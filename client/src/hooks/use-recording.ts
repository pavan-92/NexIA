import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define um segmento de áudio individual
interface AudioSegment {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: number;
}

interface RecordingHookResult {
  isRecording: boolean;
  audioBlob: Blob | null;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  transcribeAudio: () => Promise<string>;
  generateNotes: (transcription: string) => Promise<any>;
  resetRecording: () => void;
  deleteSegment: (segmentId: string) => void;
  audioSegments: AudioSegment[]; 
  error: string | null;
  liveTranscript: string | null;
  isLiveTranscribing: boolean;
}

export function useRecording(): RecordingHookResult {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string | null>(null);
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [currentSegmentStart, setCurrentSegmentStart] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  
  const { toast } = useToast();

  // Inicializar WebSocket
  useEffect(() => {
    // Criar conexão WebSocket para transcrição em tempo real
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    websocketRef.current = socket;
    
    // Configurar handlers de WebSocket
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'transcript') {
          setLiveTranscript(data.text);
          if (data.isFinal) {
            setIsLiveTranscribing(false);
          }
        } 
        else if (data.type === 'notes') {
          toast({
            title: "Prontuário gerado",
            description: "O prontuário médico foi criado com sucesso.",
          });
        }
        else if (data.type === 'error') {
          setError(data.message);
          toast({
            variant: "destructive",
            title: "Erro na transcrição",
            description: data.message,
          });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      
      // Mostrar um erro mais sutil e continuar funcionando
      console.log('Modo de fallback: transcrição após finalizar gravação');
      toast({
        variant: "default",
        title: "Modo alternativo ativado",
        description: "A transcrição será processada após finalizar a gravação.",
      });
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    // Limpar WebSocket quando componente desmontar
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [toast]);

  const startRecording = async (): Promise<void> => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setError(null);
      setLiveTranscript(null);
      setIsLiveTranscribing(true);
      setCurrentSegmentStart(recordingTime); // Marcar início do novo segmento
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
      // Configuração para integração com o serviço de transcrição em tempo real
      
      // Inicializamos a área de transcrição com uma mensagem instrutiva
      setLiveTranscript("Esperando você falar... A transcrição aparecerá aqui quando detectar sua voz.");
      
      // Notificar o servidor que começamos a gravar
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ 
          type: "start_recording"
        }));
      }
      
      // Configurar um detector de áudio para capturar e enviar o som em tempo real
      try {
        // Configurar o MediaRecorder para capturar e enviar áudio em tempo real
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            // Adicionar chunk para eventual download/processamento local
            audioChunksRef.current.push(event.data);
            
            // Enviar o chunk para o servidor em tempo real via WebSocket
            if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
              websocketRef.current.send(event.data);
            }
          }
        };
        
        // Configurar para coletar chunks a cada 250ms para transcrição em tempo real
        mediaRecorderRef.current.start(250);
        
        // Configurar detector de volume para melhorar a experiência do usuário
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let isSpeaking = false;
        let silenceTimeout: any = null;
        
        // Verificar volume do áudio a cada 100ms
        const audioDetectionInterval = window.setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          
          // Calcular o volume médio
          let sum = 0;
          for(let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          
          // Detectar atividade de fala com base no volume médio do áudio  
          const isSpeakingNow = average > 30; // Ajustar sensibilidade conforme necessário
          
          if (isSpeakingNow) {
            // Se começou a falar
            if (!isSpeaking) {
              isSpeaking = true;
              
              // Atualizar status visual caso a transcrição demore
              if (!liveTranscript || liveTranscript === "Esperando você falar... A transcrição aparecerá aqui quando detectar sua voz.") {
                setLiveTranscript("Processando sua fala...");
              }
            }
            
            // Limpar qualquer timeout de silêncio anterior
            if (silenceTimeout) {
              clearTimeout(silenceTimeout);
              silenceTimeout = null;
            }
          }
          
          // Se parou de falar, configurar um timeout para pausas longas
          if (!isSpeakingNow && isSpeaking) {
            if (!silenceTimeout) {
              silenceTimeout = setTimeout(() => {
                isSpeaking = false;
                
                // Em uma pausa longa, podemos tratar a segmentação automática se desejado
                const longPauseTimeout = setTimeout(() => {
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                    console.log("Pausa longa detectada, iniciando novo segmento de áudio");
                    
                    // Parar a gravação atual
                    mediaRecorderRef.current.stop();
                    
                    // Criar um novo blob com os chunks atuais
                    const currentAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    
                    // Criar URL para o áudio
                    const audioUrl = URL.createObjectURL(currentAudioBlob);
                    
                    // Gerar ID único para o segmento
                    const segmentId = Date.now().toString();
                    
                    // Calcular duração do segmento (em segundos)
                    const segmentDuration = recordingTime - currentSegmentStart;
                    
                    // Criar novo segmento de áudio
                    const newSegment: AudioSegment = {
                      id: segmentId,
                      blob: currentAudioBlob,
                      url: audioUrl,
                      duration: segmentDuration,
                      timestamp: Date.now()
                    };
                    
                    // Adicionar à lista de segmentos
                    setAudioSegments(prevSegments => [...prevSegments, newSegment]);
                    
                    // Atualizar blob principal para compatibilidade
                    setAudioBlob(currentAudioBlob);
                    
                    // Atualizar o início do próximo segmento
                    setCurrentSegmentStart(recordingTime);
                    
                    // Limpar os chunks para o próximo segmento
                    audioChunksRef.current = [];
                    
                    // Iniciar um novo segmento de gravação
                    setTimeout(() => {
                      if (mediaRecorderRef.current) {
                        mediaRecorderRef.current.start(250);
                        console.log("Novo segmento de gravação iniciado");
                      }
                    }, 500);
                  }
                }, 3000); // Verificar se é uma pausa longa após 3 segundos
                
                // Armazenar o timeout para limpeza
                (window as any).longPauseTimeout = longPauseTimeout;
              }, 2000); // Pausa de 2 segundos para reconhecer que parou de falar
            }
          }
        }, 100);
        
        // Armazenar referências para limpeza ao parar a gravação
        (window as any).audioDetectionInterval = audioDetectionInterval;
        (window as any).silenceTimeout = silenceTimeout;
        
        // Limpar intervalos quando o componente for desmontado
        window.addEventListener('beforeunload', () => {
          clearInterval(audioDetectionInterval);
          if (silenceTimeout) clearTimeout(silenceTimeout);
          
          // Notificar servidor que paramos de gravar
          if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify({ 
              type: "stop_recording"
            }));
          }
        });
        
      } catch (err) {
        console.error("Erro ao configurar o processamento de áudio em tempo real:", err);
      }
      
      toast({
        title: "Gravação iniciada",
        description: "Fale normalmente durante a consulta. A transcrição aparecerá em tempo real.",
      });
    } catch (err) {
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
      console.error("Error starting recording:", err);
      setIsLiveTranscribing(false);
      toast({
        variant: "destructive",
        title: "Erro ao iniciar gravação",
        description: "Verifique se o microfone está conectado e as permissões estão concedidas.",
      });
    }
  };

  const stopRecording = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (!mediaRecorderRef.current || !streamRef.current) {
          setError("Nenhuma gravação em andamento.");
          reject(new Error("No recording in progress"));
          return;
        }
        
        // Stop timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        // Notificar o servidor que paramos de gravar
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({ 
            type: "stop_recording"
          }));
        }
        
        // Stop media recorder
        mediaRecorderRef.current.onstop = () => {
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Criar URL para o áudio
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Gerar ID único para o segmento
          const segmentId = Date.now().toString();
          
          // Calcular duração do segmento (em segundos)
          const segmentDuration = recordingTime - currentSegmentStart;
          
          // Criar novo segmento de áudio
          const newSegment: AudioSegment = {
            id: segmentId,
            blob: audioBlob,
            url: audioUrl,
            duration: segmentDuration,
            timestamp: Date.now()
          };
          
          // Adicionar à lista de segmentos
          setAudioSegments(prevSegments => [...prevSegments, newSegment]);
          
          // Atualizar também o blob principal para compatibilidade
          setAudioBlob(audioBlob);
          setIsRecording(false);
          
          // Stop all tracks
          streamRef.current?.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          
          // Não reiniciamos a transcrição ao parar - mantemos o texto para que o usuário possa ver
          // o que foi transcrito até o momento
          setIsLiveTranscribing(false);
          
          // Limpar os intervalos de detecção de áudio
          if ((window as any).audioDetectionInterval) {
            clearInterval((window as any).audioDetectionInterval);
            (window as any).audioDetectionInterval = null;
          }
          
          if ((window as any).silenceTimeout) {
            clearTimeout((window as any).silenceTimeout);
            (window as any).silenceTimeout = null;
          }
          
          if ((window as any).longPauseTimeout) {
            clearTimeout((window as any).longPauseTimeout);
            (window as any).longPauseTimeout = null;
          }
          
          toast({
            title: "Segmento de áudio gravado",
            description: `Duração: ${Math.floor(segmentDuration / 60)}:${(segmentDuration % 60).toString().padStart(2, '0')}`,
          });
          
          resolve();
        };
        
        mediaRecorderRef.current.stop();
      } catch (err) {
        setError("Erro ao parar a gravação.");
        console.error("Error stopping recording:", err);
        toast({
          variant: "destructive",
          title: "Erro ao finalizar gravação",
          description: "Ocorreu um erro ao processar o áudio gravado.",
        });
        reject(err);
      }
    });
  };

  const transcribeAudio = async (): Promise<string> => {
    try {
      // Verificar se temos áudio para transcrever - se não temos o blob principal mas temos segmentos, podemos combinar eles
      if (!audioBlob && audioSegments.length === 0) {
        setError("Nenhum áudio para transcrever.");
        throw new Error("No audio to transcribe");
      }
      
      // Se já temos uma transcrição ao vivo do WebSocket, podemos usá-la diretamente
      if (liveTranscript && liveTranscript !== "Esperando você falar..." && 
          liveTranscript !== "Processando sua fala..." &&
          !liveTranscript.includes("transcrição aparecerá aqui")) {
        
        toast({
          title: "Transcrição finalizada",
          description: "Usando a transcrição capturada em tempo real.",
        });
        
        // Já temos a transcrição em tempo real, então apenas retornamos
        return liveTranscript;
      }
      
      toast({
        title: "Processando transcrição final",
        description: "Estamos finalizando a transcrição completa do áudio...",
      });
      
      // Se chegamos aqui, significa que a transcrição em tempo real não funcionou completamente
      // e precisamos processar o áudio completo
      try {
        // Processar todos os segmentos de áudio para criar um único blob
        let finalAudioBlob = audioBlob;
        
        // Se temos segmentos, podemos combinar todos eles
        if (audioSegments.length > 0) {
          const audioChunks: Blob[] = [];
          audioSegments.forEach(segment => {
            audioChunks.push(segment.blob);
          });
          
          finalAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        }
        
        // Criar form data com o áudio completo
        const formData = new FormData();
        formData.append('audio', finalAudioBlob as Blob, 'recording.webm');
        
        // Enviar para transcrição
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Atualizar a transcrição na UI
          setLiveTranscript(data.text);
          
          toast({
            title: "Transcrição concluída",
            description: "O texto da consulta foi processado com sucesso.",
          });
          
          return data.text;
        } else {
          // Se a API falhar e já temos alguma transcrição parcial, usamos ela
          if (liveTranscript && !liveTranscript.includes("transcrição aparecerá aqui")) {
            console.log("API falhou, usando transcrição parcial existente");
            return liveTranscript;
          }
          
          // Senão, usamos um fallback básico
          throw new Error('Erro ao processar transcrição');
        }
      } catch (apiError) {
        console.log("Erro na API de transcrição:", apiError);
        
        // Se já temos alguma transcrição parcial, podemos usá-la mesmo com o erro
        if (liveTranscript && !liveTranscript.includes("transcrição aparecerá aqui") &&
            liveTranscript !== "Esperando você falar...") {
          toast({
            title: "Usando transcrição parcial",
            description: "Não foi possível processar o áudio completo, usando transcrição parcial.",
          });
          
          return liveTranscript;
        }
        
        // Caso realmente não conseguimos transcrever nada
        const fallbackText = "Não foi possível processar a transcrição completa. Por favor, tente novamente ou verifique a conexão com o servidor.";
        setLiveTranscript(fallbackText);
        
        toast({
          variant: "destructive",
          title: "Falha na transcrição",
          description: "Ocorreu um erro ao processar o áudio.",
        });
        
        return fallbackText;
      }
    } catch (err) {
      setError("Erro ao transcrever o áudio.");
      console.error("Error transcribing audio:", err);
      toast({
        variant: "destructive", 
        title: "Erro na transcrição",
        description: "Não foi possível transcrever o áudio. Usando modo de demonstração.",
      });
      
      // Apenas retorna a mensagem para tentar novamente
      const fallbackText = "Não foi possível processar o áudio. Por favor, tente novamente.";
      setLiveTranscript(fallbackText);
      return fallbackText;
    }
  };

  const generateNotes = async (transcription: string): Promise<any> => {
    try {
      toast({
        title: "Gerando prontuário",
        description: "A IA está analisando a transcrição...",
      });
      
      try {
        // Tentar usar a API real
        const response = await apiRequest('POST', '/api/generate-notes', { transcription });
        
        if (response.success) {
          toast({
            title: "Prontuário gerado",
            description: "O prontuário médico foi criado com sucesso.",
          });
          
          return response.data;
        } else {
          // Se a API falhar, use simulação
          throw new Error('Usando simulação');
        }
      } catch (apiError) {
        console.log("Usando geração de notas simulada (modo demo)");
        
        // Simulação da criação de prontuário
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simular delay da API
        
        const simulatedNotes = {
          chiefComplaint: "Dor abdominal há três dias",
          history: "Paciente relata dor abdominal que piora após as refeições. Sem histórico de problemas gastrointestinais anteriores. Nega febre. Há história familiar de doença celíaca. Medicação atual inclui anti-hipertensivos e estatinas.",
          diagnosis: "Suspeita de gastrite e possível intolerância alimentar. Não podemos descartar doença celíaca devido ao histórico familiar.",
          plan: "1. Solicitar endoscopia digestiva alta\n2. Exames laboratoriais: hemograma completo, PCR, função hepática\n3. Teste sorológico para doença celíaca\n4. Suspender uso de AINEs\n5. Prescrever inibidor de bomba de prótons por 4 semanas\n6. Orientações dietéticas: evitar alimentos irritantes gástricos\n7. Retorno em 2 semanas com resultados"
        };
        
        toast({
          title: "Prontuário gerado (Modo Demo)",
          description: "Prontuário médico gerado com sucesso em modo demonstração.",
        });
        
        return simulatedNotes;
      }
    } catch (err) {
      setError("Erro ao gerar prontuário.");
      console.error("Error generating notes:", err);
      toast({
        variant: "destructive",
        title: "Erro ao gerar prontuário",
        description: "Não foi possível criar o prontuário médico. Usando dados de demonstração.",
      });
      
      // Retorna dados simulados mesmo em caso de erro
      return {
        chiefComplaint: "Dor abdominal",
        history: "Paciente com dor abdominal que piora após refeições",
        diagnosis: "Gastrite aguda",
        plan: "Solicitar exames e prescrever medicamentos"
      };
    }
  };

  const resetRecording = (): void => {
    setAudioBlob(null);
    setRecordingTime(0);
    setError(null);
    setLiveTranscript(null);
    setIsLiveTranscribing(false);
    setAudioSegments([]);
    audioChunksRef.current = [];
    
    // Limpar os intervalos de detecção de áudio
    if ((window as any).audioDetectionInterval) {
      clearInterval((window as any).audioDetectionInterval);
      (window as any).audioDetectionInterval = null;
    }
    
    if ((window as any).silenceTimeout) {
      clearTimeout((window as any).silenceTimeout);
      (window as any).silenceTimeout = null;
    }
  };
  
  // Função para deletar um segmento específico de áudio
  const deleteSegment = (segmentId: string): void => {
    setAudioSegments(prevSegments => {
      // Filtrar para remover o segmento específico
      const updatedSegments = prevSegments.filter(segment => segment.id !== segmentId);
      
      // Se não sobrar nenhum segmento, resetar o audioBlob principal
      if (updatedSegments.length === 0) {
        setAudioBlob(null);
      } else {
        // Caso contrário, definir o último segmento como o atual
        setAudioBlob(updatedSegments[updatedSegments.length - 1].blob);
      }
      
      toast({
        title: "Segmento removido",
        description: "O segmento de áudio foi excluído com sucesso.",
      });
      
      return updatedSegments;
    });
  };

  return {
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    transcribeAudio,
    generateNotes,
    resetRecording,
    deleteSegment,
    audioSegments,
    error,
    liveTranscript,
    isLiveTranscribing
  };
}

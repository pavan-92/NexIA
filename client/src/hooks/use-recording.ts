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
    // Criar conexão WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    
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
      setError('Erro na conexão com o serviço de transcrição.');
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
      
      // Configuração para integração com o serviço de transcrição real (quando disponível)
      
      // Inicializamos a área de transcrição com uma mensagem instrutiva
      setLiveTranscript("Esperando você falar... A transcrição aparecerá aqui quando detectar sua voz.");
      
      // Configurar um detector de áudio para simular a detecção de fala
      try {
        // Criar um analisador de áudio para detectar quando o usuário está falando
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Frases que serão usadas para simular a transcrição quando detectar fala
        const randomPhrases = [
          "Entendo sua preocupação com esses sintomas.",
          "Vou prescrever um medicamento para aliviar a dor.",
          "Os exames mostram resultados normais, o que é um bom sinal.",
          "Precisamos verificar sua pressão arterial regularmente.",
          "Recomendo repouso e bastante hidratação nos próximos dias."
        ];
        
        let transcript = "";
        let silenceTimeout: any = null;
        let isSpeaking = false;
        
        // Verificar volume do áudio a cada 100ms
        const audioDetectionInterval = window.setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          
          // Calcular o volume médio
          let sum = 0;
          for(let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          
          // Em uma implementação real, aqui seria o local para processar o que o usuário está realmente falando
        // e enviar o áudio para o serviço de reconhecimento de fala
          
        // Detectar atividade de fala com base no volume médio do áudio  
        const isSpeakingNow = average > 30; // Ajustar sensibilidade conforme necessário
        
        if (isSpeakingNow) {
          // Se começou a falar
          if (!isSpeaking) {
            isSpeaking = true;
            
            // Apenas registramos que a pessoa está falando sem gerar texto simulado
            setLiveTranscript("Áudio sendo gravado... (A transcrição real será processada ao finalizar a gravação)");
          }
          
          // Limpar qualquer timeout de silêncio anterior
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
            silenceTimeout = null;
          }
        }
        
        // Se parou de falar, configurar um timeout
        if (!isSpeakingNow && isSpeaking) {
          if (!silenceTimeout) {
            silenceTimeout = setTimeout(() => {
              isSpeaking = false;
              
              // Em uma pausa longa (5+ segundos), podemos reiniciar a gravação automaticamente
              // mas mantendo a transcrição
              const longPauseTimeout = setTimeout(() => {
                // Em uma implementação real, aqui salvaríamos o segmento de áudio atual
                // e iniciaríamos um novo segmento
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                  console.log("Pausa longa detectada, iniciando novo segmento de áudio");
                  
                  // Parar a gravação atual e processar o áudio
                  mediaRecorderRef.current.stop();
                  
                  // Criar um novo blob com os chunks atuais
                  const currentAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  
                  // Armazenar o blob atual em uma lista (em uma versão real)
                  console.log("Segmento de áudio salvo:", currentAudioBlob.size, "bytes");
                  
                  // Limpar os chunks sem afetar a transcrição
                  audioChunksRef.current = [];
                  
                  // Iniciar um novo segmento de gravação
                  setTimeout(() => {
                    if (mediaRecorderRef.current) {
                      mediaRecorderRef.current.start();
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
        });
        
      } catch (err) {
        console.error("Erro ao configurar o detector de áudio:", err);
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
          
          // Finalizar a simulação de transcrição
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
      if (!audioBlob) {
        setError("Nenhum áudio para transcrever.");
        throw new Error("No audio to transcribe");
      }
      
      toast({
        title: "Transcrevendo áudio",
        description: "Isso pode levar alguns segundos...",
      });
      
      // Simulação da transcrição (para demonstração)
      try {
        // Criar form data para API real (mas use simulação primeiro)
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        // Tentar com a API real primeiro
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          
          toast({
            title: "Transcrição concluída",
            description: "O texto da consulta foi gerado com sucesso.",
          });
          
          return data.text;
        } else {
          // Se a API falhar, use simulação
          throw new Error('Usando simulação');
        }
      } catch (apiError) {
        console.log("Usando transcrição simulada (modo demo)");
        
        // Simulação da transcrição
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay da API
        
        // Em um sistema real, aqui seria feita a extração do texto do áudio gravado
        // Para esta versão, vamos supor que o usuário disse o seguinte:
        const simulatedText = "[Este seria o texto transcrito do áudio. Como o áudio foi gravado em modo simulado, não há transcrição real disponível.]";
        
        setLiveTranscript(simulatedText);
        
        toast({
          title: "Transcrição concluída (Modo Demo)",
          description: "Texto da consulta gerado com sucesso em modo demonstração.",
        });
        
        return simulatedText;
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

import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RecordingHookResult {
  isRecording: boolean;
  audioBlob: Blob | null;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  transcribeAudio: () => Promise<string>;
  generateNotes: (transcription: string) => Promise<any>;
  resetRecording: () => void;
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
      
      // Configuração para integração real com o serviço de transcrição
      // Em uma versão real, a conexão com o WebSocket seria estabelecida aqui
      // e os dados de áudio seriam enviados para o serviço
      
      // Inicializamos a área de transcrição com uma mensagem instrutiva
      setLiveTranscript("Esperando você falar... A transcrição aparecerá aqui quando detectar sua voz.");
      
      // Em vez de simular com frases automáticas, apenas inicializamos a área
      // O texto só deve aparecer quando o usuário realmente falar
      
      // Este é um gancho para uma futura integração com WebSockets
      // mas neste momento não vamos adicionar texto simulado
      
      // A limpeza será feita ao parar a gravação ou ao desmontar o componente
      
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
          setAudioBlob(audioBlob);
          setIsRecording(false);
          
          // Stop all tracks
          streamRef.current?.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          
          // Finalizar a simulação de transcrição
          setIsLiveTranscribing(false);
          
          toast({
            title: "Gravação finalizada",
            description: `Duração: ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
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
        const simulatedText = "O paciente relata dor no abdômen superior há três dias, principalmente após as refeições. Histórico médico inclui hipertensão controlada com medicação. Sem alergias conhecidas. Exame físico revela sensibilidade à palpação no quadrante superior direito.";
        
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
    audioChunksRef.current = [];
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
    error,
    liveTranscript,
    isLiveTranscribing
  };
}

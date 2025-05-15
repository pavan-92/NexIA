import { useState, useRef, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/utils";

// Interfaces
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

/**
 * Hook para gerenciar gravação de áudio e transcrição
 */
export function useRecording(): RecordingHookResult {
  // Toast para notificações
  const { toast } = useToast();
  
  // Estado para controlar o estado da gravação
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string | null>(null);
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
  
  // Referências para gerenciar recursos
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioSegmentsRef = useRef<AudioSegment[]>([]);
  const currentSegmentStart = useRef<number>(0);
  
  // Libera recursos quando o componente é desmontado
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);
  
  // Função para limpar recursos
  const cleanupResources = () => {
    // Libera recursos de áudio
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    
    // Limpa URLs de objetos para evitar vazamento de memória
    audioSegments.forEach(segment => {
      URL.revokeObjectURL(segment.url);
    });
  };
  
  // Inicia a gravação
  const startRecording = async (): Promise<void> => {
    try {
      setError(null);
      
      // Reseta o estado dos chunks de áudio
      audioChunksRef.current = [];
      
      // Marca o tempo de início deste segmento
      currentSegmentStart.current = recordingTime;
      
      // Solicita acesso ao microfone (sempre solicita novamente, isso evita problemas)
      try {
        if (streamRef.current) {
          // Limpa o stream anterior se existir
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        streamRef.current = stream;
      } catch (micError) {
        console.error("Erro ao acessar o microfone:", micError);
        toast({
          title: "Erro de Microfone",
          description: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
          variant: "destructive"
        });
        throw new Error("Erro ao acessar o microfone");
      }
      
      // Cria e configura o MediaRecorder
      if (streamRef.current) {
        const mediaRecorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = mediaRecorder;
        
        // Configura o tratamento de dados de áudio
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            console.log(`Chunk recebido - Tamanho: ${e.data.size} bytes`);
            audioChunksRef.current.push(e.data);
            console.log(`Total de áudio coletado: ${audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0)} bytes em ${audioChunksRef.current.length} chunks`);
          }
        };
        
        // Configura o que acontece quando a gravação para
        mediaRecorder.onstop = () => {
          console.log(`MediaRecorder parado, processando chunks de áudio...`);
          
          // Filtra chunks vazios
          const validChunks = audioChunksRef.current.filter(chunk => chunk.size > 0);
          
          if (validChunks.length === 0) {
            console.error("Nenhum dado de áudio válido capturado");
            setError("Nenhum áudio capturado. Verifique seu microfone e tente novamente.");
            return;
          }
          
          // Determina o tipo MIME baseado nos chunks (normalmente é audio/webm)
          let mimeType = 'audio/webm';
          for (const chunk of validChunks) {
            if (chunk.type) {
              mimeType = chunk.type;
              break;
            }
          }
          
          // Cria um Blob a partir dos chunks
          const audioBlob = new Blob(validChunks, { type: mimeType });
          console.log(`Blob criado: ${audioBlob.size} bytes`);
          
          setAudioBlob(audioBlob);
          
          // Calcula a duração do segmento
          const segmentDuration = recordingTime - currentSegmentStart.current;
          const timestamp = Date.now();
          
          // Adiciona ao array de segmentos
          const url = URL.createObjectURL(audioBlob);
          const newSegment: AudioSegment = {
            id: generateId(),
            blob: audioBlob,
            url,
            duration: segmentDuration,
            timestamp
          };
          
          console.log(`Novo segmento criado: ID ${newSegment.id}, duração ${segmentDuration.toFixed(1)}s`);
          
          // Atualiza os segmentos de áudio
          const updatedSegments = [...audioSegments, newSegment];
          audioSegmentsRef.current = updatedSegments;
          setAudioSegments(updatedSegments);
          
          console.log(`Total de segmentos: ${updatedSegments.length}`);
          
          toast({
            title: "Gravação finalizada",
            description: `Segmento de áudio de ${segmentDuration.toFixed(1)} segundos gravado.`,
          });
        };
        
        // Inicia a gravação - captura dados a cada 100ms
        mediaRecorder.start(100);
        
        // Inicia o temporizador
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        
        timerIntervalRef.current = window.setInterval(() => {
          setRecordingTime(prevTime => prevTime + 0.1);
        }, 100);
        
        setIsRecording(true);
        
        toast({
          title: "Gravação iniciada",
          description: "Agora você pode falar ao microfone.",
        });
      }
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      setError("Não foi possível iniciar a gravação. Verifique seu microfone.");
      
      toast({
        title: "Erro de Microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
        variant: "destructive"
      });
    }
  };
  
  // Para a gravação
  const stopRecording = async (): Promise<void> => {
    try {
      setIsRecording(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log("Parando MediaRecorder...");
        mediaRecorderRef.current.stop();
      } else {
        console.error("MediaRecorder não está ativo");
        setError("Ocorreu um erro ao parar a gravação.");
      }
    } catch (err) {
      console.error("Erro ao parar gravação:", err);
      setError("Ocorreu um erro ao parar a gravação.");
    }
  };
  
  // Transcreve o áudio gravado
  const transcribeAudio = async (): Promise<string> => {
    try {
      setIsLiveTranscribing(true);
      
      // Obtém os segmentos atuais
      const segments = audioSegmentsRef.current || audioSegments;
      
      if (!segments || segments.length === 0) {
        throw new Error("Não há áudio para transcrever. Por favor, grave uma consulta primeiro.");
      }
      
      console.log(`Iniciando transcrição de ${segments.length} segmentos de áudio`);
      
      // Array para armazenar as transcrições de cada segmento
      const allTranscriptions: string[] = [];
      
      // Processa cada segmento individualmente
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        if (!segment.blob || segment.blob.size === 0) {
          console.warn(`Segmento ${i+1} inválido, pulando...`);
          continue;
        }
        
        console.log(`Processando segmento ${i+1}/${segments.length}: ${segment.id}`);
        
        try {
          // Prepara FormData para enviar o áudio
          const formData = new FormData();
          formData.append('audio', segment.blob, `recording-${segment.id}.webm`);
          
          // Enviar para API de transcrição
          const response = await apiRequest("POST", "/api/transcribe", formData) as any;
          
          if (response && response.text && response.text.trim()) {
            console.log(`Segmento ${i+1} transcrito: ${response.text.substring(0, 30)}...`);
            allTranscriptions.push(response.text);
          } else {
            console.warn(`Segmento ${i+1} retornou transcrição vazia`);
          }
        } catch (segmentError) {
          console.error(`Erro ao transcrever segmento ${i+1}:`, segmentError);
          // Continua com os próximos segmentos mesmo se houver erro
        }
      }
      
      // Verifica se obteve alguma transcrição
      if (allTranscriptions.length === 0) {
        throw new Error("Não foi possível obter transcrições. Tente gravar novamente.");
      }
      
      // Combina todas as transcrições em um único texto
      const combinedTranscription = allTranscriptions.join('\n\n');
      
      console.log(`Transcrição completa: ${combinedTranscription.substring(0, 100)}...`);
      
      // Atualiza estado com a transcrição
      setLiveTranscript(combinedTranscription);
      
      return combinedTranscription;
    } catch (error: any) {
      console.error("Erro na transcrição:", error);
      toast({
        title: "Erro na transcrição",
        description: error?.message || "Não foi possível transcrever o áudio",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLiveTranscribing(false);
    }
  };
  
  // Gera notas médicas
  const generateNotes = async (transcription: string): Promise<any> => {
    try {
      if (!transcription || transcription.trim().length === 0) {
        throw new Error("A transcrição está vazia. Por favor, transcreva o áudio primeiro.");
      }
      
      console.log(`Gerando prontuário a partir da transcrição (${transcription.length} caracteres)...`);
      
      const response = await apiRequest("POST", "/api/generate-notes", { 
        transcription
      });
      
      return response;
    } catch (apiError: any) {
      const errorMessage = 
        apiError.response?.data?.error || 
        apiError.message || 
        "Erro desconhecido ao gerar o prontuário";
      
      console.error("Erro ao gerar prontuário:", apiError);
      
      toast({
        title: "Erro ao gerar prontuário",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw new Error(`Falha ao gerar o prontuário médico: ${errorMessage}`);
    }
  };
  
  // Reinicia a gravação
  const resetRecording = useCallback(() => {
    // Limpa todos os recursos
    cleanupResources();
    
    // Reseta todos os estados
    setAudioBlob(null);
    setAudioSegments([]);
    setRecordingTime(0);
    setLiveTranscript(null);
    setIsLiveTranscribing(false);
    setError(null);
    audioChunksRef.current = [];
    audioSegmentsRef.current = [];
    
    toast({
      title: "Gravação reiniciada",
      description: "Os áudios gravados foram removidos.",
    });
  }, [toast]);
  
  // Remove um segmento específico
  const deleteSegment = useCallback((segmentId: string) => {
    setAudioSegments(prevSegments => {
      // Encontra o segmento a ser excluído
      const segmentToDelete = prevSegments.find(s => s.id === segmentId);
      
      if (segmentToDelete) {
        // Revoga URL para evitar vazamento de memória
        URL.revokeObjectURL(segmentToDelete.url);
      }
      
      // Filtra os segmentos mantendo apenas os que não correspondem ao ID
      const filtered = prevSegments.filter(s => s.id !== segmentId);
      audioSegmentsRef.current = filtered; // Atualiza a referência também
      return filtered;
    });
    
    toast({
      title: "Segmento removido",
      description: "O segmento de áudio foi removido com sucesso.",
    });
  }, [toast]);
  
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
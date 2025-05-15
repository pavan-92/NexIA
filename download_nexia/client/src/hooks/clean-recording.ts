import { useState, useRef, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { blobToBase64 } from "@/lib/utils";
import { generateId } from "@/lib/utils";
import { transcribeAudio as processTranscription } from "./fixed-transcribe";

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
  const audioBufferRef = useRef<Uint8Array | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioSegmentsRef = useRef<AudioSegment[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSegmentStart = useRef<number>(0);
  
  // Limpa os recursos quando o componente é desmontado
  useEffect(() => {
    return () => {
      // Libera recursos de áudio
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Limpa URLs de objetos para evitar vazamento de memória
      audioSegments.forEach(segment => {
        URL.revokeObjectURL(segment.url);
      });
    };
  }, [audioSegments]);
  
  // Inicia a gravação
  const startRecording = async (): Promise<void> => {
    try {
      // Reseta o estado dos chunks de áudio
      audioChunksRef.current = [];
      
      // Marca o tempo de início deste segmento
      currentSegmentStart.current = recordingTime;
      
      // Solicita acesso ao microfone apenas se não estiver já gravando
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        streamRef.current = stream;
      }
      
      // Cria e configura o MediaRecorder
      if (streamRef.current) {
        const mediaRecorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = mediaRecorder;
        
        // Configura o tratamento de dados de áudio
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            console.log(`Chunk recebido - Tamanho: ${e.data.size} bytes, Tipo: ${e.data.type}`);
            audioChunksRef.current.push(e.data);
            console.log(`Chunk de áudio válido: ${e.data.size} bytes`);
            console.log(`Total de áudio coletado até agora: ${audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0)} bytes em ${audioChunksRef.current.length} chunks`);
          } else {
            console.warn(`Recebido chunk de áudio vazio`);
          }
        };
        
        // Configura o que acontece quando a gravação para
        mediaRecorder.onstop = () => {
          console.log(`MediaRecorder parado, processando chunks de áudio...`);
          console.log(`Chunks disponíveis: ${audioChunksRef.current.length}`);
          
          // Filtra chunks vazios
          const validChunks = audioChunksRef.current.filter(chunk => chunk.size > 0);
          console.log(`Chunks válidos: ${validChunks.length}/${audioChunksRef.current.length}`);
          
          if (validChunks.length === 0) {
            console.error("Nenhum dado de áudio válido capturado");
            setError("Nenhum áudio capturado. Verifique seu microfone e tente novamente.");
            return;
          }
          
          // Determina o tipo MIME baseado nos chunks
          let mimeType = 'audio/webm';
          // Verifica se há algum tipo específico nos chunks
          for (const chunk of validChunks) {
            if (chunk.type) {
              mimeType = chunk.type;
              break;
            }
          }
          console.log(`Tipo de mídia selecionado: ${mimeType}`);
          
          // Cria um Blob a partir dos chunks
          const audioBlob = new Blob(validChunks, { type: mimeType });
          console.log(`Blob criado com sucesso: ${audioBlob.size} bytes`);
          
          // Verifica se o áudio é muito curto
          if (audioBlob.size < 100) {
            console.warn(`Áudio muito curto detectado: ${audioBlob.size} bytes`);
            toast({
              title: "Áudio muito curto",
              description: "A gravação foi muito curta. Tente novamente.",
              variant: "destructive"
            });
          }
          
          setAudioBlob(audioBlob);
          
          // Stop tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          
          // Calculate segment duration
          const segmentDuration = recordingTime - currentSegmentStart.current;
          const timestamp = Date.now();
          
          // Add to segments list
          const url = URL.createObjectURL(audioBlob);
          const newSegment: AudioSegment = {
            id: generateId(),
            blob: audioBlob,
            url,
            duration: segmentDuration,
            timestamp
          };
          
          console.log(`Novo segmento criado: ID ${newSegment.id}, duração ${segmentDuration}s, tamanho ${audioBlob.size} bytes`);
          
          // Atualiza os segmentos de áudio e garante que esteja disponível imediatamente
          const updatedSegments = [...audioSegments, newSegment];
          audioSegmentsRef.current = updatedSegments; 
          setAudioSegments(updatedSegments);
          
          console.log(`Segmento adicionado com sucesso. Total de segmentos: ${updatedSegments.length}`);
          console.log(`Dados do segmento adicionado: ID ${newSegment.id}, tamanho ${audioBlob.size} bytes`);
          
          toast({
            title: "Gravação finalizada",
            description: `Segmento de áudio de ${segmentDuration} segundos gravado.`,
          });
        };
        
        mediaRecorder.start(100); // Captura dados a cada 100ms
        
        // Inicia o temporizador
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        
        timerIntervalRef.current = window.setInterval(() => {
          setRecordingTime(prevTime => prevTime + 0.1);
        }, 100);
        
        setIsRecording(true);
        setError(null);
        
        toast({
          title: "Gravação iniciada",
          description: "Agora você pode falar ao microfone.",
        });
      }
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Não foi possível acessar o microfone. Verifique as permissões e tente novamente.");
      
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
        console.error("MediaRecorder não está ativo ou não foi inicializado");
        setError("Ocorreu um erro ao parar a gravação.");
      }
    } catch (err) {
      console.error("Error stopping recording:", err);
      setError("Ocorreu um erro ao parar a gravação.");
    }
  };
  
  const transcribeAudio = async (): Promise<string> => {
    try {
      // Usar nossa função de transcrição melhorada
      const segments = audioSegmentsRef.current || audioSegments;
      return await processTranscription(
        segments,
        apiRequest,
        setLiveTranscript,
        setIsLiveTranscribing
      );
    } catch (error) {
      console.error("Erro na transcrição:", error);
      setIsLiveTranscribing(false);
      throw error;
    } finally {
      setIsLiveTranscribing(false);
    }
  };
  
  const generateNotes = async (transcription: string): Promise<any> => {
    try {
      if (!transcription || transcription.trim().length === 0) {
        throw new Error("A transcrição está vazia. Por favor, transcreva o áudio primeiro.");
      }
      
      console.log(`Gerando prontuário a partir da transcrição (${transcription.length} caracteres)...`);
      
      const response = await apiRequest("POST", "/api/generate-notes", { transcription });
      return response;
    } catch (apiError: any) {
      const errorMessage: string = 
        apiError.response?.data?.error || 
        apiError.message || 
        "Erro desconhecido ao gerar o prontuário";
      
      console.error("Erro ao gerar prontuário:", apiError);
      throw new Error(`Falha ao gerar o prontuário médico: ${errorMessage}`);
    }
  };
  
  const resetRecording = useCallback(() => {
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
    
    // Revoga URLs dos segmentos de áudio
    audioSegments.forEach(segment => {
      URL.revokeObjectURL(segment.url);
    });
    
    // Reseta todos os estados
    setAudioBlob(null);
    setAudioSegments([]);
    setRecordingTime(0);
    setLiveTranscript(null);
    setIsLiveTranscribing(false);
    setError(null);
    audioChunksRef.current = [];
    audioBufferRef.current = null;
    
    toast({
      title: "Gravação reiniciada",
      description: "Os áudios gravados foram removidos.",
    });
  }, [audioSegments, toast]);
  
  const deleteSegment = useCallback((segmentId: string) => {
    setAudioSegments(prevSegments => {
      const segmentToDelete = prevSegments.find(s => s.id === segmentId);
      
      if (segmentToDelete) {
        // Revoga URL para evitar vazamento de memória
        URL.revokeObjectURL(segmentToDelete.url);
      }
      
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
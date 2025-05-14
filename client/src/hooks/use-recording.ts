import { useState, useRef, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { blobToBase64 } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import { generateId } from "@/lib/utils";

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
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [currentSegmentStart, setCurrentSegmentStart] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string | null>(null);
  const [isLiveTranscribing, setIsLiveTranscribing] = useState<boolean>(false);
  
  // Estado para controle do modo de transcrição
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  
  // Refs para controle de recursos
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  
  const { toast } = useToast();
  
  // Inicializar WebSocket
  useEffect(() => {
    // Criar conexão WebSocket para transcrição em tempo real
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      websocketRef.current = socket;
      
      // Configurar handlers de WebSocket
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setUseFallbackMode(false);
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
            console.log('Erro recebido do servidor:', data.message);
            // Não mostramos o erro para o usuário, apenas ativamos o modo de fallback
            setUseFallbackMode(true);
          }
          else if (data.type === 'status' && data.status === 'fallback_mode') {
            console.log('Modo fallback ativado pelo servidor:', data.message);
            setUseFallbackMode(true);
            
            // Se não for um erro crítico, mostramos um toast informativo
            toast({
              variant: "default",
              title: "Modo alternativo ativado",
              description: "A transcrição em tempo real não está disponível. Suas gravações serão processadas normalmente."
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        
        // Ativar modo de fallback
        setUseFallbackMode(true);
        console.log('Modo de fallback: transcrição após finalizar gravação');
        toast({
          variant: "default",
          title: "Modo alternativo ativado",
          description: "A transcrição será processada após finalizar a gravação.",
        });
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setUseFallbackMode(true);
      };
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setUseFallbackMode(true);
    }
    
    // Limpar WebSocket quando componente desmontar
    return () => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.close();
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
      setIsRecording(true);
      setIsLiveTranscribing(true);
      setCurrentSegmentStart(recordingTime); // Marcar início do novo segmento
      
      // Mensagem clara sobre gravação em andamento
      setLiveTranscript("Gravando... A transcrição aparecerá aqui em breve.");
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Start timer
      setRecordingTime(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
      // Notificar o servidor (se não estiver no modo fallback)
      if (!useFallbackMode && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ 
          type: "start_recording"
        }));
        console.log("Modo de transcrição em tempo real ativado");
      } else {
        console.log("Usando modo de gravação local (fallback)");
        // Ajustar mensagem
        setLiveTranscript("Gravando... A transcrição será processada após finalizar a gravação.");
      }
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Adicionar chunk para processamento local
          audioChunksRef.current.push(event.data);
          
          // Enviar chunk para o servidor (no modo online)
          if (!useFallbackMode && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            try {
              websocketRef.current.send(event.data);
            } catch (err) {
              console.error("Erro ao enviar áudio para o servidor:", err);
              setUseFallbackMode(true);
              setLiveTranscript("Gravando... A transcrição será processada após finalizar a gravação.");
            }
          }
        }
      };
      
      // Configurar para coletar chunks a cada 250ms
      mediaRecorder.start(250);
      
      // Mensagens para o usuário
      toast({
        title: "Gravação iniciada",
        description: "Fale normalmente durante a consulta. A gravação está em andamento.",
      });
    } catch (err) {
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
      console.error("Error starting recording:", err);
      setIsLiveTranscribing(false);
      setIsRecording(false);
    }
  };

  const stopRecording = async (): Promise<void> => {
    try {
      if (!isRecording || !mediaRecorderRef.current) {
        return;
      }
      
      // Stop recording flag
      setIsRecording(false);
      
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Notificar o servidor que paramos de gravar (se não estiver no modo fallback)
      if (!useFallbackMode && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        try {
          websocketRef.current.send(JSON.stringify({ 
            type: "stop_recording"
          }));
        } catch (err) {
          console.error("Erro ao notificar o servidor sobre fim da gravação:", err);
          setUseFallbackMode(true);
        }
      }
      
      // Stop media recorder
      mediaRecorderRef.current.onstop = () => {
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Calculate segment duration
        const segmentDuration = recordingTime - currentSegmentStart;
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
        
        setAudioSegments(prevSegments => [...prevSegments, newSegment]);
        
        toast({
          title: "Gravação finalizada",
          description: `Segmento de áudio de ${segmentDuration} segundos gravado.`,
        });
      };
      
      mediaRecorderRef.current.stop();
      
    } catch (err) {
      console.error("Error stopping recording:", err);
      setError("Ocorreu um erro ao parar a gravação.");
    }
  };

  const transcribeAudio = async (): Promise<string> => {
    try {
      if (audioSegments.length === 0) {
        throw new Error("Não há áudio para transcrever");
      }
      
      // Combine all audio segments into one blob for transcription
      const allChunks: Blob[] = [];
      audioSegments.forEach(segment => {
        allChunks.push(segment.blob);
      });
      
      const combinedBlob = new Blob(allChunks, { type: 'audio/webm' });
      
      // Convert blob to base64 for API request
      const base64Audio = await blobToBase64(combinedBlob);
      
      // Create FormData for API request
      const formData = new FormData();
      formData.append('audio', combinedBlob);
      
      // Make API call to transcribe
      const transcriptionResponse = await apiRequest("POST", "/api/transcribe", formData);
      
      // Extract transcription text
      const { text } = transcriptionResponse;
      
      if (!text) {
        throw new Error("Não foi possível transcrever o áudio");
      }
      
      // Update live transcript
      setLiveTranscript(text);
      setIsLiveTranscribing(false);
      
      return text;
    } catch (err) {
      console.error("Transcription error:", err);
      setError("Não foi possível transcrever o áudio. Tente novamente.");
      return "";
    }
  };

  const generateNotes = async (transcription: string): Promise<any> => {
    try {
      if (!transcription || transcription.trim() === "") {
        throw new Error("É necessário transcrever o áudio antes de gerar o prontuário");
      }
      
      // Make API call to generate notes
      const response = await apiRequest("POST", "/api/generate-notes", {
        text: transcription
      });
      
      return response;
    } catch (err) {
      console.error("Error generating notes:", err);
      setError("Não foi possível gerar o prontuário. Tente novamente.");
      throw err;
    }
  };

  const resetRecording = useCallback(() => {
    // Clear all recordings
    setAudioBlob(null);
    setAudioSegments([]);
    setRecordingTime(0);
    setLiveTranscript(null);
    setIsLiveTranscribing(false);
    setError(null);
    audioChunksRef.current = [];
    
    // Clean up any resources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    
    toast({
      title: "Gravação descartada",
      description: "Todos os áudios gravados foram descartados.",
    });
  }, [toast]);

  const deleteSegment = useCallback((segmentId: string) => {
    setAudioSegments(prevSegments => {
      const segmentToDelete = prevSegments.find(s => s.id === segmentId);
      if (segmentToDelete) {
        // Revoke the URL to prevent memory leaks
        URL.revokeObjectURL(segmentToDelete.url);
      }
      
      // Filter out the deleted segment
      return prevSegments.filter(s => s.id !== segmentId);
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
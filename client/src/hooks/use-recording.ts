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
      
      toast({
        title: "Gravação iniciada",
        description: "Fale normalmente durante a consulta.",
      });
    } catch (err) {
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
      console.error("Error starting recording:", err);
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
      
      // Create form data with audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Send request to transcribe endpoint
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Transcrição concluída",
        description: "O texto da consulta foi gerado com sucesso.",
      });
      
      return data.text;
    } catch (err) {
      setError("Erro ao transcrever o áudio.");
      console.error("Error transcribing audio:", err);
      toast({
        variant: "destructive",
        title: "Erro na transcrição",
        description: "Não foi possível transcrever o áudio. Tente novamente.",
      });
      throw err;
    }
  };

  const generateNotes = async (transcription: string): Promise<any> => {
    try {
      toast({
        title: "Gerando prontuário",
        description: "A IA está analisando a transcrição...",
      });
      
      const response = await apiRequest('POST', '/api/generate-notes', { transcription });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Prontuário gerado",
        description: "O prontuário médico foi criado com sucesso.",
      });
      
      return data;
    } catch (err) {
      setError("Erro ao gerar prontuário.");
      console.error("Error generating notes:", err);
      toast({
        variant: "destructive",
        title: "Erro ao gerar prontuário",
        description: "Não foi possível criar o prontuário médico. Tente novamente.",
      });
      throw err;
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
  };
}

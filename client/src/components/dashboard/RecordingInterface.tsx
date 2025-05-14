import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/use-auth";
import { useRecording } from "@/hooks/new-use-recording";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Mic,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  Volume2,
  RefreshCw,
  Trash2
} from "lucide-react";

interface RecordingInterfaceProps {
  consultationId?: string;
  isNew: boolean;
  onTranscriptionComplete: (text: string) => void;
}

export default function RecordingInterface({
  consultationId,
  isNew,
  onTranscriptionComplete
}: RecordingInterfaceProps) {
  const {
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    transcribeAudio,
    resetRecording,
    error,
    liveTranscript,
    isLiveTranscribing,
    audioSegments,
    deleteSegment,
    generateNotes,
  } = useRecording();
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { user } = useAuthState();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Audio visualization
  const [visualizationLevel, setVisualizationLevel] = useState(0);
  
  // Create visualization effect while recording
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setVisualizationLevel(Math.random() * 100);
      }, 150);
    } else {
      setVisualizationLevel(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  // Create audio URL from blob
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);
  
  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Save audio to consultation
  const { mutate: saveAudio } = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest(
        "PUT",
        `/api/consultations/${consultationId}`,
        {
          transcription: text,
          status: "in-progress"
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/consultations/${consultationId}`] });
      toast({
        title: "Transcrição salva",
        description: "A transcrição foi salva com sucesso na consulta.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar transcrição",
        description: `Não foi possível salvar: ${error.message}`,
      });
    },
  });

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
    } catch (err) {
      console.error("Error stopping recording:", err);
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    try {
      const text = await transcribeAudio();
      onTranscriptionComplete(text);
      
      // Save transcription if we have a consultation ID
      if (consultationId && !isNew) {
        saveAudio(text);
      }
    } catch (err) {
      console.error("Transcription error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };
  
  const handleReset = () => {
    resetRecording();
    setAudioUrl(null);
  };

  return (
    <div className="recording-container">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-4">
          {/* Header com nome do paciente e status */}
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-lg font-medium">Nome do Paciente</h2>
            <div className="flex items-center">
              {isRecording && (
                <>
                  <div className="animate-pulse text-red-500 text-sm mr-2">●</div>
                  <span className="text-sm font-medium mr-4">Transcrição ao vivo</span>
                </>
              )}
              <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
              <div className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                On-line
              </div>
            </div>
          </div>
          
          {/* Área principal de transcrição */}
          <div className="border border-gray-200 rounded-lg min-h-[300px] bg-white p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Transcrição</h3>
            {liveTranscript ? (
              <div className="text-sm text-gray-700">
                {liveTranscript}
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic flex items-center justify-center h-64">
                {isRecording 
                  ? "Capturando fala... (o áudio é enviado a cada 5 segundos para processamento)" 
                  : "A transcrição aparecerá aqui durante a gravação"}
              </div>
            )}
          </div>
          
          {/* Área de segmentos de áudio */}
          {audioSegments.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Áudios gravados ({audioSegments.length})</h3>
              <div className="space-y-2">
                {audioSegments.map((segment, index) => (
                  <div key={segment.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-2">
                    <div className="flex items-center flex-1">
                      <div className="text-xs font-medium text-gray-700 mr-2">
                        {index + 1}
                      </div>
                      <audio controls className="h-8 flex-1 mr-2">
                        <source src={segment.url} type="audio/webm" />
                      </audio>
                      <div className="text-xs text-gray-500 w-16 text-right">
                        {formatTime(segment.duration)}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-gray-400 hover:text-red-500"
                      onClick={() => deleteSegment(segment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Ícone de aviso sobre permissão de microfone */}
          <div className="text-center my-6">
            <div className="flex justify-center mb-2">
              <div className="bg-teal-500 text-white p-3 rounded-full">
                <Volume2 className="h-8 w-8" />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Não se esqueça de permitir o acesso ao microfone nas configurações
            </p>
          </div>
          
          {/* Botões de ação */}
          <div className="flex gap-4 justify-center">
            {isRecording ? (
              <Button 
                onClick={handleStopRecording} 
                className="bg-red-500 hover:bg-red-600 text-white rounded-full py-6 px-8"
                size="lg"
              >
                <StopCircle className="mr-2 h-5 w-5" />
                Parar gravação
              </Button>
            ) : (
              <Button 
                onClick={handleStartRecording} 
                className="bg-teal-500 hover:bg-teal-600 text-white rounded-full py-6 px-8"
                size="lg"
                disabled={isTranscribing}
              >
                <Mic className="mr-2 h-5 w-5" />
                Iniciar gravação
              </Button>
            )}
            
            <Button 
              onClick={handleTranscribe} 
              className="bg-pink-400 hover:bg-pink-500 text-white rounded-full py-6 px-8"
              size="lg"
              disabled={isRecording || isTranscribing || audioSegments.length === 0}
            >
              {isTranscribing ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Gerar prontuário
                </>
              )}
            </Button>
          </div>
          
          {/* Botão para descartar tudo */}
          {!isRecording && audioSegments.length > 0 && (
            <div className="text-center mt-2">
              <Button 
                onClick={handleReset} 
                variant="ghost" 
                disabled={isTranscribing}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Descartar tudo
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
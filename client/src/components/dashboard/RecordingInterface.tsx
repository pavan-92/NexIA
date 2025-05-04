import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRecording } from "@/hooks/use-recording";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Mic, StopCircle, RefreshCw, Volume2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthState } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Save audio to consultation mutation
  const { mutate: saveAudio, isPending: isSaving } = useMutation({
    mutationFn: async (text: string) => {
      if (!consultationId) {
        throw new Error("ID da consulta não disponível");
      }
      
      // Update consultation with transcription
      return await apiRequest(
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
    <div>
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
        {isRecording ? (
          <div className="space-y-4">
            <div className="recording-interface">
              <div className="flex-1">
                <div className="recording-waveform">
                  <Progress value={visualizationLevel} className="h-2 bg-gray-100 [&>*]:bg-blue-600" />
                </div>
                <div className="mt-2 flex items-center">
                  <div className="animate-pulse text-red-500 text-sm font-medium mr-2">●</div>
                  <div className="text-sm font-medium">{formatTime(recordingTime)}</div>
                </div>
              </div>
              
              <Button 
                onClick={handleStopRecording} 
                className="recording-button recording-button-stop"
                size="icon"
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Fale pausadamente e com clareza para melhores resultados
            </p>
          </div>
        ) : audioBlob ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Áudio gravado</div>
                    <div className="text-xs text-gray-500">
                      Duração: {formatTime(recordingTime)}
                    </div>
                  </div>
                </div>
                
                {audioUrl && (
                  <audio controls className="h-8 w-32">
                    <source src={audioUrl} type="audio/webm" />
                    Seu navegador não suporta a reprodução de áudio.
                  </audio>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleTranscribe} 
                className="bg-blue-600 text-white hover:bg-blue-700 text-sm flex-1"
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                    Transcrevendo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-3 w-3" />
                    Transcrever
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleReset} 
                variant="outline" 
                disabled={isTranscribing}
                className="text-sm border-gray-200"
              >
                Nova Gravação
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                Grave a consulta para gerar a transcrição
              </p>
              
              <Button 
                onClick={handleStartRecording} 
                className="recording-button recording-button-primary"
                size="icon"
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Clique no botão para iniciar gravação</span>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Fale pausadamente e com clareza para melhores resultados
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

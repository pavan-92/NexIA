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
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">Gravação da Consulta</h3>
        <p className="text-muted-foreground">
          Grave a consulta para gerar a transcrição e o prontuário automaticamente
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-8"
      >
        {isRecording ? (
          <div className="space-y-8 w-full max-w-md">
            <div className="relative">
              <Progress value={visualizationLevel} className="h-3" />
              <div className="text-center mt-4">
                <div className="text-2xl font-bold">{formatTime(recordingTime)}</div>
                <div className="text-sm text-red-500 animate-pulse">Gravando...</div>
              </div>
            </div>
            
            <Button 
              onClick={handleStopRecording} 
              variant="outline" 
              size="lg" 
              className="w-full flex items-center justify-center gap-2 border-red-500 text-red-500 hover:bg-red-500/10"
            >
              <StopCircle className="h-5 w-5" />
              Parar Gravação
            </Button>
          </div>
        ) : audioBlob ? (
          <div className="space-y-6 w-full max-w-md">
            <Card className="p-4 flex items-center justify-between bg-muted/50">
              <div className="flex items-center">
                <Volume2 className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <div className="font-medium">Gravação concluída</div>
                  <div className="text-sm text-muted-foreground">
                    Duração: {formatTime(recordingTime)}
                  </div>
                </div>
              </div>
              
              {audioUrl && (
                <audio controls className="w-32 h-10">
                  <source src={audioUrl} type="audio/webm" />
                  Seu navegador não suporta a reprodução de áudio.
                </audio>
              )}
            </Card>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleTranscribe} 
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Transcrevendo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Transcrever Áudio
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleReset} 
                variant="outline" 
                disabled={isTranscribing}
                className="flex-1"
              >
                Nova Gravação
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 w-full max-w-md">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartRecording}
              className="bg-primary/10 rounded-full w-32 h-32 mx-auto flex items-center justify-center cursor-pointer"
            >
              <Mic className="h-12 w-12 text-primary" />
            </motion.div>
            
            <h3 className="text-xl font-medium">Clique para começar a gravar</h3>
            
            <Button 
              onClick={handleStartRecording} 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Iniciar Gravação
            </Button>
          </div>
        )}
      </motion.div>
      
      <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
        <h4 className="font-medium mb-2">Dicas para uma boa gravação:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Certifique-se de que o microfone está funcionando corretamente</li>
          <li>Fale pausadamente e com clareza</li>
          <li>Reduza os ruídos de fundo durante a consulta</li>
          <li>Para melhores resultados, use um microfone externo</li>
        </ul>
      </div>
    </div>
  );
}

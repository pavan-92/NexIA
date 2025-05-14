import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/use-auth";
import { useRecording } from "@/hooks/use-recording";

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
          {/* Controles de gravação - mudam conforme o estado */}
          {isRecording ? (
            <div className="recording-interface">
              <div className="flex-1">
                <div className="recording-waveform">
                  <Progress value={visualizationLevel} className="h-2 bg-gray-100 [&>*]:bg-[#1B98E0]" />
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
          ) : audioBlob || audioSegments.length > 0 ? (
            <>
              <div className="bg-gray-50 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-[#1B98E0]/10 rounded-full flex items-center justify-center text-[#006494] mr-3">
                      <Volume2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Áudios gravados</div>
                      <div className="text-xs text-gray-500">
                        {audioSegments.length} segmento(s) • Total: {formatTime(recordingTime)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lista de segmentos de áudio */}
              {audioSegments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {audioSegments.map((segment, index) => (
                    <div key={segment.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-2">
                      <div className="flex items-center">
                        <div className="text-xs font-medium text-gray-700 mr-2">
                          {index + 1}
                        </div>
                        <audio controls className="h-8 w-32 mr-2">
                          <source src={segment.url} type="audio/webm" />
                        </audio>
                        <div className="text-xs text-gray-500">
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
              )}
              
              {/* Caso não tenha segmentos, mostra mensagem */}
              {audioSegments.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-500 text-sm italic mb-3">
                  Não há segmentos de áudio gravados
                </div>
              )}
            </>
          ) : (
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
          )}
          
          {/* Área de transcrição - SEMPRE VISÍVEL independentemente do estado */}
          <div className={`p-4 rounded-lg border min-h-[200px] flex flex-col ${isRecording ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center mb-2">
              {isRecording && (
                <div className="animate-pulse text-blue-500 text-sm font-medium mr-2">●</div>
              )}
              <h3 className={`text-sm font-medium ${isRecording ? 'text-blue-700' : 'text-gray-700'}`}>
                {isRecording ? 'Transcrição em tempo real' : 'Transcrição da consulta'}
              </h3>
            </div>
            
            {liveTranscript ? (
              <div className="text-sm text-gray-700 flex-grow">
                {liveTranscript}
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic flex-grow flex items-center justify-center">
                {isRecording 
                  ? "Aguardando fala..." 
                  : (audioBlob || audioSegments.length > 0)
                    ? "Clique em \"Transcrever\" para processar o áudio gravado"
                    : "A transcrição aparecerá aqui durante a gravação"}
              </div>
            )}
          </div>
          
          {isRecording && (
            <p className="text-xs text-gray-500 mt-2">
              Fale pausadamente e com clareza para melhores resultados
            </p>
          )}
          
          {/* Botões de ação - visíveis apenas quando não está gravando e tem áudio */}
          {!isRecording && (audioBlob || audioSegments.length > 0) && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Button 
                  onClick={handleTranscribe} 
                  className="bg-[#006494] text-white hover:bg-[#13293D] text-sm flex-1"
                  disabled={isTranscribing || audioSegments.length === 0}
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
                  onClick={handleStartRecording} 
                  className="text-sm bg-green-600 text-white hover:bg-green-700"
                  disabled={isRecording || isTranscribing}
                >
                  <Mic className="mr-2 h-3 w-3" />
                  Nova gravação
                </Button>
              </div>
              
              <Button 
                onClick={handleReset} 
                variant="outline" 
                disabled={isTranscribing || audioSegments.length === 0}
                className="text-sm border-gray-200 text-gray-700"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Descartar tudo
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
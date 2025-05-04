import { useState } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Save, Sparkles } from "lucide-react";

interface TranscriptViewProps {
  transcript: string;
  consultationId?: string;
  onGenerateNotes: (notes: any) => void;
}

export default function TranscriptView({
  transcript,
  consultationId,
  onGenerateNotes
}: TranscriptViewProps) {
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save transcript mutation
  const { mutate: saveTranscript, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!consultationId) {
        throw new Error("ID da consulta não disponível");
      }
      
      return await apiRequest(
        "PUT",
        `/api/consultations/${consultationId}`,
        {
          transcription: editedTranscript
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/consultations/${consultationId}`] });
      toast({
        title: "Transcrição salva",
        description: "As alterações na transcrição foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: `Não foi possível salvar a transcrição: ${error.message}`,
      });
    },
  });

  const handleGenerateNotes = async () => {
    if (!editedTranscript) {
      toast({
        variant: "destructive",
        title: "Transcrição vazia",
        description: "É necessário ter uma transcrição para gerar o prontuário.",
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/generate-notes",
        { transcription: editedTranscript }
      );
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Save transcript first if we have a consultation ID
      if (consultationId) {
        await saveTranscript();
      }
      
      onGenerateNotes(data);
      
      toast({
        title: "Prontuário gerado",
        description: "O prontuário foi gerado com sucesso a partir da transcrição.",
      });
    } catch (error) {
      console.error("Error generating notes:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar prontuário",
        description: "Não foi possível gerar o prontuário. Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">Transcrição da Consulta</h3>
          <p className="text-muted-foreground">
            Revise e edite a transcrição antes de gerar o prontuário
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {consultationId && (
            <Button 
              onClick={() => saveTranscript()} 
              variant="outline" 
              disabled={isSaving || isGenerating}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          )}
          
          <Button 
            onClick={handleGenerateNotes}
            disabled={!editedTranscript || isGenerating}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Brain className="h-4 w-4 animate-pulse" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Prontuário
              </>
            )}
          </Button>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Textarea
          value={editedTranscript}
          onChange={(e) => setEditedTranscript(e.target.value)}
          placeholder="A transcrição da consulta aparecerá aqui..."
          className="min-h-[300px] font-mono text-sm"
          disabled={isSaving || isGenerating}
        />
      </motion.div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {editedTranscript ? `${editedTranscript.length} caracteres` : "Nenhum conteúdo"}
        </div>
        
        <div className="flex items-center">
          <Sparkles className="h-4 w-4 mr-1" />
          Powered by IA
        </div>
      </div>
    </div>
  );
}

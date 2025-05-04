import { useState } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Download, Save, AlertCircle, Heart, ThumbsUp, ThumbsDown } from "lucide-react";

interface ProntuarioViewProps {
  notes: any;
  consultationId?: string;
  onSave: (notes: any) => void;
  onExportPDF: () => void;
}

export default function ProntuarioView({
  notes,
  consultationId,
  onSave,
  onExportPDF
}: ProntuarioViewProps) {
  const [editedNotes, setEditedNotes] = useState(notes || {
    chiefComplaint: "",
    history: "",
    diagnosis: "",
    plan: "",
    emotionalAnalysis: {
      sentiment: "neutral",
      emotions: {
        joy: 0,
        sadness: 0,
        fear: 0,
        anger: 0,
        surprise: 0,
        disgust: 0,
      },
      confidenceScore: 0,
    },
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Save notes mutation
  const { mutate: saveNotes, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!consultationId) {
        throw new Error("ID da consulta não disponível");
      }
      
      return await apiRequest(
        "PUT",
        `/api/consultations/${consultationId}`,
        {
          notes: editedNotes,
          status: "completed"
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/consultations/${consultationId}`] });
      onSave({ notes: editedNotes, status: "completed" });
      toast({
        title: "Prontuário salvo",
        description: "As alterações no prontuário foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: `Não foi possível salvar o prontuário: ${error.message}`,
      });
    },
  });

  const handleChange = (field: string, value: string) => {
    setEditedNotes((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-5 w-5 text-green-500" />;
      case "negative":
        return <ThumbsDown className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "Positivo";
      case "negative":
        return "Negativo";
      default:
        return "Neutro";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-600 hover:bg-green-700";
      case "negative":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-yellow-600 hover:bg-yellow-700";
    }
  };

  // Get the top emotions sorted by value
  const getTopEmotions = () => {
    if (!editedNotes?.emotionalAnalysis?.emotions) return [];
    
    return Object.entries(editedNotes.emotionalAnalysis.emotions)
      .filter(([_, value]) => (value as number) > 0.1)
      .sort(([_, a], [__, b]) => (b as number) - (a as number))
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">Prontuário Médico</h3>
          <p className="text-muted-foreground">
            Revise e edite o prontuário gerado pela IA
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {consultationId && (
            <Button 
              onClick={() => saveNotes()}
              disabled={isSaving}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              Salvar Prontuário
            </Button>
          )}
          
          <Button 
            onClick={onExportPDF}
            variant="outline" 
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Queixa Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedNotes?.chiefComplaint || ""}
                onChange={(e) => handleChange("chiefComplaint", e.target.value)}
                placeholder="Queixa principal do paciente..."
                className="min-h-[100px]"
                disabled={isSaving}
              />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>História da Moléstia Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedNotes?.history || ""}
                onChange={(e) => handleChange("history", e.target.value)}
                placeholder="História da moléstia atual..."
                className="min-h-[100px]"
                disabled={isSaving}
              />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Hipótese Diagnóstica</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedNotes?.diagnosis || ""}
                onChange={(e) => handleChange("diagnosis", e.target.value)}
                placeholder="Hipótese diagnóstica..."
                className="min-h-[100px]"
                disabled={isSaving}
              />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Conduta</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedNotes?.plan || ""}
                onChange={(e) => handleChange("plan", e.target.value)}
                placeholder="Plano de tratamento e conduta..."
                className="min-h-[100px]"
                disabled={isSaving}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {editedNotes?.emotionalAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Análise Emocional</CardTitle>
              {editedNotes.emotionalAnalysis.sentiment && (
                <Badge className={getSentimentColor(editedNotes.emotionalAnalysis.sentiment)}>
                  {getSentimentIcon(editedNotes.emotionalAnalysis.sentiment)}
                  <span className="ml-1">{getSentimentText(editedNotes.emotionalAnalysis.sentiment)}</span>
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Emoções Predominantes</h4>
                  <div className="flex flex-wrap gap-2">
                    {getTopEmotions().map(([emotion, value]) => (
                      <Badge key={emotion} variant="outline" className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-primary" />
                        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}: {Math.round((value as number) * 100)}%
                      </Badge>
                    ))}
                    
                    {getTopEmotions().length === 0 && (
                      <span className="text-sm text-muted-foreground">Nenhuma emoção significativa detectada</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Confiança na Análise</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-muted h-2 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${(editedNotes.emotionalAnalysis.confidenceScore || 0) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm whitespace-nowrap">
                      {Math.round((editedNotes.emotionalAnalysis.confidenceScore || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="text-xs">* Esta é uma análise automatizada gerada pela IA</div>
        
        <div className="flex items-center">
          <Brain className="h-4 w-4 mr-1" />
          Powered by IA
        </div>
      </div>
    </div>
  );
}

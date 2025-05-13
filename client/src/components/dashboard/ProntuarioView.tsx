import { useState } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Download, Save } from "lucide-react";

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
    plan: ""
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
      

      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="text-xs">* Este é um prontuário automatizado gerado pela IA</div>
        
        <div className="flex items-center">
          <Brain className="h-4 w-4 mr-1" />
          Powered by IA
        </div>
      </div>
    </div>
  );
}

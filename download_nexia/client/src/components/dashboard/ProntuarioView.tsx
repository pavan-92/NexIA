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
    patientInfo: {
      fullName: "",
      birthDate: "",
      sex: "",
      cpf: "",
      motherName: "",
      address: ""
    },
    healthcareInfo: {
      cnes: "",
      professionalName: "",
      professionalCNS: "",
      professionalCBO: ""
    },
    consultation: {
      dateTime: new Date().toLocaleString('pt-BR'),
      consultationType: "Consulta médica",
      
      // Formato SOAP
      subjective: "",
      objective: "",
      assessment: "",
      plan: {
        procedures: "",
        medications: "",
        referrals: "",
        conduct: "",
        followUp: ""
      },
      
      // Campos anteriores para compatibilidade
      chiefComplaint: "",
      anamnesis: "",
      diagnosis: "",
      procedures: "",
      medications: "",
      referrals: "",
      conduct: "",
      clinicalEvolution: "",
      physicalExam: ""
    },
    legalInfo: {
      professionalSignature: "",
      consultationProtocol: `PROT-${Date.now()}`,
      observations: "",
      emotionalObservations: "",
      informedConsent: ""
    }
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

  const handleChange = (section: string, field: string, value: string) => {
    setEditedNotes((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      }
    }));
  };
  
  // Função para manipular campos do plano
  const handlePlanChange = (field: string, value: string) => {
    setEditedNotes((prev: any) => ({
      ...prev,
      consultation: {
        ...prev.consultation,
        plan: {
          ...prev.consultation.plan,
          [field]: value,
        }
      }
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
      
      <div className="space-y-8">
        {/* 1. IDENTIFICAÇÃO DO PACIENTE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Badge variant="outline" className="mr-2">1</Badge>
              Identificação do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Nome completo</h4>
                <Textarea 
                  value={editedNotes?.patientInfo?.fullName || ""}
                  onChange={(e) => handleChange("patientInfo", "fullName", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Data de nascimento</h4>
                <Textarea 
                  value={editedNotes?.patientInfo?.birthDate || ""}
                  onChange={(e) => handleChange("patientInfo", "birthDate", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Sexo</h4>
                <Textarea 
                  value={editedNotes?.patientInfo?.sex || ""}
                  onChange={(e) => handleChange("patientInfo", "sex", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">CPF/CNS</h4>
                <Textarea 
                  value={editedNotes?.patientInfo?.cpf || ""}
                  onChange={(e) => handleChange("patientInfo", "cpf", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Nome da mãe</h4>
                <Textarea 
                  value={editedNotes?.patientInfo?.motherName || ""}
                  onChange={(e) => handleChange("patientInfo", "motherName", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Endereço completo</h4>
                <Textarea 
                  value={editedNotes?.patientInfo?.address || ""}
                  onChange={(e) => handleChange("patientInfo", "address", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. INFORMAÇÕES DA UNIDADE DE SAÚDE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Badge variant="outline" className="mr-2">2</Badge>
              Informações da Unidade de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">CNES</h4>
                <Textarea 
                  value={editedNotes?.healthcareInfo?.cnes || ""}
                  onChange={(e) => handleChange("healthcareInfo", "cnes", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Nome do profissional</h4>
                <Textarea 
                  value={editedNotes?.healthcareInfo?.professionalName || ""}
                  onChange={(e) => handleChange("healthcareInfo", "professionalName", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">CNS do profissional</h4>
                <Textarea 
                  value={editedNotes?.healthcareInfo?.professionalCNS || ""}
                  onChange={(e) => handleChange("healthcareInfo", "professionalCNS", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">CBO do profissional</h4>
                <Textarea 
                  value={editedNotes?.healthcareInfo?.professionalCBO || ""}
                  onChange={(e) => handleChange("healthcareInfo", "professionalCBO", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. DADOS DA CONSULTA / ATENDIMENTO - FORMATO SOAP */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Badge variant="outline" className="mr-2">3</Badge>
              Dados da Consulta (SOAP)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Data e hora</h4>
                  <Textarea 
                    value={editedNotes?.consultation?.dateTime || ""}
                    onChange={(e) => handleChange("consultation", "dateTime", e.target.value)}
                    className="h-10 resize-none"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Tipo de atendimento</h4>
                  <Textarea 
                    value={editedNotes?.consultation?.consultationType || ""}
                    onChange={(e) => handleChange("consultation", "consultationType", e.target.value)}
                    className="h-10 resize-none"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                {/* S - Subjetivo */}
                <div>
                  <h4 className="text-sm font-medium mb-1 flex items-center">
                    <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100">S</Badge>
                    Subjetivo
                  </h4>
                  <Textarea 
                    value={editedNotes?.consultation?.subjective || ""}
                    onChange={(e) => handleChange("consultation", "subjective", e.target.value)}
                    className="min-h-[150px]"
                    disabled={isSaving}
                    placeholder="Queixa principal e relato do paciente"
                  />
                </div>
                
                {/* O - Objetivo */}
                <div>
                  <h4 className="text-sm font-medium mb-1 flex items-center">
                    <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">O</Badge>
                    Objetivo
                  </h4>
                  <Textarea 
                    value={editedNotes?.consultation?.objective || ""}
                    onChange={(e) => handleChange("consultation", "objective", e.target.value)}
                    className="min-h-[150px]"
                    disabled={isSaving}
                    placeholder="Achados clínicos, sinais vitais e exame físico"
                  />
                </div>
                
                {/* A - Avaliação */}
                <div>
                  <h4 className="text-sm font-medium mb-1 flex items-center">
                    <Badge className="mr-2 bg-amber-100 text-amber-800 hover:bg-amber-100">A</Badge>
                    Avaliação
                  </h4>
                  <Textarea 
                    value={editedNotes?.consultation?.assessment || ""}
                    onChange={(e) => handleChange("consultation", "assessment", e.target.value)}
                    className="min-h-[100px]"
                    disabled={isSaving}
                    placeholder="Diagnóstico/hipótese com código CID-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                {/* P - Plano */}
                <div>
                  <h4 className="text-sm font-medium mb-1 flex items-center">
                    <Badge className="mr-2 bg-red-100 text-red-800 hover:bg-red-100">P</Badge>
                    Plano
                  </h4>
                  
                  <div className="border rounded-md p-3 space-y-3">
                    <div>
                      <h5 className="text-xs font-medium mb-1">Procedimentos realizados</h5>
                      <Textarea 
                        value={editedNotes?.consultation?.plan?.procedures || ""}
                        onChange={(e) => handlePlanChange("procedures", e.target.value)}
                        className="min-h-[70px]"
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-medium mb-1">Medicamentos prescritos</h5>
                      <Textarea 
                        value={editedNotes?.consultation?.plan?.medications || ""}
                        onChange={(e) => handlePlanChange("medications", e.target.value)}
                        className="min-h-[70px]"
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-medium mb-1">Encaminhamentos</h5>
                      <Textarea 
                        value={editedNotes?.consultation?.plan?.referrals || ""}
                        onChange={(e) => handlePlanChange("referrals", e.target.value)}
                        className="min-h-[70px]"
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-medium mb-1">Conduta</h5>
                      <Textarea 
                        value={editedNotes?.consultation?.plan?.conduct || ""}
                        onChange={(e) => handlePlanChange("conduct", e.target.value)}
                        className="min-h-[70px]"
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-medium mb-1">Acompanhamento e retorno</h5>
                      <Textarea 
                        value={editedNotes?.consultation?.plan?.followUp || ""}
                        onChange={(e) => handlePlanChange("followUp", e.target.value)}
                        className="min-h-[70px]"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. DOCUMENTOS E REGISTRO LEGAL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Badge variant="outline" className="mr-2">4</Badge>
              Documentos e Registro Legal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Assinatura digital</h4>
                <Textarea 
                  value={editedNotes?.legalInfo?.professionalSignature || ""}
                  onChange={(e) => handleChange("legalInfo", "professionalSignature", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Protocolo interno</h4>
                <Textarea 
                  value={editedNotes?.legalInfo?.consultationProtocol || ""}
                  onChange={(e) => handleChange("legalInfo", "consultationProtocol", e.target.value)}
                  className="h-10 resize-none"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Observações adicionais</h4>
                <Textarea 
                  value={editedNotes?.legalInfo?.observations || ""}
                  onChange={(e) => handleChange("legalInfo", "observations", e.target.value)}
                  className="min-h-[80px]"
                  disabled={isSaving}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Observações emocionais</h4>
                <Textarea 
                  value={editedNotes?.legalInfo?.emotionalObservations || ""}
                  onChange={(e) => handleChange("legalInfo", "emotionalObservations", e.target.value)}
                  className="min-h-[80px]"
                  disabled={isSaving}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <h4 className="text-sm font-medium mb-1">Consentimento informado</h4>
                <Textarea 
                  value={editedNotes?.legalInfo?.informedConsent || ""}
                  onChange={(e) => handleChange("legalInfo", "informedConsent", e.target.value)}
                  className="min-h-[80px]"
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="flex flex-col items-center">
            <div className="flex gap-2 items-center text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span className="text-sm">
                Gerado pela inteligência artificial
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revise todas as informações antes de salvar
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
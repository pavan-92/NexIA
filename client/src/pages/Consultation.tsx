import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generatePDF } from "@/lib/pdf";
import Sidebar from "@/components/dashboard/Sidebar";
import ConsultationView from "@/components/dashboard/ConsultationView";
import RecordingInterface from "@/components/dashboard/RecordingInterface";
import TranscriptView from "@/components/dashboard/TranscriptView";
import ProntuarioView from "@/components/dashboard/ProntuarioView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Download } from "lucide-react";
import { type Patient, type Consultation as ConsultationType } from "@/types";

export default function Consultation({ id }: { id?: string }) {
  const params = useParams();
  const consultationId = id || params.id;
  const isNew = consultationId === "new" || !consultationId;
  const [activeTab, setActiveTab] = useState<string>("details");
  const [transcript, setTranscript] = useState<string>("");
  const [generatedNotes, setGeneratedNotes] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patients for patient selection
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch consultation data if editing
  const { data: consultation, isLoading: isLoadingConsultation } = useQuery<ConsultationType>({
    queryKey: [`/api/consultations/${consultationId}`],
    enabled: !isNew && !!consultationId,
  });

  // Create/update consultation mutation
  const { mutate: saveConsultation, isPending: isSaving } = useMutation({
    mutationFn: (consultationData: Partial<ConsultationType>) => {
      return apiRequest(
        isNew ? "POST" : "PUT",
        isNew ? "/api/consultations" : `/api/consultations/${consultationId}`,
        consultationData
      );
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: isNew ? "Consulta criada!" : "Consulta atualizada!",
        description: "Os dados foram salvos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      if (isNew) {
        // Redirect to the new consultation page
        window.location.href = `/consultation/${data.id}`;
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: `Não foi possível salvar a consulta: ${error.message}`,
      });
    },
  });

  // Export PDF
  const handleExportPDF = () => {
    if (!consultation || !patients) return;
    
    const patient = patients.find(p => p.id === consultation.patientId);
    
    if (!patient) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Dados do paciente não encontrados.",
      });
      return;
    }
    
    toast({
      title: "Exportando PDF",
      description: "Seu prontuário está sendo gerado...",
    });
    
    try {
      generatePDF(consultation, patient);
      
      toast({
        title: "PDF Exportado!",
        description: "O prontuário foi gerado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF. Tente novamente.",
      });
      console.error("PDF generation error:", error);
    }
  };

  // Update tab title
  useEffect(() => {
    document.title = isNew 
      ? "Nova Consulta - Prontu.live" 
      : "Detalhes da Consulta - Prontu.live";
  }, [isNew]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  // Show loading state
  if ((isLoadingConsultation && !isNew) || isLoadingPatients) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium">Carregando...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <div className="p-6 pt-20 lg:pt-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold">
                {isNew ? "Nova Consulta" : "Detalhes da Consulta"}
              </h1>
              <p className="text-muted-foreground">
                {isNew 
                  ? "Crie uma nova consulta e comece a gravar" 
                  : `Consulta ${consultation?.doctorName ? `com ${consultation.doctorName}` : ""}`
                }
              </p>
            </div>
            
            {!isNew && consultation?.notes && (
              <Button 
                onClick={handleExportPDF} 
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            )}
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Tabs 
              defaultValue="details" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                  <TabsTrigger value="recording">Gravação</TabsTrigger>
                  <TabsTrigger value="transcript">Transcrição</TabsTrigger>
                  <TabsTrigger value="prontuario">Prontuário</TabsTrigger>
                </TabsList>
                
                {(transcript || (consultation?.transcription && activeTab === "transcript")) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => setActiveTab("prontuario")}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Gerar Prontuário</span>
                  </Button>
                )}
              </div>
              
              <TabsContent value="details" className="m-0">
                <motion.div
                  variants={itemVariants}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <ConsultationView 
                        isNew={isNew}
                        consultation={consultation}
                        patients={patients || []}
                        onSave={saveConsultation}
                        isSaving={isSaving}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="recording" className="m-0">
                <motion.div
                  variants={itemVariants}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <RecordingInterface 
                        consultationId={consultationId}
                        isNew={isNew}
                        onTranscriptionComplete={(text) => {
                          setTranscript(text);
                          setActiveTab("transcript");
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="transcript" className="m-0">
                <motion.div
                  variants={itemVariants}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <TranscriptView 
                        transcript={transcript || consultation?.transcription || ""}
                        consultationId={consultationId}
                        onGenerateNotes={(notes) => {
                          setGeneratedNotes(notes);
                          setActiveTab("prontuario");
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="prontuario" className="m-0">
                <motion.div
                  variants={itemVariants}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <ProntuarioView 
                        notes={generatedNotes || consultation?.notes}
                        consultationId={consultationId}
                        onSave={saveConsultation}
                        onExportPDF={handleExportPDF}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

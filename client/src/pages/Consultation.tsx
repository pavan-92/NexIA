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
import PubMedSearch from "@/components/dashboard/PubMedSearch";
import TranscriptView from "@/components/dashboard/TranscriptView";
import ProntuarioView from "@/components/dashboard/ProntuarioView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Download, Mic } from "lucide-react";
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
      // Não redirecionamos mais, tudo acontece na mesma página
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
      ? "Nova Consulta - NexIA" 
      : "Detalhes da Consulta - NexIA";
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

  // Get patient info if available
  const patient = patients?.find(p => consultation?.patientId === p.id);

  return (
    <div className="flex min-h-screen medical-bg">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <div className="consultation-layout">
          {!isNew && patient && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="patient-header">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="patient-name">{patient.name}</h1>
                    
                    <div className="patient-info">
                      <div className="patient-info-item">
                        <div className="patient-info-label">Idade</div>
                        <div className="patient-info-value">
                          {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos
                        </div>
                      </div>
                      
                      <div className="patient-info-item">
                        <div className="patient-info-label">Data de nascimento</div>
                        <div className="patient-info-value">
                          {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      <div className="patient-info-item">
                        <div className="patient-info-label">Sexo</div>
                        <div className="patient-info-value">{patient.gender}</div>
                      </div>
                      
                      <div className="patient-info-item">
                        <div className="patient-info-label">Altura</div>
                        <div className="patient-info-value">1,72</div>
                      </div>
                      
                      <div className="patient-info-item">
                        <div className="patient-info-label">Peso</div>
                        <div className="patient-info-value">78kg</div>
                      </div>
                    </div>
                    
                    <div className="patient-tags">
                      <div className="patient-tag">diabetes</div>
                      <div className="patient-tag">hipertensão</div>
                      <div className="patient-tag">alergia</div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleExportPDF} 
                    className="bg-blue-600 hover:bg-blue-700 text-white ml-4"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Encerrar consulta
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="consultation-section">
            {/* Iniciar consulta - Card horizontal em destaque */}
            <motion.div 
              variants={itemVariants} 
              initial="hidden"
              animate="visible"
              className="consultation-main"
            >
              <div className="consultation-card-full">
                <div className="consultation-card-header-highlight">
                  <h3 className="consultation-card-title">
                    <span className="flex items-center justify-center w-7 h-7 mr-2 text-blue-600 bg-blue-100 rounded-full">
                      <Mic className="h-4 w-4" />
                    </span>
                    Iniciar consulta
                  </h3>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Expandir</span>
                  </Button>
                </div>
                <div className="consultation-card-content">
                  <RecordingInterface 
                    consultationId={consultationId}
                    isNew={isNew}
                    onTranscriptionComplete={(text) => {
                      setTranscript(text);
                      // Não muda mais de tab automaticamente
                    }}
                  />
                </div>
              </div>
            </motion.div>
            
            {/* Cards inferiores em grid */}
            <div className="consultation-grid">
              {/* Sugestões de perguntas */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <div className="consultation-card">
                  <div className="consultation-card-header">
                    <h3 className="consultation-card-title">
                      <span className="flex items-center justify-center w-6 h-6 mr-2 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </span>
                      Sugestões de perguntas
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Expandir</span>
                    </Button>
                  </div>
                  <div className="consultation-card-content space-y-3">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <span className="text-gray-600 mr-2">•</span>
                        <span>Sentiu algum tipo de desconforto relacionado ao estômago?</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gray-600 mr-2">•</span>
                        <span>Você está com diarreia faz quantos dias?</span>
                      </li>
                    </ul>
                    
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-800 mb-2">Possíveis hipóteses diagnósticas</h4>
                      <div className="space-y-2">
                        <div className="tag-pill tag-blue">Retocolite Ulcerativa (K51.0)</div>
                        <div className="tag-pill tag-blue">Colite ulcerativa (K51)</div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-800 mb-2">Queixa principal</h4>
                      <div className="space-y-2">
                        <div className="tag-pill tag-blue">diarreia</div>
                        <div className="tag-pill tag-blue">queimação</div>
                        <div className="tag-pill tag-blue">dor abdominal</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Alergias */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <div className="consultation-card">
                  <div className="consultation-card-header">
                    <h3 className="consultation-card-title">
                      <span className="flex items-center justify-center w-6 h-6 mr-2 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </span>
                      Alergias
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Expandir</span>
                    </Button>
                  </div>
                  <div className="consultation-card-content">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left">
                            <th className="pb-2 font-medium text-gray-500">Tipo</th>
                            <th className="pb-2 font-medium text-gray-500">Data</th>
                            <th className="pb-2 font-medium text-gray-500">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-2">Metoclopramida</td>
                            <td className="py-2">24.05.2011</td>
                            <td className="py-2">
                              <span className="tag-pill tag-yellow">Ativo</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">Intolerância a glúten</td>
                            <td className="py-2">23.05.2011</td>
                            <td className="py-2">
                              <span className="tag-pill tag-yellow">Ativo</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">Intolerância a levedura</td>
                            <td className="py-2">23.05.2013</td>
                            <td className="py-2">
                              <span className="tag-pill tag-yellow">Ativo</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">Urticária</td>
                            <td className="py-2">22.05.2022</td>
                            <td className="py-2">
                              <span className="tag-pill tag-red">Inativo</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="text-right mt-3">
                      <Button variant="link" className="text-blue-600 p-0 h-auto text-sm">
                        + informações
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Estruturação de exames */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <div className="consultation-card">
                  <div className="consultation-card-header">
                    <h3 className="consultation-card-title">
                      <span className="flex items-center justify-center w-6 h-6 mr-2 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </span>
                      Estruturação de exames
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Expandir</span>
                    </Button>
                  </div>
                  <div className="consultation-card-content">
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-600 mb-3">Faça aqui o upload dos seus exames clínicos</p>
                      <Button className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100">
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Pesquisa na PubMed */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <div className="consultation-card">
                  <div className="consultation-card-header">
                    <h3 className="consultation-card-title">
                      <span className="flex items-center justify-center w-6 h-6 mr-2 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </span>
                      Pesquisa na PubMed
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Expandir</span>
                    </Button>
                  </div>
                  <div className="consultation-card-content">
                    <PubMedSearch />
                  </div>
                </div>
              </motion.div>
              
              {/* Prontuário */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <div className="consultation-card">
                  <div className="consultation-card-header">
                    <h3 className="consultation-card-title">
                      <span className="flex items-center justify-center w-6 h-6 mr-2 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </span>
                      Prontuário
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Expandir</span>
                    </Button>
                  </div>
                  <div className="consultation-card-content">
                    {generatedNotes || consultation?.notes ? (
                      <ProntuarioView 
                        consultationId={consultationId}
                        notes={generatedNotes || consultation?.notes} 
                        onSave={(notes) => {
                          setGeneratedNotes(notes);
                          saveConsultation({ notes });
                        }}
                        onExportPDF={handleExportPDF}
                      />
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 mb-4">Aqui será exibido o prontuário da consulta após a transcrição</p>
                        <Button 
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          onClick={() => {
                            // Se já tiver transcrição, tenta gerar notas
                            if (transcript || consultation?.transcription) {
                              setActiveTab("transcript");
                            } else {
                              setActiveTab("recording");
                            }
                          }}
                        >
                          Gerar Prontuário
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
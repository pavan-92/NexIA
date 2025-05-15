import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuthState } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/Sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Search, Filter, Download, MoreHorizontal, Loader2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { Consultation, Patient } from "@/types";
import { cn } from "@/lib/utils";
import { generatePDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const { user } = useAuthState();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  
  const consultationsPerPage = 10;

  // Fetch consultations
  const { data: consultations, isLoading: isLoadingConsultations } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations"],
    enabled: !!user,
  });

  // Fetch patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: !!user,
  });

  // Filter and sort consultations
  const filteredConsultations = consultations
    ? consultations
        .filter((consultation) => {
          // Status filter
          if (activeTab !== "all" && consultation.status !== activeTab) {
            return false;
          }
          
          // Date filter
          if (selectedDate) {
            const consultationDate = new Date(consultation.date);
            if (
              consultationDate.getDate() !== selectedDate.getDate() ||
              consultationDate.getMonth() !== selectedDate.getMonth() ||
              consultationDate.getFullYear() !== selectedDate.getFullYear()
            ) {
              return false;
            }
          }
          
          // Search filter
          if (searchQuery) {
            const patient = patients?.find(p => p.id === consultation.patientId);
            const searchableText = `${consultation.doctorName} ${patient?.name || ""} ${formatDate(consultation.date)}`.toLowerCase();
            return searchableText.includes(searchQuery.toLowerCase());
          }
          
          return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  // Calculate pagination
  const indexOfLastConsultation = currentPage * consultationsPerPage;
  const indexOfFirstConsultation = indexOfLastConsultation - consultationsPerPage;
  const currentConsultations = filteredConsultations.slice(
    indexOfFirstConsultation,
    indexOfLastConsultation
  );
  const totalPages = Math.ceil(filteredConsultations.length / consultationsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Find patient by ID
  const getPatientName = (patientId: number) => {
    return patients?.find(p => p.id === patientId)?.name || "Paciente não encontrado";
  };

  // Status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 hover:bg-green-700">Concluída</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-600 hover:bg-blue-700">Em Andamento</Badge>;
      case "scheduled":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Agendada</Badge>;
      case "cancelled":
        return <Badge className="bg-red-600 hover:bg-red-700">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleExportPDF = (consultation: Consultation) => {
    if (!patients) return;
    
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

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDate(undefined);
    setActiveTab("all");
    setCurrentPage(1);
  };

  useEffect(() => {
    document.title = "Histórico de Consultas - Prontu.live";
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
    }
  };

  if (isLoadingConsultations || isLoadingPatients) {
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
            className="mb-8"
          >
            <h1 className="text-3xl font-bold">Histórico de Consultas</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie o histórico de consultas
            </p>
          </motion.div>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar consultas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? formatDate(selectedDate) : "Filtrar por data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {(searchQuery || selectedDate || activeTab !== "all") && (
                  <Button variant="ghost" onClick={resetFilters} className="w-full sm:w-auto">
                    Limpar filtros
                  </Button>
                )}
              </div>
              
              <Link href="/consultation/new">
                <Button className="w-full md:w-auto">Nova Consulta</Button>
              </Link>
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">Concluídas</TabsTrigger>
                <TabsTrigger value="in-progress" className="flex-1">Em Progresso</TabsTrigger>
                <TabsTrigger value="scheduled" className="flex-1">Agendadas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                {filteredConsultations.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <h3 className="text-xl font-bold mb-2">Nenhuma consulta encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || selectedDate || activeTab !== "all"
                        ? "Tente refinar sua busca ou remover filtros."
                        : "Você ainda não tem consultas registradas."}
                    </p>
                    <Link href="/consultation/new">
                      <Button>Registrar Consulta</Button>
                    </Link>
                  </div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Médico</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentConsultations.map((consultation) => (
                            <TableRow key={consultation.id} asChild>
                              <motion.tr variants={itemVariants}>
                                <TableCell className="font-medium">{getPatientName(consultation.patientId)}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>{formatDate(consultation.date)}</span>
                                    <span className="text-xs text-muted-foreground">{formatTime(consultation.date)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{consultation.doctorName}</TableCell>
                                <TableCell>{getStatusBadge(consultation.status)}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                      <DropdownMenuItem asChild>
                                        <Link href={`/consultation/${consultation.id}`}>
                                          <a className="w-full cursor-pointer">Ver detalhes</a>
                                        </Link>
                                      </DropdownMenuItem>
                                      {consultation.notes && (
                                        <DropdownMenuItem onClick={() => handleExportPDF(consultation)}>
                                          <Download className="mr-2 h-4 w-4" />
                                          Exportar PDF
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </motion.tr>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {totalPages > 1 && (
                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={currentPage === i + 1}
                                onClick={() => paginate(i + 1)}
                                className="cursor-pointer"
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </motion.div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-6">
                {/* Same table structure as "all" tab */}
                {filteredConsultations.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <h3 className="text-xl font-bold mb-2">Nenhuma consulta concluída</h3>
                    <p className="text-muted-foreground">
                      Não há registros de consultas concluídas no sistema.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    {/* Same table as above */}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="in-progress" className="mt-6">
                {filteredConsultations.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <h3 className="text-xl font-bold mb-2">Nenhuma consulta em progresso</h3>
                    <p className="text-muted-foreground">
                      Não há consultas em andamento no momento.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    {/* Same table as above */}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="scheduled" className="mt-6">
                {filteredConsultations.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg">
                    <h3 className="text-xl font-bold mb-2">Nenhuma consulta agendada</h3>
                    <p className="text-muted-foreground">
                      Não há consultas agendadas para o futuro.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    {/* Same table as above */}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

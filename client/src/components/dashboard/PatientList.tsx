import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Patient, PatientFormData } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { PlusCircle, Search, UserPlus, Loader2 } from "lucide-react";
import PatientForm from "./PatientForm";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PatientList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const patientsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });
  
  const addPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      return apiRequest({ 
        url: "/api/patients", 
        method: "POST", 
        data 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Paciente adicionado",
        description: "O paciente foi adicionado com sucesso",
      });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao adicionar o paciente",
        variant: "destructive",
      });
    },
  });

  // Filter patients based on search query and active tab
  const filteredPatients = patients
    ? patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (patient.contact && patient.contact.includes(searchQuery))
      )
    : [];

  // Calculate pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(
    indexOfFirstPatient,
    indexOfLastPatient
  );
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar pacientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                <UserPlus className="h-4 w-4" />
                <span>Novo Paciente</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do paciente abaixo. Os campos marcados com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>
              <PatientForm 
                onSubmit={(data) => addPatientMutation.mutate(data)} 
                isSubmitting={addPatientMutation.isPending}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1 w-full sm:w-auto">
                <PlusCircle className="h-4 w-4" />
                <span>Nova Consulta</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Nova Consulta</DialogTitle>
                <DialogDescription>
                  Selecione o paciente e a data para a consulta.
                </DialogDescription>
              </DialogHeader>
              {/* Consultation form would go here */}
              <div className="py-4 text-center text-muted-foreground">
                Formulário de agendamento de consultas
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="flex-1">
            Todos
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex-1">
            Recentes
          </TabsTrigger>
          <TabsTrigger value="favorite" className="flex-1">
            Favoritos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <div className="flex justify-center">
                <UserPlus className="h-16 w-16 text-muted-foreground mb-4" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nenhum paciente encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Tente refinar sua busca ou adicione um novo paciente."
                  : "Você ainda não tem pacientes cadastrados."}
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <UserPlus className="h-4 w-4" />
                    <span>Adicionar Paciente</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes do paciente abaixo. Os campos marcados com * são obrigatórios.
                    </DialogDescription>
                  </DialogHeader>
                  <PatientForm 
                    onSubmit={(data) => addPatientMutation.mutate(data)} 
                    isSubmitting={addPatientMutation.isPending}
                    onCancel={() => setDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden md:table-cell">Data de Nascimento</TableHead>
                    <TableHead className="hidden md:table-cell">Contato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {currentPatients.map((patient) => (
                      <motion.tr key={patient.id} variants={itemVariants} className="border-b hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(patient.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{patient.name}</div>
                                <div className="text-sm text-muted-foreground hidden sm:block">
                                  {patient.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(patient.birthDate)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {patient.contact}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/consultation/new?patientId=${patient.id}`}>
                                <Button variant="outline" size="sm">
                                  Nova Consulta
                                </Button>
                              </Link>
                              <Link href={`/patients/${patient.id}`}>
                                <Button size="sm">Ver Detalhes</Button>
                              </Link>
                            </div>
                          </TableCell>
                        </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {pageNumbers.map((number) => (
                      <PaginationItem key={number}>
                        <PaginationLink
                          isActive={currentPage === number}
                          onClick={() => paginate(number)}
                          className="cursor-pointer"
                        >
                          {number}
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
        
        <TabsContent value="recent" className="mt-4">
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">Pacientes recentes aparecerão aqui.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="favorite" className="mt-4">
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">Você não tem pacientes favoritos.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

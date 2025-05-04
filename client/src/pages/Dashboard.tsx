import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, Users, Clock, FileUp, PlusCircle, Activity } from "lucide-react";

// Sample data for the chart
const consultationData = [
  { name: "Jan", count: 4 },
  { name: "Fev", count: 6 },
  { name: "Mar", count: 8 },
  { name: "Abr", count: 5 },
  { name: "Mai", count: 10 },
  { name: "Jun", count: 8 },
  { name: "Jul", count: 12 },
];

export default function Dashboard() {
  const { user } = useAuthState();

  // Fetch patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
    enabled: !!user,
  });

  // Fetch consultations
  const { data: consultations, isLoading: isLoadingConsultations } = useQuery({
    queryKey: ["/api/consultations"],
    enabled: !!user,
  });

  useEffect(() => {
    document.title = "Dashboard - Prontu.live";
  }, []);

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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <div className="p-6 pt-20 lg:pt-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
              <p className="text-gray-500 font-medium mt-1">
                Bem-vindo, {user?.displayName || "Doutor"}!
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
              <Link href="/patients">
                <span className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 hover:text-blue-600 transition-all duration-200">
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Pacientes
                  </Button>
                </span>
              </Link>
              <Link href="/consultation/new">
                <span className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Consulta
                  </Button>
                </span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="dashboard-card card-hover-effect overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total de Pacientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      {isLoadingPatients ? "..." : patients?.length || 0}
                    </div>
                    <div className="dashboard-icon dashboard-icon-blue">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="dashboard-card card-hover-effect overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Consultas este Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      {isLoadingConsultations ? "..." : consultations?.length || 0}
                    </div>
                    <div className="dashboard-icon dashboard-icon-purple">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="dashboard-card card-hover-effect overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Uso do Plano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900">70%</div>
                      <div className="dashboard-icon dashboard-icon-green">
                        <Activity className="h-5 w-5" />
                      </div>
                    </div>
                    <Progress value={70} className="h-2 bg-gray-100" 
                      style={{background: "rgba(90, 146, 246, 0.2)"}}
                      indicatorClassName="bg-blue-600"
                    />
                    <p className="text-xs text-gray-500">
                      7/10 consultas usadas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="dashboard-card card-hover-effect overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Prontuários Exportados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">18</div>
                    <div className="dashboard-icon dashboard-icon-amber">
                      <FileUp className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Consultas</CardTitle>
                  <CardDescription>
                    Consultas realizadas nos últimos 7 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={consultationData}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                          }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                          activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Consultas</CardTitle>
                  <CardDescription>
                    Consultas agendadas para hoje
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingConsultations ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : consultations?.length ? (
                    <div className="space-y-4">
                      {/* List upcoming consultations here */}
                      <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg">
                        <Clock className="h-9 w-9 text-primary p-2 bg-primary/20 rounded-full" />
                        <div>
                          <p className="font-medium">Maria Silva</p>
                          <p className="text-sm text-muted-foreground">14:30 - Check-up anual</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg">
                        <Clock className="h-9 w-9 text-primary p-2 bg-primary/20 rounded-full" />
                        <div>
                          <p className="font-medium">João Ferreira</p>
                          <p className="text-sm text-muted-foreground">16:00 - Consulta de retorno</p>
                        </div>
                      </div>
                      <Link href="/history">
                        <a className="text-primary hover:text-primary/80 transition-colors duration-300 text-sm">
                          Ver todas as consultas
                        </a>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">Nenhuma consulta hoje</h3>
                      <p className="text-muted-foreground mb-4">
                        Você não tem consultas agendadas para hoje.
                      </p>
                      <Link href="/consultation/new">
                        <Button size="sm">Agendar Consulta</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

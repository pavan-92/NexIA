import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "@/hooks/use-auth";
import Sidebar from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<any[]>({
    queryKey: ["/api/patients"],
    enabled: !!user,
  });

  // Fetch consultations
  const { data: consultations = [], isLoading: isLoadingConsultations } = useQuery<any[]>({
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
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
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
              <Card className="dashboard-card hover-scale overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg text-gray-800 font-semibold">Histórico de Consultas</CardTitle>
                      <CardDescription className="text-gray-500">
                        Consultas realizadas nos últimos 7 meses
                      </CardDescription>
                    </div>
                    <div className="dashboard-icon dashboard-icon-blue">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(230, 230, 230, 0.6)" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            borderColor: "#E5E7EB",
                            borderRadius: "0.5rem",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
                          }}
                          itemStyle={{ color: "#374151" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#5A92F6"
                          strokeWidth={3}
                          dot={{ fill: "#5A92F6", r: 4 }}
                          activeDot={{ r: 7, fill: "#5A92F6", stroke: "white", strokeWidth: 2 }}
                          animationDuration={1500}
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
              <Card className="dashboard-card hover-scale overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg text-gray-800 font-semibold">Próximas Consultas</CardTitle>
                      <CardDescription className="text-gray-500">
                        Consultas agendadas para hoje
                      </CardDescription>
                    </div>
                    <div className="dashboard-icon dashboard-icon-purple">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingConsultations ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                  ) : consultations?.length ? (
                    <div className="space-y-4">
                      {/* List upcoming consultations here */}
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Maria Silva</p>
                          <p className="text-sm text-gray-500">14:30 - Check-up anual</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">João Ferreira</p>
                          <p className="text-sm text-gray-500">16:00 - Consulta de retorno</p>
                        </div>
                      </div>
                      <Link href="/history">
                        <span className="text-blue-600 hover:text-blue-700 transition-colors duration-300 text-sm font-medium cursor-pointer block mt-2">
                          Ver todas as consultas →
                        </span>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-gray-800">Nenhuma consulta hoje</h3>
                      <p className="text-gray-500 mb-4">
                        Você não tem consultas agendadas para hoje.
                      </p>
                      <Link href="/consultation/new">
                        <span className="cursor-pointer">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Agendar Consulta
                          </Button>
                        </span>
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

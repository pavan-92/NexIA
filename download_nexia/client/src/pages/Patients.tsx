import { useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/dashboard/Sidebar";
import PatientList from "@/components/dashboard/PatientList";

export default function Patients() {
  useEffect(() => {
    document.title = "Pacientes - Prontu.live";
  }, []);

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
            <h1 className="text-3xl font-bold">Pacientes</h1>
            <p className="text-muted-foreground">
              Gerencie seus pacientes e histórico médico
            </p>
          </motion.div>
          
          <PatientList />
        </div>
      </div>
    </div>
  );
}

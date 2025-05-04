import { useEffect } from "react";
import { motion } from "framer-motion";
import { useIsAuthenticated } from "@/hooks/use-auth";
import RegisterForm from "@/components/auth/RegisterForm";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Register() {
  const { isAuthenticated, loading } = useIsAuthenticated();
  
  useEffect(() => {
    document.title = "Criar Conta - Prontu.live";
    
    // Redirect if already authenticated
    if (isAuthenticated && !loading) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 min-h-[80vh] flex items-center justify-center">
          <div className="w-full max-w-md">
            <RegisterForm />
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
}

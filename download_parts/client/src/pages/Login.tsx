import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useIsAuthenticated } from "@/hooks/use-auth";
import LoginForm from "@/components/auth/LoginForm";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Login() {
  const { isAuthenticated, loading } = useIsAuthenticated();
  
  useEffect(() => {
    document.title = "Login - Prontu.live";
    
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
            <LoginForm />
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Ao fazer login, você concorda com nossos{" "}
                <Link href="/terms">
                  <a className="underline underline-offset-2 hover:text-foreground">
                    Termos de Serviço
                  </a>
                </Link>{" "}
                e{" "}
                <Link href="/privacy">
                  <a className="underline underline-offset-2 hover:text-foreground">
                    Política de Privacidade
                  </a>
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
}

import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="hero-gradient min-h-screen flex items-center py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1 space-y-8"
          >
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            >
              Transforme sua consulta médica com{" "}
              <span className="gradient-text">IA em tempo real</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg md:text-xl text-foreground/80"
            >
              A NexIA transcreve, resume e organiza seus prontuários automaticamente – tudo enquanto você cuida do paciente.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="pt-4"
            >
              <Link href="/register">
                <Button 
                  className="btn-shine bg-gradient-to-r from-[#006494] to-[#1B98E0] hover:shadow-lg hover:shadow-[#006494]/20 text-white px-8 py-6 rounded-lg font-bold text-lg"
                >
                  Experimente Grátis
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="order-1 lg:order-2 flex justify-center animate-float"
          >
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80" 
                alt="Interface médica futurista com IA" 
                className="rounded-xl object-cover w-full h-full shadow-2xl shadow-primary/20 border border-primary/30 relative z-10"
              />
              <div className="absolute -bottom-5 -right-5 bg-background/80 backdrop-blur-md p-4 rounded-lg border border-primary/30 shadow-lg z-20">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Transcrição em tempo real</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import bannerImage from "../assets/banner-site.jpg";

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
              Médico no comando do cuidado,{" "}
              <span className="gradient-text">IA no controle da burocracia</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg md:text-xl text-foreground/80"
            >
              A NexIA transforma sua fala em prontuários completos sem digitação, eliminando a burocracia e devolvendo seu tempo para o que realmente importa: o paciente.
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              delay: 0.3, 
              duration: 0.8,
              y: {
                duration: 2.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }
            }}
            className="order-1 lg:order-2 flex justify-center"
          >
            <div className="relative w-full max-w-xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-[#006494]/30 to-[#1B98E0]/30 rounded-2xl blur-xl transform -rotate-1"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-[#1B98E0]/20 to-[#006494]/20 rounded-2xl blur-lg transform rotate-1"></div>
              <img 
                src={bannerImage} 
                alt="Médico utilizando a plataforma NexIA durante consulta" 
                className="rounded-2xl w-full h-auto shadow-2xl shadow-[#006494]/30 border-2 border-[#1B98E0]/40 relative z-10 transform hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute -bottom-6 -right-6 bg-background/90 backdrop-blur-md p-4 rounded-lg border border-[#1B98E0]/40 shadow-xl z-20 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-4 h-4 bg-[#1B98E0] rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-[#1B98E0]/40 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-sm font-medium">Transcrição em tempo real</span>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-2xl z-10 pointer-events-none"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

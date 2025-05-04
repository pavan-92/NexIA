import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Demo() {
  return (
    <section className="py-20 bg-background relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80')] bg-cover bg-center opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto bg-card/95 backdrop-blur-md p-8 md:p-12 rounded-2xl border border-border"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Veja a Prontu.live em ação
              </h2>
              <p className="text-lg text-foreground/80 mb-6">
                Agende uma demonstração ao vivo com nossa equipe para ver como nossa tecnologia pode transformar sua prática médica.
              </p>
              <Link href="/register">
                <Button 
                  className="btn-shine bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-bold"
                >
                  Agendar Demonstração
                </Button>
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-full max-w-xs aspect-square rounded-full bg-primary/20 flex items-center justify-center animate-pulse-slow"
              >
                <Play className="text-white text-4xl fill-white" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

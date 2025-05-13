import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CTA() {
  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-[#006494]/20 to-[#1B98E0]/20"></div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Comece a transformar suas consultas hoje</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de médicos que já otimizaram seu tempo e melhoraram a experiência dos seus pacientes com a NexIA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                className="btn-shine bg-gradient-to-r from-[#006494] to-[#1B98E0] text-white px-8 py-6 rounded-lg font-bold text-lg"
              >
                Experimente Grátis
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                variant="outline" 
                className="bg-background text-foreground px-8 py-6 rounded-lg font-bold text-lg border border-border hover:bg-muted"
              >
                Agendar Demonstração
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

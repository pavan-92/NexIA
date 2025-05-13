import { motion } from "framer-motion";
import { 
  Mic, 
  Brain, 
  ClipboardList 
} from "lucide-react";

const benefits = [
  {
    icon: <Mic className="h-10 w-10" />,
    title: "Transcrição ao Vivo",
    description: "Transcreve automaticamente toda a conversa durante a consulta, sem perder nenhum detalhe importante."
  },
  {
    icon: <Brain className="h-10 w-10" />,
    title: "Resumo Inteligente",
    description: "Criação de resumos clínicos formais e organizados seguindo padrões médicos reconhecidos."
  },
  {
    icon: <ClipboardList className="h-10 w-10" />,
    title: "Prontuário Inteligente",
    description: "Histórico organizado com filtros avançados e ferramentas de busca para fácil acesso às informações."
  }
];

export default function Benefits() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="benefits" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">O que a NexIA faz por você</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nossas ferramentas de IA foram projetadas para otimizar seu fluxo de trabalho clínico e melhorar a experiência do paciente
          </p>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="feature-card bg-card rounded-xl p-6 border border-border h-full"
            >
              <div className="text-[#1B98E0] text-4xl mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

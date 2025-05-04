import { motion } from "framer-motion";
import { Mic, Bot, FileText } from "lucide-react";

const steps = [
  {
    icon: <Mic className="text-primary text-3xl" />,
    title: "Passo 1",
    subtitle: "Inicie a Gravação",
    description: "Comece sua consulta normalmente e deixe a IA trabalhar em segundo plano."
  },
  {
    icon: <Bot className="text-primary text-3xl" />,
    title: "Passo 2",
    subtitle: "A IA Transcreve e Resume",
    description: "Nossa IA registra cada palavra e organiza as informações em um formato clínico padrão."
  },
  {
    icon: <FileText className="text-primary text-3xl" />,
    title: "Passo 3",
    subtitle: "Exporte o Prontuário",
    description: "Revise, edite se necessário e exporte o prontuário pronto para seu sistema."
  }
];

export default function HowItWorks() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Três passos simples para revolucionar sua rotina de consultas médicas
          </p>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="relative"
            >
              <div className="bg-card rounded-xl p-8 border border-border h-full flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <h4 className="text-lg font-medium text-primary mb-4">{step.subtitle}</h4>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-10 transform -translate-y-1/2 text-primary text-3xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

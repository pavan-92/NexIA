import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const plans = [
  {
    name: "Plano Gratuito",
    price: 0,
    priceDetail: "/mês",
    description: "Perfeito para começar",
    features: [
      { text: "Até 10 prontuários por mês", available: true },
      { text: "Transcrição básica", available: true },
      { text: "Exportação em PDF", available: true },
      { text: "Análise emocional", available: false },
      { text: "Suporte prioritário", available: false }
    ],
    cta: {
      text: "Começar Grátis",
      href: "/register"
    },
    recommended: false
  },
  {
    name: "Plano Profissional",
    price: 149,
    priceDetail: "/mês",
    description: "Para médicos e clínicas",
    features: [
      { text: "Prontuários ilimitados", available: true },
      { text: "Transcrição avançada", available: true },
      { text: "Análise emocional completa", available: true },
      { text: "Integrações com sistemas médicos", available: true },
      { text: "Suporte prioritário 24/7", available: true }
    ],
    cta: {
      text: "Assinar Agora",
      href: "/register"
    },
    recommended: true
  }
];

export default function Pricing() {
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
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos para cada necessidade</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para sua prática médica, sem compromissos ou surpresas
          </p>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className={`bg-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 ${
                plan.recommended 
                  ? "border-2 border-primary relative" 
                  : "border border-border hover:border-primary/50"
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-primary text-white text-sm font-bold px-4 py-1">
                  RECOMENDADO
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? "Grátis" : `R$ ${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">{plan.priceDetail}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      {feature.available ? (
                        <Check className="text-primary h-5 w-5 mt-1 mr-3" />
                      ) : (
                        <X className="text-muted-foreground h-5 w-5 mt-1 mr-3" />
                      )}
                      <span className={feature.available ? "" : "text-muted-foreground"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full block text-center px-6 py-3 rounded-lg font-medium ${
                    plan.recommended
                      ? "btn-shine bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg"
                      : "bg-muted text-foreground border border-primary hover:bg-primary/10"
                  }`}
                  onClick={() => window.location.href = plan.cta.href}
                >
                  {plan.cta.text}
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <div className="text-center mt-12">
          <span 
            className="text-primary hover:text-primary/80 transition-colors duration-300 inline-flex items-center cursor-pointer"
            onClick={() => window.location.href = "/contact"}
          >
            <span>Ver todos os planos e recursos</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 ml-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}

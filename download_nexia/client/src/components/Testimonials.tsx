import { motion } from "framer-motion";
import { Star, StarHalf } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    rating: 5,
    text: "A NexIA revolucionou minha rotina clínica. Agora consigo prestar atenção total ao paciente enquanto a IA cuida dos registros.",
    author: {
      name: "Dra. Ana Silva",
      role: "Clínica Geral",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    }
  },
  {
    rating: 5,
    text: "Minha produtividade dobrou desde que comecei a usar o NexIA. Os resumos são precisos e a transcrição ao vivo não falha.",
    author: {
      name: "Dr. Carlos Mendes",
      role: "Cardiologista",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    }
  },
  {
    rating: 4.5,
    text: "Impressionante como a análise emocional detecta nuances que eu poderia perder. Um diferencial valioso para a empatia médica.",
    author: {
      name: "Dra. Renata Costa",
      role: "Psiquiatra",
      avatar: "https://randomuser.me/api/portraits/women/45.jpg"
    }
  }
];

export default function Testimonials() {
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

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-primary text-primary" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-primary text-primary" />);
    }
    
    return stars;
  };

  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">O que nossos usuários dizem</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Médicos e profissionais de saúde já estão transformando suas práticas com o NexIA
          </p>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex items-center mb-4">
                <div className="flex text-primary">
                  {renderStars(testimonial.rating)}
                </div>
              </div>
              <p className="mb-6 text-foreground/90">{testimonial.text}</p>
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={testimonial.author.avatar} alt={testimonial.author.name} />
                  <AvatarFallback className="bg-primary/20">
                    {testimonial.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold">{testimonial.author.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.author.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

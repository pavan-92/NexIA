import { Link } from "wouter";
import { 
  Instagram, 
  Linkedin, 
  MessageSquare, 
  Heart
} from "lucide-react";
import logo from "../../assets/logo.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background/80 pt-16 pb-8 border-t border-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div 
              className="inline-block mb-6 cursor-pointer"
              onClick={() => window.location.href = "/"}
            >
              <img 
                src={logo} 
                alt="NexIA Logo" 
                className="h-10"
              />
            </div>
            <p className="text-muted-foreground mb-6">
              A NexIA transforma sua fala em prontuários completos sem digitação, eliminando a burocracia e devolvendo seu tempo para o paciente
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://wa.me/5500000000000" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                aria-label="WhatsApp"
              >
                <MessageSquare className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6">Produto</h3>
            <ul className="space-y-3">
              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/#benefits"}
                >
                  Funcionalidades
                </span>
              </li>

              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/#how-it-works"}
                >
                  Como Funciona
                </span>
              </li>
              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/#testimonials"}
                >
                  Casos de Uso
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/about"}
                >
                  Sobre Nós
                </span>
              </li>
              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/blog"}
                >
                  Blog
                </span>
              </li>
              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/careers"}
                >
                  Carreiras
                </span>
              </li>
              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/contact"}
                >
                  Contato
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6">Suporte</h3>
            <ul className="space-y-3">
              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/support"}
                >
                  Central de Ajuda
                </span>
              </li>
              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/docs"}
                >
                  Documentação
                </span>
              </li>
              <li>
                <span 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={() => window.location.href = "/status"}
                >
                  Status
                </span>
              </li>
              <li>
                <a 
                  href="mailto:contato@nexia.com"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  contato@nexia.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/30 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            &copy; {currentYear} NexIA. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <span 
              className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300 cursor-pointer"
              onClick={() => window.location.href = "/terms"}
            >
              Termos de Uso
            </span>
            <span 
              className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300 cursor-pointer"
              onClick={() => window.location.href = "/privacy"}
            >
              Política de Privacidade
            </span>
            <span 
              className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300 cursor-pointer"
              onClick={() => window.location.href = "/cookies"}
            >
              Cookies
            </span>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-muted-foreground/60">
          <p className="flex items-center justify-center gap-1">
            Desenvolvido com <Heart className="h-3 w-3 text-[#1B98E0] animate-pulse" /> pela equipe NexIA
          </p>
        </div>
      </div>
    </footer>
  );
}

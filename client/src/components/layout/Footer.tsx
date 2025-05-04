import { Link } from "wouter";
import { 
  Instagram, 
  Linkedin, 
  MessageSquare, 
  Heart
} from "lucide-react";

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
                src="/logo.png" 
                alt="Prontu.live Logo" 
                className="h-10"
              />
            </div>
            <p className="text-muted-foreground mb-6">
              Transformando consultas médicas com inteligência artificial em tempo real
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
                <Link href="/#pricing">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Planos e Preços
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Como Funciona
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/#testimonials">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Casos de Uso
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Sobre Nós
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Blog
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/careers">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Carreiras
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Contato
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6">Suporte</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/support">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Central de Ajuda
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/docs">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Documentação
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/status">
                  <a className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    Status
                  </a>
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:contato@prontu.live"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  contato@prontu.live
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/30 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            &copy; {currentYear} Prontu.live. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/terms">
              <a className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300">
                Termos de Uso
              </a>
            </Link>
            <Link href="/privacy">
              <a className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300">
                Política de Privacidade
              </a>
            </Link>
            <Link href="/cookies">
              <a className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300">
                Cookies
              </a>
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-muted-foreground/60">
          <p className="flex items-center justify-center gap-1">
            Desenvolvido com <Heart className="h-3 w-3 text-secondary animate-pulse" /> pela equipe Prontu.live
          </p>
        </div>
      </div>
    </footer>
  );
}

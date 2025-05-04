import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useIsAuthenticated } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import logo from "../../assets/logo.png";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const { isAuthenticated } = useIsAuthenticated();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHomePage = location === "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navLinks = isAuthenticated
    ? [
        { title: "Dashboard", href: "/dashboard" },
        { title: "Pacientes", href: "/patients" },
        { title: "Nova Consulta", href: "/consultation/new" },
        { title: "Histórico", href: "/history" },
      ]
    : [];

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 py-4 backdrop-blur-md transition-colors duration-300 shadow-sm",
      isHomePage ? "bg-background/95" : "bg-background"
    )}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <span 
            onClick={() => window.location.href = "/"}
            className="cursor-pointer flex items-center">
            <img 
              src={logo} 
              alt="Prontu.live" 
              className="h-10 cursor-pointer"
            />
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <span 
              key={link.href}
              onClick={() => window.location.href = link.href}
              className={cn(
                "text-foreground/80 hover:text-primary transition-colors duration-300 cursor-pointer",
                location === link.href && "text-primary"
              )}
            >
              {link.title}
            </span>
          ))}

          {isAuthenticated ? (
            <>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="text-foreground/80 hover:text-destructive hover:bg-destructive/10"
              >
                Sair
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Toggle theme" 
                onClick={toggleTheme} 
                className="rounded-full"
              >
                {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <>
              <span 
                className="text-foreground/80 hover:text-primary transition-colors duration-300 cursor-pointer"
                onClick={() => window.location.href = "/login"}
              >
                Entrar
              </span>
              <span 
                className="btn-shine bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 cursor-pointer inline-block"
                onClick={() => window.location.href = "/register"}
              >
                Criar Conta
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Toggle theme" 
                onClick={toggleTheme} 
                className="rounded-full"
              >
                {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Toggle theme" 
            onClick={toggleTheme} 
            className="rounded-full"
          >
            {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Open menu" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="rounded-full"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background shadow-sm"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <span 
                  key={link.href}
                  className={cn(
                    "text-foreground/80 hover:text-primary transition-colors duration-300 py-2 cursor-pointer inline-block",
                    location === link.href && "text-primary"
                  )}
                  onClick={() => {
                    window.location.href = link.href;
                    setMobileMenuOpen(false);
                  }}
                >
                  {link.title}
                </span>
              ))}
              
              {isAuthenticated ? (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start text-foreground/80 hover:text-destructive hover:bg-destructive/10"
                >
                  Sair
                </Button>
              ) : (
                <>
                  <span 
                    className="text-foreground/80 hover:text-primary transition-colors duration-300 py-2 cursor-pointer inline-block"
                    onClick={() => {
                      window.location.href = "/login";
                      setMobileMenuOpen(false);
                    }}
                  >
                    Entrar
                  </span>
                  <span 
                    className="btn-shine bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center cursor-pointer inline-block"
                    onClick={() => {
                      window.location.href = "/register";
                      setMobileMenuOpen(false);
                    }}
                  >
                    Criar Conta
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

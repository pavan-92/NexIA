import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/hooks/use-auth";
import { signOut } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import logo from "../../assets/logo.png";
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarLink {
  label: string;
  icon: React.ReactNode;
  href: string;
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuthState();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("");

  useEffect(() => {
    // Define o item ativo com base na localização atual
    setActiveItem(location);
  }, [location]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const links: SidebarLink[] = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/dashboard",
    },
    {
      label: "Pacientes",
      icon: <Users className="h-5 w-5" />,
      href: "/patients",
    },
    {
      label: "Nova Consulta",
      icon: <FileText className="h-5 w-5" />,
      href: "/consultation/new",
    },
    {
      label: "Histórico",
      icon: <Clock className="h-5 w-5" />,
      href: "/history",
    },
    {
      label: "Configurações",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
    },
  ];

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Desktop sidebar toggle
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 py-3 px-4 bg-background border-b border-border flex items-center justify-between">
        <span 
          onClick={() => window.location.href = "/"}
          className="flex items-center cursor-pointer"
        >
          <img 
            src={logo} 
            alt="NexIA" 
            className="h-8" 
          />
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMobileMenu}
          className="lg:hidden"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          >
            <div className="h-full w-64 bg-card border-r border-border pt-16 flex flex-col">
              <div className="px-4 py-6 flex flex-col items-center text-center border-b border-border">
                <Avatar className="h-16 w-16 mb-4">
                  <AvatarImage src={undefined} alt={user?.displayName || "Avatar"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {user?.displayName?.split(" ").map(n => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold">{user?.displayName}</h3>
                <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
              </div>

              <nav className="mt-6 flex-1">
                <ul className="space-y-1 px-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <span
                        className={cn(
                          "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-all duration-200",
                          location === link.href
                            ? "bg-[#1B98E0]/10 text-[#006494] font-medium"
                            : "text-gray-600 hover:bg-[#1B98E0]/5 hover:text-[#006494]"
                        )}
                        onClick={() => {
                          window.location.href = link.href;
                          setIsMobileOpen(false);
                        }}
                      >
                        <span className={cn(
                          "flex items-center justify-center w-6 h-6",
                          location === link.href ? "text-[#006494]" : "text-gray-500"
                        )}>
                          {link.icon}
                        </span>
                        <span>{link.label}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-auto border-t border-border p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span>Sair</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex h-screen flex-col border-r border-border transition-all duration-300 bg-card fixed z-20",
          isCollapsed ? "w-[70px]" : "w-64"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-border h-16">
          {!isCollapsed && (
            <span
              onClick={() => window.location.href = "/"}
              className="cursor-pointer"
            >
              <img 
                src={logo} 
                alt="NexIA" 
                className="h-8" 
              />
            </span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className={cn("ml-auto", isCollapsed && "mx-auto")}
          >
            <ChevronRight className={cn("h-5 w-5 transition-transform", !isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {!isCollapsed && (
          <div className="px-4 py-6 flex flex-col items-center text-center border-b border-border">
            <Avatar className="h-16 w-16 mb-4">
              <AvatarImage src={undefined} alt={user?.displayName || "Avatar"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {user?.displayName?.split(" ").map(n => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold">{user?.displayName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
        )}

        <nav className="mt-6 flex-1">
          <ul className="space-y-1 px-2">
            {links.map((link) => (
              <li key={link.href}>
                <span
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-all duration-200",
                    location === link.href
                      ? "bg-[#1B98E0]/10 text-[#006494] font-medium"
                      : "text-gray-600 hover:bg-[#1B98E0]/5 hover:text-[#006494]",
                    isCollapsed && "justify-center"
                  )}
                  onClick={() => window.location.href = link.href}
                >
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6",
                    location === link.href ? "text-blue-600" : "text-gray-500"
                  )}>
                    {link.icon}
                  </span>
                  {!isCollapsed && <span className="ml-3">{link.label}</span>}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto border-t border-border p-4">
          <Button
            variant="ghost"
            className={cn(
              "text-red-500 hover:text-red-600 hover:bg-red-100/10",
              isCollapsed ? "justify-center w-full px-0" : "justify-start w-full"
            )}
            onClick={handleSignOut}
          >
            <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span>Sair</span>}
          </Button>
        </div>
      </div>
    </>
  );
}

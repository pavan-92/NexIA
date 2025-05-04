import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { registerWithEmailAndPassword } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const registerSchema = z.object({
  displayName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await registerWithEmailAndPassword(
        values.email,
        values.password,
        values.displayName
      );
      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado para o dashboard.",
      });
      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Ocorreu um erro ao criar a conta. Tente novamente.";
      
      // Handle different Firebase error codes
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso. Tente outro ou faça login.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido. Verifique e tente novamente.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Senha muito fraca. Use uma senha mais segura.";
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md space-y-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold">Crie sua conta</h2>
        <p className="mt-2 text-muted-foreground">
          Registre-se para começar a usar a Prontu.live
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Dr. João Silva" 
                    {...field} 
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="seu@email.com" 
                    {...field} 
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Esconder senha" : "Mostrar senha"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Registrando...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          Já tem uma conta?{" "}
          <span 
            className="text-primary font-medium hover:text-primary/80 transition-colors cursor-pointer"
            onClick={() => window.location.href = "/login"}
          >
            Faça login
          </span>
        </p>
      </div>
      
      <div className="text-xs text-center text-muted-foreground">
        Ao se registrar, você concorda com nossos{" "}
        <span 
          className="underline underline-offset-2 hover:text-foreground cursor-pointer"
          onClick={() => window.location.href = "/terms"}
        >
          Termos de Serviço
        </span>{" "}
        e{" "}
        <span
          className="underline underline-offset-2 hover:text-foreground cursor-pointer"
          onClick={() => window.location.href = "/privacy"}
        >
          Política de Privacidade
        </span>
        .
      </div>
    </motion.div>
  );
}

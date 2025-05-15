import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { signInWithEmail } from "@/lib/firebase";
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

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      console.log("Tentando fazer login com:", {
        email: values.email,
        passwordLength: values.password.length
      });
      
      await signInWithEmail(values.email, values.password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Você será redirecionado para o dashboard.",
      });
      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Ocorreu um erro ao fazer login. Tente novamente.";
      
      // Handle different Firebase error codes
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
      } else if (error.code === "auth/configuration-not-found") {
        errorMessage = "Erro na configuração do Firebase. O método de autenticação por email/senha pode não estar habilitado no console do Firebase.";
        console.error("Instruções para corrigir o erro de configuração do Firebase:");
        console.error("1. Acesse o console do Firebase: console.firebase.google.com");
        console.error("2. Selecione seu projeto e vá para Authentication > Sign-in methods");
        console.error("3. Habilite o método 'Email/Password'");
        console.error("4. Adicione o domínio *.replit.dev em Authentication > Settings > Authorized domains");
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
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
        <h2 className="text-3xl font-bold">Bem-vindo de volta</h2>
        <p className="mt-2 text-muted-foreground">
          Entre para continuar usando a NexIA
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      autoComplete="current-password"
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

          <div className="flex items-center justify-end">
            <span 
              className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
              onClick={() => window.location.href = "/forgot-password"}
            >
              Esqueceu sua senha?
            </span>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-white hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          Não tem uma conta?{" "}
          <span 
            className="text-primary font-medium hover:text-primary/80 transition-colors cursor-pointer"
            onClick={() => window.location.href = "/register"}
          >
            Registre-se
          </span>
        </p>
      </div>
    </motion.div>
  );
}

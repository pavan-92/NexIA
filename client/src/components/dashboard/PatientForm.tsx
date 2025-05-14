import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatientFormData } from "@/types";
import { Loader2 } from "lucide-react";

// Função para validar CPF
const isCPFValid = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Calcula dígitos verificadores
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

// Schema for form validation
const patientFormSchema = z.object({
  cpf: z.string()
    .min(11, { message: "CPF deve ter no mínimo 11 dígitos" })
    .refine((cpf) => isCPFValid(cpf), { 
      message: "CPF inválido" 
    }),
  name: z.string()
    .min(3, { message: "Nome deve ter no mínimo 3 caracteres" })
    .refine((name) => /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(name), {
      message: "Nome deve conter apenas letras e espaços"
    }),
  birthDate: z.string()
    .min(1, { message: "Data de nascimento é obrigatória" })
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate <= today;
    }, { message: "Data de nascimento não pode ser no futuro" }),
  gender: z.string().optional(),
  motherName: z.string().optional(),
  contact: z.string()
    .optional()
    .refine((val) => !val || /^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$/.test(val.replace(/\D/g, '')), {
      message: "Telefone inválido",
      path: ["contact"]
    }),
  email: z.string()
    .email({ message: "Email inválido" })
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  healthInsurance: z.string().optional(),
  cnsNumber: z.string()
    .optional()
    .refine((val) => !val || /^\d{15}$/.test(val.replace(/\D/g, '')), {
      message: "CNS deve ter 15 dígitos",
      path: ["cnsNumber"]
    }),
  medicalHistory: z.string().optional(),
});

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  isSubmitting: boolean;
  defaultValues?: Partial<PatientFormData>;
}

// Formatar CPF com máscara 000.000.000-00
const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

// Formatar telefone com máscara (00) 00000-0000
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

// Formatar CNS com máscara
const formatCNS = (value: string): string => {
  return value.replace(/\D/g, '').substring(0, 15);
};

export default function PatientForm({ onSubmit, isSubmitting, defaultValues, onCancel }: PatientFormProps & { onCancel?: () => void }) {
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: defaultValues || {
      cpf: "",
      name: "",
      birthDate: "",
      gender: "",
      motherName: "",
      contact: "",
      email: "",
      address: "",
      healthInsurance: "",
      cnsNumber: "",
      medicalHistory: "",
    },
  });

  const handleSubmit = (data: PatientFormData) => {
    // Remover máscaras antes de enviar
    const formattedData = {
      ...data,
      cpf: data.cpf.replace(/\D/g, ''),
      contact: data.contact ? data.contact.replace(/\D/g, '') : data.contact,
      cnsNumber: data.cnsNumber ? data.cnsNumber.replace(/\D/g, '') : data.cnsNumber,
    };
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPF - Obrigatório */}
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input 
                    placeholder="000.000.000-00" 
                    value={field.value}
                    onChange={(e) => {
                      const formattedValue = formatCPF(e.target.value);
                      field.onChange(formattedValue);
                    }}
                    maxLength={14}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Digite apenas os números, a formatação será automática
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nome completo - Obrigatório */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo do paciente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de nascimento - Obrigatório */}
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de nascimento <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nome da mãe */}
          <FormField
            control={form.control}
            name="motherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da mãe</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo da mãe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sexo */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Telefone */}
          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    value={field.value}
                    onChange={(e) => {
                      const formattedValue = formatPhone(e.target.value);
                      field.onChange(formattedValue);
                    }}
                    maxLength={15}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Digite apenas os números, a formatação será automática
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Número do Cartão Nacional de Saúde (CNS) */}
          <FormField
            control={form.control}
            name="cnsNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cartão Nacional de Saúde (CNS)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Número do CNS" 
                    value={field.value}
                    onChange={(e) => {
                      const formattedValue = formatCNS(e.target.value);
                      field.onChange(formattedValue);
                    }}
                    maxLength={15}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  O CNS deve ter 15 dígitos numéricos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Endereço completo */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço completo</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Rua, número, complemento, bairro, cidade, estado, CEP" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Plano de saúde */}
        <FormField
          control={form.control}
          name="healthInsurance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano de saúde</FormLabel>
              <FormControl>
                <Input placeholder="Nome do plano de saúde" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Histórico médico */}
        <FormField
          control={form.control}
          name="medicalHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Histórico médico</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Informações relevantes sobre o histórico médico do paciente" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar paciente"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
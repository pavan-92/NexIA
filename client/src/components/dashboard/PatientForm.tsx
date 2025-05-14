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

// Schema for form validation
const patientFormSchema = z.object({
  cpf: z.string().min(11, {
    message: "CPF deve ter no mínimo 11 caracteres",
  }),
  name: z.string().min(3, {
    message: "Nome deve ter no mínimo 3 caracteres",
  }),
  birthDate: z.string().min(1, {
    message: "Data de nascimento é obrigatória",
  }),
  gender: z.string().optional(),
  motherName: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email({
    message: "Email inválido",
  }).optional().or(z.literal("")),
  address: z.string().optional(),
  healthInsurance: z.string().optional(),
  cnsNumber: z.string().optional(),
  medicalHistory: z.string().optional(),
});

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  isSubmitting: boolean;
  defaultValues?: Partial<PatientFormData>;
}

export default function PatientForm({ onSubmit, isSubmitting, defaultValues }: PatientFormProps) {
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
    onSubmit(data);
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
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
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
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
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
                  <Input placeholder="Número do CNS" {...field} />
                </FormControl>
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
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
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
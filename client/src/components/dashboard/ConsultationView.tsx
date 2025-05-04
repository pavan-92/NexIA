import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Consultation, Patient } from "@/types";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useAuthState } from "@/hooks/use-auth";

// Consultation form schema
const consultationSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  date: z.date({
    required_error: "Selecione uma data",
  }),
  doctorName: z.string().min(3, "Nome do médico é obrigatório"),
});

type ConsultationFormValues = z.infer<typeof consultationSchema>;

interface ConsultationViewProps {
  isNew: boolean;
  consultation?: Consultation;
  patients: Patient[];
  onSave: (data: Partial<Consultation>) => void;
  isSaving: boolean;
}

export default function ConsultationView({
  isNew,
  consultation,
  patients,
  onSave,
  isSaving,
}: ConsultationViewProps) {
  const { user } = useAuthState();
  const [formattedDate, setFormattedDate] = useState<string>("");
  
  // Set up form with default values
  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      patientId: consultation?.patientId.toString() || "",
      date: consultation?.date ? new Date(consultation.date) : new Date(),
      doctorName: consultation?.doctorName || user?.displayName || "",
    },
  });

  // Update formatted date when date changes
  useEffect(() => {
    const date = form.watch("date");
    if (date) {
      setFormattedDate(formatDate(date));
    }
  }, [form.watch("date")]);

  // Handle form submission
  const onSubmit = (values: ConsultationFormValues) => {
    const consultationData: Partial<Consultation> = {
      patientId: parseInt(values.patientId),
      date: values.date.toISOString(),
      doctorName: values.doctorName,
      status: isNew ? "scheduled" : consultation?.status || "scheduled",
    };
    
    onSave(consultationData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={isSaving || !isNew}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Consulta</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isSaving}
                      >
                        {formattedDate || "Selecione uma data"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="doctorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Médico</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isNew && consultation && (
            <div className="flex items-center h-10 mt-8">
              <div className="text-sm text-muted-foreground">
                Status: <span className="font-medium text-foreground">{consultation.status === "completed" ? "Concluída" : consultation.status === "in-progress" ? "Em Andamento" : consultation.status === "scheduled" ? "Agendada" : "Cancelada"}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Detalhes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

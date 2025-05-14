import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("doctor"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Patients table schema
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  cpf: text("cpf").notNull(),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  gender: text("gender"),
  motherName: text("mother_name"),
  contact: text("contact"),
  email: text("email"),
  address: text("address"),
  healthInsurance: text("health_insurance"),
  cnsNumber: text("cns_number"),
  medicalHistory: text("medical_history"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Notes schema for consultations
export const notesSchema = z.object({
  chiefComplaint: z.string().optional(),
  history: z.string().optional(),
  diagnosis: z.string().optional(),
  plan: z.string().optional(),
  emotionalAnalysis: z.object({
    sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
    emotions: z.record(z.number()).optional(),
    confidenceScore: z.number().optional(),
  }).optional(),
});

// Consultations table schema
export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  patientId: integer("patient_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("scheduled"),
  transcription: text("transcription"),
  audioUrl: text("audio_url"),
  duration: integer("duration"),
  notes: jsonb("notes").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConsultationSchema = createInsertSchema(consultations)
  .extend({
    notes: notesSchema.optional(),
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;

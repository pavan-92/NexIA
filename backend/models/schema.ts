import { 
  mysqlTable, 
  varchar, 
  int, 
  timestamp, 
  text, 
  json, 
  boolean,
  date
} from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Tabela de usuários
export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login')
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Relações de usuários
export const usersRelations = relations(users, ({ many }) => ({
  patients: many(patients)
}));

// Tabela de pacientes
export const patients = mysqlTable('patients', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).notNull(),
  birthDate: date('birth_date').notNull(),
  gender: varchar('gender', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: varchar('address', { length: 255 }),
  mothersName: varchar('mothers_name', { length: 255 }),
  cns: varchar('cns', { length: 20 }),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Relações de pacientes
export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id]
  }),
  consultations: many(consultations)
}));

// Schema para notas médicas (SOAP)
export const notesSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
  icdCodes: z.array(z.object({
    code: z.string(),
    description: z.string()
  }))
});

// Tabela de consultas
export const consultations = mysqlTable('consultations', {
  id: int('id').primaryKey().autoincrement(),
  patientId: int('patient_id').notNull().references(() => patients.id),
  userId: varchar('user_id', { length: 128 }).notNull(),
  date: timestamp('date').notNull(),
  transcription: text('transcription'),
  notes: json('notes').$type<z.infer<typeof notesSchema>>(),
  status: varchar('status', { length: 20 }).default('pending'),
  duration: int('duration'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const insertConsultationSchema = createInsertSchema(consultations)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  });

export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;

// Relações de consultas
export const consultationsRelations = relations(consultations, ({ one }) => ({
  patient: one(patients, {
    fields: [consultations.patientId],
    references: [patients.id]
  })
}));
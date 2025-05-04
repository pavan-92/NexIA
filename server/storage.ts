import { 
  users, type User, type InsertUser,
  patients, type Patient, type InsertPatient,
  consultations, type Consultation, type InsertConsultation
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Patient methods
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientsByUserId(userId: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient>;
  deletePatient(id: number): Promise<void>;
  
  // Consultation methods
  getConsultation(id: number): Promise<Consultation | undefined>;
  getConsultationsByUserId(userId: string): Promise<Consultation[]>;
  getConsultationsByPatientId(patientId: number): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: number, consultation: Partial<InsertConsultation>): Promise<Consultation>;
  deleteConsultation(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private patientsMap: Map<number, Patient>;
  private consultationsMap: Map<number, Consultation>;
  userIdCounter: number;
  patientIdCounter: number;
  consultationIdCounter: number;

  constructor() {
    this.usersMap = new Map();
    this.patientsMap = new Map();
    this.consultationsMap = new Map();
    this.userIdCounter = 1;
    this.patientIdCounter = 1;
    this.consultationIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date().toISOString();
    const user: User = { ...insertUser, id, createdAt: now, updatedAt: now };
    this.usersMap.set(id, user);
    return user;
  }
  
  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patientsMap.get(id);
  }
  
  async getPatientsByUserId(userId: string): Promise<Patient[]> {
    return Array.from(this.patientsMap.values()).filter(
      (patient) => patient.userId === userId
    );
  }
  
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.patientIdCounter++;
    const now = new Date().toISOString();
    const patient: Patient = { ...insertPatient, id, createdAt: now, updatedAt: now };
    this.patientsMap.set(id, patient);
    return patient;
  }
  
  async updatePatient(id: number, patientData: Partial<InsertPatient>): Promise<Patient> {
    const patient = this.patientsMap.get(id);
    if (!patient) {
      throw new Error("Patient not found");
    }
    
    const updatedPatient: Patient = {
      ...patient,
      ...patientData,
      updatedAt: new Date().toISOString(),
    };
    
    this.patientsMap.set(id, updatedPatient);
    return updatedPatient;
  }
  
  async deletePatient(id: number): Promise<void> {
    this.patientsMap.delete(id);
  }
  
  // Consultation methods
  async getConsultation(id: number): Promise<Consultation | undefined> {
    return this.consultationsMap.get(id);
  }
  
  async getConsultationsByUserId(userId: string): Promise<Consultation[]> {
    return Array.from(this.consultationsMap.values()).filter(
      (consultation) => consultation.userId === userId
    );
  }
  
  async getConsultationsByPatientId(patientId: number): Promise<Consultation[]> {
    return Array.from(this.consultationsMap.values()).filter(
      (consultation) => consultation.patientId === patientId
    );
  }
  
  async createConsultation(insertConsultation: InsertConsultation): Promise<Consultation> {
    const id = this.consultationIdCounter++;
    const now = new Date().toISOString();
    
    const consultation: Consultation = {
      ...insertConsultation,
      id,
      createdAt: now,
      updatedAt: now,
      notes: insertConsultation.notes || {}
    };
    
    this.consultationsMap.set(id, consultation);
    return consultation;
  }
  
  async updateConsultation(id: number, consultationData: Partial<InsertConsultation>): Promise<Consultation> {
    const consultation = this.consultationsMap.get(id);
    if (!consultation) {
      throw new Error("Consultation not found");
    }
    
    const updatedConsultation: Consultation = {
      ...consultation,
      ...consultationData,
      notes: {
        ...consultation.notes,
        ...(consultationData.notes || {})
      },
      updatedAt: new Date().toISOString(),
    };
    
    this.consultationsMap.set(id, updatedConsultation);
    return updatedConsultation;
  }
  
  async deleteConsultation(id: number): Promise<void> {
    this.consultationsMap.delete(id);
  }
}

export const storage = new MemStorage();

// Add some sample data
async function initializeSampleData() {
  // Create sample user
  const user = await storage.createUser({
    username: "doctor@example.com",
    password: "password123",
    displayName: "Dr. João Silva",
    role: "doctor",
  });
  
  // Create sample patients
  const patient1 = await storage.createPatient({
    userId: "1",
    name: "Maria Costa",
    birthDate: "1980-05-15",
    gender: "Feminino",
    contact: "(11) 98765-4321",
    email: "maria@example.com",
    address: "Rua das Flores, 123 - São Paulo, SP",
    healthInsurance: "Unimed",
  });
  
  const patient2 = await storage.createPatient({
    userId: "1",
    name: "Carlos Ferreira",
    birthDate: "1972-09-23",
    gender: "Masculino",
    contact: "(11) 91234-5678",
    email: "carlos@example.com",
    address: "Av. Paulista, 1000 - São Paulo, SP",
    healthInsurance: "Amil",
  });
  
  // Create sample consultations
  await storage.createConsultation({
    userId: "1",
    patientId: 1,
    doctorName: "Dr. João Silva",
    date: "2023-05-10T14:30:00.000Z",
    status: "completed",
    transcription: "Paciente relata dores de cabeça frequentes...",
    duration: 1800,
    notes: {
      chiefComplaint: "Dores de cabeça frequentes",
      history: "Paciente relata dores de cabeça há 2 semanas, principalmente durante a tarde.",
      diagnosis: "Enxaqueca tensional",
      plan: "Prescrição de analgésicos e repouso. Retorno em 15 dias.",
      emotionalAnalysis: {
        sentiment: "neutral",
        emotions: {
          anxiety: 0.7,
          frustration: 0.5
        },
        confidenceScore: 0.85
      }
    }
  });
  
  await storage.createConsultation({
    userId: "1",
    patientId: 2,
    doctorName: "Dr. João Silva",
    date: "2023-05-15T10:00:00.000Z",
    status: "scheduled",
    notes: {}
  });
}

// Uncomment to initialize sample data
// initializeSampleData();

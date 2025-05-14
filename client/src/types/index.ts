// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'doctor' | 'admin';
  createdAt: string;
}

// Patient types
export interface Patient {
  id: number;
  userId: string;
  cpf: string;
  name: string;
  birthDate: string;
  gender?: string;
  motherName?: string;
  contact?: string;
  email?: string;
  address?: string;
  cnsNumber?: string;
  medicalHistory?: string;
  createdAt: string;
  updatedAt: string;
}

// Consultation types
export interface Consultation {
  id: number;
  userId: string;
  patientId: number;
  doctorName: string;
  date: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  transcription?: string;
  audioUrl?: string;
  duration?: number;
  notes: {
    chiefComplaint?: string;
    history?: string;
    diagnosis?: string;
    plan?: string;
  };
  createdAt: string;
  updatedAt: string;
}



// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  displayName: string;
}

export interface PatientFormData {
  cpf: string;
  name: string;
  birthDate: string;
  gender?: string;
  motherName?: string;
  contact?: string;
  email?: string;
  address?: string;
  cnsNumber?: string;
  medicalHistory?: string;
}

export interface ConsultationFormData {
  patientId: number;
  date: string;
  doctorName: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TranscriptionResponse {
  text: string;
  duration: number;
}

export interface NotesResponse {
  chiefComplaint: string;
  history: string;
  diagnosis: string;
  plan: string;
}

// Plans
export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended: boolean;
}

// Firebase Admin SDK setup for server-side authentication
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert } from 'firebase-admin/app';
import dotenv from 'dotenv';

dotenv.config();

// Verificar configuração do Firebase
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

let adminAuth: any;

// Inicializar Firebase Admin se tivermos Project ID
if (projectId) {
  try {
    // Inicializar Firebase Admin SDK com as credenciais
    const app = initializeApp({
      projectId
    });
    
    adminAuth = getAuth(app);
    console.log("Firebase Admin inicializado com sucesso:", projectId);
  } catch (error) {
    console.error("Erro ao inicializar Firebase Admin:", error);
  }
}

// Interface de autenticação com fallback para mock
export const auth = {
  verifyIdToken: async (token: string) => {
    // Se o Firebase Admin estiver disponível, usar API real
    if (adminAuth) {
      try {
        return await adminAuth.verifyIdToken(token);
      } catch (error) {
        console.error("Erro ao verificar token com Firebase Admin:", error);
        throw error;
      }
    } else {
      // Esta é uma implementação mock para desenvolvimento
      console.log("Usando verificação mock para token, Firebase Admin não inicializado");
      
      // Retornar um token decodificado mock
      return {
        uid: "1",
        email: "doctor@example.com",
        name: "Dr. João Silva"
      };
    }
  }
};
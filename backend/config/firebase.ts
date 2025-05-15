import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Configuração do Firebase Admin SDK
 * Utilizamos variáveis de ambiente para armazenar as credenciais
 */

// Verifica se estamos em ambiente de desenvolvimento para facilitar testes
const isDevelopment = process.env.NODE_ENV === 'development';
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

let firebaseServiceAccount: admin.ServiceAccount | undefined;

// Tenta carregar as credenciais do Firebase de diferentes formas
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    // Se estiverem como string JSON Base64 (recomendado para produção)
    const decodedServiceAccount = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT,
      'base64'
    ).toString('utf-8');
    
    firebaseServiceAccount = JSON.parse(decodedServiceAccount);
  } catch (error) {
    console.error('Erro ao decodificar credenciais do Firebase:', error);
  }
} 

// Função para inicializar o Firebase Admin SDK
export function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      if (firebaseServiceAccount) {
        // Com credenciais completas
        admin.initializeApp({
          credential: admin.credential.cert(firebaseServiceAccount)
        });
      } else if (projectId && isDevelopment) {
        // Em desenvolvimento, pode usar apenas o projectId (com Application Default Credentials)
        admin.initializeApp({
          projectId
        });
      } else {
        console.warn('Credenciais do Firebase não configuradas corretamente. Algumas funcionalidades podem estar indisponíveis.');
        // Inicializa com configuração vazia para não bloquear o aplicativo
        admin.initializeApp({});
      }
      console.log(`Firebase Admin inicializado com sucesso: ${projectId || firebaseServiceAccount?.projectId || 'modo teste'}`);
    } catch (error) {
      console.error('Erro ao inicializar Firebase Admin:', error);
    }
  }
}

// Exporta funções úteis para autenticação
export const auth = {
  // Verifica se um token é válido e retorna os dados do usuário
  verifyIdToken: async (idToken: string) => {
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      throw error;
    }
  },
  
  // Obtém dados de um usuário pelo ID
  getUser: async (uid: string) => {
    try {
      return await admin.auth().getUser(uid);
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      throw error;
    }
  },
  
  // Cria um novo usuário
  createUser: async (userData: admin.auth.CreateRequest) => {
    try {
      return await admin.auth().createUser(userData);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }
};

export default admin;
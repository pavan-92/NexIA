import { Express, json, urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Configura middleware global para a aplicação Express
 * @param app Instância do Express
 */
export function configureMiddleware(app: Express) {
  // Parsing do corpo das requisições
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  // Configuração CORS
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];
  
  app.use(cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (ex: mobile apps, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Cookie parser para manipulação de cookies
  app.use(cookieParser());
  
  // Configuração de sessão temporariamente desabilitada
  // até que as dependências sejam resolvidas corretamente
  /*
  if (process.env.USE_SESSIONS === 'true') {
    const sessionSecret = process.env.SESSION_SECRET || 'seu-segredo-de-sessao-aqui';
    const sessionStore = createSessionStore(sessionSecret);
    
    if (sessionStore) {
      app.use(sessionStore);
    }
  }
  */
  
  // Configuração de cabeçalhos de segurança
  app.use((_, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
}
// Importações necessárias
import express from 'express';
import session from 'express-session';
import expressMySQL from 'express-mysql-session';

/**
 * Cria e configura o middleware de sessão para Express
 * @param secret Chave secreta para assinar as sessões
 * @returns Middleware de sessão configurado para uso com Express
 */
export function createSessionStore(secret: string) {
  // Criando store para MySQL (precisa passar session como argumento)
  const MySQLStore = expressMySQL(session);
  
  // Opções para o armazenamento de sessão
  const sessionOptions: session.SessionOptions = {
    name: 'nexia.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    },
    store: new MySQLStore({
      // Reutiliza as configurações do banco de dados
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nexia_db',
      // Propriedades específicas de sessão
      clearExpired: true,
      checkExpirationInterval: 15 * 60 * 1000, // 15 minutos
      createDatabaseTable: true
    })
  };
  
  // Retorna o middleware de sessão configurado
  return session(sessionOptions);
}
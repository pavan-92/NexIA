import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { Server } from 'http';
import path from 'path';
import { connectToDatabase, closeDatabase } from './config/database';
import { configureMiddleware } from './config/middleware';
import { registerRoutes } from './routes';
import { initializeFirebase } from './config/firebase';

// Carrega variáveis de ambiente
dotenv.config();

// Porta para o servidor (5000 para Replit, 3000 para ambiente local)
const PORT = parseInt(process.env.PORT || '5000', 10);

// Função principal para iniciar o servidor
async function startServer() {
  const app: Express = express();
  
  // Inicializar o Firebase
  initializeFirebase();
  
  // Configura middleware global
  configureMiddleware(app);
  
  // Servir arquivos estáticos da pasta public
  app.use(express.static(path.join(process.cwd(), 'public')));
  
  try {
    // Conecta ao banco de dados
    await connectToDatabase();
    console.log('Banco de dados conectado com sucesso');
    
    // Registra rotas da API
    await registerRoutes(app);
    console.log('Rotas da API registradas com sucesso');
    
    // Inicia servidor
    const server: Server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
    });
    
    // Configuração de manipulação de exceções não tratadas
    process.on('uncaughtException', (error: Error) => {
      console.error('Exceção não tratada:', error);
    });
    
    // Configuração de manipulação de rejeições de promessas não tratadas
    process.on('unhandledRejection', (reason: any) => {
      console.error('Rejeição não tratada:', reason);
    });
    
    // Configuração para encerramento gracioso do servidor
    const gracefulShutdown = async () => {
      console.log('Encerrando o servidor...');
      server.close(async () => {
        console.log('Servidor HTTP encerrado');
        
        try {
          // Fecha conexão com o banco de dados
          await closeDatabase();
          console.log('Conexão com o banco de dados fechada');
          process.exit(0);
        } catch (error) {
          console.error('Erro ao fechar conexão com o banco de dados:', error);
          process.exit(1);
        }
      });
    };
    
    // Registra manipuladores de sinais para encerramento gracioso
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    // Middleware global para tratamento de erros
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Erro global:', err);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Erro interno do servidor';
      
      res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      });
    });
    
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Inicializa o servidor
startServer();
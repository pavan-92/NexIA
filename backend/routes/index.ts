import { Express, Request, Response, NextFunction } from 'express';
import patientRoutes from './patient.routes';
import consultationRoutes from './consultation.routes';
import authRoutes from './auth.routes';
import transcriptionRoutes from './transcription.routes';
import path from 'path';
import express from 'express';
import fs from 'fs';

export async function registerRoutes(app: Express) {
  // API de verificação de saúde para monitoramento
  app.get('/api/health', (_: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
  });

  // Rotas da API
  app.use('/api/patients', patientRoutes);
  app.use('/api/consultations', consultationRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/transcription', transcriptionRoutes);

  // Servir o frontend em qualquer ambiente para Replit
  // Usando caminho relativo para encontrar os arquivos do frontend
  const publicPath = path.join(process.cwd(), 'public');
  
  console.log('Verificando frontend em:', publicPath);
  console.log('Arquivos na pasta public:', fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : 'Pasta não encontrada');
  
  // Servir diretamente as páginas da pasta public
  app.use(express.static(publicPath));
  
  // Rota para verificar se o frontend está sendo servido
  app.get('/frontend-check', (_: Request, res: Response) => {
    res.status(200).json({ status: 'Frontend está configurado corretamente' });
  });
  
  // Rotas específicas para as páginas de teste
  app.get('/teste-prontuario.html', (_: Request, res: Response) => {
    res.sendFile(path.join(publicPath, 'teste-prontuario.html'));
  });
  
  app.get('/teste-transcricao.html', (_: Request, res: Response) => {
    res.sendFile(path.join(publicPath, 'teste-transcricao.html'));
  });
  
  // Para todas as demais rotas não-API, servir o index.html
  app.get('/', (_: Request, res: Response) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
  
  // Para qualquer outra rota que não seja API e não corresponda a nada
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    // Se for uma rota de API, passa para o próximo handler
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Tentar enviar index.html para rotas desconhecidas
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}
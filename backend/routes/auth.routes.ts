import express, { Request, Response } from 'express';
import { validateAuth } from '../middleware/auth';

const router = express.Router();

// Verificar token: Endpoint para validar se o token do usuário é válido
// e retornar informações básicas do usuário
router.post('/verify', validateAuth, (req: Request, res: Response) => {
  // Se chegou aqui, o middleware de autenticação já verificou o token
  // e adicionou as informações do usuário ao objeto req
  res.status(200).json({
    authenticated: true,
    user: req.user
  });
});

export default router;
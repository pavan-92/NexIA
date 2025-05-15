import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

// Estender a interface Request para incluir um campo user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                displayName?: string;
                role?: string;
            };
        }
    }
}

/**
 * Middleware para validar tokens de autenticação
 * Verifica se o token de autenticação é válido e adiciona as informações do usuário ao objeto req
 */
export async function validateAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      res.status(401).json({ error: 'Unauthorized: Invalid token format' });
      return;
    }
    
    try {
      // Verificar o token com o Firebase Admin
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Adicionar informações do usuário ao objeto req
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name,
        role: decodedToken.role || 'user',
      };
      
      next();
    } catch (firebaseError) {
      console.error('Firebase authentication error:', firebaseError);
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}
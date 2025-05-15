import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

// Configuração do diretório de uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// Verificar se o diretório de uploads existe, se não, criá-lo
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Limitar tamanho do upload (padrão: 50MB)
const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE || '50') * 1024 * 1024;

// Filtro para arquivos de áudio
const audioFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Verificar se o tipo de arquivo é de áudio
  if (file.mimetype.startsWith('audio/')) {
    console.log(`Arquivo de áudio aceito: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.log(`Arquivo rejeitado: ${file.mimetype} não é um tipo de áudio`);
    cb(new Error('Somente arquivos de áudio são permitidos'));
  }
};

// Criar o middleware de upload com as configurações
const upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: audioFilter
});

// Middleware para upload de áudio
export const uploadAudio = (req: Request, res: Response, next: NextFunction) => {
  console.log('Iniciando processamento de upload de áudio...');
  
  // Usar o middleware do Multer para processar um único arquivo
  upload.single('audio')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Erro do Multer
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: `Arquivo muito grande. Tamanho máximo permitido: ${maxSize / (1024 * 1024)}MB`
          });
        }
        return res.status(400).json({ error: err.message });
      }
      
      // Erro genérico
      return res.status(400).json({ error: err.message });
    }
    
    // Se chegou aqui, o upload foi bem-sucedido
    if (req.file) {
      console.log(`Recebido arquivo para upload: ${req.file.originalname}, tipo: ${req.file.mimetype}`);
      console.log(`Upload concluído com sucesso: ${req.file.filename}, ${req.file.size} bytes`);
    } else {
      console.log('Nenhum arquivo foi enviado');
    }
    
    next();
  });
};
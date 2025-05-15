import { Request, Response, NextFunction } from "express";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    // Lista de formatos de áudio permitidos (ampliada para melhor compatibilidade)
    const allowedMimeTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/mp3',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav',
      'audio/vnd.wav',
      'audio/wave',
      'audio/x-pn-wav',
      'audio/3gpp',
      'audio/aac',
      'audio/opus',
      'application/octet-stream' // Para casos onde o MIME não é detectado corretamente
    ];
    
    console.log(`Recebido arquivo para upload: ${file.originalname}, tipo: ${file.mimetype}`);
    
    // Verifica se o MIME type está na lista ou começa com audio/
    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith("audio/")) {
      console.log(`Arquivo de áudio aceito: ${file.mimetype}`);
      cb(null, true);
    } else {
      console.warn(`Arquivo rejeitado: ${file.mimetype} não é um tipo de áudio permitido`);
      cb(new Error(`Formato de áudio não suportado: ${file.mimetype}. Formatos aceitos: MP3, WAV, OGG, WEBM`));
    }
  },
});

// Middleware for handling audio file uploads
export const uploadAudio = (req: Request, res: Response, next: NextFunction) => {
  console.log("Iniciando processamento de upload de áudio...");
  
  // Configuração do upload
  const singleUpload = upload.single("audio");
  
  singleUpload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // Multer error (file size, etc.)
      console.error(`Erro Multer no upload: ${err.message}`, err);
      return res.status(400).json({
        error: `Erro no upload: ${err.message}`,
      });
    } else if (err) {
      // Other errors
      console.error(`Erro geral no upload: ${err.message || 'Desconhecido'}`, err);
      return res.status(400).json({
        error: err.message || "Erro ao processar o arquivo de áudio",
      });
    }
    
    // Check if file exists
    if (!req.file) {
      console.warn("Nenhum arquivo encontrado na requisição");
      return res.status(400).json({
        error: "Por favor, envie um arquivo de áudio",
      });
    }
    
    // Validação adicional do arquivo
    if (req.file.size === 0) {
      console.error("Arquivo de áudio com tamanho zero recebido");
      return res.status(400).json({
        error: "O arquivo de áudio está vazio",
      });
    }
    
    // Validação de tamanho mínimo
    if (req.file.size < 100) {
      console.warn(`Arquivo muito pequeno (${req.file.size} bytes), pode não conter áudio válido`);
      // Continuamos, mas com aviso no log
    }
    
    console.log(`Upload concluído com sucesso: ${req.file.originalname}, ${req.file.size} bytes`);
    next();
  });
};

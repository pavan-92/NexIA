import express, { Request, Response } from 'express';
import { validateAuth } from '../middleware/auth';
import { uploadAudio } from '../middleware/upload';
import { transcribeAudio, generateMedicalNotes, translateText } from '../services/openai';
import fs from 'fs';

// Verificar ambiente de desenvolvimento
const isDev = process.env.NODE_ENV === 'development';

const router = express.Router();

// Rota para transcrever um arquivo de áudio
// Em ambiente de desenvolvimento, não exigimos autenticação
router.post('/transcribe', isDev ? uploadAudio : [validateAuth, uploadAudio], async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de áudio foi enviado' });
    }

    console.log('Recebido arquivo para transcrição:');
    console.log(`- Nome: ${req.file.filename}`);
    console.log(`- Tamanho: ${req.file.size} bytes`);
    console.log(`- Tipo MIME: ${req.file.mimetype}`);

    console.log('Iniciando transcrição do áudio...');
    
    // Ler o arquivo como buffer
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log(`Arquivo temporário criado: ${fileBuffer.length} bytes`);
    
    // Transcrever o áudio usando o OpenAI Whisper
    console.log('Tentando transcrição com OpenAI Whisper...');
    const result = await transcribeAudio(fileBuffer);
    console.log('Transcrição com OpenAI bem-sucedida!');
    
    // Remover o arquivo temporário
    fs.unlinkSync(filePath);
    console.log('Arquivo temporário removido');
    
    console.log(`Transcrição concluída. Tamanho do texto: ${result.text.length} caracteres`);
    
    // Retornar o resultado da transcrição
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    res.status(500).json({ error: 'Falha ao processar a transcrição do áudio' });
  }
});

// Adicionar rota de teste para geração de prontuário (somente em desenvolvimento)
if (isDev) {
  router.post('/test/generate-notes', async (req: Request, res: Response) => {
    try {
      const { transcription } = req.body;
      
      if (!transcription) {
        return res.status(400).json({ error: 'Transcrição não fornecida' });
      }
      
      // Gerar notas médicas usando GPT
      const notes = await generateMedicalNotes(transcription);
      
      res.status(200).json(notes);
    } catch (error) {
      console.error('Erro ao gerar notas médicas (teste):', error);
      res.status(500).json({ error: 'Falha ao gerar notas médicas' });
    }
  });
}

// Rota para gerar notas médicas a partir de uma transcrição
router.post('/generate-notes', validateAuth, async (req: Request, res: Response) => {
  try {
    const { transcription } = req.body;
    
    if (!transcription) {
      return res.status(400).json({ error: 'Transcrição não fornecida' });
    }
    
    // Gerar notas médicas usando GPT
    const notes = await generateMedicalNotes(transcription);
    
    res.status(200).json(notes);
  } catch (error) {
    console.error('Erro ao gerar notas médicas:', error);
    res.status(500).json({ error: 'Falha ao gerar notas médicas' });
  }
});

// Rota para traduzir texto (não requer autenticação)
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { content, sourceLang, targetLang } = req.body;
    
    if (!content || !targetLang) {
      return res.status(400).json({ error: 'Conteúdo ou idioma de destino não fornecidos' });
    }
    
    // Traduzir o texto
    const translatedText = await translateText({ 
      text: content, 
      sourceLanguage: sourceLang || 'auto', 
      targetLanguage: targetLang 
    });
    
    res.status(200).json({ translatedText });
  } catch (error) {
    console.error('Erro ao traduzir texto:', error);
    res.status(500).json({ error: 'Falha ao traduzir texto' });
  }
});

export default router;
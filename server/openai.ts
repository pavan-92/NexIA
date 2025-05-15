import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import DeepgramSDK from '@deepgram/sdk';

// Definindo explicitamente a chave da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Initialize Deepgram client for audio transcription
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
if (!DEEPGRAM_API_KEY) {
  console.error("DEEPGRAM_API_KEY não encontrada nas variáveis de ambiente. A transcrição pode falhar.");
}
const deepgram = new DeepgramSDK.Deepgram(DEEPGRAM_API_KEY);

// Transcribe audio using OpenAI Whisper with Deepgram as fallback
export async function transcribeAudio(buffer: Buffer): Promise<{ text: string, duration: number }> {
  try {
    // Validação inicial do buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("Buffer de áudio vazio ou inválido");
    }
    
    // Verificação de tamanho mínimo, mas permitimos arquivos menores (apenas logamos aviso)
    if (buffer.length < 1024) { // Menos de 1KB
      console.warn(`Arquivo de áudio muito pequeno (${buffer.length} bytes). Pode não conter fala suficiente para transcrição.`);
    }
    
    // Cria um arquivo temporário para o áudio
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
    
    try {
      // Escreve o buffer no arquivo
      fs.writeFileSync(tempFilePath, buffer);
      
      if (!fs.existsSync(tempFilePath)) {
        throw new Error("Falha ao criar arquivo temporário");
      }
      
      const fileStats = fs.statSync(tempFilePath);
      console.log(`Arquivo temporário criado: ${fileStats.size} bytes`);
      
      // ESTRATÉGIA 1: Tenta transcrever com OpenAI Whisper
      try {
        console.log('Tentando transcrição com OpenAI Whisper...');
        
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-1",
          language: "pt",
          response_format: "text"
        });
        
        console.log("Transcrição com OpenAI bem-sucedida!");
        
        // Estima duração: ~16KB por segundo para áudio 16kHz mono
        const estimatedDuration = buffer.length / 16000; 
        
        return {
          text: transcription,
          duration: estimatedDuration
        };
      } 
      catch (openaiError) {
        // Se OpenAI falhar, tenta com Deepgram
        console.error("Erro na transcrição com OpenAI:", openaiError);
        console.log("Tentando com Deepgram como fallback...");
        
        // ESTRATÉGIA 2: Tenta transcrever com Deepgram (fallback)
        try {
          // Opções básicas para Deepgram (sem recursos avançados)
          const transcriptionOptions = {
            punctuate: true,
            language: "pt-BR",
            model: "general", // Modelo básico sem restrições
            detect_language: true
          };
          
          const audioData = fs.readFileSync(tempFilePath);
          const mimetype = 'audio/webm';
          
          console.log(`Usando Deepgram com MIME type ${mimetype}`);
          
          const response = await deepgram.transcription.preRecorded(
            { buffer: audioData, mimetype },
            transcriptionOptions
          );
          
          const transcript = response?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
          
          if (!transcript) {
            throw new Error("Deepgram retornou transcrição vazia");
          }
          
          console.log("Transcrição com Deepgram bem-sucedida!");
          
          // Estima duração com base no número de palavras
          const wordCount = transcript.split(' ').length;
          const estimatedDuration = Math.max(wordCount * 0.5, 1); 
          
          return {
            text: transcript,
            duration: estimatedDuration
          };
        } 
        catch (deepgramError) {
          console.error("Erro na transcrição com Deepgram:", deepgramError);
          throw new Error("Falha em ambos métodos de transcrição");
        }
      }
    } 
    finally {
      // Sempre tenta limpar o arquivo temporário
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log("Arquivo temporário removido");
        }
      } 
      catch (cleanupError) {
        console.warn("Erro ao limpar arquivo temporário:", cleanupError);
      }
    }
  } 
  catch (error) {
    console.error("Erro geral na transcrição:", error);
    
    let errorMessage = "Falha ao transcrever áudio";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}

// Gera notas médicas em formato SOAP a partir de uma transcrição
export async function generateMedicalNotes(transcription: string): Promise<{
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  cid10: {
    code: string;
    description: string;
  }[];
}> {
  try {
    if (!transcription.trim()) {
      throw new Error("Transcrição vazia. Não é possível gerar prontuário médico.");
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um assistente médico especializado em criar prontuários médicos a partir de transcrições de consultas.
          
Gere um prontuário médico bem estruturado seguindo o formato SOAP em formato JSON:
- Subjetivo: sintomas relatados pelo paciente, queixas, histórico
- Objetivo: achados do exame físico, sinais vitais, resultados de exames 
- Avaliação: diagnósticos considerados (incluir códigos CID-10)
- Plano: medicamentos receitados, exames solicitados, encaminhamentos, retorno

Também inclua os códigos CID-10 relevantes para o diagnóstico como uma lista separada.

Organização:
- Mantenha o prontuário conciso e objetivo
- Use terminologia médica apropriada
- Inclua apenas informações mencionadas na transcrição
- Foque nos aspectos médicos relevantes
- Omita informações redundantes ou conversas sociais

Retorne sua resposta como um objeto JSON com a seguinte estrutura:
{
  "soap": {
    "subjective": "Texto do subjetivo",
    "objective": "Texto do objetivo",
    "assessment": "Texto da avaliação",
    "plan": "Texto do plano"
  },
  "cid10": [
    {"code": "Código CID", "description": "Descrição do código"}
  ]
}
`
        },
        {
          role: "user",
          content: `Aqui está a transcrição da consulta médica. Crie um prontuário médico no formato SOAP com avaliação CID-10, formatado como JSON conforme instruções:\n\n${transcription}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse a resposta (JSON)
    const content = response.choices[0].message.content || "{}";
    const notes = JSON.parse(content);
    
    // Valida que o retorno contém os campos esperados para evitar erros posteriores
    if (!notes.soap || !notes.soap.subjective || !notes.soap.objective || 
        !notes.soap.assessment || !notes.soap.plan || !notes.cid10) {
      throw new Error("Formato de resposta inválido da API");
    }
    
    return notes;
  } catch (error) {
    console.error("Erro ao gerar notas médicas:", error);
    throw new Error("Falha ao gerar prontuário médico");
  }
}

// Serviço de tradução de texto
export async function translateText(content: {
  text: string;
  sourceLang: string;
  targetLang: string;
}): Promise<{ translatedText: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um tradutor profissional especializado em traduzir texto do ${content.sourceLang} para ${content.targetLang}. Mantenha a tradução precisa, preservando a terminologia médica quando aplicável.`
        },
        {
          role: "user",
          content: `Traduza o seguinte texto de ${content.sourceLang} para ${content.targetLang}:\n\n${content.text}`
        }
      ],
    });
    
    return {
      translatedText: response.choices[0].message.content || ""
    };
  } catch (error) {
    console.error("Erro na tradução:", error);
    throw new Error("Falha ao traduzir o texto");
  }
}
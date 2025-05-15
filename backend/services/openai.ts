import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from 'zod';
import { notesSchema } from '../models/schema';

// Carrega variáveis de ambiente
dotenv.config();

// Inicializa o cliente da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verifica se o cliente foi inicializado corretamente
if (!process.env.OPENAI_API_KEY) {
  console.warn('Chave da API OpenAI não configurada. Funcionalidades de IA serão limitadas.');
}

/**
 * Transcreve um arquivo de áudio usando o OpenAI Whisper
 * @param buffer Buffer do arquivo de áudio
 * @returns Objeto com texto transcrito e duração
 */
export async function transcribeAudio(buffer: Buffer): Promise<{ text: string, duration: number }> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], 'audio.mp3', { type: 'audio/mp3' }),
      model: 'whisper-1',
      language: 'pt',
      response_format: 'verbose_json',
    });

    return {
      text: transcription.text,
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    throw new Error('Falha ao processar a transcrição do áudio');
  }
}

/**
 * Gera notas médicas no formato SOAP a partir de uma transcrição
 * @param transcription Texto transcrito da consulta médica
 * @returns Objeto com notas médicas em formato SOAP e códigos CID-10
 */
export async function generateMedicalNotes(transcription: string): Promise<{
  notes: z.infer<typeof notesSchema>,
  text: string
}> {
  try {
    const prompt = `
    Você é um assistente médico especializado em criar prontuários a partir de transcrições de consultas.
    
    Analise a seguinte transcrição de uma consulta médica e gere um prontuário no formato SOAP (Subjetivo, Objetivo, Avaliação e Plano).
    Adicione também os possíveis códigos CID-10 relacionados ao diagnóstico, com seus respectivos nomes.
    
    Retorne o resultado no seguinte formato JSON:
    {
      "subjective": "Queixas e histórico relatado pelo paciente",
      "objective": "Achados do exame físico e resultados de exames",
      "assessment": "Avaliação e diagnóstico médico",
      "plan": "Plano de tratamento e recomendações",
      "icdCodes": [
        {
          "code": "Código CID-10",
          "description": "Descrição do código"
        }
      ]
    }
    
    Transcrição da consulta:
    ${transcription}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: 'system', content: 'Você é um assistente médico especializado em criar prontuários SOAP e codificação CID-10.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Resposta vazia do modelo de IA');
    }

    const parsedContent = JSON.parse(content);
    const validatedNotes = notesSchema.parse(parsedContent);

    return {
      notes: validatedNotes,
      text: content
    };
  } catch (error) {
    console.error('Erro ao gerar notas médicas:', error);
    throw new Error('Falha ao gerar notas médicas a partir da transcrição');
  }
}

/**
 * Traduz texto entre idiomas
 * @param content Objeto com texto para tradução e idiomas de origem/destino
 * @returns Texto traduzido
 */
export async function translateText(content: {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): Promise<string> {
  try {
    const { text, sourceLanguage = 'auto', targetLanguage } = content;

    const prompt = `
    Traduza o seguinte texto ${sourceLanguage !== 'auto' ? `do ${sourceLanguage}` : ''} para ${targetLanguage}:
    
    ${text}
    
    Por favor, mantenha o formato e termos técnicos quando possível.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: 'system', content: 'Você é um tradutor profissional especializado em textos médicos e técnicos.' },
        { role: 'user', content: prompt }
      ]
    });

    const translatedText = response.choices[0].message.content;
    if (!translatedText) {
      throw new Error('Resposta vazia do modelo de IA');
    }

    return translatedText;
  } catch (error) {
    console.error('Erro ao traduzir texto:', error);
    throw new Error('Falha ao traduzir o texto');
  }
}
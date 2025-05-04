import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Definindo explicitamente a chave da API
const OPENAI_API_KEY = "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";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Transcribe audio using Whisper
export async function transcribeAudio(buffer: Buffer): Promise<{ text: string, duration: number }> {
  try {
    // Cria um arquivo temporário
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
    
    // Escreve o buffer no arquivo
    fs.writeFileSync(tempFilePath, buffer);
    
    // Abre o arquivo para leitura
    const fileStream = fs.createReadStream(tempFilePath);
    
    // Chama a API OpenAI com o stream de arquivo
    const transcript = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
    });
    
    // Limpa o arquivo temporário
    fs.unlinkSync(tempFilePath);
    
    // Estima duração com base no número de palavras
    const wordCount = transcript.text.split(' ').length;
    const estimatedDuration = wordCount * 3; // ~3s por palavra (aproximação)
    
    return {
      text: transcript.text,
      duration: estimatedDuration,
    };
  } catch (error) {
    console.error("Erro ao transcrever áudio:", error);
    throw new Error("Falha ao transcrever áudio");
  }
}

// Generate medical notes from transcription
export async function generateMedicalNotes(transcription: string): Promise<{
  chiefComplaint: string;
  history: string;
  diagnosis: string;
  plan: string;
  emotionalAnalysis: {
    sentiment: 'positive' | 'negative' | 'neutral';
    emotions: {
      joy?: number;
      sadness?: number;
      fear?: number;
      anger?: number;
      surprise?: number;
      disgust?: number;
    };
    confidenceScore: number;
  };
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a medical assistant that helps doctors organize patient information. 
          Analyze the following conversation transcript between a doctor and a patient. 
          Then generate a structured medical record with the following sections:
          
          1. Chief Complaint: A concise statement of the patient's main issue
          2. History of Present Illness: Detailed chronological description of the patient's symptoms
          3. Diagnosis: Potential diagnoses based on the information provided
          4. Treatment Plan: Recommended next steps, medications, and follow-up
          5. Emotional Analysis: Analyze the patient's emotional state during the consultation
          
          Your response should be in JSON format with the following structure:
          {
            "chiefComplaint": "string",
            "history": "string",
            "diagnosis": "string",
            "plan": "string",
            "emotionalAnalysis": {
              "sentiment": "positive|negative|neutral",
              "emotions": {
                "joy": number (0-1),
                "sadness": number (0-1),
                "fear": number (0-1),
                "anger": number (0-1),
                "surprise": number (0-1),
                "disgust": number (0-1)
              },
              "confidenceScore": number (0-1)
            }
          }`
        },
        {
          role: "user",
          content: transcription
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      chiefComplaint: result.chiefComplaint || "",
      history: result.history || "",
      diagnosis: result.diagnosis || "",
      plan: result.plan || "",
      emotionalAnalysis: {
        sentiment: result.emotionalAnalysis?.sentiment || "neutral",
        emotions: result.emotionalAnalysis?.emotions || {},
        confidenceScore: result.emotionalAnalysis?.confidenceScore || 0
      }
    };
  } catch (error) {
    console.error("Error generating medical notes:", error);
    throw new Error("Failed to generate medical notes");
  }
}

// Analyze sentiment of text
export async function analyzeSentiment(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidenceScore: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a sentiment rating (positive, negative, or neutral) and a confidence score between 0 and 1. Respond with JSON in this format: { 'sentiment': 'positive|negative|neutral', 'confidenceScore': number }"
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      sentiment: result.sentiment || "neutral",
      confidenceScore: Math.max(0, Math.min(1, result.confidenceScore || 0.5))
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    throw new Error("Failed to analyze sentiment");
  }
}

// Translate text from English to Portuguese
export async function translateText(content: {
  title?: string;
  abstract?: string;
}): Promise<{
  title?: string;
  abstract?: string;
}> {
  try {
    // Skip if content is empty
    if (!content.title && !content.abstract) {
      return content;
    }

    // Create prompt for translation
    const titleText = content.title || "";
    const abstractText = content.abstract || "";
    
    const prompt = `
Traduza do inglês para o português o conteúdo a seguir. Mantenha termos médicos técnicos intactos quando necessário.

TÍTULO: ${titleText}
RESUMO: ${abstractText.substring(0, 1000)}
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "Você é um tradutor médico especializado em traduzir artigos científicos do inglês para o português. Mantenha a tradução precisa mas adaptada para a compreensão em português. Use exatamente este formato em sua resposta:\n\nTÍTULO TRADUZIDO: [título traduzido]\n\nRESUMO TRADUZIDO: [resumo traduzido]" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    });

    // Extract response
    const translationText = response.choices[0]?.message.content || "";
    
    // Parse translated content
    let translatedTitle = content.title;
    let translatedAbstract = content.abstract;
    
    if (translationText.includes("TÍTULO TRADUZIDO:")) {
      const parts = translationText.split("TÍTULO TRADUZIDO:");
      if (parts.length > 1) {
        const titlePart = parts[1];
        if (titlePart.includes("RESUMO TRADUZIDO:")) {
          translatedTitle = titlePart.split("RESUMO TRADUZIDO:")[0].trim();
          translatedAbstract = titlePart.split("RESUMO TRADUZIDO:")[1].trim();
        } else {
          translatedTitle = titlePart.trim();
        }
      }
    }
    
    return {
      title: translatedTitle,
      abstract: translatedAbstract
    };
  } catch (error) {
    console.error("Erro na tradução:", error);
    return content; // Return original content on error
  }
}

export default openai;

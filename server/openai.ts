import OpenAI from "openai";

// Definindo explicitamente a chave da API
const OPENAI_API_KEY = "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";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Transcribe audio using Whisper
export async function transcribeAudio(buffer: Buffer): Promise<{ text: string, duration: number }> {
  const transcript = await openai.audio.transcriptions.create({
    file: buffer,
    model: "whisper-1",
  });

  return {
    text: transcript.text,
    duration: transcript.duration || 0,
  };
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

export default openai;

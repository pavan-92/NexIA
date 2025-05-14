import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { transcribeAudio, generateMedicalNotes, translateText } from "./openai";
import { validateAuth } from "./middleware/auth";
import { uploadAudio } from "./middleware/upload";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import {
  insertUserSchema,
  insertPatientSchema,
  insertConsultationSchema,
  notesSchema
} from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";
import { setupLiveTranscription } from "./liveTranscriptionWithOpenAI";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket for real-time transcription
  setupLiveTranscription(httpServer);
  
  // Set up WebSocket for API updates (separate path)
  const wss = new WebSocketServer({ server: httpServer, path: "/api/ws" });
  
  wss.on("connection", (ws) => {
    console.log("WebSocket connection established");
    
    // Receber mensagens do cliente
    ws.on("message", async (message) => {
      try {
        // Se a mensagem for um objeto JSON, processamos
        if (message.toString().startsWith('{')) {
          const data = JSON.parse(message.toString());
          console.log("WebSocket command received:", data);
          
          // Processamento específico para comandos
          if (data.type === "start_recording") {
            console.log("Iniciando gravação");
            ws.send(JSON.stringify({ 
              type: "status", 
              status: "recording_started" 
            }));
          } 
          else if (data.type === "stop_recording") {
            console.log("Parando gravação");
            ws.send(JSON.stringify({ 
              type: "status", 
              status: "recording_stopped" 
            }));
          }
          else if (data.type === "transcribe") {
            console.log("Recebido áudio para transcrição");
            
            try {
              if (data.audio) {
                // Simular processamento de transcrição
                const transcript = "Este é um exemplo de transcrição. Na implementação real, usaremos o serviço Deepgram.";
                
                // Enviar a transcrição de volta ao cliente
                ws.send(JSON.stringify({
                  type: "transcript",
                  text: transcript,
                  isFinal: true
                }));
                
                // Gerar notas médicas a partir da transcrição
                const notes = await generateMedicalNotes(transcript);
                
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ 
                    type: "notes", 
                    notes 
                  }));
                }
              }
            } catch (err) {
              const error = err as Error;
              console.error("Error processing transcription:", error.message);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                  type: "error", 
                  message: "Erro ao processar transcrição" 
                }));
              }
            }
          }
        } else {
          // Se a mensagem não é JSON, é provavelmente áudio bruto
          console.log("Recebido áudio binário");
          
          // Na implementação real, isso seria enviado para o serviço de transcrição
          if (ws.readyState === WebSocket.OPEN) {
            // Simular uma transcrição parcial
            setTimeout(() => {
              ws.send(JSON.stringify({ 
                type: "transcript", 
                text: "Transcrição em andamento...", 
                isFinal: false 
              }));
            }, 500);
          }
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error processing WebSocket message:", error.message);
      }
    });
    
    // Lidar com fechamento da conexão
    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });
  
  // API routes
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });
  
  // Auth routes
  app.post("/api/auth/verify", validateAuth, (req: Request, res: Response) => {
    res.json({ user: req.user });
  });
  
  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: `Invalid user data: ${error.message}` });
    }
  });
  
  app.get("/api/users/:id", validateAuth, async (req: Request, res: Response) => {
    const userId = req.params.id;
    const user = await storage.getUser(Number(userId));
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  });
  
  // Patient routes
  app.get("/api/patients", validateAuth, async (req: Request, res: Response) => {
    const patients = await storage.getPatientsByUserId(req.user.id);
    res.json(patients);
  });
  
  app.post("/api/patients", validateAuth, async (req: Request, res: Response) => {
    try {
      const patientData = insertPatientSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ error: `Invalid patient data: ${error.message}` });
    }
  });
  
  app.get("/api/patients/:id", validateAuth, async (req: Request, res: Response) => {
    const patientId = Number(req.params.id);
    const patient = await storage.getPatient(patientId);
    
    if (!patient || patient.userId !== req.user.id) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    res.json(patient);
  });
  
  app.put("/api/patients/:id", validateAuth, async (req: Request, res: Response) => {
    try {
      const patientId = Number(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient || patient.userId !== req.user.id) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      const patientData = createInsertSchema(insertPatientSchema).parse(req.body);
      const updatedPatient = await storage.updatePatient(patientId, patientData);
      
      res.json(updatedPatient);
    } catch (error) {
      res.status(400).json({ error: `Invalid patient data: ${error.message}` });
    }
  });
  
  // Consultation routes
  app.get("/api/consultations", validateAuth, async (req: Request, res: Response) => {
    const consultations = await storage.getConsultationsByUserId(req.user.id);
    res.json(consultations);
  });
  
  app.post("/api/consultations", validateAuth, async (req: Request, res: Response) => {
    try {
      const consultationData = insertConsultationSchema.parse({
        ...req.body,
        userId: req.user.id,
        status: req.body.status || "scheduled"
      });
      
      const consultation = await storage.createConsultation(consultationData);
      res.status(201).json(consultation);
    } catch (error) {
      res.status(400).json({ error: `Invalid consultation data: ${error.message}` });
    }
  });
  
  app.get("/api/consultations/:id", validateAuth, async (req: Request, res: Response) => {
    const consultationId = Number(req.params.id);
    const consultation = await storage.getConsultation(consultationId);
    
    if (!consultation || consultation.userId !== req.user.id) {
      return res.status(404).json({ error: "Consultation not found" });
    }
    
    res.json(consultation);
  });
  
  app.put("/api/consultations/:id", validateAuth, async (req: Request, res: Response) => {
    try {
      const consultationId = Number(req.params.id);
      const consultation = await storage.getConsultation(consultationId);
      
      if (!consultation || consultation.userId !== req.user.id) {
        return res.status(404).json({ error: "Consultation not found" });
      }
      
      // We don't use the schema validation here to allow partial updates
      const updatedConsultation = await storage.updateConsultation(consultationId, req.body);
      
      // Notify connected clients about the update
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({
            type: "CONSULTATION_UPDATED",
            payload: updatedConsultation
          }));
        }
      });
      
      res.json(updatedConsultation);
    } catch (error) {
      res.status(400).json({ error: `Invalid consultation data: ${error.message}` });
    }
  });
  
  // AI routes
  app.post("/api/transcribe", validateAuth, uploadAudio, async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }
      
      const result = await transcribeAudio(req.file.buffer);
      
      res.json({
        text: result.text,
        duration: result.duration
      });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });
  
  app.post("/api/generate-notes", validateAuth, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        transcription: z.string().min(1, "Transcription is required"),
      });
      
      const { transcription } = schema.parse(req.body);
      
      const notes = await generateMedicalNotes(transcription);
      
      res.json(notes);
    } catch (error) {
      console.error("Error generating notes:", error);
      res.status(500).json({ error: "Failed to generate medical notes" });
    }
  });

  // Translation route
  app.post("/api/translate", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        title: z.string().optional(),
        abstract: z.string().optional(),
      });
      
      const content = schema.parse(req.body);
      
      if (!content.title && !content.abstract) {
        return res.status(400).json({ error: "At least one of title or abstract must be provided" });
      }
      
      const translatedContent = await translateText(content);
      
      res.json(translatedContent);
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Failed to translate content" });
    }
  });

  return httpServer;
}

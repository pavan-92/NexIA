import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import DeepgramSDK from "@deepgram/sdk";
import { generateMedicalNotes } from "./openai";

export function setupLiveTranscription(server: Server) {
  // Set up WebSocket for real-time transcription
  const wss = new WebSocketServer({ server, path: "/ws" });
  
  // Create Deepgram client
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  const deepgram = deepgramApiKey ? new DeepgramSDK.Deepgram(deepgramApiKey) : null;
  
  wss.on("connection", (ws) => {
    console.log("WebSocket connection established for live transcription");
    
    // Create a new Deepgram live transcription session
    let deepgramLive: any = null;
    
    if (deepgram) {
      try {
        deepgramLive = deepgram.transcription.live({
          punctuate: true,
          language: "pt-BR",
          model: "general",
          smart_format: true,
          diarize: true
        });
        
        // Listener for transcription results
        deepgramLive.addListener("transcriptReceived", (data: any) => {
          try {
            const transcriptData = JSON.parse(data);
            const transcript = transcriptData.channel?.alternatives[0]?.transcript;
            
            if (transcript && transcript.trim() !== "") {
              console.log("Live transcript:", transcript);
              // Send transcript back to client
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                  type: "transcript", 
                  text: transcript,
                  isFinal: transcriptData.is_final
                }));
              }
            }
          } catch (err) {
            const error = err as Error;
            console.error("Error processing live transcription:", error.message);
          }
        });
        
        // Listener for connection close
        deepgramLive.addListener("close", () => {
          console.log("Deepgram connection closed");
        });
        
        // Listener for errors
        deepgramLive.addListener("error", (err: any) => {
          const error = err as Error;
          console.error("Deepgram error:", error.message);
        });
      } catch (err) {
        const error = err as Error;
        console.error("Failed to initialize Deepgram:", error.message);
      }
    }
    
    // Handle messages from client
    ws.on("message", async (message) => {
      try {
        // Check if it's a text message (command)
        if (message instanceof Buffer && message.toString().startsWith('{')) {
          const data = JSON.parse(message.toString());
          console.log("WebSocket command received:", data.type);
          
          // Process specific commands
          if (data.type === "start_recording") {
            console.log("Iniciando gravação em tempo real");
            ws.send(JSON.stringify({ 
              type: "status", 
              status: "recording_started" 
            }));
          } 
          else if (data.type === "stop_recording") {
            console.log("Parando gravação em tempo real");
            
            // Finalize Deepgram connection if active
            if (deepgramLive && deepgramLive.getReadyState() === 1) {
              deepgramLive.finish();
              
              // Reinitialize for next recording session
              if (deepgram) {
                deepgramLive = deepgram.transcription.live({
                  punctuate: true,
                  language: "pt-BR",
                  model: "general",
                  smart_format: true,
                  diarize: true
                });
              }
            }
            
            ws.send(JSON.stringify({ 
              type: "status", 
              status: "recording_stopped" 
            }));
          }
          else if (data.type === "generate_notes" && data.text) {
            try {
              console.log("Gerando notas médicas da transcrição");
              const notes = await generateMedicalNotes(data.text);
              
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                  type: "notes", 
                  notes 
                }));
              }
            } catch (err) {
              const error = err as Error;
              console.error("Error generating notes:", error.message);
              
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                  type: "error", 
                  message: "Erro ao gerar notas médicas" 
                }));
              }
            }
          }
        } 
        // Process binary audio data for real-time transcription
        else if (deepgramLive && deepgramLive.getReadyState() === 1) {
          // Send audio data to Deepgram for real-time transcription
          deepgramLive.send(message);
        }
        else if (!deepgram || !deepgramLive) {
          // Fallback for when Deepgram is not available
          console.log("Deepgram não disponível, enviando resposta simulada");
          
          if (ws.readyState === WebSocket.OPEN) {
            // Send a message to client explaining that real-time transcription is not available
            ws.send(JSON.stringify({ 
              type: "error", 
              message: "Transcrição em tempo real não disponível. Verifique a chave da API Deepgram." 
            }));
          }
        }
      } catch (err) {
        const error = err as Error;
        console.error("WebSocket message processing error:", error.message);
      }
    });
    
    // Handle WebSocket connection close
    ws.on("close", () => {
      console.log("WebSocket connection closed");
      
      // Clean up Deepgram connection
      if (deepgramLive && deepgramLive.getReadyState() === 1) {
        try {
          deepgramLive.finish();
        } catch (err) {
          console.error("Error closing Deepgram connection:", err);
        }
      }
    });
  });
  
  return wss;
}
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import DeepgramSDK from "@deepgram/sdk";
import { generateMedicalNotes } from "./openai";

export function setupLiveTranscription(server: Server) {
  // Set up WebSocket for real-time transcription
  const wss = new WebSocketServer({ server, path: "/ws" });
  
  // Create Deepgram client
  let deepgram: any = null;
  try {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    
    if (!deepgramApiKey) {
      console.log("DEEPGRAM_API_KEY não encontrada nas variáveis de ambiente");
    } else if (deepgramApiKey.trim() === "" || deepgramApiKey === "undefined" || deepgramApiKey === "null") {
      console.log("DEEPGRAM_API_KEY está vazia ou inválida");
    } else {
      try {
        deepgram = new DeepgramSDK.Deepgram(deepgramApiKey);
        console.log("Cliente Deepgram inicializado com sucesso");
      } catch (initErr) {
        console.error("Erro ao inicializar cliente Deepgram:", initErr);
      }
    }
  } catch (err) {
    console.error("Erro ao verificar configuração Deepgram:", err);
  }
  
  wss.on("connection", (ws) => {
    console.log("WebSocket connection established for live transcription");
    
    // Create a new Deepgram live transcription session
    let deepgramLive: any = null;
    
    // Inicializar deepgram se disponível
    const initializeDeepgram = () => {
      if (!deepgram) {
        console.log("Deepgram API key not configured or invalid, using fallback mode");
        console.log("DEEPGRAM_API_KEY exists:", !!process.env.DEEPGRAM_API_KEY);
        
        // Notificar o cliente que não temos Deepgram disponível
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "status",
            status: "fallback_mode",
            message: "Transcrição ao vivo não disponível, usando modo offline"
          }));
        }
        return null;
      }
      
      console.log("Attempting to initialize Deepgram live transcription...");
      
      try {
        const liveTx = deepgram.transcription.live({
          punctuate: true,
          language: "pt-BR",
          model: "general",
          smart_format: true,
          diarize: true,
          interim_results: true
        });
        
        // Listener for transcription results
        liveTx.addListener("transcriptReceived", (data: any) => {
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
        liveTx.addListener("close", () => {
          console.log("Deepgram connection closed");
          
          // Reinicializar se necessário
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "status",
              status: "connection_closed",
              message: "Conexão com serviço de transcrição encerrada"
            }));
          }
        });
        
        // Listener for errors
        liveTx.addListener("error", (err: any) => {
          const error = err as Error;
          console.error("Deepgram error:", error.message);
          
          // Notificar o cliente do erro
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Erro na transcrição em tempo real. Continuando no modo offline."
            }));
          }
        });
        
        return liveTx;
      } catch (err) {
        const error = err as Error;
        console.error("Failed to initialize Deepgram:", error.message);
        
        // Notificar o cliente do erro
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "error",
            message: "Falha ao iniciar serviço de transcrição. Modo offline ativado."
          }));
        }
        
        return null;
      }
    };
    
    // Inicializar a transcrição ao vivo
    deepgramLive = initializeDeepgram();
    
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
          try {
            deepgramLive.send(message);
          } catch (err) {
            const error = err as Error;
            console.error("Erro ao enviar áudio para Deepgram:", error.message);
            
            // Se falhou ao enviar, tente reinicializar a conexão
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "status",
                status: "reconnecting",
                message: "Reconectando ao serviço de transcrição..."
              }));
              
              // Tentar reinicializar
              try {
                if (deepgramLive) {
                  deepgramLive.finish();
                }
                deepgramLive = initializeDeepgram();
              } catch (reinitErr) {
                console.error("Erro ao reinicializar Deepgram:", reinitErr);
              }
            }
          }
        }
        else if (!deepgram || !deepgramLive) {
          // Captura áudio recebido para processamento em modo offline
          console.log("Recebendo áudio em modo offline (sem transcrição em tempo real)");
          
          // Armazenar os fragmentos de áudio para processamento posterior
          // No modo offline, processamos os pedaços de áudio no cliente e enviamos
          // apenas o resultado final para transcrição via API REST
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
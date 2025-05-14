import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import OpenAI from "openai";
import { generateMedicalNotes } from "./openai";

// Inicialize o OpenAI - reusando a mesma instância do arquivo openai.ts
import openai from './openai';

// Buffer para armazenar chunks de áudio recebidos
const audioBuffers: Map<string, Buffer[]> = new Map();

// Função para iniciar o servidor WebSocket
export function setupLiveTranscription(server: Server) {
  // Set up WebSocket for real-time transcription
  const wss = new WebSocketServer({ 
    server, 
    path: "/ws",
    // Configurações para WebSocket mais tolerante
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // ver: https://nodejs.org/api/zlib.html#zlib_class_options
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Outros padrões
      serverNoContextTakeover: true, // recomendado
      clientNoContextTakeover: true, // recomendado
      serverMaxWindowBits: 10, // recomendado
      concurrencyLimit: 10, // limite de callbacks processadas simultaneamente
      threshold: 1024 // tamanho compressão mínima em bytes
    }
  });
  
  console.log("Servidor WebSocket para transcrição com OpenAI inicializado");
  
  wss.on("connection", (ws, req) => {
    // Usamos o IP como parte do identificador para debug
    const ip = req.socket.remoteAddress || 'unknown';
    console.log(`Conexão WebSocket estabelecida para transcrição ao vivo de ${ip}`);
    
    // Configurar timeout e keepalive para evitar desconexão
    req.socket.setTimeout(0);
    req.socket.setKeepAlive(true, 60000); // 60 segundos
    
    // Identificador único para esta conexão
    const connectionId = `${Date.now()}-${ip}`;
    
    // Inicializar buffer de áudio para esta conexão
    audioBuffers.set(connectionId, []);
    
    // Temporizador para processar o áudio periodicamente
    let processingInterval: NodeJS.Timeout | null = null;
    
    // Função para processar o áudio acumulado
    const processAudioBuffer = async () => {
      try {
        const buffers = audioBuffers.get(connectionId);
        
        if (!buffers || buffers.length === 0) return;
        
        // Combine os buffers em um único
        const combinedBuffer = Buffer.concat(buffers);
        
        // Se tiver conteúdo suficiente para transcrever
        if (combinedBuffer.length > 10000) { // Pelo menos 10KB de áudio para processar
          // Cria um arquivo temporário
          const tempDir = os.tmpdir();
          const tempFilePath = path.join(tempDir, `live-audio-${connectionId}-${Date.now()}.webm`);
          
          // Escreve o buffer no arquivo
          fs.writeFileSync(tempFilePath, combinedBuffer);
          
          // Abre o arquivo para leitura
          const fileStream = fs.createReadStream(tempFilePath);
          
          // Informa ao cliente que estamos processando
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "status",
              status: "processing",
              message: "Processando transcrição..."
            }));
          }
          
          // Chama a API OpenAI com o stream de arquivo
          const transcript = await openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
          });
          
          // Limpa o arquivo temporário
          fs.unlinkSync(tempFilePath);
          
          // Envia a transcrição para o cliente
          if (ws.readyState === WebSocket.OPEN && transcript.text.trim()) {
            ws.send(JSON.stringify({
              type: "transcript",
              text: transcript.text,
              isFinal: true
            }));
            
            console.log("Transcrição OpenAI enviada:", transcript.text);
          }
          
          // Limpa o buffer após o envio
          audioBuffers.set(connectionId, []);
        }
      } catch (error) {
        console.error("Erro ao processar áudio para transcrição:", error);
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "error",
            message: "Erro ao processar a transcrição"
          }));
        }
      }
    };
    
    // Inicia o processamento periódico
    processingInterval = setInterval(processAudioBuffer, 5000); // A cada 5 segundos
    
    // Manipular mensagens do cliente
    ws.on("message", async (message) => {
      // Verificar se a mensagem é uma string ou um Buffer que começa com '{'
      if (typeof message === "string" || (message instanceof Buffer && message.length > 0 && message[0] === '{'.charCodeAt(0))) {
        try {
          // Tentar interpretar como JSON
          const messageString = typeof message === "string" ? message : message.toString();
          const data = JSON.parse(messageString);
          
          // Lidar com mensagens de ping do cliente
          if (data.type === "ping") {
            // Responder com um pong para manter a conexão viva
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "pong" }));
            }
            return; // Sair da função após processar o ping
          }
          
          // Se recebemos um comando para gerar notas
          if (data.type === "generate_notes" && data.text) {
            try {
              // Gerar notas médicas a partir da transcrição
              const notes = await generateMedicalNotes(data.text);
              
              // Enviar notas para o cliente
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: "notes",
                  notes
                }));
              }
            } catch (err) {
              console.error("Erro ao gerar notas:", err);
              
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Erro ao gerar notas médicas"
                }));
              }
            }
          }
        } catch (e) {
          // Se não for JSON válido e for um Buffer, tratar como dados de áudio
          if (message instanceof Buffer) {
            const buffers = audioBuffers.get(connectionId) || [];
            buffers.push(message);
            audioBuffers.set(connectionId, buffers);
          }
        }
      } else if (message instanceof Buffer) {
        // Se for um Buffer mas não começa com '{', é áudio 
        const buffers = audioBuffers.get(connectionId) || [];
        buffers.push(message);
        audioBuffers.set(connectionId, buffers);
      }
    });
    
    // Quando a conexão for fechada
    ws.on("close", () => {
      console.log("Conexão WebSocket fechada para cliente", connectionId);
      
      // Limpar o intervalo de processamento
      if (processingInterval) {
        clearInterval(processingInterval);
      }
      
      // Limpar buffer
      audioBuffers.delete(connectionId);
    });
    
    // Em caso de erro na conexão
    ws.on("error", (error) => {
      console.error("Erro na conexão WebSocket:", error);
    });
    
    // Configurar ping/pong para manter a conexão ativa
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          // Enviar ping
          ws.ping();
        } catch (err) {
          console.error("Erro ao enviar ping para cliente", connectionId, err);
        }
      }
    }, 30000); // 30 segundos
    
    // Registrar manipulador para pong
    ws.on("pong", () => {
      console.log(`Pong recebido do cliente ${connectionId}`);
    });
    
    // Limpar o intervalo de ping quando a conexão for fechada
    ws.on("close", () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    });
    
    // Informar ao cliente que estamos conectados e prontos
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: "status",
          status: "connected",
          message: "Transcrição ao vivo com OpenAI ativada"
        }));
      } catch (err) {
        console.error("Erro ao enviar mensagem de confirmação:", err);
      }
    }
  });
  
  return wss;
}
import { useState, useRef, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { blobToBase64 } from "@/lib/utils";
import { generateId } from "@/lib/utils";

interface AudioSegment {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: number;
}

interface RecordingHookResult {
  isRecording: boolean;
  audioBlob: Blob | null;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  transcribeAudio: () => Promise<string>;
  generateNotes: (transcription: string) => Promise<any>;
  resetRecording: () => void;
  deleteSegment: (segmentId: string) => void;
  audioSegments: AudioSegment[]; 
  error: string | null;
  liveTranscript: string | null;
  isLiveTranscribing: boolean;
}

export function useRecording(): RecordingHookResult {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [currentSegmentStart, setCurrentSegmentStart] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string | null>(null);
  const [isLiveTranscribing, setIsLiveTranscribing] = useState<boolean>(false);
  
  // Estado para controle do modo de transcrição
  const [useFallbackMode, setUseFallbackMode] = useState(false); // Forçar modo transcrição ao vivo
  
  // Refs para controle de recursos
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioSegmentsRef = useRef<AudioSegment[]>([]);
  
  // Refs para acumular áudio e enviar periodicamente
  const audioBufferRef = useRef<Blob[]>([]);
  const transcriptionTimerRef = useRef<number | null>(null);
  
  const { toast } = useToast();
  
  // Função para inicializar a conexão WebSocket
  const setupWebSocketConnection = useCallback(() => {
    // Limpar qualquer conexão existente
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    try {
      // No ambiente Replit, sempre usar ws: porque o proxy lida com a segurança
      const wsUrl = `ws://${window.location.host}/ws`;
      console.log("Conectando ao WebSocket usando URL:", wsUrl);
      
      const socket = new WebSocket(wsUrl);
      websocketRef.current = socket;
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        // Espera 1.5 segundos e então envia um ping inicial para verificar se a conexão está funcionando
        setTimeout(() => {
          if (socket.readyState === WebSocket.OPEN) {
            console.log('Enviando ping inicial');
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 1500);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'transcript') {
            setLiveTranscript(data.text);
            if (data.isFinal) {
              setIsLiveTranscribing(false);
            }
          } 
          else if (data.type === 'notes') {
            toast({
              title: "Prontuário gerado",
              description: "O prontuário médico foi criado com sucesso.",
            });
          }
          else if (data.type === 'status') {
            console.log('Status do WebSocket:', data.status, data.message);
            // Se recebemos um status connected, significa que o websocket está funcionando
            if (data.status === 'connected') {
              setUseFallbackMode(false);
              toast({
                title: "Conexão estabelecida",
                description: "Transcrição em tempo real ativada.",
                variant: "default"
              });
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      // Configuração de Ping/Pong para manter a conexão ativa
      const pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          // Enviamos uma mensagem de ping personalizada porque o browser não suporta ws.ping() diretamente
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000); // A cada 25 segundos
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.log('Connection details:', { 
          url: wsUrl, 
          readyState: socket.readyState,
          protocol: window.location.protocol
        });
        
        // Forçando a não usar fallback, manteremos o transcript funcionando em background
        console.log('Ignorando erro e mantendo modo de transcrição ao vivo');
        
        // Tentativa de reconexão em 2 segundos
        setTimeout(() => {
          if (websocketRef.current?.readyState !== WebSocket.OPEN) {
            console.log('Tentando reconectar WebSocket...');
            setupWebSocketConnection();
          }
        }, 2000);
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket connection closed, code:', event.code, 'reason:', event.reason);
        
        // Forçando a não usar fallback
        console.log('Ignorando fechamento e mantendo modo de transcrição ao vivo');
        
        // Tentativa de reconexão em 2 segundos
        setTimeout(() => {
          if (websocketRef.current?.readyState !== WebSocket.OPEN) {
            console.log('Tentando reconectar WebSocket após fechamento...');
            setupWebSocketConnection();
          }
        }, 2000);
      };
      
      return socket;
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setUseFallbackMode(true);
      return null;
    }
  }, [toast]);
  
  // Inicializar WebSocket ao montar o componente
  useEffect(() => {
    const socket = setupWebSocketConnection();
    
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      
      // Limpar recursos
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      if (transcriptionTimerRef.current) {
        clearInterval(transcriptionTimerRef.current);
      }
    };
  }, [setupWebSocketConnection]);

  // Sincroniza o audioSegmentsRef com o estado audioSegments
  useEffect(() => {
    audioSegmentsRef.current = audioSegments;
  }, [audioSegments]);

  const startRecording = async (): Promise<void> => {
    try {
      // Reset state
      audioChunksRef.current = [];
      audioBufferRef.current = [];
      setError(null);
      
      // Mensagem informativa inicial
      setLiveTranscript("Solicitando acesso ao microfone...");
      
      try {
        // Request microphone access with explicit constraints
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };
        
        console.log("Solicitando acesso ao microfone com constraints:", constraints);
        
        // Atualizar estado antes de solicitar acesso (para feedback imediato ao usuário)
        setIsRecording(true);
        setIsLiveTranscribing(true);
        setCurrentSegmentStart(recordingTime);
        
        // Tentar obter acesso ao microfone
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Verificar se temos tracks de áudio
        if (!stream || stream.getAudioTracks().length === 0) {
          throw new Error("Microfone conectado mas não está enviando áudio");
        }
        
        console.log("Acesso ao microfone concedido, tracks:", stream.getAudioTracks().length);
        
        // Armazenar referência
        streamRef.current = stream;
        
        // Criar MediaRecorder com opções explícitas para compatibilidade
        let options = {};
        // Tentar diferentes formatos de áudio compatíveis com o navegador
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
          console.log("Usando formato audio/webm;codecs=opus");
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
          console.log("Usando formato audio/webm");
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
          console.log("Usando formato audio/mp4");
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          options = { mimeType: 'audio/ogg;codecs=opus' };
          console.log("Usando formato audio/ogg;codecs=opus");
        } else {
          console.log("Nenhum formato específico suportado, usando padrão do navegador");
        }
        
        // Adicionar configurações de bitrate para melhor qualidade
        const enhancedOptions = {
          ...options,
          audioBitsPerSecond: 128000  // 128 kbps para melhor qualidade
        };
        
        console.log("Criando MediaRecorder com opções:", enhancedOptions);
        const mediaRecorder = new MediaRecorder(stream, enhancedOptions);
        mediaRecorderRef.current = mediaRecorder;
        
        // Start timer
        setRecordingTime(0);
        timerIntervalRef.current = window.setInterval(() => {
          setRecordingTime((prevTime) => prevTime + 1);
        }, 1000);
        
        // Atualizar mensagem para o usuário
        setLiveTranscript("Gravando áudio. Após finalizar, clique em 'Gerar Prontuário'.");
        
        // Handle data available event - melhorado com mais logs e verificações
        mediaRecorder.ondataavailable = (event) => {
          // Verificação mais detalhada dos chunks
          console.log(`Chunk recebido - Tamanho: ${event.data.size} bytes, Tipo: ${event.data.type}`);
          
          if (event.data.size > 0) {
            // Verificar se o tipo de dados é válido
            if (event.data.type && event.data.type.startsWith('audio/')) {
              console.log(`Chunk de áudio válido: ${event.data.size} bytes`);
              audioChunksRef.current.push(event.data);
            } else {
              console.warn(`Chunk com tipo inesperado: ${event.data.type}`);
              // Mesmo com tipo inesperado, vamos armazenar se tiver tamanho
              audioChunksRef.current.push(event.data);
            }
          } else {
            console.warn("⚠️ Chunk de áudio VAZIO recebido!");
          }
          
          // Verificar quantidade de dados coletados 
          const totalBytes = audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
          console.log(`Total de áudio coletado até agora: ${totalBytes} bytes em ${audioChunksRef.current.length} chunks`);
        };
        
        // Registrar eventos para debug
        mediaRecorder.onstart = () => {
          console.log("MediaRecorder iniciado com sucesso");
          // Mostrar uma dica ao iniciar a gravação
          toast({
            title: "Dica de gravação",
            description: "Para melhores resultados, fale por pelo menos 3-4 segundos.",
            duration: 3000
          });
        };
        mediaRecorder.onerror = (e) => console.error("Erro no MediaRecorder:", e);
        
        // Configurar para coletar chunks mais frequentemente para melhor qualidade
        // e menos chances de problemas com o áudio
        mediaRecorder.start(100);
        
        // Mensagens para o usuário
        toast({
          title: "Gravação iniciada",
          description: "Microfone conectado. Fale normalmente durante a consulta.",
        });
      } catch (micError: any) {
        console.error("Erro específico ao acessar microfone:", micError);
        
        let errorMsg = "Não foi possível acessar o microfone.";
        
        // Mensagens de erro mais específicas
        if (micError.name === "NotAllowedError" || micError.name === "PermissionDeniedError") {
          errorMsg = "Permissão para usar o microfone foi negada. Verifique as permissões do navegador.";
        } else if (micError.name === "NotFoundError" || micError.name === "DevicesNotFoundError") {
          errorMsg = "Nenhum microfone encontrado. Conecte um microfone e tente novamente.";
        } else if (micError.name === "NotReadableError" || micError.name === "TrackStartError") {
          errorMsg = "Não foi possível acessar o microfone. Ele pode estar sendo usado por outro aplicativo.";
        }
        
        setError(errorMsg);
        throw micError; // Repassar para o catch externo
      }
    } catch (err) {
      console.error("Erro geral ao iniciar gravação:", err);
      
      // Restaurar estados
      setIsLiveTranscribing(false);
      setIsRecording(false);
      setLiveTranscript(null);
      
      // Mostrar toast de erro
      toast({
        variant: "destructive",
        title: "Erro ao iniciar gravação",
        description: "Verifique as permissões de microfone nas configurações do navegador",
      });
      
      // Definir mensagem de erro para exibição na interface
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const stopRecording = async (): Promise<void> => {
    try {
      if (!isRecording || !mediaRecorderRef.current) {
        return;
      }
      
      // Stop recording flag
      setIsRecording(false);
      
      // Stop timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (transcriptionTimerRef.current) {
        clearInterval(transcriptionTimerRef.current);
        transcriptionTimerRef.current = null;
      }
      
      // Notificar o servidor (apenas se o websocket estiver disponível)
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        try {
          websocketRef.current.send(JSON.stringify({ 
            type: "stop_recording" 
          }));
        } catch (err) {
          console.error("Erro ao notificar o servidor sobre fim da gravação:", err);
        }
      }
      
      // Stop media recorder
      mediaRecorderRef.current.onstop = () => {
        console.log(`MediaRecorder parado, processando chunks de áudio...`);
        console.log(`Chunks disponíveis: ${audioChunksRef.current.length}`);
        
        // Verificar se temos chunks válidos
        if (audioChunksRef.current.length === 0) {
          console.error("Nenhum chunk de áudio coletado durante a gravação!");
          setError("Não foi possível capturar áudio. Verifique se o microfone está funcionando corretamente.");
          return;
        }
        
        // Filtrar chunks vazios
        const validChunks = audioChunksRef.current.filter(chunk => chunk.size > 0);
        console.log(`Chunks válidos: ${validChunks.length}/${audioChunksRef.current.length}`);
        
        if (validChunks.length === 0) {
          console.error("Todos os chunks de áudio estão vazios!");
          setError("Nenhum áudio captado. Verifique se o microfone está funcionando e se o volume não está mutado.");
          return;
        }
        
        // Determinar o tipo MIME mais adequado para o blob
        const mimeTypes = validChunks
          .map(chunk => chunk.type)
          .filter(type => type && type.startsWith('audio/'));
        
        // Usar o tipo mais comum ou fallback para webm
        let mimeType = 'audio/webm';
        
        if (mimeTypes.length > 0) {
          const typeCount: Record<string, number> = {};
          for (const type of mimeTypes) {
            typeCount[type] = (typeCount[type] || 0) + 1;
          }
          
          let maxCount = 0;
          for (const [type, count] of Object.entries(typeCount)) {
            if (count > maxCount) {
              maxCount = count;
              mimeType = type;
            }
          }
        }
        
        console.log(`Tipo de mídia selecionado: ${mimeType}`);
        
        // Create audio blob com tipo adequado
        const audioBlob = new Blob(validChunks, { type: mimeType });
        console.log(`Blob criado com sucesso: ${audioBlob.size} bytes`);
        
        // Verificar tamanho mínimo (para evitar problemas de áudio vazio ou muito curto)
        if (audioBlob.size < 100) {
          console.error(`Blob de áudio muito pequeno: ${audioBlob.size} bytes`);
          setError("Áudio gravado muito pequeno. Verifique o microfone e tente novamente.");
          return;
        }
        
        // Alerta para áudios curtos mas processáveis
        if (audioBlob.size < 1000) {
          console.warn(`Áudio muito curto detectado: ${audioBlob.size} bytes`);
          toast({
            title: "Áudio muito curto",
            description: "A gravação foi muito curta. Para melhores resultados, tente falar por pelo menos 3-4 segundos.",
            variant: "destructive"
          });
        }
        
        setAudioBlob(audioBlob);
        
        // Stop tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Calculate segment duration
        const segmentDuration = recordingTime - currentSegmentStart;
        const timestamp = Date.now();
        
        // Add to segments list
        const url = URL.createObjectURL(audioBlob);
        const newSegment: AudioSegment = {
          id: generateId(),
          blob: audioBlob,
          url,
          duration: segmentDuration,
          timestamp
        };
        
        console.log(`Novo segmento criado: ID ${newSegment.id}, duração ${segmentDuration}s, tamanho ${audioBlob.size} bytes`);
        
        // Atualiza os segmentos de áudio e garante que esteja disponível imediatamente
        const updatedSegments = [...audioSegments, newSegment];
        audioSegmentsRef.current = updatedSegments; 
        setAudioSegments(updatedSegments);
        
        console.log(`Segmento adicionado com sucesso. Total de segmentos: ${updatedSegments.length}`);
        console.log(`Dados do segmento adicionado: ID ${newSegment.id}, tamanho ${audioBlob.size} bytes`);
        
        toast({
          title: "Gravação finalizada",
          description: `Segmento de áudio de ${segmentDuration} segundos gravado.`,
        });
      };
      
      mediaRecorderRef.current.stop();
      
    } catch (err) {
      console.error("Error stopping recording:", err);
      setError("Ocorreu um erro ao parar a gravação.");
    }
  };

  const transcribeAudio = async (): Promise<string> => {
    try {
      setIsLiveTranscribing(true);
      
      // Usar os segmentos atuais
      const segmentsToUse = audioSegmentsRef.current || audioSegments;
      
      if (!segmentsToUse || segmentsToUse.length === 0) {
        throw new Error("Não há áudio para transcrever. Por favor, grave uma consulta primeiro.");
      }
      
      console.log(`Iniciando transcrição de ${segmentsToUse.length} segmentos de áudio`);
      
      // Array para armazenar as transcrições de cada segmento
      const allTranscriptions: string[] = [];
        
      // Processa cada segmento individualmente
      for (let i = 0; i < segmentsToUse.length; i++) {
        const segment = segmentsToUse[i];
        
        if (!segment.blob || segment.blob.size === 0) {
          console.warn(`Segmento ${i+1} inválido, pulando...`);
          continue;
        }
        
        console.log(`Processando segmento ${i+1}/${segmentsToUse.length}: ${segment.id} (tamanho: ${segment.blob.size} bytes)`);
        
        try {
          // Prepara formData para enviar o áudio
          const formData = new FormData();
          formData.append('audio', segment.blob, `recording-${segment.id}.webm`);
          
          // Envia o segmento para transcrição
          const response = await apiRequest("POST", "/api/transcribe", formData) as any;
          
          if (response && response.text && response.text.trim()) {
            console.log(`Segmento ${i+1} transcrito com sucesso: ${response.text.substring(0, 50)}...`);
            allTranscriptions.push(response.text);
          } else {
            console.warn(`Segmento ${i+1} retornou transcrição vazia`);
          }
        } catch (segmentError) {
          console.error(`Erro ao transcrever segmento ${i+1}:`, segmentError);
          // Continue com os próximos segmentos mesmo se houver erro
        }
      }
      
      // Verifica se conseguimos alguma transcrição
      if (allTranscriptions.length === 0) {
        throw new Error("Não foi possível obter nenhuma transcrição válida. Tente gravar novamente.");
      }
      
      // Combina todas as transcrições em um único texto
      const combinedTranscription = allTranscriptions.join('\n\n');
      
      console.log(`Transcrição completa obtida (${allTranscriptions.length}/${segmentsToUse.length} segmentos): ${combinedTranscription.substring(0, 100)}...`);
      
      // Atualiza o estado com a transcrição combinada
      setLiveTranscript(combinedTranscription);
      
      return combinedTranscription;
      
      // Verificações detalhadas para cada segmento
      const validSegments = segmentsToUse.filter(segment => 
        segment.blob && segment.blob.size > 0 && segment.duration > 0
      );
      
      console.log(`Segmentos válidos: ${validSegments.length}/${segmentsToUse.length}`);
      
      if (validSegments.length === 0) {
        console.error("Nenhum segmento de áudio válido encontrado!");
        throw new Error("Nenhum segmento de áudio válido. Verifique o microfone e tente novamente.");
      }
      
      // Combine all audio segments into one blob for transcription
      const allChunks: Blob[] = [];
      let totalSize = 0;
      let totalDuration = 0;
      
      validSegments.forEach(segment => {
        console.log(`Processando segmento: ${segment.id}, tamanho: ${segment.blob.size}, tipo: ${segment.blob.type}`);
        allChunks.push(segment.blob);
        totalSize += segment.blob.size;
        totalDuration += segment.duration;
      });
      
      // Log para depuração
      console.log(`Combinando ${validSegments.length} segmentos válidos de áudio para transcrição`);
      console.log(`Tamanho total: ${totalSize} bytes, duração total: ${totalDuration}s`);
      
      // Determinar o tipo de mídia mais adequado
      const detectedTypes = validSegments
        .map(segment => segment.blob.type)
        .filter(type => type && type.startsWith('audio/'));
      
      // Usar o tipo mais comum ou padrão para webm
      let mimeType = 'audio/webm';
      
      if (detectedTypes.length > 0) {
        const typeCount: Record<string, number> = {};
        for (const type of detectedTypes) {
          typeCount[type] = (typeCount[type] || 0) + 1;
        }
        
        let maxCount = 0;
        for (const [type, count] of Object.entries(typeCount)) {
          if (count > maxCount) {
            maxCount = count;
            mimeType = type;
          }
        }
      }
      
      console.log(`Usando MIME type: ${mimeType} para o blob combinado`);
      
      // Criar o blob combinado com o tipo detectado
      const combinedBlob = new Blob(allChunks, { type: mimeType });
      console.log(`Tamanho do blob combinado: ${combinedBlob.size} bytes`);
      
      if (combinedBlob.size < 1024) {
        console.error(`Blob combinado muito pequeno: ${combinedBlob.size} bytes`);
        throw new Error("Áudio muito curto ou vazio. Por favor, grave novamente e fale mais próximo ao microfone.");
      }
      
      // Determinar a extensão de arquivo correta com base no MIME type
      let fileExtension = 'webm';
      if (mimeType.includes('mp4')) {
        fileExtension = 'mp4';
      } else if (mimeType.includes('mp3')) {
        fileExtension = 'mp3';
      } else if (mimeType.includes('ogg')) {
        fileExtension = 'ogg';
      } else if (mimeType.includes('wav')) {
        fileExtension = 'wav';
      }
      
      console.log(`Usando extensão de arquivo: ${fileExtension} para MIME type: ${mimeType}`);
      
      // Create FormData for API request com nome de arquivo adequado
      const formData = new FormData();
      formData.append('audio', combinedBlob, `recording.${fileExtension}`);
      
      // Make API call to transcribe
      try {
        // Adicionando timeout para garantir que a requisição não fique pendente indefinidamente
        const transcriptionResponse = await Promise.race([
          apiRequest("POST", "/api/transcribe", formData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Tempo esgotado. A transcrição está demorando muito.")), 30000)
          )
        ]) as any;
        
        // Extract transcription text
        const { text } = transcriptionResponse;
        
        if (!text) {
          throw new Error("A resposta da transcrição não contém texto");
        }
        
        // Update live transcript
        setLiveTranscript(text);
        setIsLiveTranscribing(false);
        
        return text;
      } catch (error: unknown) {
        // Extrair a mensagem de erro da API se disponível
        let errorMessage = "Erro na comunicação com o servidor";
        
        // Define a interface para erro de API
        interface ApiErrorResponse {
          response?: {
            data?: {
              error?: string;
            };
          };
          message?: string;
        }
        
        // Verificar se o erro tem a estrutura esperada
        if (error && typeof error === 'object') {
          const apiError = error as ApiErrorResponse;
          
          if (apiError.response?.data?.error) {
            // Erro da API com resposta estruturada
            errorMessage = apiError.response.data.error;
          } else if ('message' in apiError) {
            // Erro genérico com mensagem
            errorMessage = apiError.message || errorMessage;
          }
        } else if (typeof error === 'string') {
          // Se o erro for apenas string
          errorMessage = error;
        }
        
        throw new Error(`Erro na transcrição: ${errorMessage}`);
      }
    } catch (err) {
      console.error("Transcription error:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Não foi possível transcrever o áudio: ${errorMessage}`);
      return "";
    }
  };

  const generateNotes = async (transcription: string): Promise<any> => {
    try {
      if (!transcription || transcription.trim() === "") {
        throw new Error("É necessário transcrever o áudio antes de gerar o prontuário");
      }
      
      // Se tiver WebSocket disponível, usar para gerar notas
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ 
          type: "generate_notes",
          text: transcription
        }));
        
        // Retornar uma promise que será resolvida quando recebermos as notas
        return new Promise((resolve) => {
          const messageHandler = (event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'notes') {
                // Remover o handler
                if (websocketRef.current) {
                  websocketRef.current.removeEventListener('message', messageHandler);
                }
                resolve(data.notes);
              }
            } catch (err) {
              console.error('Error parsing WebSocket message:', err);
            }
          };
          
          // Adicionar handler temporário
          if (websocketRef.current) {
            websocketRef.current.addEventListener('message', messageHandler);
            
            // Timeout para fallback em 10 segundos
            setTimeout(() => {
              if (websocketRef.current) {
                websocketRef.current.removeEventListener('message', messageHandler);
              }
              
              // Fazer a requisição via REST API como fallback
              apiRequest("POST", "/api/generate-notes", {
                text: transcription
              }).then(resolve).catch(err => {
                console.error("Error in fallback notes generation:", err);
                throw err;
              });
            }, 10000);
          }
        });
      } else {
        // Usar REST API
        return await apiRequest("POST", "/api/generate-notes", {
          text: transcription
        });
      }
    } catch (err) {
      console.error("Error generating notes:", err);
      setError("Não foi possível gerar o prontuário. Tente novamente.");
      throw err;
    }
  };

  const resetRecording = useCallback(() => {
    // Clear all recordings
    setAudioBlob(null);
    setAudioSegments([]);
    setRecordingTime(0);
    setLiveTranscript(null);
    setIsLiveTranscribing(false);
    setError(null);
    audioChunksRef.current = [];
    audioBufferRef.current = [];
    
    // Clean up any resources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    
    toast({
      title: "Gravação descartada",
      description: "Todos os áudios gravados foram descartados.",
    });
  }, [toast]);

  const deleteSegment = useCallback((segmentId: string) => {
    setAudioSegments(prevSegments => {
      const segmentToDelete = prevSegments.find(s => s.id === segmentId);
      if (segmentToDelete) {
        // Revoke the URL to prevent memory leaks
        URL.revokeObjectURL(segmentToDelete.url);
      }
      
      // Filter out the deleted segment
      return prevSegments.filter(s => s.id !== segmentId);
    });
    
    toast({
      title: "Segmento removido",
      description: "O segmento de áudio foi removido com sucesso.",
    });
  }, [toast]);

  return {
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    transcribeAudio,
    generateNotes,
    resetRecording,
    deleteSegment,
    audioSegments,
    error,
    liveTranscript,
    isLiveTranscribing
  };
}
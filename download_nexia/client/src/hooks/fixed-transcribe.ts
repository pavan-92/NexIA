export async function transcribeAudio(
  audioSegments: Array<{ id: string; blob: Blob; duration: number }>,
  apiRequest: (method: string, url: string, data?: any) => Promise<any>,
  setLiveTranscript: (text: string) => void,
  setIsLiveTranscribing: (state: boolean) => void
): Promise<string> {
  setIsLiveTranscribing(true);
  
  try {
    if (!audioSegments || audioSegments.length === 0) {
      throw new Error("Não há áudio para transcrever. Por favor, grave uma consulta primeiro.");
    }
    
    console.log(`Iniciando transcrição de ${audioSegments.length} segmentos de áudio`);
    
    // Array para armazenar as transcrições de cada segmento
    const allTranscriptions: string[] = [];
    
    // Processa cada segmento individualmente
    for (let i = 0; i < audioSegments.length; i++) {
      const segment = audioSegments[i];
      
      if (!segment.blob || segment.blob.size === 0) {
        console.warn(`Segmento ${i+1} inválido, pulando...`);
        continue;
      }
      
      console.log(`Processando segmento ${i+1}/${audioSegments.length}: ${segment.id} (tamanho: ${segment.blob.size} bytes)`);
      
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
    
    console.log(`Transcrição completa obtida (${allTranscriptions.length}/${audioSegments.length} segmentos): ${combinedTranscription.substring(0, 100)}...`);
    
    // Atualiza o estado com a transcrição combinada
    setLiveTranscript(combinedTranscription);
    
    return combinedTranscription;
  } catch (error) {
    console.error("Erro geral na transcrição:", error);
    throw error;
  } finally {
    setIsLiveTranscribing(false);
  }
}
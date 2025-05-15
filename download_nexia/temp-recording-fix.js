// Nova implementação simplificada da função startRecording
const startRecording = async () => {
  try {
    // Reset state
    audioChunksRef.current = [];
    setError(null);
    setIsRecording(true);
    setIsLiveTranscribing(true);
    setCurrentSegmentStart(recordingTime);
    
    // Mensagem clara sobre gravação em andamento
    setLiveTranscript("Gravando... A transcrição aparecerá aqui em breve.");
    
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    
    // Create media recorder
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    // Start timer
    setRecordingTime(0);
    timerIntervalRef.current = window.setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
    
    // Notificar o servidor (se não estiver no modo fallback)
    if (!useFallbackMode && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ 
        type: "start_recording"
      }));
      console.log("Modo de transcrição em tempo real ativado");
    } else {
      console.log("Usando modo de gravação local (fallback)");
    }
    
    // Handle data available event
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // Adicionar chunk para eventual download/processamento local
        audioChunksRef.current.push(event.data);
        
        // Enviar chunk para o servidor (no modo online)
        if (!useFallbackMode && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          try {
            websocketRef.current.send(event.data);
          } catch (err) {
            console.error("Erro ao enviar áudio para o servidor:", err);
            setUseFallbackMode(true);
          }
        }
      }
    };
    
    // Start recording
    mediaRecorder.start(250);
    
    // Mensagem de toast
    toast({
      title: useFallbackMode ? "Gravação iniciada (modo offline)" : "Gravação iniciada",
      description: "Fale normalmente durante a consulta.",
    });
    
  } catch (err) {
    setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    console.error("Error starting recording:", err);
    setIsLiveTranscribing(false);
    setIsRecording(false);
  }
};
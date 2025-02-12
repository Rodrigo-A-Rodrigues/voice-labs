"use client";
import { useRef, useState } from 'react';

export default function CallPage() {
  const [isCalling, setIsCalling] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startCall = async () => {
    try {
      // Solicita acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Cria um Blob com os pedaços de áudio gravados
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Cria uma URL para reprodução local
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);

        // Se desejar enviar o áudio para o backend, converta para base64 ou use FormData
        // Exemplo com base64:
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          // Envie para seu endpoint (ex.: /api/process-call)
          await fetch('/api/process-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Audio }),
          });
        };
      };

      mediaRecorder.start();
      setIsCalling(true);

      // Opcional: Notifique o backend que a chamada iniciou (para iniciar uma sessão com o Agent AI)
      // await fetch('/api/start-call', { method: 'POST' });
    } catch (error) {
      console.error('Erro ao iniciar a chamada:', error);
    }
  };

  const endCall = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsCalling(false);

    // Opcional: Notifique o backend que a chamada foi finalizada
    // await fetch('/api/end-call', { method: 'POST' });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Chamada com Agent AI do ElevenLabs</h1>
      {!isCalling ? (
        <button onClick={startCall}>Iniciar Chamada</button>
      ) : (
        <>
          <p>Chamada em andamento...</p>
          <button onClick={endCall}>Finalizar Chamada</button>
        </>
      )}
      {recordedAudio && (
        <div style={{ marginTop: '20px' }}>
          <p>Gravação da chamada:</p>
          <audio controls src={recordedAudio}></audio>
        </div>
      )}
    </div>
  );
}

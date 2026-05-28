"use client";

import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderOptions {
  voiceLanguage: string;
  onTranscript: (text: string) => void;
}

export function useAudioRecorder({ voiceLanguage, onTranscript }: UseAudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const startRecording = useCallback(async () => {
    try {
      // Pick the first MIME type the current browser actually supports.
      // Safari (iOS especially) does not support "audio/webm" and throws a
      // NotSupportedError as soon as `new MediaRecorder(stream, { mimeType })`
      // runs — which surfaced as "microphone access denied" on iPhones even
      // though the permission was granted.
      const candidateMimes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/mp4;codecs=mp4a.40.2",
        "audio/ogg;codecs=opus",
      ];
      const supportedMime =
        typeof MediaRecorder !== "undefined" && "isTypeSupported" in MediaRecorder
          ? candidateMimes.find((m) => (MediaRecorder as unknown as { isTypeSupported: (t: string) => boolean }).isTypeSupported(m))
          : undefined;

      if (!supportedMime) {
        alert("Seu navegador não suporta gravação de áudio. Tente digitar a resposta ou use outro navegador.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMime });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        // Use the same MIME the recorder produced so the Blob is correctly
        // typed for the backend transcription endpoint.
        const audioBlob = new Blob(audioChunksRef.current, { type: supportedMime });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          // Filename extension follows the actual container so OpenAI/Whisper
          // accepts the upload (it sniffs both the Content-Type and the name).
          const ext = supportedMime.startsWith("audio/mp4")
            ? "m4a"
            : supportedMime.startsWith("audio/ogg")
            ? "ogg"
            : "webm";
          const formData = new FormData();
          formData.append("audio", audioBlob, `recording.${ext}`);
          formData.append("language", voiceLanguage);

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
          if (!res.ok) throw new Error("Transcription failed");

          const data = await res.json();
          if (data.text) onTranscriptRef.current(data.text);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          console.error("Transcription error:", err);
        } finally {
          abortRef.current = null;
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  }, [voiceLanguage]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const cancelTranscription = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { isRecording, isTranscribing, startRecording, stopRecording, cancelTranscription };
}

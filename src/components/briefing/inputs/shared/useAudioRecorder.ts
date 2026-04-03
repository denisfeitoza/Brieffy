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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
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

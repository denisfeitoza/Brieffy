"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, ArrowRight, RefreshCw } from "lucide-react";
import { useAudioRecorder } from "./shared/useAudioRecorder";

export interface TextAudioInputHandle {
  focus: () => void;
  scrollIntoView: () => void;
}

interface TextAudioInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSubmit: () => void;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  isAddAction?: boolean;
  isLoading: boolean;
  isSubmittingLocal: boolean;
  selectedMultiplesCount?: number;
  hasUserAnswer?: boolean;
  voiceLanguage: string;
  placeholderOverride?: string;
  isDiscoveryPhase?: boolean;
}

export const TextAudioInput = forwardRef<TextAudioInputHandle, TextAudioInputProps>(function TextAudioInput({
  inputText,
  setInputText,
  onSubmit,
  onAction,
  actionIcon,
  isAddAction = false,
  isLoading,
  isSubmittingLocal,
  selectedMultiplesCount = 0,
  hasUserAnswer = false,
  voiceLanguage,
  placeholderOverride,
  isDiscoveryPhase = false,
}, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus({ preventScroll: false });
    },
    scrollIntoView: () => {
      wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Small delay to ensure scroll completes before focus
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 400);
    },
  }));

  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorder({
    voiceLanguage,
    onTranscript: setInputText,
  });

  const actionToRun = onAction || onSubmit;

  const placeholder = placeholderOverride
    ? placeholderOverride
    : isRecording
    ? voiceLanguage === "pt"
      ? "Ouvindo... Pode falar! (clique no microfone para parar)"
      : voiceLanguage === "es"
      ? "Escuchando... ¡Puedes hablar! (toca el micrófono para detener)"
      : "Listening... Speak now! (click mic to stop)"
    : isTranscribing
    ? voiceLanguage === "pt"
      ? "Transcrevendo áudio..."
      : voiceLanguage === "es"
      ? "Transcribiendo audio..."
      : "Transcribing audio..."
    : isDiscoveryPhase
    ? voiceLanguage === "pt"
      ? "Escreva ou grave um áudio — sem pressa, conte tudo..."
      : voiceLanguage === "es"
      ? "Escriba o grabe un audio — sin prisa, cuéntelo todo..."
      : "Write or record audio — take your time, tell me everything..."
    : isAddAction
    ? voiceLanguage === "pt"
      ? "Adicione um comentário extra ou opção..."
      : voiceLanguage === "es"
      ? "Agregue un comentario u opción extra..."
      : "Add an extra comment or option..."
    : voiceLanguage === "pt"
    ? "Digite ou toque no 🎙 para responder por áudio..."
    : voiceLanguage === "es"
    ? "Escriba o toque el 🎙 para responder con audio..."
    : "Type or tap 🎙 to answer with audio...";

  return (
    <div ref={wrapperRef} className={`relative group w-full ${isDiscoveryPhase ? 'mt-6' : 'mt-8'}`}>
      <Input
        ref={inputRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter") {
            e.preventDefault();
            actionToRun();
          }
        }}
        disabled={isLoading || isSubmittingLocal || isTranscribing}
        placeholder={placeholder}
        className={`w-full transition-all font-inter pr-32 pl-6 rounded-2xl ${
          isRecording 
            ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30 text-red-100 placeholder:text-red-400/80 animate-pulse' 
            : 'bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500'
        } ${
          isDiscoveryPhase
            ? `h-20 md:h-24 text-lg md:text-xl ${!isRecording ? 'border-indigo-500/20' : ''}`
            : 'h-14 md:h-16 text-base md:text-lg'
        }`}
        spellCheck="false"
        autoComplete="off"
        autoCorrect="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        {isTranscribing ? (
          <div className="h-12 w-12 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className={`rounded-xl transition-all ${
              isDiscoveryPhase ? 'h-14 w-14' : 'h-12 w-12'
            } ${
              isRecording
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse"
                : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 bg-indigo-500/5 border border-indigo-500/20"
            }`}
            onClick={() => (isRecording ? stopRecording() : startRecording())}
            style={!isRecording ? {
              animation: isDiscoveryPhase ? 'mic-glow 2s ease-in-out 1s infinite' : 'mic-glow 3s ease-in-out 1.5s infinite',
            } : undefined}
          >
            <Mic className={isDiscoveryPhase ? 'w-6 h-6' : 'w-5 h-5'} />
          </Button>
        )}

        <Button
          size="icon"
          className={`h-12 w-12 rounded-xl transition-colors shadow-lg shadow-white/5 ${
            isAddAction && inputText.trim()
              ? "bg-indigo-500 text-white hover:bg-indigo-600"
              : "bg-white text-black hover:bg-neutral-200"
          }`}
          disabled={
            isAddAction
              ? !inputText.trim()
              : (!inputText.trim() && selectedMultiplesCount === 0 && !hasUserAnswer) ||
                isLoading ||
                isSubmittingLocal ||
                isTranscribing
          }
          onClick={actionToRun}
        >
          {(isLoading || isSubmittingLocal) && !isAddAction ? (
            <RefreshCw className="w-5 h-5 animate-spin text-neutral-500" />
          ) : actionIcon ? (
            actionIcon
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
});


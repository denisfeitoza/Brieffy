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
            ? 'bg-red-50/50 border-red-500/50 ring-2 ring-red-500/30 text-red-900 placeholder:text-red-500/80 animate-pulse' 
            : 'bg-white border-gray-200 text-black placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[var(--orange)]/20 focus-visible:border-[var(--orange)] shadow-sm'
        } ${
          isDiscoveryPhase
            ? `h-20 md:h-24 text-lg md:text-xl ${!isRecording ? 'border-[var(--orange)]/30 shadow-md' : ''}`
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
            <RefreshCw className="w-5 h-5 text-[var(--orange)] animate-spin" />
          </div>
        ) : (
          <Button
            size="icon"
            className={`rounded-xl transition-all shadow-lg ${
              isDiscoveryPhase ? 'h-14 w-14' : 'h-12 w-12'
            } ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-red-500/30"
                : "bg-white text-[var(--orange)] border border-gray-100 hover:bg-[var(--orange)]/5 shadow-sm"
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
          className={`h-12 w-12 rounded-xl transition-colors shadow-sm ${
            isAddAction && inputText.trim()
              ? "bg-black text-white hover:bg-neutral-800"
              : "bg-black text-white hover:bg-neutral-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
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


"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, ArrowRight, RefreshCw } from "lucide-react";
import { useAudioRecorder } from "./shared/useAudioRecorder";

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
}

export function TextAudioInput({
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
}: TextAudioInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorder({
    voiceLanguage,
    onTranscript: setInputText,
  });

  const actionToRun = onAction || onSubmit;

  const placeholder = placeholderOverride
    ? placeholderOverride
    : isTranscribing
    ? voiceLanguage === "pt"
      ? "Transcrevendo áudio..."
      : voiceLanguage === "es"
      ? "Transcribiendo audio..."
      : "Transcribing audio..."
    : isAddAction
    ? voiceLanguage === "pt"
      ? "Adicione um comentário extra ou opção..."
      : voiceLanguage === "es"
      ? "Agregue un comentario u opción extra..."
      : "Add an extra comment or option..."
    : voiceLanguage === "pt"
    ? "Ou digite sua resposta livremente..."
    : voiceLanguage === "es"
    ? "O escriba su respuesta libremente..."
    : "Or type your answer freely...";

  return (
    <div className="relative group w-full mt-8">
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
        className="h-14 md:h-16 w-full bg-neutral-900/50 border-neutral-800 rounded-2xl pl-6 pr-32 text-base md:text-lg text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all font-inter"
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
            className={`h-12 w-12 rounded-xl transition-all ${
              isRecording
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
            onClick={() => (isRecording ? stopRecording() : startRecording())}
          >
            <Mic className="w-5 h-5" />
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
}

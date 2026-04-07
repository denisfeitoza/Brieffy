"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, ArrowRight, RefreshCw, Square } from "lucide-react";
import { useAudioRecorder } from "./shared/useAudioRecorder";
import { motion, AnimatePresence } from "framer-motion";

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
  showVoiceTutorial?: boolean;
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
  showVoiceTutorial = false,
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
    ? "Digite ou toque no microfone para responder por áudio..."
    : voiceLanguage === "es"
    ? "Escriba o toque el micrófono para responder con audio..."
    : "Type or tap the microphone to answer with audio...";

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
        className={`w-full transition-all font-inter pr-32 pl-6 md:pl-8 rounded-[2rem] ${
          isRecording 
            ? 'bg-red-50/50 border-red-500/50 ring-2 ring-red-500/30 text-red-900 placeholder:text-red-500/80 animate-pulse' 
            : 'bg-white border-gray-200 text-black placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[var(--orange)]/20 focus-visible:border-[var(--orange)] shadow-sm'
        } ${
          isDiscoveryPhase
            ? `h-[88px] md:h-28 text-xl md:text-2xl ${!isRecording ? 'border-[var(--orange)]/30 shadow-md' : ''}`
            : 'h-16 md:h-20 text-[17px] md:text-xl'
        }`}
        spellCheck="false"
        autoComplete="off"
        autoCorrect="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        <AnimatePresence>
          {showVoiceTutorial && !isRecording && !inputText && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ delay: 0.5, duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
              className="absolute bottom-[calc(100%+14px)] -right-2 md:right-4 bg-gray-900 text-white p-4 rounded-[1.25rem] shadow-2xl w-[calc(100vw-2rem)] max-w-[18rem] md:w-72 md:max-w-none pointer-events-none origin-bottom-right z-50 flex items-start gap-3 md:gap-4 border border-white/10"
            >
              <div className="bg-[var(--orange)] rounded-[0.85rem] p-2.5 shrink-0 shadow-lg shadow-[var(--orange)]/30">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-bold text-[11px] text-[var(--orange)] uppercase tracking-wider mb-1">
                  {voiceLanguage === 'pt' ? 'Dica de Ouro' : voiceLanguage === 'es' ? 'Consejo de Oro' : 'Pro Tip'}
                </span>
                <span className="font-semibold text-[15px] mb-1">
                  {voiceLanguage === 'pt' ? 'Ganhe tempo com a Voz!' : voiceLanguage === 'es' ? '¡Ahorra tiempo con la Voz!' : 'Save time with Voice!'}
                </span>
                <span className="text-[13px] text-gray-300 leading-relaxed">
                  {voiceLanguage === 'pt' ? 'Falar é até 4x mais rápido do que digitar. Teste na sua resposta!' : voiceLanguage === 'es' ? 'Hablar es hasta 4 veces más rápido que escribir. ¡Pruébalo!' : 'Speaking is up to 4x faster than typing. Try it out!'}
                </span>
              </div>
              {/* Pointer triangle */}
              <div className="absolute -bottom-2 right-6 md:right-20 w-4 h-4 bg-gray-900 border-r border-b border-white/10 rotate-45 rounded-sm" />
            </motion.div>
          )}
        </AnimatePresence>

        {isTranscribing ? (
          <div className="h-12 w-12 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-[var(--orange)] animate-spin" />
          </div>
        ) : (
          <Button
            size="icon"
            className={`rounded-[1.25rem] transition-all shadow-lg ${
              isDiscoveryPhase ? 'h-[72px] w-[72px]' : 'h-14 w-14'
            } ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-red-500/30"
                : "bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90 shadow-[var(--orange)]/30"
            }`}
            onClick={() => (isRecording ? stopRecording() : startRecording())}
          >
            {isRecording ? (
              <Square className={`${isDiscoveryPhase ? 'w-6 h-6' : 'w-5 h-5'} fill-current`} />
            ) : (
              <Mic className={`${isDiscoveryPhase ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
            )}
          </Button>
        )}

        <Button
          size="icon"
          className={`rounded-[1.25rem] transition-colors shadow-sm ${
            isDiscoveryPhase ? 'h-[72px] w-[72px]' : 'h-14 w-14'
          } ${
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


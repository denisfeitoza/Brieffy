"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { TextAudioInput } from "./TextAudioInput";

interface DraggableToggleProps {
  onSelect: (val: string) => void;
  disabled: boolean;
  t: Record<string, string>;
  initialAnswer?: string | null;
}

function BooleanButtons({ onSelect, disabled, t, initialAnswer }: DraggableToggleProps) {
  const normalize = (val?: string | null) => val?.trim().toLowerCase();

  const resolveInitial = (val?: string | null): string | null => {
    const n = normalize(val);
    if (n === normalize(t.yes)) return t.yes;
    if (n === normalize(t.no)) return t.no;
    return null;
  };

  const [selected, setSelected] = useState<string | null>(resolveInitial(initialAnswer));

  useEffect(() => {
    const resolved = resolveInitial(initialAnswer);
    setSelected(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAnswer]);

  const handleSelect = (val: string) => {
    if (disabled) return;
    setSelected(val);
    setTimeout(() => onSelect(val), 200);
  };

  const isYes = selected === t.yes;
  const isNo = selected === t.no;

  return (
    <div
      className="flex gap-4 w-full max-w-sm"
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      {/* SIM button */}
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(t.yes)}
        whileHover={!disabled ? { scale: 1.03 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        className={`
          flex-1 flex flex-col items-center justify-center gap-2
          h-28 rounded-2xl border-2 font-bold text-xl uppercase tracking-widest
          transition-all duration-200 cursor-pointer select-none
            ? "bg-green-500 border-green-400 text-white shadow-[0_0_24px_rgba(34,197,94,0.4)]"
            : "bg-white border-gray-200 text-gray-500 hover:border-green-500/40 hover:bg-green-50 hover:text-green-600 shadow-sm"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Check className={`w-7 h-7 ${isYes ? "text-white" : "text-gray-400"}`} />
        {t.yes}
      </motion.button>

      {/* NÃO button */}
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(t.no)}
        whileHover={!disabled ? { scale: 1.03 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        className={`
          flex-1 flex flex-col items-center justify-center gap-2
          h-28 rounded-2xl border-2 font-bold text-xl uppercase tracking-widest
          transition-all duration-200 cursor-pointer select-none
          ${isNo
            ? "bg-red-500 border-red-400 text-white shadow-[0_0_24px_rgba(239,68,68,0.4)]"
            : "bg-white border-gray-200 text-gray-500 hover:border-red-500/40 hover:bg-red-50 hover:text-red-600 shadow-sm"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <X className={`w-7 h-7 ${isNo ? "text-white" : "text-gray-400"}`} />
        {t.no}
      </motion.button>
    </div>
  );
}

interface BooleanToggleInputProps {
  onSelect: (val: string) => void;
  isLoading: boolean;
  isSubmittingLocal: boolean;
  initialAnswer?: string | null;
  inputText: string;
  setInputText: (t: string) => void;
  handleLocalSend: () => void;
  voiceLanguage: string;
  t: Record<string, string>;
}

export function BooleanToggleInput({
  onSelect,
  isLoading,
  isSubmittingLocal,
  initialAnswer,
  inputText,
  setInputText,
  handleLocalSend,
  voiceLanguage,
  t,
}: BooleanToggleInputProps) {
  return (
    <div className="flex flex-col gap-6 w-full items-center justify-center my-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <BooleanButtons
        t={t}
        onSelect={onSelect}
        disabled={isLoading || isSubmittingLocal}
        initialAnswer={initialAnswer}
      />
      <div className="w-full max-w-lg opacity-70 hover:opacity-100 transition-opacity">
        <p className="text-sm text-center text-gray-500 mb-2">{t.moreDetails}</p>
        <TextAudioInput
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={handleLocalSend}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          voiceLanguage={voiceLanguage}
        />
      </div>
    </div>
  );
}

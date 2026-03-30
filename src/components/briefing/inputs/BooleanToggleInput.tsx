"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { TextAudioInput } from "./TextAudioInput";

interface DraggableToggleProps {
  onSelect: (val: string) => void;
  disabled: boolean;
  t: Record<string, string>;
  initialAnswer?: string | null;
}

function DraggableToggle({ onSelect, disabled, t, initialAnswer }: DraggableToggleProps) {
  const [answered, setAnswered] = useState<string | null>(initialAnswer || null);
  const x = useMotionValue(0);
  const knobWidth = 140;
  const maxDrag = (320 - knobWidth) / 2 - 8;

  useEffect(() => {
    if (initialAnswer === t.yes || initialAnswer === t.yes?.toLowerCase()) {
      x.set(-maxDrag);
    } else if (initialAnswer === t.no || initialAnswer === t.no?.toLowerCase()) {
      x.set(maxDrag);
    } else {
      x.set(0);
    }
  }, [initialAnswer, t.yes, t.no, x, maxDrag]);

  const handleSelect = (val: string) => {
    if (disabled) return;
    setAnswered(val);
    if (val === t.yes) {
      animate(x, -maxDrag, { type: "spring", stiffness: 300, damping: 20 });
      setTimeout(() => onSelect(t.yes), 350);
    } else if (val === t.no) {
      animate(x, maxDrag, { type: "spring", stiffness: 300, damping: 20 });
      setTimeout(() => onSelect(t.no), 350);
    }
  };

  const background = useTransform(x, [-maxDrag, 0, maxDrag], [
    "rgba(34, 197, 94, 0.15)",
    "rgba(38, 38, 38, 0.4)",
    "rgba(239, 68, 68, 0.15)",
  ]);
  const borderColor = useTransform(x, [-maxDrag, 0, maxDrag], [
    "rgba(34, 197, 94, 0.4)",
    "rgba(64, 64, 64, 0.6)",
    "rgba(239, 68, 68, 0.4)",
  ]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mobile fix: w-full max-w-[320px] instead of fixed 320px */}
      <motion.div
        className="relative flex items-center justify-center h-20 rounded-[2.5rem] overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] backdrop-blur-md w-full"
        style={{ maxWidth: 320, backgroundColor: background, borderColor, borderWidth: 1 }}
      >
        <div className="absolute inset-0 flex z-20">
          <div className="flex-1 flex items-center justify-center cursor-pointer" onClick={() => handleSelect(t.yes)}>
            <span className={`font-bold text-lg uppercase tracking-widest transition-colors ${answered === t.yes ? "text-transparent" : "text-white/40 hover:text-white/80"}`}>
              {t.yes}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center cursor-pointer" onClick={() => handleSelect(t.no)}>
            <span className={`font-bold text-lg uppercase tracking-widest transition-colors ${answered === t.no ? "text-transparent" : "text-white/40 hover:text-white/80"}`}>
              {t.no}
            </span>
          </div>
        </div>
        <motion.div
          className="absolute h-16 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.15),inset_0_-2px_5px_rgba(0,0,0,0.1)] flex items-center justify-center font-bold text-black uppercase tracking-wider z-10 pointer-events-none transition-opacity duration-300"
          style={{ width: knobWidth, x, opacity: answered ? 1 : 0 }}
          initial={false}
          animate={{ x: x.get() }}
        >
          {answered === t.yes ? t.yes : answered === t.no ? t.no : ""}
        </motion.div>
      </motion.div>
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
    <div className="flex flex-col gap-6 w-full items-center justify-center my-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DraggableToggle
        t={t}
        onSelect={onSelect}
        disabled={isLoading || isSubmittingLocal}
        initialAnswer={initialAnswer}
      />
      <div className="w-full max-w-lg mt-4 opacity-70 hover:opacity-100 transition-opacity">
        <p className="text-sm text-center text-neutral-500 mb-2">{t.moreDetails}</p>
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

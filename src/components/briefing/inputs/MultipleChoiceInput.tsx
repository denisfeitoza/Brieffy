"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, RefreshCw, Plus } from "lucide-react";
import { ScrollConfirmWrapper } from "@/components/briefing/ScrollConfirmWrapper";
import { TextAudioInput } from "./TextAudioInput";
import type { TextAudioInputHandle } from "./TextAudioInput";
import { CustomTextPills } from "./shared/CustomTextPills";
import { parseOption, isOtherOption } from "./constants";
import type { Message } from "@/lib/types";

interface MultipleChoiceInputProps {
  activeMessage: Message;
  inputText: string;
  setInputText: (text: string) => void;
  selectedMultiples: string[];
  setSelectedMultiples: (items: string[]) => void;
  handleLocalSend: () => void;
  handleAddCustomText: () => void;
  isLoading: boolean;
  isSubmittingLocal: boolean;
  voiceLanguage: string;
  t: Record<string, string>;
  isFontSelection: boolean;
}

export function MultipleChoiceInput({
  activeMessage,
  inputText,
  setInputText,
  selectedMultiples,
  setSelectedMultiples,
  handleLocalSend,
  handleAddCustomText,
  isLoading,
  isSubmittingLocal,
  voiceLanguage,
  t,
  isFontSelection,
}: MultipleChoiceInputProps) {
  const options = activeMessage.options || [];
  const [highlightInput, setHighlightInput] = useState(false);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<TextAudioInputHandle>(null);

  const optionTitles = options.map((opt) => parseOption(opt, 0).text);
  const customTexts = selectedMultiples.filter((item) => !optionTitles.includes(item));

  const specifyLabel = voiceLanguage === "pt"
    ? "Especifique abaixo o que deseja:"
    : voiceLanguage === "es"
    ? "Especifique a continuación lo que desea:"
    : "Specify below what you want:";

  const handleCheckChange = (optText: string, checked: boolean | string) => {
    if (checked) {
      setSelectedMultiples([...selectedMultiples, optText]);
      // If it's an "Other" option, redirect to text input
      if (isOtherOption(optText)) {
        setHighlightInput(true);
        setTimeout(() => setHighlightInput(false), 2000);
        setTimeout(() => scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } else {
      setSelectedMultiples(selectedMultiples.filter((item) => item !== optText));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, idx) => {
          const { text: optText, key: optKey } = parseOption(opt, idx);
          const isSelected = selectedMultiples.includes(optText);
          return (
            <label
              key={optKey}
              className={`flex items-center gap-3 p-4 min-h-[48px] rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
              }`}
            >
              <Checkbox
                checked={isSelected}
                className="w-5 h-5 shrink-0"
                onCheckedChange={(checked) => handleCheckChange(optText, checked)}
              />
              <span
                className="text-white font-medium"
                style={
                  isFontSelection
                    ? {
                        fontFamily: `"${optText
                          .split("-")[0]
                          .replace(/[^a-zA-Z0-9 ]/g, "")
                          .trim()}", sans-serif`,
                        fontSize: "1.25rem",
                      }
                    : undefined
                }
              >
                {optText}
              </span>
            </label>
          );
        })}
      </div>

      <div ref={scrollTargetRef} className={`w-full transition-all mt-4 ${highlightInput ? 'opacity-100 ring-2 ring-indigo-500/50 rounded-2xl p-2' : 'opacity-80 hover:opacity-100'}`}>
        {highlightInput && (
          <p className="text-sm font-medium text-indigo-400 text-center animate-in fade-in duration-300 mb-2">
            ↓ {specifyLabel}
          </p>
        )}
        <p className="text-sm text-center text-neutral-500 mb-2">
          {voiceLanguage === "pt"
            ? "Adicione detalhes via texto ou áudio (opcional):"
            : voiceLanguage === "es"
            ? "Agregue detalles vía texto o audio (opcional):"
            : "Add details via text or audio (optional):"}
        </p>
        <CustomTextPills
          customTexts={customTexts}
          onRemove={(text) =>
            setSelectedMultiples(selectedMultiples.filter((t) => t !== text))
          }
        />
        <TextAudioInput
          ref={textInputRef}
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={handleLocalSend}
          onAction={handleAddCustomText}
          actionIcon={<Plus className="w-5 h-5" />}
          isAddAction
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          selectedMultiplesCount={selectedMultiples.length}
          voiceLanguage={voiceLanguage}
        />
      </div>

      <ScrollConfirmWrapper
        containerClassName="flex justify-end mt-6 border-t border-neutral-800 pt-6"
        isDisabled={
          (selectedMultiples.length === 0 && !inputText.trim()) ||
          isLoading ||
          isSubmittingLocal
        }
        ActionComponent={
          <Button
            size="lg"
            className={`w-full sm:w-auto h-14 px-8 rounded-full font-medium transition-all duration-300 border ${
              selectedMultiples.length > 0 || inputText.trim()
                ? "bg-indigo-500 text-white border-indigo-400 hover:bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105"
                : "bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10"
            }`}
            onClick={handleLocalSend}
            disabled={
              (selectedMultiples.length === 0 && !inputText.trim()) ||
              isLoading ||
              isSubmittingLocal
            }
          >
            {isLoading || isSubmittingLocal ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin text-white/70" />
            ) : null}
            {t.confirmSelection} <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        }
      />
    </div>
  );
}


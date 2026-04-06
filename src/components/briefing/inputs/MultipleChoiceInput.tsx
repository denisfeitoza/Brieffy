"use client";

import { useState, useRef, useEffect } from "react";
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
  const [showTextInput, setShowTextInput] = useState(false);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<TextAudioInputHandle>(null);

  const optionTitles = options.map((opt) => parseOption(opt, 0).text);
  const customTexts = selectedMultiples.filter((item) => !optionTitles.includes(item));

  const hasOtherSelected = selectedMultiples.some(isOtherOption);
  const isTextInputVisible = showTextInput || hasOtherSelected || customTexts.length > 0 || inputText.trim().length > 0;

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
        setShowTextInput(true);
        setHighlightInput(true);
        setTimeout(() => setHighlightInput(false), 2000);
        setTimeout(() => scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } else {
      setSelectedMultiples(selectedMultiples.filter((item) => item !== optText));
      if (isOtherOption(optText)) {
        setShowTextInput(false);
      }
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
                  ? "border-[var(--orange)] bg-[var(--orange)]/5 ring-1 ring-[var(--orange)]/30"
                  : "border-gray-200 bg-white hover:border-[var(--orange)]/30 shadow-sm"
              }`}
            >
              <Checkbox
                checked={isSelected}
                className="w-5 h-5 shrink-0 data-[state=checked]:bg-[var(--orange)] data-[state=checked]:border-[var(--orange)]"
                onCheckedChange={(checked) => handleCheckChange(optText, checked)}
              />
              <span
                className="text-black font-medium"
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

      <div ref={scrollTargetRef} className={`w-full transition-all mt-4 ${highlightInput ? 'opacity-100 ring-2 ring-[var(--orange)]/30 rounded-2xl p-2 bg-[var(--orange)]/5' : 'opacity-80 hover:opacity-100'}`}>
        <CustomTextPills
          customTexts={customTexts}
          onRemove={(text) =>
            setSelectedMultiples(selectedMultiples.filter((t) => t !== text))
          }
        />
        {isTextInputVisible ? (
          <div className="w-full flex flex-col items-center mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {highlightInput && (
              <p className="text-sm font-medium text-[var(--orange)] text-center animate-pulse mb-2">
                ↓ {specifyLabel}
              </p>
            )}
            <p className="text-sm text-center text-gray-500 mb-2">
              {voiceLanguage === "pt"
                ? "Adicione detalhes via texto ou áudio (opcional):"
                : voiceLanguage === "es"
                ? "Agregue detalles vía texto o audio (opcional):"
                : "Add details via text or audio (optional):"}
            </p>
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
        ) : (
          <div className="flex justify-center mt-2 animate-in fade-in">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTextInput(true)}
              className="text-xs text-gray-400 hover:text-gray-600 rounded-full"
            >
              + {t.moreDetails || "Adicionar detalhes"}
            </Button>
          </div>
        )}
      </div>

      <ScrollConfirmWrapper
        containerClassName="flex justify-end mt-6 border-t border-gray-200 pt-6"
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
                ? "bg-black text-white hover:bg-neutral-800 shadow-lg hover:scale-105"
                : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
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


"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw, Plus } from "lucide-react";
import { ScrollConfirmWrapper } from "@/components/briefing/ScrollConfirmWrapper";
import { TextAudioInput } from "./TextAudioInput";
import { CustomTextPills } from "./shared/CustomTextPills";
import { parseOption, isOtherOption } from "./constants";
import type { Message } from "@/lib/types";

interface CardSelectorInputProps {
  activeMessage: Message;
  inputText: string;
  setInputText: (t: string) => void;
  selectedMultiples: string[];
  setSelectedMultiples: (items: string[]) => void;
  handleLocalSend: () => void;
  handleAddCustomText: () => void;
  isLoading: boolean;
  isSubmittingLocal: boolean;
  generateMoreOptions: () => void;
  isGeneratingMore: boolean;
  voiceLanguage: string;
  isFontSelection: boolean;
  t: Record<string, string>;
}

export function CardSelectorInput({
  activeMessage,
  inputText,
  setInputText,
  selectedMultiples,
  setSelectedMultiples,
  handleLocalSend,
  handleAddCustomText,
  isLoading,
  isSubmittingLocal,
  generateMoreOptions,
  isGeneratingMore,
  voiceLanguage,
  isFontSelection,
  t,
}: CardSelectorInputProps) {
  const options = activeMessage.options || [];
  const optionTitles = options.map((opt) => parseOption(opt, 0).text);
  const customTexts = selectedMultiples.filter((item) => !optionTitles.includes(item));
  const [highlightInput, setHighlightInput] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customTexts.length > 0 || inputText.trim().length > 0) setShowTextInput(true);
  }, [customTexts.length, inputText]);

  const specifyLabel = voiceLanguage === "pt"
    ? "Especifique abaixo o que deseja:"
    : voiceLanguage === "es"
    ? "Especifique a continuación lo que desea:"
    : "Specify below what you want:";


  const handleCardClick = (title: string) => {
    const isSelected = selectedMultiples.includes(title);
    if (isSelected) {
      setSelectedMultiples(selectedMultiples.filter((t) => t !== title));
    } else {
      setSelectedMultiples([...selectedMultiples, title]);
      // If it's an "Other" option, redirect to text input
      if (isOtherOption(title)) {
        setShowTextInput(true);
        setHighlightInput(true);
        setTimeout(() => setHighlightInput(false), 2000);
        setTimeout(() => scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {options.map((opt, idx) => {
          const optObj = typeof opt === "object" && opt !== null ? (opt as Record<string, unknown>) : null;
          const title = optObj
            ? String(optObj.title || optObj.name || optObj.label || JSON.stringify(opt))
            : String(opt);
          const desc = optObj ? String(optObj.description || "") : "";
          const isSelected = selectedMultiples.includes(title);

          return (
            <button
              key={idx}
              onClick={() => handleCardClick(title)}
              disabled={isLoading || isSubmittingLocal}
              className={`group flex flex-col items-start text-left p-4 md:p-8 rounded-3xl bg-white border transition-all min-h-[120px] md:min-h-auto active:scale-[0.98] ${
                isSelected
                  ? "border-[var(--orange)] bg-[var(--orange)]/5 shadow-[0_5px_30px_rgba(255,96,41,0.15)]"
                  : "border-gray-200 hover:border-[var(--orange)]/50 hover:bg-[var(--orange)]/5 hover:-translate-y-1 hover:shadow-lg"
              }`}
            >
              <div
                className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-colors border ${
                  isSelected
                    ? "bg-[var(--orange)]/10 border-[var(--orange)]/50"
                    : "bg-gray-50 border-gray-200 group-hover:bg-[var(--orange)]/10"
                }`}
              >
                <div
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all ${
                    isSelected
                      ? "bg-[var(--orange)] shadow-sm"
                      : "bg-gray-300 group-hover:bg-[var(--orange)]"
                  }`}
                />
              </div>
              <h3
                className={`text-lg md:text-xl font-bold mb-2 md:mb-3 transition-colors ${
                  isSelected ? "text-[var(--orange)]" : "text-black group-hover:text-[var(--orange)]"
                }`}
                style={
                  isFontSelection
                    ? {
                        fontFamily: `"${title
                          .split("-")[0]
                          .replace(/[^a-zA-Z0-9 ]/g, "")
                          .trim()}", sans-serif`,
                        fontSize: "1.5rem",
                        fontWeight: 400,
                      }
                    : undefined
                }
              >
                {title}
              </h3>
              {desc && <p className="text-sm text-gray-500 font-inter leading-relaxed">{desc}</p>}
            </button>
          );
        })}
      </div>

      {activeMessage.allowMoreOptions && (
        <div className="flex justify-center w-full mt-2">
          <Button
            onClick={generateMoreOptions}
            disabled={isGeneratingMore}
            variant="outline"
            className="rounded-full gap-2 border-gray-200 bg-white shadow-sm text-[var(--orange)] hover:bg-gray-50 hover:text-[#e05221] h-14 px-8 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingMore ? "animate-spin" : ""}`} />
            <span>{t.suggestRoutes}</span>
          </Button>
        </div>
      )}

      <div ref={scrollTargetRef} className={`w-full transition-all mt-4 ${highlightInput ? 'opacity-100 ring-2 ring-[var(--orange)]/30 bg-[var(--orange)]/5 rounded-2xl p-2' : 'opacity-80 hover:opacity-100'}`}>
        <CustomTextPills
          customTexts={customTexts}
          onRemove={(text) => setSelectedMultiples(selectedMultiples.filter((t) => t !== text))}
        />
        {showTextInput ? (
          <div className="w-full flex flex-col items-center mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {highlightInput && (
              <p className="text-sm font-medium text-[var(--orange)] text-center animate-pulse mb-2">
                ↓ {specifyLabel}
              </p>
            )}
            <p className="text-sm text-center text-gray-500 mb-2">{t.addDetails}</p>
            <TextAudioInput
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
        containerClassName="flex flex-col sm:flex-row gap-4 w-full mt-6 items-center justify-end border-t border-gray-200 pt-6"
        isDisabled={
          (selectedMultiples.length === 0 && !inputText.trim()) || isLoading || isSubmittingLocal
        }
        ActionComponent={
          <Button
            size="lg"
            className={`w-full sm:w-auto h-14 px-8 rounded-full font-medium transition-all duration-300 border ${
              selectedMultiples.length > 0 || inputText.trim()
                ? "bg-black text-white hover:bg-neutral-800 shadow-xl hover:scale-105"
                : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
            }`}
            onClick={handleLocalSend}
            disabled={
              (selectedMultiples.length === 0 && !inputText.trim()) || isLoading || isSubmittingLocal
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


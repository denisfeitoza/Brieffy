"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw, Plus } from "lucide-react";
import { ScrollConfirmWrapper } from "@/components/briefing/ScrollConfirmWrapper";
import { TextAudioInput } from "./TextAudioInput";
import { CustomTextPills } from "./shared/CustomTextPills";
import { parseOption } from "./constants";
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
              onClick={() => {
                if (isSelected) {
                  setSelectedMultiples(selectedMultiples.filter((t) => t !== title));
                } else {
                  setSelectedMultiples([...selectedMultiples, title]);
                }
              }}
              disabled={isLoading || isSubmittingLocal}
              className={`group flex flex-col items-start text-left p-4 md:p-8 rounded-3xl bg-neutral-900/40 border transition-all min-h-[120px] md:min-h-auto active:scale-[0.98] ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500/10 shadow-[0_5px_30px_rgba(99,102,241,0.15)]"
                  : "border-neutral-800 hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(var(--color-primary),0.1)]"
              }`}
            >
              <div
                className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-colors border ${
                  isSelected
                    ? "bg-primary/20 border-primary/50"
                    : "bg-neutral-800 border-white/5 group-hover:bg-primary/20"
                }`}
              >
                <div
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all ${
                    isSelected
                      ? "bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.8)]"
                      : "bg-neutral-500 group-hover:bg-primary group-hover:shadow-[0_0_15px_rgba(var(--color-primary),0.8)]"
                  }`}
                />
              </div>
              <h3
                className={`text-lg md:text-xl font-bold mb-2 md:mb-3 transition-colors ${
                  isSelected ? "text-primary" : "text-white group-hover:text-primary"
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
              {desc && <p className="text-sm text-neutral-400 font-inter leading-relaxed">{desc}</p>}
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
            className="rounded-full gap-2 border-neutral-800 bg-transparent text-neutral-300 hover:bg-neutral-900 h-14 px-8 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingMore ? "animate-spin" : ""}`} />
            <span>{t.suggestRoutes}</span>
          </Button>
        </div>
      )}

      <div className="w-full opacity-80 hover:opacity-100 transition-opacity mt-4">
        <p className="text-sm text-center text-neutral-500 mb-2">{t.addDetails}</p>
        <CustomTextPills
          customTexts={customTexts}
          onRemove={(text) => setSelectedMultiples(selectedMultiples.filter((t) => t !== text))}
        />
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

      <ScrollConfirmWrapper
        containerClassName="flex flex-col sm:flex-row gap-4 w-full mt-6 items-center justify-end border-t border-neutral-800 pt-6"
        isDisabled={
          (selectedMultiples.length === 0 && !inputText.trim()) || isLoading || isSubmittingLocal
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

"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ScrollConfirmWrapper } from "@/components/briefing/ScrollConfirmWrapper";
import { TextAudioInput } from "./TextAudioInput";
import type { TextAudioInputHandle } from "./TextAudioInput";
import { BottomSheetOptions } from "./BottomSheetOptions";
import { parseOption, isOtherOption } from "./constants";
import type { Message } from "@/lib/types";

const BOTTOM_SHEET_THRESHOLD = 5;

interface SingleChoiceInputProps {
  activeMessage: Message;
  inputText: string;
  setInputText: (text: string) => void;
  doSubmit: (val: string | string[] | number) => void;
  handleLocalSend: () => void;
  isLoading: boolean;
  isSubmittingLocal: boolean;
  generateMoreOptions: () => void;
  isGeneratingMore: boolean;
  voiceLanguage: string;
  t: Record<string, string>;
}

export function SingleChoiceInput({
  activeMessage,
  inputText,
  setInputText,
  doSubmit,
  handleLocalSend,
  isLoading,
  isSubmittingLocal,
  generateMoreOptions,
  isGeneratingMore,
  voiceLanguage,
  t,
}: SingleChoiceInputProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [highlightInput, setHighlightInput] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const textInputRef = useRef<TextAudioInputHandle>(null);

  const hasOtherAnswered = activeMessage.userAnswer && typeof activeMessage.userAnswer === "string" && isOtherOption(activeMessage.userAnswer);
  const isTextInputVisible = showTextInput || hasOtherAnswered || inputText.trim().length > 0;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const options = activeMessage.options || [];
  const msgText = activeMessage.content?.toLowerCase() || "";
  const isFontSelection =
    msgText.includes("tipografi") || (msgText.includes("fonte") && !msgText.includes("inspiraç"));

  // Load Google Fonts for font preview
  useEffect(() => {
    if (!isFontSelection) return;
    const fontNames = options
      .map((opt) => {
        const { text } = parseOption(opt, 0);
        return text.split(" - ")[0].trim().replace(/[^a-zA-Z0-9 ]/g, "");
      })
      .filter((n) => n && !n.toLowerCase().includes("nenhuma") && !n.toLowerCase().includes("none"));

    if (fontNames.length > 0) {
      const families = fontNames.map((n) => n.replace(/ /g, "+")).join("&family=");
      const linkId = "google-fonts-preview";
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [isFontSelection, options]);

  const questionText = activeMessage.content || "";
  const companyMatch = questionText.match(
    /(?:represent[ae]|para|da|d[eo])\s+(?:a\s+|o\s+)?([A-ZÀ-Ú][a-zA-ZÀ-ú0-9]+(?:\s+[A-ZÀ-Ú][a-zA-ZÀ-ú0-9]+)*)/i
  );
  const companyPreview = companyMatch?.[1] || "Sua Marca";

  const useBottomSheet = isMobile && options.length > BOTTOM_SHEET_THRESHOLD && !isFontSelection;

  // Handler that intercepts "Other" options and redirects to text input
  const handleOptionClick = (optText: string) => {
    if (isOtherOption(optText)) {
      // Redirect to text/voice input instead of submitting
      setShowTextInput(true);
      setHighlightInput(true);
      setTimeout(() => setHighlightInput(false), 2000);
      setTimeout(() => textInputRef.current?.scrollIntoView(), 100);
      return;
    }
    doSubmit(optText);
  };

  // Handler for BottomSheet "Other" option — close sheet then redirect
  const handleBottomSheetSelect = (optText: string) => {
    if (isOtherOption(optText)) {
      setShowTextInput(true);
      setHighlightInput(true);
      setTimeout(() => setHighlightInput(false), 2000);
      // Small delay to allow bottom sheet close animation
      setTimeout(() => textInputRef.current?.scrollIntoView(), 350);
      return;
    }
    doSubmit(optText);
  };

  const specifyLabel = t.specifyLabel || "Especifique abaixo o que deseja:";

  if (isFontSelection) {
    return (
      <div className="flex flex-col gap-6 w-full mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <p className="text-sm font-medium text-[var(--text2)] -mb-2 tracking-wide">
          {t.selectOnlyOne}{" "}
          <strong className="text-[var(--orange)] font-semibold text-[15px]">{t.onlyOneLabel}</strong>{" "}
          {t.optionLabel}
        </p>
        <div className="flex flex-col gap-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full cursor-pointer">
            {options.map((opt, idx) => {
              const { text: optText, key: optKey } = parseOption(opt, idx);
              const parts = optText.split(" - ");
              const fontName = parts[0].trim();
              const fontDesc = parts.slice(1).join(" - ").trim() || "";
              const fontNameClean = fontName.replace(/[^a-zA-Z0-9 ]/g, "");
              const isNoneOption =
                fontName.toLowerCase().includes("nenhuma") ||
                fontName.toLowerCase().includes("none") ||
                fontName.toLowerCase().includes("default");

              return (
                <button
                  key={optKey}
                  onClick={() => handleOptionClick(optText)}
                  disabled={isLoading || isSubmittingLocal}
                  className={`flex flex-col items-center justify-center gap-3 p-4 sm:p-6 rounded-2xl border transition-all text-center min-h-[140px] md:min-h-[200px] group cursor-pointer ${
                    isNoneOption
                      ? "border-dashed border-[var(--bd)] bg-[var(--bg2)] hover:bg-[var(--bg3)] hover:border-[var(--bd-strong)]"
                      : "border-[var(--bd)] bg-[var(--bg)] hover:bg-[var(--orange)]/5 hover:border-[var(--orange)]/30 shadow-sm hover:-translate-y-1"
                  }`}
                  style={isNoneOption ? undefined : { fontFamily: `"${fontNameClean}", sans-serif` }}
                >
                  {isNoneOption ? (
                    <>
                      <span className="text-[28px] font-medium text-[var(--text3)] group-hover:text-[var(--text2)] transition-colors leading-tight">
                        Aa
                      </span>
                      <span className="text-sm text-[var(--text3)] group-hover:text-[var(--text2)] font-inter">
                        {fontDesc || t.systemDefault || "Padrão do Sistema"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[28px] md:text-[32px] font-semibold text-[var(--text)] group-hover:text-[var(--orange)] transition-colors leading-tight">
                        {companyPreview}
                      </span>
                      <span className="text-xs uppercase tracking-[0.15em] text-[var(--text3)] group-hover:text-[var(--text2)] font-inter font-semibold mt-1">
                        {fontName}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          {activeMessage.allowMoreOptions && (
            <div className="flex justify-start">
              <Button
                variant="ghost"
                size="lg"
                onClick={generateMoreOptions}
                disabled={isGeneratingMore || isLoading || isSubmittingLocal}
                className="rounded-full text-[var(--orange)] hover:text-[var(--orange)] hover:bg-[var(--orange)]/10 h-12 md:h-14 font-medium"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingMore ? "animate-spin" : ""}`} />
                {t.otherOptions}
              </Button>
            </div>
          )}
        </div>
        {isTextInputVisible ? (
          <div className="w-full flex flex-col items-center mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {highlightInput && (
              <p className="text-sm font-medium text-[var(--orange)] text-center animate-pulse mb-2">
                ↓ {specifyLabel}
              </p>
            )}
            <TextAudioInput
              ref={textInputRef}
              inputText={inputText}
              setInputText={setInputText}
              onSubmit={handleLocalSend}
              isLoading={isLoading}
              isSubmittingLocal={isSubmittingLocal}
              voiceLanguage={voiceLanguage}
            />
          </div>
        ) : (
          <div className="flex justify-center mt-2 animate-in fade-in">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTextInput(true)}
              className="text-xs text-[var(--text3)] hover:text-[var(--text2)] rounded-full"
            >
              + {t.addDetailsShort || "Adicionar detalhes"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (useBottomSheet) {
    return (
      <div className="flex flex-col gap-4 w-full mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <p className="text-sm font-medium text-[var(--text2)] tracking-wide">
          {t.selectOnlyOne}{" "}
          <strong className="text-[var(--orange)] font-semibold">{t.onlyOneLabel}</strong>{" "}
          {t.optionLabel}
        </p>
        <BottomSheetOptions
          options={options.map((opt, idx) => parseOption(opt, idx).text)}
          onSelect={handleBottomSheetSelect}
          isDisabled={isLoading || isSubmittingLocal}
          label={t.viewOptions}
          title={t.selectAnOption}
        />
        {isTextInputVisible ? (
          <div className="w-full flex flex-col items-center mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {highlightInput && (
              <p className="text-sm font-medium text-[var(--orange)] text-center animate-pulse mb-2">
                ↓ {specifyLabel}
              </p>
            )}
            <TextAudioInput
              ref={textInputRef}
              inputText={inputText}
              setInputText={setInputText}
              onSubmit={handleLocalSend}
              isLoading={isLoading}
              isSubmittingLocal={isSubmittingLocal}
              voiceLanguage={voiceLanguage}
            />
          </div>
        ) : (
          <div className="flex justify-center mt-2 animate-in fade-in">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTextInput(true)}
              className="text-xs text-[var(--text3)] hover:text-[var(--text2)] rounded-full"
            >
              + {t.addDetailsShort || "Adicionar detalhes"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-sm font-medium text-[var(--text2)] -mb-2 tracking-wide">
        {t.selectOnlyOne}{" "}
        <strong className="text-[var(--orange)] font-semibold text-[15px]">{t.onlyOneLabel}</strong>{" "}
        {t.optionLabel}
      </p>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-stretch sm:items-center w-full">
        {options.map((opt, idx) => {
          const { text: optText, key: optKey } = parseOption(opt, idx);
          return (
            <Button
              key={optKey}
              variant="outline"
              size="lg"
              onClick={() => handleOptionClick(optText)}
              disabled={isLoading || isSubmittingLocal}
              className="rounded-2xl sm:rounded-full bg-[var(--bg)] border-[var(--bd)] hover:border-[var(--orange)]/40 hover:bg-[var(--orange)]/5 text-[var(--text)] shadow-sm min-h-[64px] sm:min-h-[72px] h-auto py-4 px-6 md:px-8 text-[16px] md:text-[17px] font-medium tracking-wide transition-all active:scale-[0.97] justify-start sm:justify-center text-left sm:text-center whitespace-normal break-words"
            >
              {optText}
            </Button>
          );
        })}
        {activeMessage.allowMoreOptions && (
          <Button
            variant="ghost"
            size="lg"
            onClick={generateMoreOptions}
            disabled={isGeneratingMore || isLoading || isSubmittingLocal}
            className="rounded-full justify-center text-[var(--orange)] hover:text-[var(--orange)] hover:bg-[var(--orange)]/10 min-h-[64px] sm:min-h-[72px] h-auto py-4 px-6 md:px-8 text-[16px] md:text-[17px] font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingMore ? "animate-spin" : ""}`} />
            {t.otherOptions}
          </Button>
        )}
      </div>
      {isTextInputVisible ? (
        <div className="w-full flex flex-col items-center mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {highlightInput && (
            <p className="text-sm font-medium text-[var(--orange)] text-center animate-pulse mb-2">
              ↓ {specifyLabel}
            </p>
          )}
          <TextAudioInput
            ref={textInputRef}
            inputText={inputText}
            setInputText={setInputText}
            onSubmit={handleLocalSend}
            isLoading={isLoading}
            isSubmittingLocal={isSubmittingLocal}
            voiceLanguage={voiceLanguage}
          />
        </div>
      ) : (
        <div className="flex justify-center mt-2 animate-in fade-in">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTextInput(true)}
            className="text-xs text-[var(--text3)] hover:text-[var(--text2)] rounded-full"
          >
            + {t.addDetailsShort || "Adicionar detalhes"}
          </Button>
        </div>
      )}
    </div>
  );
}


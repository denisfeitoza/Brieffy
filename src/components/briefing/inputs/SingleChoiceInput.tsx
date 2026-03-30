"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ScrollConfirmWrapper } from "@/components/briefing/ScrollConfirmWrapper";
import { TextAudioInput } from "./TextAudioInput";
import { BottomSheetOptions } from "./BottomSheetOptions";
import { parseOption } from "./constants";
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

  if (isFontSelection) {
    return (
      <div className="flex flex-col gap-6 w-full mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <p className="text-sm font-medium text-neutral-400 -mb-2 tracking-wide">
          {t.selectOnlyOne}{" "}
          <strong className="text-indigo-400 font-semibold text-[15px]">{t.onlyOneLabel}</strong>{" "}
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
                  onClick={() => doSubmit(optText)}
                  disabled={isLoading || isSubmittingLocal}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all text-center min-h-[160px] md:min-h-[200px] group cursor-pointer ${
                    isNoneOption
                      ? "border-dashed border-neutral-700 bg-neutral-900/20 hover:bg-neutral-800/40 hover:border-neutral-500"
                      : "border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800 hover:border-neutral-600 hover:-translate-y-1"
                  }`}
                  style={isNoneOption ? undefined : { fontFamily: `"${fontNameClean}", sans-serif` }}
                >
                  {isNoneOption ? (
                    <>
                      <span className="text-[28px] font-medium text-neutral-500 group-hover:text-neutral-300 transition-colors leading-tight">
                        Aa
                      </span>
                      <span className="text-sm text-neutral-500 group-hover:text-neutral-400 font-inter">
                        {fontDesc || "Padrão do Sistema"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[28px] md:text-[32px] font-semibold text-neutral-100 group-hover:text-white transition-colors leading-tight">
                        {companyPreview}
                      </span>
                      <span className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-inter font-semibold mt-1">
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
                className="rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-12 md:h-14 font-medium"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingMore ? "animate-spin" : ""}`} />
                {t.otherOptions}
              </Button>
            </div>
          )}
        </div>
        <TextAudioInput
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={handleLocalSend}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          voiceLanguage={voiceLanguage}
        />
      </div>
    );
  }

  if (useBottomSheet) {
    return (
      <div className="flex flex-col gap-4 w-full mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <p className="text-sm font-medium text-neutral-400 tracking-wide">
          {t.selectOnlyOne}{" "}
          <strong className="text-indigo-400 font-semibold">{t.onlyOneLabel}</strong>{" "}
          {t.optionLabel}
        </p>
        <BottomSheetOptions
          options={options.map((opt, idx) => parseOption(opt, idx).text)}
          onSelect={(val) => doSubmit(val)}
          isDisabled={isLoading || isSubmittingLocal}
          label={t.viewOptions}
        />
        <TextAudioInput
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={handleLocalSend}
          isLoading={isLoading}
          isSubmittingLocal={isSubmittingLocal}
          voiceLanguage={voiceLanguage}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-sm font-medium text-neutral-400 -mb-2 tracking-wide">
        {t.selectOnlyOne}{" "}
        <strong className="text-indigo-400 font-semibold text-[15px]">{t.onlyOneLabel}</strong>{" "}
        {t.optionLabel}
      </p>
      <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full">
        {options.map((opt, idx) => {
          const { text: optText, key: optKey } = parseOption(opt, idx);
          return (
            <Button
              key={optKey}
              variant="outline"
              size="lg"
              onClick={() => doSubmit(optText)}
              disabled={isLoading || isSubmittingLocal}
              className="rounded-full bg-transparent border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 text-neutral-300 min-h-[48px] h-12 md:h-14 md:px-6 font-medium tracking-wide transition-all active:scale-[0.97]"
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
            className="rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-12 md:h-14 font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingMore ? "animate-spin" : ""}`} />
            {t.otherOptions}
          </Button>
        )}
      </div>
      <TextAudioInput
        inputText={inputText}
        setInputText={setInputText}
        onSubmit={handleLocalSend}
        isLoading={isLoading}
        isSubmittingLocal={isSubmittingLocal}
        voiceLanguage={voiceLanguage}
      />
    </div>
  );
}

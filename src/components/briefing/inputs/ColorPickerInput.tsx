"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, RefreshCw, CheckCircle2, Pipette } from "lucide-react";

interface ColorPickerInputProps {
  colorWizardStep: 1 | 2 | 3;
  suggestedMainColors: string[];
  selectedMainColors: string[];
  mainColors: string[];
  suggestedColors: string[];
  selectedSuggestions: string[];
  isFetchingColors: boolean;
  colorHint: string;
  showHintInput: boolean;
  isLoading: boolean;
  isSubmittingLocal: boolean;
  isOnboarding: boolean;
  userAnswer: unknown;
  setColorWizardStep: (step: 1 | 2 | 3) => void;
  setSuggestedMainColors: (c: string[]) => void;
  setSelectedMainColors: (c: string[]) => void;
  setSuggestedColors: (c: string[]) => void;
  setSelectedSuggestions: (c: string[]) => void;
  setColorHint: (h: string) => void;
  setShowHintInput: (v: boolean) => void;
  fetchInitialColors: () => void;
  fetchDetailColors: () => void;
  doSubmit: (val: string | string[] | number) => void;
  t: Record<string, string>;
}

export function ColorPickerInput({
  colorWizardStep,
  suggestedMainColors,
  selectedMainColors,
  mainColors,
  suggestedColors,
  selectedSuggestions,
  isFetchingColors,
  colorHint,
  showHintInput,
  isLoading,
  isSubmittingLocal,
  isOnboarding,
  userAnswer,
  setColorWizardStep,
  setSuggestedMainColors,
  setSelectedMainColors,
  setSuggestedColors,
  setSelectedSuggestions,
  setColorHint,
  setShowHintInput,
  fetchInitialColors,
  fetchDetailColors,
  doSubmit,
  t,
}: ColorPickerInputProps) {
  // Auto-fetch initial colors
  useEffect(() => {
    if (colorWizardStep === 1 && suggestedMainColors.length === 0 && !isFetchingColors) {
      fetchInitialColors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorWizardStep, suggestedMainColors.length]);

  // Show palette summary if already answered
  if (
    userAnswer &&
    Array.isArray(userAnswer) &&
    (userAnswer as string[]).length >= 2
  ) {
    const ansArray = userAnswer as string[];
    const mainCount = mainColors.length || Math.min(2, Math.ceil(ansArray.length / 2));
    return (
      <div className="flex flex-col gap-6 w-full mt-4 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white border border-gray-200 shadow-xl">
          <span className="text-sm font-semibold tracking-widest text-[var(--orange)] uppercase mb-2 text-center">
            Paleta Final
          </span>
          <p className="text-xs text-gray-500 mb-6 text-center">Sua paleta de marca selecionada</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {ansArray.map((hex: string, idx: number) => (
              <div key={idx} className="group flex flex-col items-center gap-3 relative">
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] border-2 border-white/10 relative overflow-hidden shadow-lg"
                  style={{ backgroundColor: hex }}
                />
                <div className="flex flex-col items-center mt-1">
                  <span className="text-xs uppercase font-bold text-gray-400 tracking-wider whitespace-nowrap">
                    {idx < mainCount ? "Principal" : "Detalhe"}
                  </span>
                  <span className="text-xs font-mono text-gray-500 mt-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200">
                    {hex}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {!isLoading && !isSubmittingLocal && (
            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                className="h-11 px-5 rounded-full border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-black text-sm"
                onClick={() => setColorWizardStep(1)}
              >
                Editar Cores
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const ColorSwatch = ({
    hex,
    isSelected,
    onToggle,
    onColorChange,
  }: {
    hex: string;
    isSelected: boolean;
    onToggle: () => void;
    onColorChange: (newHex: string) => void;
  }) => (
    <div
      className={`cursor-pointer group flex flex-col items-center gap-3 p-4 rounded-2xl relative transition-all border-2 ${
        isSelected
          ? "border-[var(--orange)] bg-[var(--orange)]/10 shadow-md"
          : "border-gray-200 hover:border-[var(--orange)]/50 hover:bg-[var(--orange)]/5"
      }`}
      onClick={onToggle}
    >
      <div className="relative flex items-center justify-center">
        <div
          className="w-16 h-16 rounded-full transition-transform group-hover:scale-110 border border-white/10 relative overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: hex, boxShadow: isSelected ? `0 0 25px ${hex}60` : undefined }}
        >
          <input
            type="color"
            value={hex}
            onChange={(e) => {
              e.stopPropagation();
              onColorChange(e.target.value.toUpperCase());
            }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${
              isSelected ? "z-20" : "pointer-events-none z-[-1]"
            }`}
          />
          {isSelected && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
              <Pipette className="w-6 h-6 text-white drop-shadow-md" />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center z-10 pointer-events-none">
        <span className="text-xs font-mono text-gray-500">{hex}</span>
      </div>
    </div>
  );

  const HintInput = ({ onConfirm }: { onConfirm: () => void }) => (
    <div className="w-full max-w-sm mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block text-center">
        Descreva o estilo que você quer
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={colorHint}
          onChange={(e) => setColorHint(e.target.value)}
          placeholder="Ex: verde neon, tons pastéis..."
          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-[var(--orange)] focus:ring-[var(--orange)] shadow-sm"
          autoFocus
          enterKeyHint="done"
          onKeyDown={(e) => {
            if (e.key === "Enter" && colorHint.trim()) onConfirm();
          }}
        />
        <Button
          className="rounded-xl bg-[var(--orange)] hover:opacity-90 text-white px-4"
          onClick={onConfirm}
          disabled={isFetchingColors}
        >
          {isFetchingColors ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );

  // Step 1: Primary Colors
  if (colorWizardStep === 1) {
    return (
      <div className="flex flex-col gap-6 w-full mt-4 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl bg-white border border-gray-200 shadow-xl">
          <span className="text-sm font-semibold tracking-widest text-[var(--orange)] uppercase mb-2 text-center">
            {t.step1Title}
          </span>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
            A IA sugeriu cores com base nas suas respostas.{" "}
            {isOnboarding
              ? "Selecione 1 cor principal para sua marca."
              : "Selecione 1 ou 2 cores principais para sua marca."}
          </p>

          {isFetchingColors && suggestedMainColors.length === 0 ? (
            <div className="py-12 flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--orange)] mb-4" />
              <p className="text-gray-500 font-medium">Gerando paleta com base no seu perfil...</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4">
              {suggestedMainColors.map((hex, idx) => (
                <ColorSwatch
                  key={`main-${idx}-${hex}`}
                  hex={hex}
                  isSelected={selectedMainColors.includes(hex)}
                  onToggle={() => {
                    if (selectedMainColors.includes(hex)) {
                      setSelectedMainColors(selectedMainColors.filter((c) => c !== hex));
                    } else if (isOnboarding) {
                      setSelectedMainColors([hex]);
                    } else if (selectedMainColors.length < 2) {
                      setSelectedMainColors([...selectedMainColors, hex]);
                    }
                  }}
                  onColorChange={(newHex) => {
                    const newColors = [...suggestedMainColors];
                    newColors[idx] = newHex;
                    setSuggestedMainColors(newColors);
                    if (selectedMainColors.includes(hex)) {
                      setSelectedMainColors(selectedMainColors.map((c) => (c === hex ? newHex : c)));
                    }
                  }}
                />
              ))}
            </div>
          )}

          {showHintInput && <HintInput onConfirm={fetchInitialColors} />}

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Button
              variant="outline"
              className="h-11 px-5 rounded-full border-gray-200 bg-white shadow-sm text-gray-500 hover:bg-gray-50 hover:text-black text-sm"
              onClick={() => {
                if (showHintInput) { setColorHint(""); fetchInitialColors(); }
                else setShowHintInput(true);
              }}
              disabled={isFetchingColors}
            >
              {isFetchingColors ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {showHintInput ? "Gerar sem dica" : t.generateMore}
            </Button>
            <Button
              className="h-11 px-6 rounded-full bg-black hover:bg-neutral-800 text-white shadow-xl transition-all hover:scale-105 text-sm"
              onClick={() => {
                if (selectedMainColors.length >= 1) {
                  setShowHintInput(false);
                  setColorHint("");
                  fetchDetailColors();
                }
              }}
              disabled={selectedMainColors.length < 1 || isFetchingColors}
            >
              {isFetchingColors ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
              {t.next}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Detail Colors
  return (
    <div className="flex flex-col gap-6 w-full mt-4 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl bg-white border border-gray-200 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400 uppercase tracking-wider mr-2">Principais:</span>
          {mainColors.map((hex, i) => (
            <div key={i} className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: hex }} title={hex} />
          ))}
        </div>
        <span className="text-sm font-semibold tracking-widest text-[var(--orange)] uppercase mb-2 text-center">
          Cores de Detalhe
        </span>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
          {isOnboarding
            ? "Escolha 1 cor de detalhe que complementa sua cor principal."
            : "Escolha 1 ou 2 cores de detalhe que complementam suas cores principais."}
        </p>

        {isFetchingColors && suggestedColors.length === 0 ? (
          <div className="py-12 flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--orange)] mb-4" />
            <p className="text-gray-500 font-medium">Gerando cores que harmonizam com sua paleta...</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {suggestedColors.map((hex, idx) => (
              <ColorSwatch
                key={`detail-${idx}-${hex}`}
                hex={hex}
                isSelected={selectedSuggestions.includes(hex)}
                onToggle={() => {
                  if (selectedSuggestions.includes(hex)) {
                    setSelectedSuggestions(selectedSuggestions.filter((c) => c !== hex));
                  } else if (isOnboarding) {
                    setSelectedSuggestions([hex]);
                  } else if (selectedSuggestions.length < 2) {
                    setSelectedSuggestions([...selectedSuggestions, hex]);
                  }
                }}
                onColorChange={(newHex) => {
                  const newColors = [...suggestedColors];
                  newColors[idx] = newHex;
                  setSuggestedColors(newColors);
                  if (selectedSuggestions.includes(hex)) {
                    setSelectedSuggestions(selectedSuggestions.map((c) => (c === hex ? newHex : c)));
                  }
                }}
              />
            ))}
          </div>
        )}

        {showHintInput && <HintInput onConfirm={fetchDetailColors} />}

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Button
            variant="outline"
            className="h-11 px-5 rounded-full border-gray-200 bg-white shadow-sm text-gray-500 hover:bg-gray-50 hover:text-black text-sm"
            onClick={() => { setShowHintInput(false); setColorHint(""); setColorWizardStep(1); }}
          >
            {t.back}
          </Button>
          <Button
            variant="outline"
            className="h-11 px-5 rounded-full border-gray-200 bg-white shadow-sm text-gray-500 hover:bg-gray-50 hover:text-black text-sm"
            onClick={() => {
              if (showHintInput) { setColorHint(""); fetchDetailColors(); }
              else setShowHintInput(true);
            }}
            disabled={isFetchingColors}
          >
            {isFetchingColors ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {showHintInput ? "Gerar sem dica" : t.generateMore}
          </Button>
          <Button
            className="h-11 px-6 rounded-full bg-black hover:bg-neutral-800 text-white shadow-xl transition-all hover:scale-105 text-sm"
            onClick={() => doSubmit([...mainColors, ...selectedSuggestions])}
            disabled={selectedSuggestions.length < 1 || isLoading || isSubmittingLocal}
          >
            {isLoading || isSubmittingLocal ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            )}
            {t.finishPalette}
          </Button>
        </div>
      </div>
    </div>
  );
}

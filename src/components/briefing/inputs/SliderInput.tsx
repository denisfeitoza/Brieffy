"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, RefreshCw } from "lucide-react";
import { ScrollConfirmWrapper } from "@/components/briefing/ScrollConfirmWrapper";
import { TextAudioInput } from "./TextAudioInput";

interface SliderInputProps {
  min: number;
  max: number;
  value: number[];
  onChange: (val: number[]) => void;
  onConfirm: (val: number) => void;
  inputText: string;
  setInputText: (text: string) => void;
  handleLocalSend: () => void;
  isLoading: boolean;
  isSubmittingLocal: boolean;
  voiceLanguage: string;
  t: Record<string, string>;
}

export function SliderInput({
  min,
  max,
  value,
  onChange,
  onConfirm,
  inputText,
  setInputText,
  handleLocalSend,
  isLoading,
  isSubmittingLocal,
  voiceLanguage,
  t,
}: SliderInputProps) {
  const currentVal = Number(value[0]) || min;

  return (
    <div className="flex flex-col gap-6 w-full mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center justify-center p-6 md:p-12 rounded-3xl bg-white border border-gray-200 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--orange)]/5 opacity-50 pointer-events-none" />

        {/* Big value display */}
        <div className="text-center mb-8 md:mb-10 relative z-10 w-full">
          <span className="text-xs font-semibold tracking-[0.2em] text-[var(--orange)] uppercase mb-2 block">
            {t.yourResponse}
          </span>
          <div className="text-6xl md:text-8xl font-black text-black tabular-nums tracking-tighter transition-all duration-300">
            {currentVal >= max ? `+${currentVal}` : currentVal}
          </div>
        </div>

        {/* Slider — bigger touch area */}
        <div className="w-full px-4 md:px-8 relative z-10">
          <Slider
            value={[currentVal]}
            onValueChange={(val) => {
              const arr = Array.isArray(val) ? val : [val];
              onChange(arr.map(Number));
            }}
            max={max}
            min={min}
            step={1}
            className="w-full cursor-grab active:cursor-grabbing [&_[role=slider]]:h-6 [&_[role=slider]]:w-6"
          />
        </div>

        {/* Min/Max labels */}
        <div className="flex justify-between w-full mt-6 px-4 md:px-8 text-gray-500 font-medium text-sm md:text-base relative z-10">
          <span className="bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-200 shadow-sm">
            {min}
          </span>
          <span className="bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-200 shadow-sm">
            {max}
          </span>
        </div>
      </div>

      <ScrollConfirmWrapper
        containerClassName="flex justify-end mt-2 w-full"
        isDisabled={isLoading || isSubmittingLocal}
        ActionComponent={
          <Button
            size="lg"
            className="w-full sm:w-auto h-14 bg-black text-white hover:bg-neutral-800 px-10 rounded-full font-bold shadow-xl transition-all hover:scale-105"
            onClick={() => onConfirm(currentVal)}
            disabled={isLoading || isSubmittingLocal}
          >
            {isLoading || isSubmittingLocal ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin text-neutral-500" />
            ) : null}
            {t.next} <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        }
      />

      <div className="w-full opacity-70 hover:opacity-100 transition-opacity">
        <p className="text-sm text-center text-gray-500 mb-2">{t.exactValue}</p>
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

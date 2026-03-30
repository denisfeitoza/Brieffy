'use client';

import React, { useState, useCallback } from 'react';
import { MultiSliderOption } from '@/lib/types';
import { ScrollConfirmWrapper } from './ScrollConfirmWrapper';

interface MultiSliderQuestionProps {
  sliders: MultiSliderOption[];
  onConfirm: (values: Record<string, number>) => void;
  disabled?: boolean;
}

export function MultiSliderQuestion({ sliders, onConfirm, disabled }: MultiSliderQuestionProps) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    sliders.forEach(s => {
      initial[s.label] = s.defaultValue ?? Math.ceil((s.max - s.min) / 2) + s.min;
    });
    return initial;
  });

  const handleChange = useCallback((label: string, val: number) => {
    setValues(prev => ({ ...prev, [label]: val }));
  }, []);

  const handleConfirm = () => {
    onConfirm(values);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 mb-8 pt-2">
        {sliders.map((slider, idx) => (
          <SingleMiniSlider
            key={slider.label}
            slider={slider}
            value={values[slider.label]}
            onChange={(val) => handleChange(slider.label, val)}
            index={idx}
          />
        ))}
      </div>

      {/* Confirm Button */}
      <ScrollConfirmWrapper
        containerClassName="flex justify-center pt-4"
        isDisabled={disabled}
        ActionComponent={
          <button
            onClick={handleConfirm}
            disabled={disabled}
            className="
              px-8 py-3 rounded-2xl font-bold text-sm tracking-wide
              bg-gradient-to-r from-cyan-500 to-blue-600
              text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]
              hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]
              hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            Confirm Profile ✓
          </button>
        }
      />
    </div>
  );
}

// ================================================================
// Individual Mini Slider
// ================================================================
function SingleMiniSlider({
  slider,
  value,
  onChange,
  index,
}: {
  slider: MultiSliderOption;
  value: number;
  onChange: (val: number) => void;
  index: number;
}) {
  const progress = ((value - slider.min) / (slider.max - slider.min)) * 100;

  return (
    <div
      className="
        relative py-2
        transition-all duration-300
        animate-in fade-in slide-in-from-bottom-2 group
      "
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-medium text-zinc-100 leading-tight">
          {slider.label}
        </span>
        <span className="text-lg font-black text-cyan-400 tabular-nums">
          {value}
        </span>
      </div>

      {/* Custom Range Slider */}
      <input
        type="range"
        min={slider.min}
        max={slider.max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          w-full h-1.5 rounded-full appearance-none cursor-pointer mt-4
          bg-transparent
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-cyan-400
          [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(6,182,212,0.8)]
          [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125
          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-400
          [&::-moz-range-thumb]:cursor-grab
          [&::-webkit-slider-runnable-track]:bg-transparent
          [&::-moz-range-track]:bg-transparent
        "
        style={{
          background: `linear-gradient(to right, rgba(6,182,212,1) ${progress}%, rgba(255,255,255,0.08) ${progress}%)`
        }}
      />

      {/* Min/Max Labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[11px] text-zinc-500 font-medium">
          {slider.minLabel || slider.min}
        </span>
        <span className="text-[11px] text-zinc-500 font-medium">
          {slider.maxLabel || slider.max}
        </span>
      </div>
    </div>
  );
}

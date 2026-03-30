"use client";

import { X } from "lucide-react";

interface CustomTextPillsProps {
  customTexts: string[];
  onRemove: (text: string) => void;
}

export function CustomTextPills({ customTexts, onRemove }: CustomTextPillsProps) {
  if (customTexts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4 justify-center">
      {customTexts.map((text, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-500/50 animate-in fade-in zoom-in duration-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
        >
          <span className="text-sm font-medium text-indigo-300 truncate max-w-[200px]" title={text}>
            {text}
          </span>
          <button
            onClick={() => onRemove(text)}
            className="text-indigo-400/70 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

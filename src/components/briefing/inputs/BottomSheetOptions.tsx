"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomSheetOptionsProps {
  options: string[];
  onSelect: (value: string) => void;
  isDisabled: boolean;
  label: string; // button label e.g. "Ver opções"
  title: string; // sheet title e.g. "Selecione uma opção"
}

export function BottomSheetOptions({ options, onSelect, isDisabled, label, title }: BottomSheetOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsOpen(true)}
        disabled={isDisabled}
        className="w-full rounded-2xl border-[var(--bd)] bg-[var(--bg)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] shadow-sm h-14 font-medium flex items-center justify-between px-6"
      >
        <span>{label}</span>
        <ChevronDown className="w-4 h-4 opacity-60" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
              onClick={() => setIsOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-[201] bg-[var(--bg)] border-t border-[var(--bd)] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.4)]"
              style={{ maxHeight: "75vh" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1.5 rounded-full bg-[var(--bd-strong)]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-[var(--bd)]">
                <p className="text-sm font-medium text-[var(--text2)] tracking-wide">
                  {title}
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg2)] flex items-center justify-center text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Options List */}
              <div className="overflow-y-auto pb-[env(safe-area-inset-bottom,24px)]" style={{ maxHeight: "calc(75vh - 90px)" }}>
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelect(opt);
                      setIsOpen(false);
                    }}
                    disabled={isDisabled}
                    className="w-full text-left px-6 py-4 text-[var(--text)] font-medium text-base border-b border-[var(--bd)] hover:bg-[var(--bg2)] active:bg-[var(--bg3)] transition-colors min-h-[56px] flex items-center"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

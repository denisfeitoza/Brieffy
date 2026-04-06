"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BriefingSignal, SignalCategory } from "@/lib/types";
import { 
  AlertTriangle, Lightbulb, Eye, Flame, Map, 
  ChevronDown, ChevronUp, Sparkles, X
} from "lucide-react";

const SIGNAL_CONFIG: Record<SignalCategory, { 
  icon: React.ElementType; 
  label: string; 
  color: string; 
  bg: string;
  border: string;
}> = {
  contradiction: { 
    icon: AlertTriangle, 
    label: "Contradição", 
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },
  implicit_pain: { 
    icon: Flame, 
    label: "Dor Implícita", 
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-200"
  },
  evasion: { 
    icon: Eye, 
    label: "Evasão Detectada", 
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200"
  },
  hidden_ambition: { 
    icon: Lightbulb, 
    label: "Ambição Oculta", 
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200"
  },
  strategic_gap: { 
    icon: Map, 
    label: "Lacuna Estratégica", 
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200"
  },
};

interface InsightsPanelProps {
  signals: BriefingSignal[];
  isOwner?: boolean;
}

export function InsightsPanel({ signals, isOwner = true }: InsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only render for the agency owner
  if (!isOwner || dismissed) return null;

  const highRelevance = signals.filter(s => s.relevance_score >= 0.8);
  const hasNew = signals.length > 0;

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 shadow-xl text-sm font-semibold text-black hover:bg-gray-50 hover:border-gray-300 transition-all group"
            style={{ boxShadow: hasNew && signals.length > 0 ? '0 0 20px rgba(255,96,41,0.2)' : undefined }}
          >
            <Sparkles className={`w-4 h-4 ${hasNew ? 'text-[var(--orange)]' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">Sinais Detectados</span>
            {signals.length > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--orange)] text-white text-xs font-bold">
                {signals.length}
              </span>
            )}
            <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-[var(--orange)] transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto z-50 w-full md:w-[380px] max-h-[70vh] md:max-h-[520px] flex flex-col rounded-t-3xl md:rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden"
              style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.1)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--orange-light)] border border-[var(--orange-mid)] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[var(--orange)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black">Radar de Escuta Ativa</h3>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Sinais capturados nas entrelinhas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setIsOpen(false); setDismissed(true); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                    title="Fechar e ocultar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {signals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Escutando as entrelinhas...</p>
                      <p className="text-sm text-gray-400 mt-1">Sinais serão exibidos conforme o cliente responde.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {highRelevance.length > 0 && (
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                        Alta Relevância — {highRelevance.length} sinal{highRelevance.length !== 1 ? 'is' : ''}
                      </div>
                    )}
                    {signals
                      .slice()
                      .sort((a, b) => b.relevance_score - a.relevance_score)
                      .map((signal) => {
                        const cfg = SIGNAL_CONFIG[signal.category];
                        const Icon = cfg.icon;
                        return (
                          <motion.div
                            key={signal.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className={`flex items-start gap-3 p-3 rounded-2xl border ${cfg.bg} ${cfg.border}`}
                          >
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}>
                              <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                <span className="text-xs font-mono text-gray-400 shrink-0">
                                  {Math.round(signal.relevance_score * 100)}% relevante
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{signal.summary}</p>
                              {signal.source_answer && signal.source_answer.length < 120 && (
                                <p className="text-xs text-gray-400 mt-1.5 italic line-clamp-2">
                                  &quot;{signal.source_answer}&quot;
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                  </>
                )}
              </div>

              {/* Footer note */}
              {signals.length > 0 && (
                <div className="shrink-0 p-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">
                    Estes insights serão incluídos no relatório final do briefing
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

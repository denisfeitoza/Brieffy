"use client";

import { motion } from "framer-motion";

interface MilestoneI18n {
  messages: { label: string; title: string }[];
  powered: string;
}

const I18N_MILESTONES: Record<string, MilestoneI18n> = {
  pt: {
    messages: [
      { label: "Etapa concluída", title: "Analisando suas respostas" },
      { label: "Progresso sólido", title: "Refinando a estratégia" },
      { label: "Quase lá", title: "Ajustando as últimas peças" },
      { label: "Reta final", title: "Preparando o encerramento" },
    ],
    powered: "Powered by",
  },
  en: {
    messages: [
      { label: "Step complete", title: "Analyzing your answers" },
      { label: "Solid progress", title: "Refining the strategy" },
      { label: "Almost there", title: "Adjusting the last pieces" },
      { label: "Final stretch", title: "Preparing to wrap up" },
    ],
    powered: "Powered by",
  },
  es: {
    messages: [
      { label: "Etapa concluida", title: "Analizando tus respuestas" },
      { label: "Progreso sólido", title: "Refinando la estrategia" },
      { label: "Casi listo", title: "Ajustando las últimas piezas" },
      { label: "Recta final", title: "Preparando el cierre" },
    ],
    powered: "Powered by",
  },
};

interface MilestoneScreenProps {
  block: number; // 1, 2, 3, 4
  language: string;
  brandColor?: string;
}

export function MilestoneScreen({ block, language, brandColor }: MilestoneScreenProps) {
  const t = I18N_MILESTONES[language] || I18N_MILESTONES.pt;
  const idx = Math.max(0, Math.min(block - 1, t.messages.length - 1));
  const msg = t.messages[idx];
  const accentColor = brandColor || "#ff6029";
  const dotOpacity = [0.4, 0.55, 0.7, 0.85][idx] ?? 0.5;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "var(--bg, #ffffff)", fontFamily: '"DM Sans", sans-serif' }}
    >
      <div className="flex flex-col items-center gap-6 px-6 max-w-sm w-full">
        {/* Pulsing dot */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [dotOpacity, 1, dotOpacity] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-3 h-3 rounded-full"
          style={{ background: accentColor }}
        />

        {/* Label */}
        <span
          className="text-[11px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: accentColor }}
        >
          {msg.label}
        </span>

        {/* Title */}
        <h2
          className="text-[22px] sm:text-[26px] font-bold tracking-[-0.03em] text-center leading-tight"
          style={{ color: "var(--text, #000000)" }}
        >
          {msg.title}
        </h2>

        {/* Progress bar — fast sweep like an ad preloader */}
        <div
          className="w-full max-w-[200px] h-[3px] rounded-full overflow-hidden mt-2"
          style={{ background: "var(--bg3, #ebebea)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: accentColor }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>

        {/* Powered by Brieffy */}
        <div className="flex items-center gap-1.5 mt-4">
          <span
            className="text-[10px] tracking-[0.06em]"
            style={{ color: "var(--text3, #9e9e9a)" }}
          >
            {t.powered}
          </span>
          <span
            className="text-[11px] font-bold tracking-[-0.02em]"
            style={{ color: "var(--text, #000)" }}
          >
            brieffy
            <span style={{ color: accentColor }}>.</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

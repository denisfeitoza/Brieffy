"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Shield,
  Globe,
  Zap,
  PieChart,
  Workflow,
} from "lucide-react";

const BRAND = "oklch(0.65 0.25 255)";
const ACCENT = "#06b6d4";

const FEATURES = [
  {
    icon: Sparkles,
    title: "IA Consultiva Adaptativa",
    desc: "Cada pergunta é gerada com base no contexto acumulado. Zero repetição, máximo aprofundamento.",
    gradient: `linear-gradient(135deg, ${BRAND}, #8b5cf6)`,
  },
  {
    icon: Shield,
    title: "White-label com sua marca",
    desc: "Seu logo, suas cores, seu domínio. O cliente vê apenas sua identidade — nunca a nossa.",
    gradient: `linear-gradient(135deg, #10b981, ${ACCENT})`,
  },
  {
    icon: Globe,
    title: "Multi-idioma automático",
    desc: "O sistema detecta e se adapta ao idioma do respondente. Suporte nativo a PT, EN, ES e mais.",
    gradient: `linear-gradient(135deg, #f59e0b, #ef4444)`,
  },
  {
    icon: Zap,
    title: "Respostas em 5 minutos",
    desc: "Opções rápidas por clique, voz ou texto. O briefing mais rápido que seu cliente já respondeu.",
    gradient: `linear-gradient(135deg, ${ACCENT}, ${BRAND})`,
  },
  {
    icon: PieChart,
    title: "Diagnóstico com Score",
    desc: "Métricas automáticas de clareza de marca, maturidade digital e definição de público-alvo.",
    gradient: `linear-gradient(135deg, #a855f7, #ec4899)`,
  },
  {
    icon: Workflow,
    title: "Documento estruturado",
    desc: "Output final organizado com todas as respostas, insights, score e estratégias sugeridas.",
    gradient: `linear-gradient(135deg, #14b8a6, #3b82f6)`,
  },
];

const containerVars = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVars = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-20 md:py-32">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 50% 50%, ${BRAND}08 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block text-xs uppercase tracking-[0.2em] font-semibold mb-4 px-4 py-1.5 rounded-full border"
            style={{
              color: BRAND,
              borderColor: `oklch(0.65 0.25 255 / 25%)`,
              background: `oklch(0.65 0.25 255 / 6%)`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Recursos
          </motion.span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            Tudo que você precisa,
            <br />
            <span className="text-neutral-500">nada que você não precisa</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          variants={containerVars}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                className="group relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-7 md:p-8 hover:border-white/[0.12] transition-all duration-500 cursor-default overflow-hidden"
                variants={itemVars}
                whileHover={{ y: -5 }}
              >
                {/* Hover glow */}
                <motion.div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-3xl"
                  style={{ background: feat.gradient }}
                />

                <div className="relative">
                  {/* Icon Container */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      className="w-6 h-6"
                      style={{
                        background: feat.gradient,
                        mask: "none",
                      }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <h3
                    className="text-lg font-semibold text-white mb-2"
                    style={{ fontFamily: '"Outfit", sans-serif' }}
                  >
                    {feat.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

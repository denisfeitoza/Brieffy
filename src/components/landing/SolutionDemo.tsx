"use client";

import { motion } from "framer-motion";
import {
  MessageSquareText,
  Mic,
  Brain,
  BarChart3,
  Layers,
  Palette,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const BRAND = "oklch(0.65 0.25 255)";
const ACCENT = "#06b6d4";

const getDemoSteps = (t: (key: string) => string) => [
  {
    role: "ai",
    text: t("solution.chat.1"),
    type: "question",
  },
  {
    role: "user",
    text: t("solution.chat.2"),
    type: "answer",
  },
  {
    role: "ai",
    text: t("solution.chat.3"),
    type: "question",
    options: t("solution.chat.options").split("|"),
  },
  {
    role: "insight",
    text: t("solution.chat.4"),
    type: "extraction",
  },
];

function DemoMessage({
  step,
  index,
  t
}: {
  step: ReturnType<typeof getDemoSteps>[0];
  index: number;
  t: (key: string) => string;
}) {
  const isAI = step.role === "ai";
  const isInsight = step.role === "insight";

  return (
    <motion.div
      className={`flex ${isAI || isInsight ? "justify-start" : "justify-end"}`}
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        delay: index * 0.3 + 0.3,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isInsight
            ? "border border-emerald-500/30 bg-emerald-500/[0.08]"
            : isAI
            ? "border border-white/[0.08] bg-white/[0.04]"
            : "border border-[oklch(0.65_0.25_255_/_0.3)] bg-[oklch(0.65_0.25_255_/_0.08)]"
        }`}
      >
        {isInsight && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
              {t("solution.demo.ext")}
            </span>
          </div>
        )}
        <p
          className={`text-sm leading-relaxed ${
            isInsight
              ? "text-emerald-300/90"
              : isAI
              ? "text-neutral-300"
              : "text-white"
          }`}
        >
          {step.text}
        </p>
        {step.options && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {step.options.map((opt, i) => (
              <motion.span
                key={opt}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  i === 1
                    ? "border-[oklch(0.65_0.25_255_/_0.5)] bg-[oklch(0.65_0.25_255_/_0.15)] text-white"
                    : "border-white/[0.08] bg-white/[0.03] text-neutral-400"
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.3 + 0.6 + i * 0.08 }}
              >
                {opt}
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function SolutionDemo() {
  const { t } = useLanguage();
  const demoSteps = getDemoSteps(t);

  return (
    <section className="relative py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              color: ACCENT,
              borderColor: `${ACCENT}30`,
              background: `${ACCENT}08`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t("solution.badge")}
          </motion.span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            {t("solution.title1")}
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("solution.title2")}
            </span>
          </h2>
          <p className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto">
            {t("solution.desc")}
          </p>
        </motion.div>

        {/* Demo + Features */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Demo Mockup */}
          <motion.div
            className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Mockup Header */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="text-[10px] text-neutral-600 px-4 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                  brieffy.com/briefing
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="p-5 space-y-3">
              {demoSteps.map((step, i) => (
                <DemoMessage key={i} step={step} index={i} t={t} />
              ))}

              {/* Typing indicator */}
              <motion.div
                className="flex items-center gap-1 px-4 py-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.8 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: BRAND }}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.15,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </motion.div>
            </div>

            {/* Input bar */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                <MessageSquareText className="w-4 h-4 text-neutral-600" />
                <span className="text-sm text-neutral-600 flex-1">
                  {t("solution.demo.input")}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: `${BRAND}20` }}
                >
                  <Mic className="w-3.5 h-3.5" style={{ color: BRAND }} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            className="space-y-4 md:space-y-5"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {[
              {
                icon: Brain,
                title: t("solution.feat.1.title"),
                desc: t("solution.feat.1.desc"),
                color: BRAND,
              },
              {
                icon: Mic,
                title: t("solution.feat.2.title"),
                desc: t("solution.feat.2.desc"),
                color: ACCENT,
              },
              {
                icon: BarChart3,
                title: t("solution.feat.3.title"),
                desc: t("solution.feat.3.desc"),
                color: "#10b981",
              },
              {
                icon: Palette,
                title: t("solution.feat.4.title"),
                desc: t("solution.feat.4.desc"),
                color: "#f59e0b",
              },
              {
                icon: Layers,
                title: t("solution.feat.5.title"),
                desc: t("solution.feat.5.desc"),
                color: "#a855f7",
              },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  className="group flex gap-4 items-start p-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-400 cursor-default"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                  whileHover={{ x: 4 }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${feat.color}12`,
                      border: `1px solid ${feat.color}25`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feat.color }} />
                  </div>
                  <div>
                    <h3
                      className="text-sm font-semibold text-white mb-1"
                      style={{ fontFamily: '"Outfit", sans-serif' }}
                    >
                      {feat.title}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

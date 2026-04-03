"use client";

import { motion } from "framer-motion";
import { Link2, MessageSquareText, FileOutput } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const BRAND = "oklch(0.65 0.25 255)";
const ACCENT = "#06b6d4";

const getSteps = (t: (key: string) => string) => [
  {
    number: "01",
    icon: Link2,
    title: t("how.1.title"),
    desc: t("how.1.desc"),
    detail: t("how.1.detail"),
  },
  {
    number: "02",
    icon: MessageSquareText,
    title: t("how.2.title"),
    desc: t("how.2.desc"),
    detail: t("how.2.detail"),
  },
  {
    number: "03",
    icon: FileOutput,
    title: t("how.3.title"),
    desc: t("how.3.desc"),
    detail: t("how.3.detail"),
  },
];

export function HowItWorks() {
  const { t } = useLanguage();
  const steps = getSteps(t);

  return (
    <section id="how-it-works" className="relative py-20 md:py-32">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 60%, ${BRAND}06 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block text-xs uppercase tracking-[0.2em] font-semibold mb-4 px-4 py-1.5 rounded-full border"
            style={{
              color: "#10b981",
              borderColor: "#10b98130",
              background: "#10b98108",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t("how.badge")}
          </motion.span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            {t("how.title1")}
            <br />
            <span className="text-neutral-500">{t("how.title2")}</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connector line (desktop) */}
          <div className="absolute left-[28px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-px hidden sm:block">
            <motion.div
              className="w-full h-full"
              style={{
                background: `linear-gradient(180deg, transparent 0%, ${BRAND}30 15%, ${ACCENT}30 85%, transparent 100%)`,
              }}
              initial={{ scaleY: 0, originY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-1 md:gap-16">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isEven = i % 2 === 0;

              return (
                <motion.div
                  key={step.number}
                  className={`relative flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-10 ${
                    !isEven ? "md:flex-row-reverse" : ""
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    delay: i * 0.15,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {/* Node dot (center column) */}
                  <div className="absolute left-[20px] md:left-1/2 md:-translate-x-1/2 top-0 z-10 hidden sm:block">
                    <motion.div
                      className="w-4 h-4 rounded-full border-2"
                      style={{
                        borderColor: i === 0 ? BRAND : i === 1 ? ACCENT : "#10b981",
                        background:
                          i === 0 ? `${BRAND}30` : i === 1 ? `${ACCENT}30` : "#10b98130",
                      }}
                      whileInView={{
                        scale: [1, 1.5, 1],
                        boxShadow: [
                          `0 0 0px ${i === 0 ? BRAND : i === 1 ? ACCENT : "#10b981"}`,
                          `0 0 15px ${i === 0 ? BRAND : i === 1 ? ACCENT : "#10b981"}50`,
                          `0 0 0px ${i === 0 ? BRAND : i === 1 ? ACCENT : "#10b981"}`,
                        ],
                      }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 + 0.3, duration: 0.8 }}
                    />
                  </div>

                  {/* Left / right content */}
                  <div
                    className={`flex-1 ${
                      isEven ? "md:text-right md:pr-12" : "md:text-left md:pl-12"
                    } sm:pl-14 md:pl-0`}
                  >
                    <div
                      className={`inline-flex flex-col ${
                        isEven ? "md:items-end" : "md:items-start"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background:
                              i === 0
                                ? `${BRAND}15`
                                : i === 1
                                ? `${ACCENT}15`
                                : "#10b98115",
                            border: `1px solid ${
                              i === 0 ? BRAND : i === 1 ? ACCENT : "#10b981"
                            }25`,
                          }}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{
                              color:
                                i === 0 ? BRAND : i === 1 ? ACCENT : "#10b981",
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{
                            color:
                              i === 0 ? BRAND : i === 1 ? ACCENT : "#10b981",
                          }}
                        >
                          {t("how.step")} {step.number}
                        </span>
                      </div>
                      <h3
                        className="text-xl md:text-2xl font-bold text-white mb-2"
                        style={{ fontFamily: '"Outfit", sans-serif' }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-neutral-400 leading-relaxed max-w-sm mb-2">
                        {step.desc}
                      </p>
                      <span className="text-xs text-neutral-600 font-medium">
                        {step.detail}
                      </span>
                    </div>
                  </div>

                  {/* Spacer for opposite side */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

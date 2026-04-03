"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const BRAND = "oklch(0.65 0.25 255)";
const ACCENT = "#06b6d4";

const getTestimonials = (t: (key: string) => string) => [
  {
    name: "Ana Costa",
    role: t("testim.1.role"),
    text: t("testim.1.text"),
    avatar: "AC",
    color: "#f59e0b",
  },
  {
    name: "Ricardo Mendes",
    role: t("testim.2.role"),
    text: t("testim.2.text"),
    avatar: "RM",
    color: ACCENT,
  },
  {
    name: "Camila Torres",
    role: t("testim.3.role"),
    text: t("testim.3.text"),
    avatar: "CT",
    color: "#a855f7",
  },
  {
    name: "Fernando Silva",
    role: t("testim.4.role"),
    text: t("testim.4.text"),
    avatar: "FS",
    color: "#10b981",
  },
];

export function TestimonialsCarousel() {
  const { t } = useLanguage();
  const testimonials = getTestimonials(t);
  const [active, setActive] = useState(0);

  const next = () => setActive((a) => (a + 1) % testimonials.length);
  const prev = () =>
    setActive((a) => (a - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative py-20 md:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-14 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block text-xs uppercase tracking-[0.2em] font-semibold mb-4 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t("testim.badge")}
          </motion.span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            {t("testim.title1")} <span className="text-neutral-500">{t("testim.title2")}</span>
          </h2>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <motion.div
            className="rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-8 md:p-12 text-center relative overflow-hidden"
            key={active}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Quote icon */}
            <Quote
              className="w-10 h-10 mx-auto mb-6 opacity-20"
              style={{ color: testimonials[active].color }}
            />

            {/* Text */}
            <p className="text-lg md:text-xl text-neutral-300 leading-relaxed max-w-2xl mx-auto mb-8 italic">
              &ldquo;{testimonials[active].text}&rdquo;
            </p>

            {/* Avatar + Name */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${testimonials[active].color}, ${testimonials[active].color}80)`,
                }}
              >
                {testimonials[active].avatar}
              </div>
              <div>
                <p
                  className="text-base font-semibold text-white"
                  style={{ fontFamily: '"Outfit", sans-serif' }}
                >
                  {testimonials[active].name}
                </p>
                <p className="text-sm text-neutral-500">
                  {testimonials[active].role}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/20 transition-all"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-6 bg-white"
                      : "bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/20 transition-all"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

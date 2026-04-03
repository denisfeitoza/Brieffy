"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

const BRAND = "oklch(0.65 0.25 255)";
const ACCENT = "#06b6d4";

export function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 50% 50%, ${BRAND}15 0%, transparent 65%),
            radial-gradient(circle at 30% 70%, ${ACCENT}08 0%, transparent 50%),
            radial-gradient(circle at 70% 30%, ${BRAND}08 0%, transparent 45%)
          `,
        }}
      />

      {/* Grid pattern */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.025 }}
        viewport={{ once: true }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Animated orbs */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`cta-orb-${i}`}
          className="absolute rounded-full pointer-events-none blur-3xl"
          style={{
            width: 200 + i * 100,
            height: 200 + i * 100,
            background:
              i % 2 === 0
                ? `${BRAND}08`
                : `${ACCENT}06`,
            left: `${20 + i * 25}%`,
            top: `${30 + i * 15}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 5 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            {t("cta.title1")}
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("cta.title2")}
            </span>
          </h2>
          <p className="text-base md:text-lg text-neutral-400 max-w-xl mx-auto mb-10">
            {t("cta.desc")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/register"
              className="relative group text-base font-semibold text-white px-8 py-4 rounded-full overflow-hidden inline-block"
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                }}
              />
              <motion.span
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, oklch(0.72 0.28 255), #0ef0ff)`,
                }}
              />
              {/* Glow */}
              <motion.span
                className="absolute -inset-2 rounded-full blur-xl opacity-30"
                style={{
                  background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                }}
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <span className="relative z-10">{t("cta.btn")}</span>
            </Link>
          </div>

          <motion.p
            className="text-xs text-neutral-600 mt-5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {t("cta.sub")}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

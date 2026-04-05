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
import { useLanguage } from "@/i18n/LanguageContext";

const BRAND = "#ff6029";
const ACCENT = "#ffcfbc";

const getFeatures = (t: (key: string) => string) => [
  {
    icon: Sparkles,
    title: t("features.1.title"),
    desc: t("features.1.desc"),
    gradient: `linear-gradient(135deg, ${BRAND}, #8b5cf6)`,
  },
  {
    icon: Shield,
    title: t("features.2.title"),
    desc: t("features.2.desc"),
    gradient: `linear-gradient(135deg, #10b981, ${ACCENT})`,
  },
  {
    icon: Globe,
    title: t("features.3.title"),
    desc: t("features.3.desc"),
    gradient: `linear-gradient(135deg, #f59e0b, #ef4444)`,
  },
  {
    icon: Zap,
    title: t("features.4.title"),
    desc: t("features.4.desc"),
    gradient: `linear-gradient(135deg, ${ACCENT}, ${BRAND})`,
  },
  {
    icon: PieChart,
    title: t("features.5.title"),
    desc: t("features.5.desc"),
    gradient: `linear-gradient(135deg, #a855f7, #ec4899)`,
  },
  {
    icon: Workflow,
    title: t("features.6.title"),
    desc: t("features.6.desc"),
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
  const { t } = useLanguage();
  const features = getFeatures(t);

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
              borderColor: `#ff602925`,
              background: `#ff602906`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t("features.badge")}
          </motion.span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-black tracking-tight mb-4"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            {t("features.title1")}
            <br />
            <span className="text-neutral-500">{t("features.title2")}</span>
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
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                className="group relative rounded-3xl border border-black/[0.06] bg-black/[0.02] backdrop-blur-sm p-7 md:p-8 hover:border-black/[0.12] transition-all duration-500 cursor-default overflow-hidden"
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
                      background: `linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02))`,
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      className="w-6 h-6"
                      style={{
                        background: feat.gradient,
                        mask: "none",
                      }}
                    >
                      <Icon className="w-6 h-6 text-black" />
                    </div>
                  </div>

                  <h3
                    className="text-lg font-semibold text-black mb-2"
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

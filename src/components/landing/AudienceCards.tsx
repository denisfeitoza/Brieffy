"use client";

import { motion } from "framer-motion";
import {
  Megaphone,
  Code2,
  Lightbulb,
  FolderKanban,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const BRAND = "#ff6029";
const ACCENT = "#ffcfbc";

const getAudiences = (t: (key: string) => string) => [
  {
    icon: Megaphone,
    title: t("audience.1.title"),
    subtitle: t("audience.1.sub"),
    color: "#f59e0b",
    arguments: t("audience.1.args").split("|"),
  },
  {
    icon: Lightbulb,
    title: t("audience.2.title"),
    subtitle: t("audience.2.sub"),
    color: "#a855f7",
    arguments: t("audience.2.args").split("|"),
  },
  {
    icon: Code2,
    title: t("audience.3.title"),
    subtitle: t("audience.3.sub"),
    color: ACCENT,
    arguments: t("audience.3.args").split("|"),
  },
  {
    icon: FolderKanban,
    title: t("audience.4.title"),
    subtitle: t("audience.4.sub"),
    color: "#10b981",
    arguments: t("audience.4.args").split("|"),
  },
];

const containerVars = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVars = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function AudienceCards() {
  const { t } = useLanguage();
  const audiences = getAudiences(t);

  return (
    <section id="audience" className="relative py-20 md:py-32">
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
            className="inline-block text-xs uppercase tracking-[0.2em] font-semibold mb-4 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t("audience.badge")}
          </motion.span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-black tracking-tight mb-4"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            {t("audience.title1")}
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("audience.title2")}
            </span>
          </h2>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
          variants={containerVars}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {audiences.map((aud) => {
            const Icon = aud.icon;
            return (
              <motion.div
                key={aud.title}
                className="group relative rounded-3xl border border-black/[0.06] bg-black/[0.02] backdrop-blur-sm p-6 md:p-8 hover:border-black/[0.12] transition-all duration-500 cursor-default overflow-hidden"
                variants={cardVars}
                whileHover={{ y: -4 }}
              >
                {/* Hover glow */}
                <div
                  className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-3xl"
                  style={{ background: `${aud.color}15` }}
                />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: `${aud.color}12`,
                        border: `1px solid ${aud.color}25`,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: aud.color }} />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-semibold text-black"
                        style={{ fontFamily: '"Outfit", sans-serif' }}
                      >
                        {aud.title}
                      </h3>
                      <p className="text-xs text-neutral-500">{aud.subtitle}</p>
                    </div>
                  </div>

                  {/* Arguments list */}
                  <ul className="space-y-2.5">
                    {aud.arguments.map((arg, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-neutral-600"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 + 0.4 }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                          style={{ background: aud.color }}
                        />
                        <span>{arg}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

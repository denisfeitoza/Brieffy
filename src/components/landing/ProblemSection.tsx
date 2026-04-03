"use client";

import { motion } from "framer-motion";
import {
  Clock,
  RotateCcw,
  FileQuestion,
  AlertTriangle,
} from "lucide-react";

import { useLanguage } from "@/i18n/LanguageContext";

const getProblems = (t: (key: string) => string) => [
  {
    icon: Clock,
    title: t("problem.cards.1.title"),
    desc: t("problem.cards.1.desc"),
    stat: t("problem.cards.1.stat"),
    statLabel: t("problem.cards.1.statLabel"),
  },
  {
    icon: RotateCcw,
    title: t("problem.cards.2.title"),
    desc: t("problem.cards.2.desc"),
    stat: t("problem.cards.2.stat"),
    statLabel: t("problem.cards.2.statLabel"),
  },
  {
    icon: FileQuestion,
    title: t("problem.cards.3.title"),
    desc: t("problem.cards.3.desc"),
    stat: t("problem.cards.3.stat"),
    statLabel: t("problem.cards.3.statLabel"),
  },
  {
    icon: AlertTriangle,
    title: t("problem.cards.4.title"),
    desc: t("problem.cards.4.desc"),
    stat: t("problem.cards.4.stat"),
    statLabel: t("problem.cards.4.statLabel"),
  },
];

const containerVars = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVars = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function ProblemSection() {
  const { t } = useLanguage();
  const problems = getProblems(t);

  return (
    <section className="relative py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block text-xs uppercase tracking-[0.2em] text-red-400/80 font-semibold mb-4 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/5"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t("problem.badge")}
          </motion.span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            {t("problem.title")}
            <br />
            <span className="text-neutral-500">{t("problem.title.broken")}</span>
          </h2>
        </motion.div>

        {/* Problem Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          variants={containerVars}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {problems.map((problem) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.title}
                className="group relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 md:p-8 hover:border-red-500/20 transition-all duration-500 cursor-default"
                variants={itemVars}
                whileHover={{ y: -4 }}
              >
                {/* Subtle red glow on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-red-500/[0.03] to-transparent" />

                <div className="relative">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20 mb-5">
                    <Icon className="w-5 h-5 text-red-400" />
                  </div>

                  {/* Stat */}
                  <div className="mb-4">
                    <span className="text-3xl md:text-4xl font-bold text-red-400/90">
                      {problem.stat}
                    </span>
                    <span className="block text-[11px] text-neutral-600 mt-0.5">
                      {problem.statLabel}
                    </span>
                  </div>

                  {/* Text */}
                  <h3
                    className="text-base font-semibold text-white mb-2"
                    style={{ fontFamily: '"Outfit", sans-serif' }}
                  >
                    {problem.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {problem.desc}
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

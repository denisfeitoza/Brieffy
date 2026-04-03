"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const BRAND = "oklch(0.65 0.25 255)";
const ACCENT = "#06b6d4";

const getStats = (t: (key: string) => string) => [
  {
    value: 90,
    suffix: "%",
    label: t("stats.1.label"),
    desc: t("stats.1.desc"),
    color: BRAND,
  },
  {
    value: 5,
    suffix: "min",
    label: t("stats.2.label"),
    desc: t("stats.2.desc"),
    color: ACCENT,
  },
  {
    value: 100,
    suffix: "%",
    label: t("stats.3.label"),
    desc: t("stats.3.desc"),
    color: "#10b981",
  },
  {
    value: 15,
    suffix: "+",
    label: t("stats.4.label"),
    desc: t("stats.4.desc"),
    color: "#a855f7",
  },
];

function AnimatedCounter({
  value,
  suffix,
  color,
}: {
  value: number;
  suffix: string;
  color: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span
      ref={ref}
      className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
      style={{
        fontFamily: '"Outfit", sans-serif',
        background: `linear-gradient(135deg, ${color}, ${color}90)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {count}
      {suffix}
    </span>
  );
}

export function StatsCounter() {
  const { t } = useLanguage();
  const stats = getStats(t);

  return (
    <section className="relative py-20 md:py-28">
      {/* Divider line top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 max-w-md h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                color={stat.color}
              />
              <h3
                className="text-base md:text-lg font-semibold text-white mt-2"
                style={{ fontFamily: '"Outfit", sans-serif' }}
              >
                {stat.label}
              </h3>
              <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Divider line bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 max-w-md h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </section>
  );
}

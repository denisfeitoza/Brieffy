"use client";

import { motion } from "framer-motion";

/* ─── Infinite scrolling marquee of trusted-by logos ─── */
const LOGOS = [
  "Marketing Pro",
  "Agência Pulse",
  "DevLab",
  "StrategyHub",
  "BrandForce",
  "CodeCraft",
  "GrowthMind",
  "ProjectFlow",
  "PixelStudio",
  "InnovateTech",
];

function LogoBadge({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm shrink-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
        style={{
          background: `linear-gradient(135deg, oklch(0.65 0.25 255 / 30%), #06b6d4${30})`,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {initials}
      </div>
      <span className="text-sm text-neutral-500 font-medium whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export function TrustedByMarquee() {
  const doubled = [...LOGOS, ...LOGOS];

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Label */}
      <motion.p
        className="text-center text-xs uppercase tracking-[0.2em] text-neutral-600 mb-8 font-medium"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Empresas que confiam na Brieffy
      </motion.p>

      {/* Marquee Track */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-[oklch(0.10_0.02_260)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-[oklch(0.10_0.02_260)] to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {doubled.map((name, i) => (
            <LogoBadge key={`${name}-${i}`} name={name} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

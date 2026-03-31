"use client";

import { motion } from "framer-motion";
import { memo, useMemo, useState, useEffect } from "react";

/* ================================================================
 * AI LOADING SPLASH — Premium loading screen shown while the
 * briefing session initializes. Features:
 *  • Company branding at the top (logo/name of the agency sending)
 *  • AI-themed neural network animation (center)
 *  • Brief.i marketing message at the bottom
 *  • Smooth progress bar that fills over the duration
 *  • Auto-dismiss with smooth exit
 * ================================================================ */

interface AILoadingSplashProps {
  branding: {
    logo_url: string;
    company_name: string;
    brand_color: string;
    brand_accent?: string;
    tagline?: string;
  };
  language?: string;
  /** Number of selected skill packages — influences progress bar duration */
  skillCount?: number;
}

// ─── i18n messages ──────────────────────────────────────
const SPLASH_I18N: Record<string, { generating: string; subtitle: string; footer: string }> = {
  pt: {
    generating: "Gerando seu briefing personalizado",
    subtitle: "Vamos começar com uma conversa aberta sobre você e seu negócio — depois aprofundamos juntos",
    footer: "Com a Brief.i, responda briefings mais rápido e de forma inteligente. Aprendemos com suas respostas para gerar as próximas com base nelas.",
  },
  en: {
    generating: "Generating your personalized briefing",
    subtitle: "We'll start with an open conversation about you and your business — then dive deeper together",
    footer: "With Brief.i, answer briefings faster and smarter. We learn from your responses to generate even better ones next time.",
  },
  es: {
    generating: "Generando su briefing personalizado",
    subtitle: "Comenzaremos con una conversación abierta sobre usted y su negocio — después profundizamos juntos",
    footer: "Con Brief.i, responda briefings más rápido e inteligente. Aprendemos de sus respuestas para generar las próximas basándonos en ellas.",
  },
};

function getContrastColor(hexcolor: string) {
  if (!hexcolor) return "#ffffff";
  const hex = hexcolor.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return "#ffffff";
  const fullHex = hex.length === 3 ? hex.split("").map((x) => x + x).join("") : hex;
  const r = parseInt(fullHex.substr(0, 2), 16);
  const g = parseInt(fullHex.substr(2, 2), 16);
  const b = parseInt(fullHex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

// ─── Orbital Particle ──────────────────────────────────
const OrbitalParticle = memo(function OrbitalParticle({
  delay,
  radius,
  duration,
  size,
  color,
  reverse,
}: {
  delay: number;
  radius: number;
  duration: number;
  size: number;
  color: string;
  reverse?: boolean;
}) {
  const dir = reverse ? -1 : 1;
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        filter: `blur(${size > 3 ? 1 : 0}px)`,
        boxShadow: `0 0 ${size * 4}px ${color}, 0 0 ${size * 8}px ${color}40`,
        top: "50%",
        left: "50%",
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
      animate={{
        x: [
          Math.cos(0) * radius * dir,
          Math.cos(Math.PI * 0.5) * radius * dir,
          Math.cos(Math.PI) * radius * dir,
          Math.cos(Math.PI * 1.5) * radius * dir,
          Math.cos(Math.PI * 2) * radius * dir,
        ],
        y: [
          Math.sin(0) * radius,
          Math.sin(Math.PI * 0.5) * radius,
          Math.sin(Math.PI) * radius,
          Math.sin(Math.PI * 1.5) * radius,
          Math.sin(Math.PI * 2) * radius,
        ],
        opacity: [0.4, 1, 0.4, 1, 0.4],
        scale: [0.7, 1.3, 0.7, 1.3, 0.7],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
});

// ─── Neural Node / Connection ──────────────────────────
const NeuralConnection = memo(function NeuralConnection({
  x1,
  y1,
  x2,
  y2,
  delay,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
  color: string;
}) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: [0, 1, 1, 0],
        opacity: [0, 0.7, 0.7, 0],
      }}
      transition={{
        duration: 2.8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});

// ─── Data Pulse (travels along a connection) ───────────
const DataPulse = memo(function DataPulse({
  x1,
  y1,
  x2,
  y2,
  delay,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
  color: string;
}) {
  return (
    <motion.circle
      r={2.5}
      fill={color}
      filter={`drop-shadow(0 0 4px ${color})`}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{
        cx: [x1, x2],
        cy: [y1, y2],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 1.5,
        delay,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: "easeInOut",
      }}
    />
  );
});

// ─── Floating Dot ──────────────────────────────────────
const FloatingDot = memo(function FloatingDot({
  x,
  y,
  size,
  delay,
  color,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={size}
      fill={color}
      filter={`drop-shadow(0 0 ${size * 2}px ${color})`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1.3, 0],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});

// ─── Typewriter Text ───────────────────────────────────
const TypewriterText = memo(function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [text]);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <span className={className}>
      {displayed}
      <span
        className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom rounded-full"
        style={{
          opacity: cursorVisible ? 1 : 0,
          background: "currentColor",
          transition: "opacity 0.1s",
        }}
      />
    </span>
  );
});

// ─── Main Component ────────────────────────────────────
export const AILoadingSplash = memo(function AILoadingSplash({
  branding,
  language = "pt",
  skillCount = 0,
}: AILoadingSplashProps) {
  // Progress bar duration scales with the number of skills selected.
  // Base: 3.8s (no skills). Each skill adds 0.8s. Capped at 8s.
  const progressDuration = Math.min(3.8 + skillCount * 0.8, 8);
  const t = SPLASH_I18N[language] || SPLASH_I18N.pt;
  const brandColor = branding.brand_color || "#6366f1";
  const accentColor = branding.brand_accent || "#06b6d4";
  const contrastColor = getContrastColor(brandColor);

  // Pre-compute node positions for the neural network visualization
  const nodes = useMemo(
    () => [
      { x: 100, y: 55 },
      { x: 55, y: 95 },
      { x: 145, y: 95 },
      { x: 35, y: 140 },
      { x: 100, y: 140 },
      { x: 165, y: 140 },
      { x: 55, y: 185 },
      { x: 145, y: 185 },
      { x: 100, y: 225 },
    ],
    []
  );

  const connections = useMemo(
    () => [
      [0, 1], [0, 2],
      [1, 3], [1, 4], [2, 4], [2, 5],
      [3, 6], [4, 6], [4, 7], [5, 7],
      [6, 8], [7, 8],
    ],
    []
  );

  const initials = branding.company_name
    ? branding.company_name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "AI";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-neutral-950 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)", scale: 1.02 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ─── Background Ambient Glow ─── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 45%, ${brandColor}15 0%, transparent 70%),
            radial-gradient(circle at 25% 65%, ${accentColor}0a 0%, transparent 50%),
            radial-gradient(circle at 75% 30%, ${brandColor}08 0%, transparent 45%)
          `,
        }}
      />

      {/* ─── Animated Grid Pattern ─── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.025 }}
        transition={{ duration: 3 }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* ─── Floating ambient particles (background depth) ─── */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`ambient-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            background: i % 2 === 0 ? `${brandColor}30` : `${accentColor}25`,
            left: `${15 + i * 10}%`,
            top: `${20 + (i * 17) % 60}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + i * 0.4,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ══════════════════════════════════════════
          TOP — Company Branding
         ══════════════════════════════════════════ */}
      <motion.div
        className="relative z-10 flex flex-col items-center pt-10 md:pt-14 gap-3 md:gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Company Logo or Initials */}
        <motion.div
          className="relative"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Glow ring behind logo */}
          <motion.div
            className="absolute -inset-4 rounded-2xl blur-2xl"
            style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}
            animate={{ opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt={branding.company_name}
              className="relative w-14 h-14 md:w-18 md:h-18 rounded-2xl object-contain bg-white border border-white/10 p-1.5 shadow-xl"
            />
          ) : (
            <div
              className="relative w-14 h-14 md:w-18 md:h-18 rounded-2xl flex items-center justify-center font-bold text-xl md:text-2xl border border-white/10 shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${brandColor}, ${accentColor || brandColor})`,
                color: contrastColor,
              }}
            >
              {initials}
            </div>
          )}
        </motion.div>

        {/* Company Name */}
        <div className="text-center">
          <h2
            className="text-lg md:text-xl font-bold tracking-tight text-white"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            {branding.company_name}
          </h2>
          {branding.tagline && (
            <motion.p
              className="text-[11px] md:text-xs text-neutral-500 mt-1 tracking-wider uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {branding.tagline}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          CENTER — AI Neural Network Animation
         ══════════════════════════════════════════ */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 md:gap-8 -mt-4"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Neural + Orbital Animation Container */}
        <div className="relative w-48 h-48 md:w-56 md:h-56">
          {/* Central Pulsing Core */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="w-10 h-10 md:w-14 md:h-14 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`,
                boxShadow: `0 0 30px ${brandColor}50, 0 0 60px ${brandColor}25, 0 0 100px ${brandColor}10`,
              }}
            />
          </motion.div>

          {/* Pulsing Ring 1 */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          >
            <div
              className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2"
              style={{ borderColor: `${brandColor}50` }}
            />
          </motion.div>

          {/* Pulsing Ring 2 (offset) */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 3, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
          >
            <div
              className="w-10 h-10 md:w-14 md:h-14 rounded-full border"
              style={{ borderColor: `${accentColor}30` }}
            />
          </motion.div>

          {/* Pulsing Ring 3 (largest, very subtle) */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1.2, 2.5, 1.2], opacity: [0.08, 0, 0.08] }}
            transition={{ duration: 4, delay: 1, repeat: Infinity, ease: "easeOut" }}
          >
            <div
              className="w-10 h-10 md:w-14 md:h-14 rounded-full border"
              style={{ borderColor: `${brandColor}20` }}
            />
          </motion.div>

          {/* Neural Network SVG */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 200 280"
            fill="none"
          >
            {/* Connections */}
            {connections.map(([from, to], i) => (
              <NeuralConnection
                key={`conn-${i}`}
                x1={nodes[from].x}
                y1={nodes[from].y}
                x2={nodes[to].x}
                y2={nodes[to].y}
                delay={i * 0.12}
                color={i % 2 === 0 ? `${brandColor}70` : `${accentColor}50`}
              />
            ))}
            {/* Data Pulses — select 4 prominent connections */}
            {[[0, 1], [2, 5], [4, 7], [6, 8]].map(([from, to], i) => (
              <DataPulse
                key={`pulse-${i}`}
                x1={nodes[from].x}
                y1={nodes[from].y}
                x2={nodes[to].x}
                y2={nodes[to].y}
                delay={i * 0.7 + 0.3}
                color={i % 2 === 0 ? brandColor : accentColor}
              />
            ))}
            {/* Nodes */}
            {nodes.map((node, i) => (
              <FloatingDot
                key={`node-${i}`}
                x={node.x}
                y={node.y}
                size={i === 0 || i === 8 ? 4.5 : 3}
                delay={i * 0.18}
                color={i % 3 === 0 ? brandColor : i % 3 === 1 ? accentColor : "#ffffff60"}
              />
            ))}
          </svg>

          {/* Orbital Particles (fewer, more elegant) */}
          {[0, 1, 2, 3].map((i) => (
            <OrbitalParticle
              key={`orbit-${i}`}
              delay={i * 0.8}
              radius={65 + i * 15}
              duration={5 + i * 0.7}
              size={2 + (i % 2)}
              color={i % 2 === 0 ? brandColor : accentColor}
              reverse={i % 2 === 1}
            />
          ))}
        </div>

        {/* Loading Text with Typewriter */}
        <div className="text-center space-y-2.5 max-w-xs md:max-w-sm px-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <h1
              className="text-lg md:text-xl font-medium text-white tracking-tight"
              style={{ fontFamily: '"Outfit", sans-serif' }}
            >
              <TypewriterText text={t.generating} />
            </h1>
          </motion.div>
          <motion.p
            className="text-xs md:text-sm text-neutral-500 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            {t.subtitle}
          </motion.p>
        </div>

        {/* Loading Dots Bar */}
        <motion.div
          className="flex gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={`dot-${i}`}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: i % 2 === 0 ? brandColor : accentColor }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.4,
                delay: i * 0.12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════
          BOTTOM — Brief.i Marketing Footer
         ══════════════════════════════════════════ */}
      <motion.div
        className="relative z-10 flex flex-col items-center pb-8 md:pb-12 gap-3 px-6 max-w-sm md:max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Progress Bar */}
        <div className="w-32 md:w-40 h-[3px] bg-neutral-800/60 rounded-full overflow-hidden mb-1">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${brandColor}, ${accentColor})`,
            }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: progressDuration, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent" />

        {/* Footer Text */}
        <p className="text-[11px] md:text-xs text-neutral-600 leading-relaxed">
          {t.footer}
        </p>

        {/* Brief.i Badge */}
        <div className="flex items-center gap-2 mt-0.5">
          <motion.div
            className="w-4 h-4 md:w-5 md:h-5 rounded-md flex items-center justify-center text-[8px] md:text-[9px] font-black"
            style={{
              background: `linear-gradient(135deg, ${brandColor}50, ${accentColor}50)`,
              color: brandColor,
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            B
          </motion.div>
          <span className="text-[10px] md:text-xs text-neutral-600 font-medium tracking-wide">
            Powered by{" "}
            <span
              className="font-bold"
              style={{
                background: `linear-gradient(90deg, ${brandColor}, ${accentColor})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Brief.i
            </span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
});

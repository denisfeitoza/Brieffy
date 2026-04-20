"use client";

import { motion } from "framer-motion";
import { memo, useMemo, useState, useEffect } from "react";
import Link from "next/link";

/* ─── Reusable animation primitives ─── */

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
      strokeWidth={1.2}
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: [0, 1, 1, 0],
        opacity: [0, 0.5, 0.5, 0],
      }}
      transition={{
        duration: 3.5,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});

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
      r={2}
      fill={color}
      filter={`drop-shadow(0 0 4px ${color})`}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{
        cx: [x1, x2],
        cy: [y1, y2],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 1.8,
        delay,
        repeat: Infinity,
        repeatDelay: 2,
        ease: "easeInOut",
      }}
    />
  );
});

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
        scale: [0, 1, 1.2, 0],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});

/* ─── Typewriter ─── */
const TypewriterText = memo(function TypewriterText({
  text,
  className,
  speed = 50,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
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
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <span className={className}>
      {displayed}
      <span
        className="inline-block w-[3px] h-[0.85em] ml-1 align-text-bottom rounded-full"
        style={{
          opacity: cursorVisible ? 1 : 0,
          background:
            "linear-gradient(180deg, #ff6029, #ffcfbc)",
          transition: "opacity 0.1s",
        }}
      />
    </span>
  );
});

import { useLanguage } from "@/i18n/LanguageContext";

/* ─── HERO ─── */
const BRAND = "#ff6029";
const ACCENT = "#ffcfbc";

/**
 * Detects if motion should be reduced — either via OS-level
 * `prefers-reduced-motion` setting OR small-screen viewport (mobile),
 * where the heavy particle animations harm scroll perf and battery.
 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqMobile = window.matchMedia('(max-width: 767px)');
    const update = () => setReduced(mqMotion.matches || mqMobile.matches);
    update();
    mqMotion.addEventListener('change', update);
    mqMobile.addEventListener('change', update);
    return () => {
      mqMotion.removeEventListener('change', update);
      mqMobile.removeEventListener('change', update);
    };
  }, []);
  return reduced;
}

export function HeroSection() {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const ambientCount = reduceMotion ? 4 : 12;
  const orbitCount = reduceMotion ? 2 : 5;

  const nodes = useMemo(
    () => [
      { x: 150, y: 40 },
      { x: 70, y: 90 },
      { x: 230, y: 90 },
      { x: 40, y: 150 },
      { x: 150, y: 150 },
      { x: 260, y: 150 },
      { x: 70, y: 210 },
      { x: 230, y: 210 },
      { x: 150, y: 260 },
    ],
    []
  );

  const connections = useMemo(
    () => [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 4],
      [2, 5],
      [3, 6],
      [4, 6],
      [4, 7],
      [5, 7],
      [6, 8],
      [7, 8],
    ],
    []
  );

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0"
    >
      {/* ─── Background Effects ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% 35%, ${BRAND}12 0%, transparent 70%),
            radial-gradient(circle at 20% 70%, ${ACCENT}08 0%, transparent 50%),
            radial-gradient(circle at 80% 25%, ${BRAND}06 0%, transparent 45%)
          `,
        }}
      />

      {/* Animated Grid */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 3 }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating ambient particles — count adapts to reduced motion / mobile */}
      {[...Array(ambientCount)].map((_, i) => (
        <motion.div
          key={`amb-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            background:
              i % 2 === 0 ? `${BRAND}25` : `${ACCENT}20`,
            left: `${8 + i * 7.5}%`,
            top: `${15 + ((i * 19) % 65)}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 3.5 + i * 0.3,
            delay: i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ─── Content ─── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          {/* Left: Text */}
          <motion.div
            className="flex-1 text-center lg:text-left max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] bg-black/[0.03] backdrop-blur-sm mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ background: ACCENT }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs text-neutral-400 font-medium">
                {t("hero.badge")}
              </span>
            </motion.div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-black leading-[1.08] mb-6"
              style={{ fontFamily: '"Outfit", sans-serif' }}
            >
              <TypewriterText text={t("hero.title1") + " "} speed={55} />
              <br />
              <span
                style={{
                  background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("hero.title2")}
              </span>
            </h1>

            {/* Sub-headline */}
            <motion.p
              className="text-base sm:text-lg md:text-xl text-neutral-600 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
            >
              {t("hero.sub1")}
              <span className="text-black font-medium">
                {t("hero.sub2")}
              </span>
              {t("hero.sub3")}
              <span className="text-black font-medium">{t("hero.sub4")}</span>.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
            >
              <Link
                href="/dashboard/register"
                className="relative group text-sm sm:text-base font-semibold text-white px-7 py-3.5 rounded-full overflow-hidden w-full sm:w-auto text-center"
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
                    background: `linear-gradient(135deg, #ffcfbc, #ff6029)`,
                  }}
                />
                {/* Glow */}
                <motion.span
                  className="absolute -inset-1 rounded-full blur-lg opacity-40"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                  }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="relative z-10">{t("hero.cta.start")}</span>
              </Link>
              <Link
                href="/dashboard/login"
                className="text-sm sm:text-base text-neutral-600 hover:text-black transition-colors border border-black/10 hover:border-black/20 px-7 py-3.5 rounded-full w-full sm:w-auto text-center backdrop-blur-sm bg-black/[0.02]"
              >
                {t("hero.cta.login")}
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Neural Network Animation */}
          <motion.div
            className="flex-shrink-0 relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1,
              delay: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Central Core */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${BRAND}, ${ACCENT})`,
                  boxShadow: `0 0 40px ${BRAND}50, 0 0 80px ${BRAND}20, 0 0 120px ${BRAND}10`,
                }}
              />
            </motion.div>

            {/* Pulsing Rings */}
            {[
              { scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4], dur: 2.5, del: 0 },
              { scale: [1, 2.2, 1], opacity: [0.15, 0, 0.15], dur: 3.5, del: 0.5 },
              { scale: [1.1, 2.8, 1.1], opacity: [0.06, 0, 0.06], dur: 4.5, del: 1 },
            ].map((ring, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: ring.scale, opacity: ring.opacity }}
                transition={{
                  duration: ring.dur,
                  delay: ring.del,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              >
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border"
                  style={{
                    borderColor: i === 0 ? `${BRAND}50` : `${ACCENT}30`,
                  }}
                />
              </motion.div>
            ))}

            {/* Neural Network SVG */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 300 300"
              fill="none"
            >
              {connections.map(([from, to], i) => (
                <NeuralConnection
                  key={`hconn-${i}`}
                  x1={nodes[from].x}
                  y1={nodes[from].y}
                  x2={nodes[to].x}
                  y2={nodes[to].y}
                  delay={i * 0.15}
                  color={i % 2 === 0 ? `${BRAND}60` : `${ACCENT}40`}
                />
              ))}
              {[
                [0, 1],
                [2, 5],
                [4, 7],
                [6, 8],
              ].map(([from, to], i) => (
                <DataPulse
                  key={`hpulse-${i}`}
                  x1={nodes[from].x}
                  y1={nodes[from].y}
                  x2={nodes[to].x}
                  y2={nodes[to].y}
                  delay={i * 0.8 + 0.5}
                  color={i % 2 === 0 ? BRAND : ACCENT}
                />
              ))}
              {nodes.map((node, i) => (
                <FloatingDot
                  key={`hnode-${i}`}
                  x={node.x}
                  y={node.y}
                  size={i === 0 || i === 8 ? 4 : 2.5}
                  delay={i * 0.2}
                  color={
                    i % 3 === 0 ? BRAND : i % 3 === 1 ? ACCENT : "#00000030"
                  }
                />
              ))}
            </svg>

            {/* Orbital Particles — fewer when reduced motion / mobile */}
            {Array.from({ length: orbitCount }, (_, i) => i).map((i) => (
              <OrbitalParticle
                key={`horbit-${i}`}
                delay={i * 0.7}
                radius={75 + i * 18}
                duration={6 + i * 0.8}
                size={2 + (i % 2)}
                color={i % 2 === 0 ? BRAND : ACCENT}
                reverse={i % 2 === 1}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}

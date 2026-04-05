"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const THINKING_MESSAGES: Record<string, string[]> = {
  pt: [
    'Analisando sua resposta...',
    'Cruzando dados ao vivo...',
    'Gerando a próxima pergunta...',
    'Processando intenção...',
    'Validando parâmetros contextuais...',
    'Ajustando modelo de linguagem...',
    'Extraindo entidades chave...',
    'Mapeando vetores de resposta...',
    'Lendo nas entrelinhas da resposta...',
    'Rodando inferência em tempo real...',
    'Calibrando o peso da próxima questão...',
    'Compilando novo fluxo de dados...',
  ],
  en: [
    'Analyzing your response...',
    'Cross-referencing live data...',
    'Generating next question...',
    'Processing intent...',
    'Validating contextual parameters...',
    'Adjusting language model...',
    'Extracting key entities...',
    'Mapping response vectors...',
    'Reading between the response lines...',
    'Running real-time inference...',
    'Calibrating question weights...',
    'Compiling new data flow...',
  ],
  es: [
    'Analizando su respuesta...',
    'Cruzando datos en vivo...',
    'Generando la próxima pregunta...',
    'Procesando intención...',
    'Validando parámetros contextuales...',
    'Ajustando modelo de lenguaje...',
    'Extrayendo entidades clave...',
    'Mapeando vectores de respuesta...',
    'Leyendo entre las líneas de la respuesta...',
    'Ejecutando inferencia en tiempo real...',
    'Calibrando el peso de la próxima pregunta...',
    'Compilando nuevo flujo de datos...',
  ],
};

export const AIThinkingAnimation = memo(function AIThinkingAnimation({ 
  language, 
  brandColor = '#ff6029',
  accentColor = '#000000',
}: { 
  language: string; 
  brandColor?: string;
  accentColor?: string;
}) {
  const msgs = THINKING_MESSAGES[language] || THINKING_MESSAGES.pt;
  const [msgIdx, setMsgIdx] = useState(() => Math.floor(Math.random() * msgs.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % msgs.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [msgs.length]);

  // Generate stable particle configs on mount
  const particles = useMemo<{ id: number; x: number; size: number; delay: number; duration: number; color: string; opacity: number }[]>(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 5 + (i * 8) % 90,
      size: 2 + (i % 3),
      delay: i * 0.15,
      duration: 2 + (i % 4) * 0.5,
      color: i % 3 === 0 ? brandColor : i % 3 === 1 ? accentColor : '#ffffff',
      opacity: i % 3 === 2 ? 0.15 : 0.4,
    })),
    [brandColor, accentColor]
  );

  // Neural wave bars config
  const waveBars = useMemo<{ id: number; delay: number; color: string }[]>(() => 
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      delay: i * 0.08,
      color: i % 2 === 0 ? brandColor : accentColor,
    })),
    [brandColor, accentColor]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-start gap-3 py-4 my-2"
    >
      {/* Floating luminous particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              bottom: '20%',
              background: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}${p.opacity > 0.3 ? '80' : '40'}, 0 0 ${p.size * 6}px ${p.color}30`,
            }}
            animate={{
              y: [0, -30 - (p.id % 4) * 8, -50 - (p.id % 3) * 12],
              opacity: [0, p.opacity, 0],
              scale: [0.5, 1.2, 0.3],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Main content row */}
      <div className="relative flex items-center gap-3">
        {/* Neural wave / audio-wave bars */}
        <div className="flex items-end gap-[3px] h-5">
          {waveBars.map(bar => (
            <motion.div
              key={bar.id}
              className="w-[3px] rounded-full"
              style={{ background: `linear-gradient(to top, ${bar.color}90, ${bar.color})` }}
              animate={{
                height: ['6px', '18px', '8px', '14px', '6px'],
                opacity: [0.5, 1, 0.6, 0.9, 0.5],
              }}
              transition={{
                duration: 1.2,
                delay: bar.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Progressive message with typewriter shimmer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={msgIdx}
            initial={{ opacity: 0, x: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.35 }}
            className="relative"
          >
            <span 
              className="text-sm font-medium font-inter"
              style={{
                background: `linear-gradient(90deg, ${brandColor}, ${accentColor}, ${brandColor})`,
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmerText 2.5s ease-in-out infinite',
              }}
            >
              {msgs[msgIdx]}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtle glow line under the animation */}
      <motion.div
        className="h-[1px] rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${brandColor}40, ${accentColor}40, transparent)`,
          width: '100%',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Inject shimmer keyframes via global style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmerText {
          0% { background-position: 100% 0; }
          50% { background-position: 0% 0; }
          100% { background-position: 100% 0; }
        }
      ` }} />
    </motion.div>
  );
});

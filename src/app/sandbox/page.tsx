"use client";

import { Message } from "@/lib/types";
import { DynamicInput } from "@/components/briefing/DynamicInput";
import { useState, useEffect, memo, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ================================================================
// MOCK QUESTIONS — Each type of input to demo
// ================================================================
const mockQuestions: Message[] = [
  {
    id: "q_text",
    role: "assistant",
    content: "Por que você faz o que faz? Me conta o que te motivou a começar e o que o negócio representa pra você hoje.",
    questionType: "text",
    microFeedback: "Vamos começar pelo propósito — isso revela muito sobre a marca.",
  },
  {
    id: "q_single",
    role: "assistant",
    content: "Seu principal foco de negócio atualmente é B2B ou B2C?",
    questionType: "single_choice",
    options: ["B2B (Empresas)", "B2C (Consumidor Final)", "Ambos"],
    allowMoreOptions: true,
  },
  {
    id: "q_card",
    role: "assistant",
    content: "Qual o estágio atual do seu negócio no mercado digital?",
    questionType: "card_selector",
    options: [
      {
        title: "Dando os Primeiros Passos",
        description: "Ainda não temos processos bem definidos. Tudo é feito muito manualmente."
      },
      {
        title: "Em Tração Inicial",
        description: "Já realizamos vendas, mas a operação ainda depende 100% de esforço ativo e orgânico."
      },
      {
        title: "Pronto para Escala",
        description: "Processos alinhados, CAQ e LTV mapeados. Preciso de tecnologia e tráfego."
      }
    ],
    microFeedback: "Entender seu estágio ajuda a calibrar a profundidade do plano.",
  },
  {
    id: "q_multi",
    role: "assistant",
    content: "Quais dos canais abaixo você já utiliza na sua estratégia atual?",
    questionType: "multiple_choice",
    options: ["Instagram", "Google Ads", "LinkedIn B2B", "E-mail Marketing", "Nenhum de forma estruturada"],
  },
  {
    id: "q_multi_slider",
    role: "assistant",
    content: "Como você definiria o perfil da sua marca nos seguintes eixos?",
    questionType: "multi_slider",
    options: [
      { label: "Formalidade", min: 1, max: 5, minLabel: "Descontraído", maxLabel: "Corporativo", defaultValue: 3 },
      { label: "Ousadia", min: 1, max: 5, minLabel: "Tradicional", maxLabel: "Disruptivo", defaultValue: 3 },
      { label: "Comunicação", min: 1, max: 5, minLabel: "Direta/Técnica", maxLabel: "Emocional", defaultValue: 3 },
    ],
  },
  {
    id: "q_slider",
    role: "assistant",
    content: "Numa escala de 1 a 10, qual o nível de maturidade digital da sua empresa hoje?",
    questionType: "slider",
    minOption: 1,
    maxOption: 10,
    microFeedback: "Isso calibra o tom técnico vs. introdutório das recomendações.",
  },
  {
    id: "q_boolean",
    role: "assistant",
    content: "Sua empresa já possui uma identidade visual consolidada (Logo, Cores, Tipografia)?",
    questionType: "boolean_toggle",
  },
  {
    id: "q_color",
    role: "assistant",
    content: "Se sua marca fosse uma dessas cores sólidas, qual melhor representaria sua essência?",
    questionType: "color_picker",
    options: ["#007BFF", "#00A6FF", "#5BC0EB", "#FF9F1C", "#FF4365"],
  },
];

// ================================================================
// AI THINKING ANIMATION (same as production, inlined for sandbox)
// ================================================================
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

const AIThinkingAnimation = memo(function AIThinkingAnimation({
  brandColor = '#6366f1',
  accentColor = '#06b6d4',
}: {
  brandColor?: string;
  accentColor?: string;
}) {
  const msgs = THINKING_MESSAGES.pt;
  const [msgIdx, setMsgIdx] = useState(() => Math.floor(Math.random() * msgs.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % msgs.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [msgs.length]);

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

      <div className="relative flex items-center gap-3">
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

      <motion.div
        className="h-[1px] rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${brandColor}40, ${accentColor}40, transparent)`,
          width: '100%',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

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

// ================================================================
// SANDBOX PAGE
// ================================================================
export default function SandboxPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);

  // Simulated "AI thinking" delay (1.5-3s)
  const THINKING_DELAY_MS = 2200;

  const activeMessage = mockQuestions[currentIdx];

  // Simulate sending answer → loading → next question
  const submitAnswer = (ans: unknown) => {
    if (isLoading) return;
    console.log(`[Sandbox] Answer:`, ans);

    // Phase 1: Hide current question, show loading
    setShowQuestion(false);
    setIsLoading(true);
    setInputText("");

    // Phase 2: After "thinking" delay, show next question
    setTimeout(() => {
      setCurrentIdx(prev => (prev + 1) % mockQuestions.length);
      setIsLoading(false);
      setShowQuestion(true);
    }, THINKING_DELAY_MS);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white selection:bg-indigo-500/30 font-inter">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 shrink-0 border-b border-neutral-900 bg-neutral-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:bg-neutral-800 p-2 rounded-full transition-colors flex items-center justify-center">
             <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <span className="font-outfit font-medium text-lg tracking-tight">Sandbox — AI Transition Demo</span>
        </div>

        {/* Question type tabs (scrollable on mobile) */}
        <div className="hidden md:flex gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800 overflow-x-auto max-w-full">
          {mockQuestions.map((q, i) => (
             <button
               key={q.id}
               onClick={() => {
                 if (isLoading) return;
                 setShowQuestion(false);
                 setTimeout(() => {
                   setCurrentIdx(i);
                   setInputText("");
                   setShowQuestion(true);
                 }, 200);
               }}
               className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                 currentIdx === i 
                   ? "bg-indigo-500 text-white shadow-md" 
                   : "text-neutral-500 hover:text-white"
               }`}
             >
               {q.questionType}
             </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
        <div className="min-h-full w-full flex flex-col items-center p-6 lg:p-12">
          <div className="flex-1 shrink-0" />
          <div className="w-full max-w-3xl flex flex-col space-y-8 shrink-0 py-8">

            {/* Micro-feedback (if present on active message) */}
            <AnimatePresence mode="wait">
              {showQuestion && activeMessage.microFeedback && (
                <motion.div
                  key={`micro-${currentIdx}`}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm w-fit max-w-md"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  <span className="text-[13px] text-zinc-400 leading-relaxed font-medium">{activeMessage.microFeedback}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question text */}
            <AnimatePresence mode="wait">
              {showQuestion && (
                <motion.h1
                  key={`q-${currentIdx}`}
                  className="text-2xl md:text-5xl font-outfit font-medium tracking-tight text-white leading-tight"
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {activeMessage.content}
                </motion.h1>
              )}
            </AnimatePresence>

            {/* AI Thinking Animation */}
            <AnimatePresence>
              {isLoading && (
                <AIThinkingAnimation
                  brandColor="#6366f1"
                  accentColor="#06b6d4"
                />
              )}
            </AnimatePresence>

            {/* Input area */}
            <AnimatePresence mode="wait">
              {showQuestion && !isLoading && (
                <motion.div
                  key={`input-${currentIdx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="p-6 md:p-8 border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/10"
                >
                  <DynamicInput
                    activeMessage={activeMessage}
                    inputText={inputText}
                    setInputText={setInputText}
                    submitAnswer={submitAnswer}
                    handleSend={() => submitAnswer(inputText || "(demo answer)")}
                    isLoading={false}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    generateMoreOptions={() => {}}
                    isGeneratingMore={false}
                    voiceLanguage="pt"
                    messages={mockQuestions}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status indicator */}
            <div className="flex items-center gap-3 pt-4">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-xs text-neutral-600 font-mono">
                {isLoading 
                  ? `Thinking... → next: ${mockQuestions[(currentIdx + 1) % mockQuestions.length].questionType}`
                  : `Ready — ${activeMessage.questionType} (${currentIdx + 1}/${mockQuestions.length})`
                }
              </span>
            </div>
          </div>
          <div className="flex-1 shrink-0" />
        </div>
      </main>
    </div>
  );
}

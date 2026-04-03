"use client";

import { useBriefing } from "@/lib/BriefingContext";
import { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AILoadingSplash } from "./AILoadingSplash";
import { Button } from "@/components/ui/button";

import { ArrowRight, ArrowLeft, RefreshCw, Lock, Copy, Sparkles, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import { DynamicInput } from "./DynamicInput";
import { InsightsPanel } from "./InsightsPanel";
import { getContrastColor } from "@/lib/utils";

const I18N: Record<string, Record<string, string>> = {
  pt: {
    docGenerated: "Documento Gerado ✓",
    lastStep: "Última Etapa",
    generatingDoc: "Gerando seu Documento...",
    analyzingResponses: "Analisando todas as {count} respostas para criar um briefing completo.",
    downloadDoc: "Baixar Documento (.md)",
    goToDashboard: "Ir para Dashboard",
    allSet: "Tudo Certo! Vamos gerar seu diagnóstico.",
    uploadRef: "Analisamos todas as suas respostas para gerar um briefing completo e personalizado.",
    generateDiag: "Gerar Diagnóstico",
    loadingStep: "Carregando etapa...",
    goBackAdjust: "Voltar e ajustar resposta anterior",
    docReadyTitle: "Seu Diagnóstico Está Pronto",
    docReadyDesc: "Você pode editar este documento, baixá-lo ou acessar mais tarde pelo link seguro.",
    secureLink: "Link Seguro de Acesso Contínuo",
    secureLinkDesc: "Guarde este link e a palavra-chave para revisar o documento a qualquer momento.",
    password: "Senha",
    copyAccess: "Copiar Acesso",
    clipboardMsg: "Aqui está o link para o seu diagnóstico interativo:",
    clipboardPassword: "Senha de acesso:",
    clipboardSuccess: "Link e senha copiados!",
    thankYouTitle: "Obrigado por participar!",
    thankYouSubtitle: "Suas respostas foram registradas com sucesso.",
    thankYouBody: "Nossa equipe vai analisar cada detalhe com atenção para criar algo verdadeiramente alinhado com a sua visão.",
    thankYouCta: "Pode fechar esta página",
  },
  en: {
    docGenerated: "Document Generated ✓",
    lastStep: "Last Step",
    generatingDoc: "Generating your Document...",
    analyzingResponses: "Analyzing all {count} responses to build a complete briefing.",
    downloadDoc: "Download Document (.md)",
    goToDashboard: "Go to Dashboard",
    allSet: "All set! Let's generate your diagnosis.",
    uploadRef: "We'll analyze all your responses to generate a complete, personalized briefing.",
    generateDiag: "Generate Diagnosis",
    loadingStep: "Loading step...",
    goBackAdjust: "Go back and adjust previous answer",
    docReadyTitle: "Your Diagnosis is Ready",
    docReadyDesc: "You can edit this document, download it, or access it later via the secure link.",
    secureLink: "Secure Continuous Access Link",
    secureLinkDesc: "Save this link and passphrase to review the document at any time.",
    password: "Password",
    copyAccess: "Copy Access",
    clipboardMsg: "Here is the link to your interactive diagnosis:",
    clipboardPassword: "Access password:",
    clipboardSuccess: "Link and password copied!",
    thankYouTitle: "Thank you for participating!",
    thankYouSubtitle: "Your responses have been recorded successfully.",
    thankYouBody: "Our team will carefully analyze every detail to create something truly aligned with your vision.",
    thankYouCta: "You can close this page",
  },
  es: {
    docGenerated: "Documento Generado ✓",
    lastStep: "Última Etapa",
    generatingDoc: "Generando su Documento...",
    analyzingResponses: "Analizando las {count} respuestas para crear un briefing completo.",
    downloadDoc: "Descargar Documento (.md)",
    goToDashboard: "Ir al Dashboard",
    allSet: "¡Todo listo! Generemos su diagnóstico.",
    uploadRef: "Analizaremos todas sus respuestas para generar un briefing completo y personalizado.",
    generateDiag: "Generar Diagnóstico",
    loadingStep: "Cargando etapa...",
    goBackAdjust: "Volver y ajustar respuesta anterior",
    docReadyTitle: "Su Diagnóstico Está Listo",
    docReadyDesc: "Puede editar este documento, descargarlo o acceder más tarde a través del enlace seguro.",
    secureLink: "Enlace de Acceso Seguro Continuo",
    secureLinkDesc: "Guarde este enlace y la contraseña para revisar el documento en cualquier momento.",
    password: "Contraseña",
    copyAccess: "Copiar Acceso",
    clipboardMsg: "Aquí está el enlace a su diagnóstico interactivo:",
    clipboardPassword: "Contraseña de acceso:",
    clipboardSuccess: "¡Enlace y contraseña copiados!",
    thankYouTitle: "¡Gracias por participar!",
    thankYouSubtitle: "Sus respuestas se han registrado con éxito.",
    thankYouBody: "Nuestro equipo analizará cada detalle con atención para crear algo verdaderamente alineado con su visión.",
    thankYouCta: "Puede cerrar esta página",
  }
};

const BrandedLogo = memo(function BrandedLogo({ branding, size = 'md', isSolid = false }: { branding: { logo_url: string; company_name: string; brand_color: string }; size?: 'sm' | 'md', isSolid?: boolean }) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const initials = branding.company_name
    ? branding.company_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AI';

  if (branding.logo_url) {
    return (
      <img
        src={branding.logo_url}
        alt={branding.company_name}
        className={`${sizeClasses} flex-shrink-0 rounded-xl object-contain bg-white border border-white/10 p-0.5 shadow-sm`}
      />
    );
  }

  const contrastColor = getContrastColor(branding.brand_color || '#000000');
  const fallbackBg = isSolid ? (contrastColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') : `linear-gradient(135deg, ${branding.brand_color}40, ${branding.brand_color}20)`;
  const fallbackColor = isSolid ? contrastColor : branding.brand_color;

  return (
    <div
      className={`${sizeClasses} flex-shrink-0 rounded-xl flex items-center justify-center font-bold border ${isSolid ? 'border-transparent' : 'border-white/10'}`}
      style={{ background: fallbackBg, color: fallbackColor }}
    >
      {initials}
    </div>
  );
});

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
  language, 
  brandColor = '#6366f1',
  accentColor = '#06b6d4',
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

interface TypeformWizardProps {
  hasAccessPassword?: boolean;
  accessSessionId?: string;
}

export function TypeformWizard({ hasAccessPassword = false, accessSessionId }: TypeformWizardProps) {
  const {
    messages,
    currentStepIndex,
    goBack,
    goNext,
    submitAnswer,
    isLoading,
    isGeneratingMore,
    generateMoreOptions,
    isUploadStep,
    chosenLanguage,
    generatedDocument,
    isGeneratingDocument,
    documentError,
    generateDocument,
    branding,
    editToken,
    editPassphrase,
    selectedPackageDetails,
    briefingState,
    basalInfo,
    detectedSignals,
    engagementLevel,
    isOwner,
    isOnboarding,
  } = useBriefing();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/dashboard/login';
  };

  const t = I18N[chosenLanguage] || I18N.pt;

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // ─── AI Splash Screen on First Load ───
  const isResumedSession = messages.length > 1 && currentStepIndex > 0;
  const [showSplash, setShowSplash] = useState(!isResumedSession);
  const [justExitedSplash, setJustExitedSplash] = useState(false);
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [accessUnlocked, setAccessUnlocked] = useState(!hasAccessPassword);

  const dismissSplash = useCallback(() => {
    setShowSplash(false);
    setJustExitedSplash(true);
    setTimeout(() => setJustExitedSplash(false), 800);
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    // If password is required and not yet unlocked, don't auto-dismiss
    if (hasAccessPassword && !accessUnlocked) return;

    const splashDuration = Math.min(1800 + (selectedPackageDetails?.length || 0) * 200, 2800);
    splashTimerRef.current = setTimeout(dismissSplash, splashDuration);
    return () => {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessUnlocked]);

  const handleAccessUnlocked = useCallback(() => {
    setAccessUnlocked(true);
  }, []);

  // Track navigation direction for directional slide animations
  const prevStepRef = useRef(currentStepIndex);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (currentStepIndex > prevStepRef.current) {
      setDirection(1);
    } else if (currentStepIndex < prevStepRef.current) {
      setDirection(-1);
    }
    prevStepRef.current = currentStepIndex;
  }, [currentStepIndex]);

  const activeColor = useMemo(() => {
    const colorPickerMsg = messages.find(m => m.questionType === 'color_picker' && m.userAnswer && Array.isArray(m.userAnswer) && m.userAnswer.length > 0);
    return colorPickerMsg 
      ? (colorPickerMsg.userAnswer as string[])[0] 
      : (briefingState.brand_color as string) || branding.brand_color || '#171717';
  }, [messages, briefingState.brand_color, branding.brand_color]);

  const activeFont = useMemo(() => {
    const fontMsg = messages.find(m => {
      const txt = m.content?.toLowerCase() || '';
      const isFontQ = txt.includes('tipografi') || (txt.includes('fonte') && !txt.includes('inspiraç'));
      return isFontQ && typeof m.userAnswer === 'string';
    });
    const fontChoiceResult = fontMsg ? (fontMsg.userAnswer as string).split(' - ')[0].trim() : null;
    const fontChoice = fontChoiceResult && !fontChoiceResult.toLowerCase().includes('nenhuma') && !fontChoiceResult.toLowerCase().includes('none') && !fontChoiceResult.toLowerCase().includes('padrão')
      ? fontChoiceResult.replace(/[^a-zA-Z0-9 ]/g, '') 
      : null;
    return fontChoice || branding.brand_font || 'Outfit';
  }, [messages, branding.brand_font]);

  useEffect(() => {
    // BUG-08 FIX: Track how many wizards are using the same font with a ref-count
    // to prevent premature cleanup when multiple instances share the same font.
    if (activeFont && activeFont !== 'Outfit' && activeFont !== 'Inter' && activeFont !== 'Aa') {
      const linkId = `google-font-${activeFont.replace(/\s+/g, '-')}`;
      const countAttr = 'data-use-count';
      let el = document.getElementById(linkId) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.id = linkId;
        el.rel = 'stylesheet';
        el.href = `https://fonts.googleapis.com/css2?family=${activeFont.replace(/ /g, '+')}&display=swap`;
        el.setAttribute(countAttr, '1');
        document.head.appendChild(el);
      } else {
        el.setAttribute(countAttr, String(parseInt(el.getAttribute(countAttr) || '0') + 1));
      }
    }
    return () => {
      // BUG-08 FIX: Only remove the <link> when no other instances reference it
      if (activeFont && activeFont !== 'Outfit' && activeFont !== 'Inter' && activeFont !== 'Aa') {
        const linkId = `google-font-${activeFont.replace(/\s+/g, '-')}`;
        const el = document.getElementById(linkId);
        if (el) {
          const count = parseInt(el.getAttribute('data-use-count') || '1') - 1;
          if (count <= 0) {
            el.remove();
          } else {
            el.setAttribute('data-use-count', String(count));
          }
        }
      }
    };
  }, [activeFont]);

  const activeCompanyName = useMemo(() => {
    const dynamicName = (briefingState.nome_empresa as string) || 
                        (briefingState.company_name as string) || 
                        (briefingState.empresa as string) || 
                        (branding.company_name && branding.company_name !== 'Smart Briefing' ? branding.company_name : '');
    return dynamicName || 'Sua Empresa';
  }, [briefingState.nome_empresa, briefingState.company_name, briefingState.empresa, branding.company_name]);

  const isDiscoveryPhase = currentStepIndex >= 1 && currentStepIndex <= 3;

  // Focus input on step change se for open text question foi movido para o DynamicInput para ter controle melhor (com preventScroll)
  // Aqui vamos rolar a view container para o topo quando a pergunta muda
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [currentStepIndex, isUploadStep]);

  // Shift+Enter to skip current question
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter' && !isLoading && currentStepIndex > 0) {
        e.preventDefault();
        submitAnswer('(skipped)');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, currentStepIndex, submitAnswer]);

  const handleSend = useCallback(() => {
    const currentMsg = messages[currentStepIndex];
    const isInteractiveType = (
      currentMsg?.questionType === 'single_choice' ||
      currentMsg?.questionType === 'multiple_choice' ||
      currentMsg?.questionType === 'card_selector' ||
      currentMsg?.questionType === 'boolean_toggle' ||
      currentMsg?.questionType === 'slider' ||
      currentMsg?.questionType === 'multi_slider'
    );

    if (!inputText.trim() && !currentMsg?.userAnswer && !isInteractiveType) {
      return; 
    }
    
    if (inputText.trim()) {
      submitAnswer(inputText.trim());
      setInputText("");
    } else {
      goNext();
    }
  }, [messages, currentStepIndex, inputText, submitAnswer, goNext]);

  const activeMessage = messages[currentStepIndex];

  // ==========================
  // ESTÁGIO DE FINALIZAÇÃO & DOCUMENTO
  // ==========================
  if (isUploadStep) {
    // ════════════════════════════════════════════════════════════
    // CLIENT THANK YOU SCREEN — Non-owner sees a beautiful 
    // animated thank you page, NOT the document/results
    // ════════════════════════════════════════════════════════════
    if (!isOwner) {
      return (
        <div className="flex flex-col h-full bg-neutral-950 text-white">
          <main className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center max-w-lg space-y-8 relative"
            >
              {/* Background glow */}
              <div className="absolute inset-0 -z-10">
                <motion.div
                  className="w-72 h-72 rounded-full mx-auto"
                  style={{ background: `radial-gradient(circle, ${activeColor}15 0%, transparent 70%)` }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Animated Check */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.7, type: 'spring', stiffness: 150 }}
                className="relative"
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: `${activeColor}40`, background: `${activeColor}10` }}
                >
                  <motion.svg
                    width="48" height="48" viewBox="0 0 48 48"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                  >
                    <motion.path
                      d="M14 24 L22 32 L34 16"
                      fill="none"
                      stroke={activeColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                    />
                  </motion.svg>
                </div>
                <motion.div
                  className="absolute inset-0 w-24 h-24 rounded-full"
                  style={{ boxShadow: `0 0 40px ${activeColor}25, 0 0 80px ${activeColor}10` }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>

              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="space-y-3"
              >
                <h1 className="text-3xl md:text-4xl font-outfit font-medium tracking-tight text-white">
                  {t.thankYouTitle}
                </h1>
                <p className="text-lg text-neutral-300 font-medium">
                  {t.thankYouSubtitle}
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                className="text-neutral-500 leading-relaxed max-w-md"
              >
                {t.thankYouBody}
              </motion.p>

              {/* Brand badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.4, duration: 0.5 }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/5"
                style={{ background: `${activeColor}08` }}
              >
                <BrandedLogo branding={{ ...branding, brand_color: activeColor, company_name: activeCompanyName }} size="sm" isSolid />
                <span className="text-sm font-medium text-neutral-400" style={{ fontFamily: `"${activeFont}", sans-serif` }}>
                  {activeCompanyName}
                </span>
              </motion.div>

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none -z-5 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      background: activeColor,
                      left: `${15 + i * 14}%`,
                      top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0, 0.6, 0],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      delay: i * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {/* Subtle footer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 0.5 }}
                className="text-xs text-neutral-700 pt-4"
              >
                {t.thankYouCta}
              </motion.p>
            </motion.div>
          </main>
        </div>
      );
    }

    // ════════════════════════════════════════════════════════════
    // OWNER DOCUMENT VIEW — Full document generation flow
    // ════════════════════════════════════════════════════════════
    return (
      <div className="flex flex-col h-full bg-neutral-950 text-white selection:bg-indigo-500/30">
        <header className="flex items-center justify-between p-4 md:p-6 h-20 shrink-0">
          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-2xl shadow-lg border border-white/5 transition-transform hover:scale-[1.02]"
            style={{ 
              backgroundColor: activeColor,
              color: getContrastColor(activeColor),
              fontFamily: `"${activeFont}", sans-serif`
            }}
          >
            <BrandedLogo branding={{ ...branding, brand_color: activeColor, company_name: activeCompanyName }} size="sm" isSolid />
            <div className="hidden sm:flex flex-col justify-center">
              <span className="font-outfit font-bold text-sm tracking-tight leading-tight" style={{ fontFamily: `"${activeFont}", sans-serif` }}>
                {activeCompanyName}
              </span>
              {branding.tagline && (
                <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80 truncate max-w-[180px]">
                  {branding.tagline}
                </span>
              )}
            </div>
          </div>
          <div className="text-sm font-medium text-neutral-500 flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
            {generatedDocument ? (I18N[chosenLanguage] || I18N.pt).docGenerated : (I18N[chosenLanguage] || I18N.pt).lastStep}
          </div>
        </header>

        <main ref={mainRef} className="flex-1 w-full overflow-y-auto overflow-x-hidden">
          <div className="min-h-full w-full flex flex-col items-center p-6 lg:p-12">
            <div className="flex-1 shrink-0" />
            <AnimatePresence mode="wait">
              {/* STATE 1: Generating document */}
              {isGeneratingDocument && (
                <motion.div
                  key="generating-doc"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center justify-center space-y-6 text-center shrink-0 py-8"
                >
                  <div className="relative flex items-center justify-center w-28 h-28 mb-6">
                    {/* Outer ring */}
                    <div className="absolute w-full h-full rounded-full border-2 border-white/5"></div>
                    {/* Spinning gradient ring */}
                    <motion.div
                      className="absolute w-full h-full rounded-full"
                      style={{
                        border: '3px solid transparent',
                        borderTopColor: activeColor,
                        borderRightColor: `${branding.brand_accent || '#06b6d4'}80`,
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Pulsing glow */}
                    <motion.div
                      className="absolute w-full h-full rounded-full"
                      style={{ boxShadow: `0 0 30px ${activeColor}30, 0 0 60px ${activeColor}15` }}
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <Sparkles className="w-10 h-10" style={{ color: activeColor }} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-outfit font-medium text-white">{(I18N[chosenLanguage] || I18N.pt).generatingDoc}</h2>
                    <p className="text-lg text-neutral-400">{(I18N[chosenLanguage] || I18N.pt).analyzingResponses.replace('{count}', String(messages.length))}</p>
                    {/* Animated dots indicator */}
                    <div className="flex gap-1.5 justify-center pt-2">
                      {[0, 1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: i % 2 === 0 ? activeColor : (branding.brand_accent || '#06b6d4') }}
                          animate={{ scale: [1, 2, 1], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.4, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STATE 2: Document ready — render it */}
              {generatedDocument && !isGeneratingDocument && (
                <motion.div
                  key="document-ready"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-5xl flex flex-col space-y-6 shrink-0 py-8"
                >
                  <div className="flex flex-col space-y-2 text-center mb-4">
                    <h2 className="text-3xl font-outfit text-white">{t.docReadyTitle}</h2>
                    <p className="text-neutral-400">{t.docReadyDesc}</p>
                  </div>

                  {/* Public Link Card */}
                  {editToken && editPassphrase && (
                    <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2 text-indigo-400 font-medium">
                          <Lock className="w-4 h-4" /> {t.secureLink}
                        </div>
                        <p className="text-sm text-neutral-400">
                          {t.secureLinkDesc}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300">
                          {t.password}: <span className="text-white font-bold">{editPassphrase}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-transparent border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                          onClick={() => {
                            const url = `${window.location.origin}/doc/${editToken}`;
                            navigator.clipboard.writeText(`${t.clipboardMsg}\n${url}\n\n${t.clipboardPassword} ${editPassphrase}`);
                            toast.success(t.clipboardSuccess);
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" /> {t.copyAccess}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Document Editor Component (Read/Edit/Save/PDF) */}
                  <DocumentEditor 
                    initialContent={generatedDocument} 
                    onSave={async (newContent) => {
                       // Opcional: Apenas chamamos API ou atualizamos estado
                       // a atualização de estado no BriefingContext pode ser feita, mas não é estritamente obrigatório
                       // se formos salvar localmente também. A API que faremos (já fizemos) save é a route.ts.
                       const res = await fetch("/api/document/save", {
                         method: "POST",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({
                           editToken,
                           passphrase: editPassphrase,
                           documentContent: newContent
                         })
                       });
                       if (!res.ok) throw new Error("Erro ao salvar.");
                    }}
                  />

                </motion.div>
              )}

              {/* STATE 3: Ready to generate */}
              {!generatedDocument && !isGeneratingDocument && (
                <motion.div
                  key="upload-step"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-2xl flex flex-col items-center text-center space-y-8 shrink-0 py-8"
                >
                  <div className="space-y-4">
                     <h1 className="text-3xl md:text-5xl font-outfit font-medium tracking-tight text-white leading-tight">
                      {/* BUG-07 FIX: Show error title when document generation failed */}
                      {documentError
                        ? (chosenLanguage === 'en' ? 'Something went wrong' : chosenLanguage === 'es' ? 'Algo salió mal' : 'Algo deu errado')
                        : t.allSet}
                    </h1>
                    <p className="text-lg text-neutral-400 max-w-lg mx-auto leading-relaxed">
                      {documentError ? documentError : t.uploadRef}
                    </p>
                  </div>

                  {/* BUG-07 FIX: Show warning icon when there is an error */}
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${documentError ? 'bg-red-500/10 border border-red-500/20' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
                    {documentError
                      ? <span className="text-4xl">⚠️</span>
                      : <Sparkles className="w-10 h-10 text-indigo-400" />
                    }
                  </div>
                  
                  <div className="w-full pt-4">
                    <Button 
                        size="lg"
                        className={`w-full h-16 text-lg font-medium rounded-2xl transition-all ${
                          documentError
                            ? 'bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]'
                        }`}
                        onClick={generateDocument}
                      >
                        {documentError
                          ? (chosenLanguage === 'en' ? '↺ Try Again' : chosenLanguage === 'es' ? '↺ Reintentar' : '↺ Tentar Novamente')
                          : <>{t.generateDiag} <ArrowRight className="w-5 h-5 ml-2" /></>
                        }
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex-1 shrink-0" />
          </div>
        </main>
      </div>
    )
  }

  // ==========================
  //  AI SPLASH SCREEN (first load)
  // ==========================
  if (showSplash) {
    return (
      <AnimatePresence mode="wait">
        <AILoadingSplash
          branding={{
            logo_url: branding.logo_url,
            company_name: activeCompanyName,
            brand_color: branding.brand_color,
            brand_accent: branding.brand_accent,
            tagline: branding.tagline,
          }}
          language={chosenLanguage}
          skillCount={selectedPackageDetails?.length || 0}
          requirePassword={hasAccessPassword && !accessUnlocked}
          sessionId={accessSessionId}
          onAccessUnlocked={handleAccessUnlocked}
        />
      </AnimatePresence>
    );
  }

  // ==========================
  //  TYPEFORM VIEW
  // ==========================
  if (!activeMessage || activeMessage.role !== "assistant") {
     // Safeguard for synchronization delays
     return <div className="h-full flex items-center justify-center flex-col gap-4 text-white">{(I18N[chosenLanguage] || I18N.pt).loadingStep}</div>;
  }

  return (
    <motion.div
      className="flex flex-col h-full bg-neutral-950 text-white selection:bg-indigo-500/30"
      style={{ '--brand-color': branding.brand_color, '--brand-accent': branding.brand_accent } as React.CSSProperties}
      initial={justExitedSplash ? { opacity: 0, scale: 0.98, filter: 'blur(4px)' } : false}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between p-4 md:p-6 h-20 shrink-0">
        <div className="flex items-center gap-3">
          {currentStepIndex > 0 && (
            <Button variant="ghost" size="icon" className="hover:bg-neutral-800 shrink-0 border border-neutral-800 bg-neutral-900 shadow-sm rounded-full" onClick={goBack}>
              <ArrowLeft className="w-5 h-5 text-neutral-400" />
            </Button>
          )}

          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-2xl shadow-lg border border-white/5 transition-transform hover:scale-[1.02]"
            style={{ 
              backgroundColor: activeColor,
              color: getContrastColor(activeColor),
              fontFamily: `"${activeFont}", sans-serif`
            }}
          >
            <BrandedLogo branding={{ ...branding, brand_color: activeColor, company_name: activeCompanyName }} size="sm" isSolid />
            <div className="hidden sm:flex flex-col justify-center">
              <span className="font-outfit font-bold text-sm tracking-tight leading-tight" style={{ fontFamily: `"${activeFont}", sans-serif` }}>
                {activeCompanyName}
              </span>
              {branding.tagline && (
                <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80 truncate max-w-[180px]">
                  {branding.tagline}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Packages, Progress and Logout */}
        <div className="flex items-center gap-3">
          {/* Active AI Packages — grouped by tier, humanized for client */}
          {selectedPackageDetails && selectedPackageDetails.length > 0 && (() => {
            const TIER_LABELS: Record<string, string> = {
              branding: 'Marca',
              strategy: 'Estratégia',
              execution: 'Execução',
              consulting: 'Consultoria',
            };
            const activeTiers = [...new Set(
              selectedPackageDetails.map(p => p.tier).filter(Boolean)
            )] as string[];
            const tierLabels = activeTiers.map(t => TIER_LABELS[t] || t);
            return (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-3 h-3" />
                  {tierLabels.length > 0 ? tierLabels.join(' · ') : `${selectedPackageDetails.length} especialidades`}
                </div>
              </div>
            );
          })()}

          {/* Progresso Simplificado */}
          <div className="text-sm font-medium text-neutral-500 flex items-center gap-2 bg-neutral-900 px-4 py-1.5 rounded-full border border-neutral-800">
             {(() => {
               const skillDilution = 1 / (1 + (selectedPackageDetails?.length || 0) * 0.22);
               const rawPct = basalInfo.basalCoverage * 100;
               const diluted = rawPct >= 100 ? 100 : Math.min(rawPct * skillDilution, 95);
               return Math.max(Math.round(diluted), currentStepIndex > 0 ? 3 : 0);
             })()}%
          </div>

          {/* Logout — only visible during onboarding */}
          {isOnboarding && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Sair da conta"
              className="shrink-0 rounded-full w-9 h-9 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-neutral-800"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Progress Bar — diluted by skill count so it doesn't rush to 100% early */}
      {(() => {
        // With more skills, the briefing is longer, so we dilute the visual progress.
        // skillDilution compresses the basalCoverage so the bar fills slower.
        // 0 skills → 1.0 (no dilution), 1 skill → 0.82, 3 skills → 0.57, 5 skills → 0.45
        const skillDilution = 1 / (1 + (selectedPackageDetails?.length || 0) * 0.22);
        const rawProgress = basalInfo.basalCoverage * 100;
        // Apply dilution but keep a minimum of 5% and never exceed 95% until truly done
        const dilutedProgress = rawProgress >= 100 ? 100 : Math.min(rawProgress * skillDilution, 95);
        const displayProgress = Math.max(dilutedProgress, currentStepIndex > 0 ? 3 : 0);

        return (
          <div className="h-1 bg-neutral-900/50 w-full shrink-0 overflow-hidden">
            <motion.div
              className="h-full rounded-r-full"
              style={{
                background: `linear-gradient(90deg, ${activeColor}, ${branding.brand_accent || '#06b6d4'}, ${activeColor})`,
              }}
              initial={false}
              animate={{ 
                width: `${displayProgress}%` 
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        );
      })()}

      {/* Main Content Area: Centered, Large Text */}
      <main ref={mainRef} className="flex-1 w-full overflow-y-auto overflow-x-hidden">
        <div className="min-h-full w-full flex flex-col relative px-6 lg:px-12">
          
          <div className="flex-[1_0_auto]" />

          <div className="w-full max-w-3xl mx-auto flex flex-col shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${currentStepIndex}`}
                initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full flex flex-col space-y-8 md:space-y-12 py-6 md:py-12"
                drag={activeMessage.questionType === 'boolean_toggle' || activeMessage.questionType === 'slider' || activeMessage.questionType === 'color_picker' ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_e, info) => {
                  // Swipe right to go back (threshold 100px)
                  if (info.offset.x > 100 && currentStepIndex > 0 && !isLoading) {
                    goBack();
                  }
                }}
              >
                {/* Discovery Phase Badge — warm invitation to speak freely */}
                {isDiscoveryPhase && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/15 text-indigo-300/90 text-sm font-medium w-fit mb-3"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400/60 animate-pulse" />
                    {chosenLanguage === 'en' ? 'Speak freely — the more details, the better the result'
                      : chosenLanguage === 'es' ? 'Habla libremente — cuantos más detalles, mejor el resultado'
                      : 'Fale livremente — quanto mais detalhes, melhor o resultado'}
                  </motion.div>
                )}

                {/* Depth Question Badge */}
                {activeMessage.isDepthQuestion && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold w-fit mb-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    {chosenLanguage === 'en' ? 'Going deeper...' : chosenLanguage === 'es' ? 'Profundizando...' : 'Aprofundando...'}
                  </motion.div>
                )}

                {/* Micro-feedback — subtle strategic insight from the AI (no emojis) */}
                {activeMessage.microFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm w-fit mb-5 max-w-md"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                    <span className="text-[13px] text-zinc-400 leading-relaxed font-medium">{activeMessage.microFeedback}</span>
                  </motion.div>
                )}

                {/* The IA Formatted Question — stagger entrance for premium feel */}
                <motion.h1
                  className="text-2xl md:text-5xl font-outfit font-medium tracking-tight text-white leading-tight"
                  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  {activeMessage.content}
                </motion.h1>

                {/* Engagement encouragement when fatigue detected */}
                {engagementLevel === 'low' && currentStepIndex > 3 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-neutral-500 mt-2"
                  >
                    {chosenLanguage === 'en' ? '⚡ Almost there — just a few key questions left.' 
                      : chosenLanguage === 'es' ? '⚡ Ya casi — solo quedan algunas preguntas clave.' 
                      : '⚡ Quase lá — restam poucas perguntas importantes.'}
                  </motion.p>
                )}


                {/* Progressive Loading Feedback — reduces perceived wait time */}
                {isLoading && (
                  <AIThinkingAnimation 
                    language={chosenLanguage} 
                    brandColor={branding.brand_color}
                    accentColor={branding.brand_accent || '#06b6d4'}
                  />
                )}

                {/* Box Híbrido Dinamico (Text, Audio, Single Choice, Multiple Choice, Slider, Color Picker) */}
                <DynamicInput 
                  activeMessage={activeMessage}
                  inputText={inputText}
                  setInputText={setInputText}
                  submitAnswer={submitAnswer}
                  handleSend={handleSend}
                  isLoading={isLoading}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                  generateMoreOptions={generateMoreOptions}
                  isGeneratingMore={isGeneratingMore}
                  voiceLanguage={chosenLanguage}
                  messages={messages}
                  isDiscoveryPhase={isDiscoveryPhase}
                />

                {currentStepIndex > 0 && !isDiscoveryPhase && (
                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-between gap-2 pt-4 opacity-70 hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={goBack} 
                      disabled={isLoading}
                      className="text-neutral-400 hover:text-white rounded-full px-4 h-10 border border-transparent hover:border-neutral-800 hover:bg-neutral-900/50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {(I18N[chosenLanguage] || I18N.pt).goBackAdjust}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => submitAnswer('(skipped)')}
                      disabled={isLoading}
                      className="text-neutral-500 hover:text-neutral-300 rounded-full px-4 h-10 text-xs gap-2"
                    >
                      {chosenLanguage === 'en' ? 'Skip' : chosenLanguage === 'es' ? 'Omitir' : 'Pular'}
                      <span className="hidden sm:inline opacity-40 text-[10px] font-mono ml-1">Shift+Enter</span>
                    </Button>
                  </div>
                )}
                {/* Mobile swipe hint — only on first few steps */}
                {currentStepIndex > 0 && currentStepIndex <= 3 && (
                  <motion.p
                    className="text-[10px] text-neutral-600 text-center sm:hidden mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 0.5 }}
                  >
                    {chosenLanguage === 'en' ? '← swipe right to go back' : chosenLanguage === 'es' ? '← desliza a la derecha para volver' : '← deslize para a direita para voltar'}
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex-[2_0_auto]" />

        </div>
      </main>

      {/* Active Listening Insights Panel — visible only to agency owner */}
      <InsightsPanel signals={detectedSignals} isOwner={isOwner} />
    </motion.div>
  );
}

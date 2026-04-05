"use client";

import { useBriefing } from "@/lib/BriefingContext";
import { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AILoadingSplash } from "./AILoadingSplash";
import { ClientThankYouScreen } from "./ClientThankYouScreen";
import { Button } from "@/components/ui/button";

import { ArrowRight, ArrowLeft, RefreshCw, Lock, Copy, Sparkles, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import { DynamicInput } from "./DynamicInput";
import { InsightsPanel } from "./InsightsPanel";
import { BriefingActionsMenu } from "./BriefingActionsMenu";
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
    uploadRef: "- Salvar progresso\n- Retomar depois\n- Histórico de respostas\n- **Resetar Briefing**: Permite apagar o histórico de interações e recomeçar a conversa mantendo os dados basais da empresa (Acesso via menu \"Mais Opções\").",
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
    reviewAnswers: "Conferir minhas respostas",
    reviewDesc: "Caso tenha se esquecido ou pulado algo importante, suas respostas já foram enviadas mas você pode revisar o painel abaixo ou simplesmente fechar esta página.",
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
    reviewAnswers: "Review my answers",
    reviewDesc: "If you forgot or skipped something important, your answers are already sent but you can review them below or simply close this page.",
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
    reviewAnswers: "Revisar mis respuestas",
    reviewDesc: "Si olvidó o se saltó algo importante, sus respuestas ya han sido enviadas pero puede revisarlas aquí abajo o simplemente cerrar esta página.",
  }
};

import { BrandedLogo } from "./BrandedLogo";

import { AIThinkingAnimation } from "./AIThinkingAnimation";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (I18N[chosenLanguage] || I18N.pt) as any;

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // ─── Draft auto-save to localStorage (debounced) ───
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = accessSessionId ? `brieffy_draft_${accessSessionId}_${currentStepIndex}` : null;

  useEffect(() => {
    if (!draftKey || !inputText.trim()) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try { localStorage.setItem(draftKey, inputText); } catch { /* quota */ }
    }, 800);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [inputText, draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved && !inputText) setInputText(saved);
    } catch { /* SSR */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // ─── AI Splash Screen on First Load ───
  const isResumedSession = messages.length > 1 && currentStepIndex > 0;
  // ALWAYS show splash on first load to mask API continuation latency and prevent initial flicker
  const [showSplash, setShowSplash] = useState(true);
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

    // If the briefing is currently loading (e.g. fetching the next question on resume),
    // we hold the splash screen to prevent flickering questions.
    if (isLoading) {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
      return; 
    }

    const splashDuration = 800; // Fast 800ms loading duration for highly fluid UX
    splashTimerRef.current = setTimeout(dismissSplash, splashDuration);
    return () => {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessUnlocked, hasAccessPassword, isLoading, showSplash, dismissSplash]);

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
    if (isOnboarding) {
      const colorPickerMsg = messages.find(m => m.questionType === 'color_picker' && m.userAnswer && Array.isArray(m.userAnswer) && m.userAnswer.length > 0);
      const dynamicColor = colorPickerMsg 
        ? (colorPickerMsg.userAnswer as string[])[0] 
        : (briefingState.brand_color as string);
      if (dynamicColor) return dynamicColor;
    }
    return branding.brand_color || '#171717';
  }, [isOnboarding, messages, briefingState.brand_color, branding.brand_color]);

  const activeFont = useMemo(() => {
    if (isOnboarding) {
      const fontMsg = messages.find(m => {
        const txt = m.content?.toLowerCase() || '';
        const isFontQ = txt.includes('tipografi') || (txt.includes('fonte') && !txt.includes('inspiraç'));
        return isFontQ && typeof m.userAnswer === 'string';
      });
      const fontChoiceResult = fontMsg ? (fontMsg.userAnswer as string).split(' - ')[0].trim() : null;
      const fontChoice = fontChoiceResult && !fontChoiceResult.toLowerCase().includes('nenhuma') && !fontChoiceResult.toLowerCase().includes('none') && !fontChoiceResult.toLowerCase().includes('padrão')
        ? fontChoiceResult.replace(/[^a-zA-Z0-9 ]/g, '') 
        : null;
      if (fontChoice) return fontChoice;
    }
    return branding.brand_font || 'Outfit';
  }, [isOnboarding, messages, branding.brand_font]);

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
    if (isOnboarding) {
      const dynamicName = (briefingState.nome_empresa as string) || 
                          (briefingState.company_name as string) || 
                          (briefingState.empresa as string);
      if (dynamicName) return dynamicName;
    }
    return (branding.company_name && branding.company_name !== 'Smart Briefing') ? branding.company_name : 'Sua Empresa';
  }, [isOnboarding, briefingState.nome_empresa, briefingState.company_name, briefingState.empresa, branding.company_name]);

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
      if (draftKey) try { localStorage.removeItem(draftKey); } catch { /* ok */ }
    } else {
      goNext();
    }
  }, [messages, currentStepIndex, inputText, submitAnswer, goNext, draftKey]);

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
        <ClientThankYouScreen
          branding={branding}
          activeColor={activeColor}
          activeCompanyName={activeCompanyName}
          activeFont={activeFont}
          t={t}
          messages={messages}
        />
      );
    }

    // ════════════════════════════════════════════════════════════
    // OWNER DOCUMENT VIEW — Full document generation flow
    // ════════════════════════════════════════════════════════════
    return (
      <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text)] selection:bg-[#FF6029]/20">
        <header className="flex items-center justify-between p-4 md:p-6 h-20 shrink-0">
          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.02]"
            style={{ 
              backgroundColor: activeColor,
              color: getContrastColor(activeColor),
              fontFamily: `"${activeFont}", sans-serif`
            }}
          >
            <BrandedLogo branding={{ ...branding, brand_color: activeColor, company_name: activeCompanyName }} size="sm" isSolid />
            <div className="hidden sm:flex flex-col justify-center">
              <span className="font-bold text-sm tracking-tight leading-tight" style={{ fontFamily: `"${activeFont}", sans-serif` }}>
                {activeCompanyName}
              </span>
              {branding.tagline && (
                <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80 truncate max-w-[180px]">
                  {branding.tagline}
                </span>
              )}
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
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
                        borderRightColor: `${branding.brand_accent || '#000000'}80`,
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
                    <h2 className="text-3xl font-medium text-[var(--text)]" style={{ fontFamily: '"Outfit", sans-serif' }}>{(I18N[chosenLanguage] || I18N.pt).generatingDoc}</h2>
                    <p className="text-lg text-gray-500">{(I18N[chosenLanguage] || I18N.pt).analyzingResponses.replace('{count}', String(messages.length))}</p>
                    {/* Animated dots indicator */}
                    <div className="flex gap-1.5 justify-center pt-2">
                      {[0, 1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: i % 2 === 0 ? activeColor : (branding.brand_accent || '#000000') }}
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
                    <h2 className="text-3xl text-[var(--text)]" style={{ fontFamily: '"Outfit", sans-serif' }}>{t.docReadyTitle}</h2>
                    <p className="text-gray-500">{t.docReadyDesc}</p>
                  </div>

                  {/* Public Link Card */}
                  {editToken && editPassphrase && (
                    <div className="bg-[var(--orange)]/5 border border-[var(--orange)]/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2 text-[var(--orange)] font-medium">
                          <Lock className="w-4 h-4" /> {t.secureLink}
                        </div>
                        <p className="text-sm text-gray-500">
                          {t.secureLinkDesc}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-black">
                          {t.password}: <span className="text-black font-bold">{editPassphrase}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
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
                     <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-[var(--text)] leading-tight" style={{ fontFamily: '"Outfit", sans-serif' }}>
                      {/* BUG-07 FIX: Show error title when document generation failed */}
                      {documentError
                        ? (chosenLanguage === 'en' ? 'Something went wrong' : chosenLanguage === 'es' ? 'Algo salió mal' : 'Algo deu errado')
                        : t.allSet}
                    </h1>
                    <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
                      {documentError ? documentError : t.uploadRef}
                    </p>
                  </div>

                  {/* BUG-07 FIX: Show warning icon when there is an error */}
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${documentError ? 'bg-red-500/10 border border-red-500/20' : 'bg-[var(--orange)]/10 border border-[var(--orange)]/20'}`}>
                    {documentError
                      ? <span className="text-4xl">⚠️</span>
                      : <Sparkles className="w-10 h-10 text-[var(--orange)]" />
                    }
                  </div>
                  
                  <div className="w-full pt-4">
                    <Button 
                        size="lg"
                        className={`w-full h-16 text-lg font-medium rounded-2xl transition-all ${
                          documentError
                            ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                            : 'bg-[var(--orange)] text-white hover:opacity-90 shadow-xl hover:shadow-2xl border-none'
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
  //  TYPEFORM VIEW & HEADER
  // ==========================
  const wizardContent = (!activeMessage || activeMessage.role !== 'assistant') ? null : (
    <motion.div
      className="flex flex-col bg-[var(--bg)] text-[var(--text)] selection:bg-[#FF6029]/20 absolute inset-0 w-full"
      style={{ '--brand-color': branding.brand_color, '--brand-accent': branding.brand_accent, zIndex: 10 } as React.CSSProperties}
      initial={justExitedSplash ? { opacity: 0, scale: 0.98, filter: 'blur(4px)' } : false}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between p-4 md:p-6 h-20 shrink-0">
        <div className="flex items-center gap-3">
          {currentStepIndex > 0 && (
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 shrink-0 border border-gray-200 bg-white shadow-sm rounded-full w-10 h-10 transition-all text-gray-700" onClick={goBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          {(isOnboarding || (activeCompanyName !== 'Brieffy' && activeCompanyName !== 'Smart Briefing')) && (
            <div 
              className="flex items-center gap-3 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.02]"
              style={{ 
                backgroundColor: activeColor,
                color: getContrastColor(activeColor),
                fontFamily: `"${activeFont}", sans-serif`
              }}
            >
              <BrandedLogo branding={{ ...branding, brand_color: activeColor, company_name: activeCompanyName }} size="sm" isSolid />
              <div className="hidden sm:flex flex-col justify-center">
                <span className="font-bold text-sm tracking-tight leading-tight" style={{ fontFamily: `"${activeFont}", sans-serif` }}>
                  {activeCompanyName}
                </span>
                {branding.tagline && (
                  <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80 truncate max-w-[180px]">
                    {branding.tagline}
                  </span>
                )}
              </div>
            </div>
          )}
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
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full bg-[var(--orange)]/10 text-[var(--orange)] border border-[var(--orange)]/20">
                  <Sparkles className="w-3 h-3" />
                  {tierLabels.length > 0 ? tierLabels.join(' · ') : `${selectedPackageDetails.length} especialidades`}
                </div>
              </div>
            );
          })()}

          {/* Progresso Simplificado */}
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
             {(() => {
               const skillDilution = 1 / (1 + (selectedPackageDetails?.length || 0) * 0.22);
               const rawPct = basalInfo.basalCoverage * 100;
               const diluted = rawPct >= 100 ? 100 : Math.min(rawPct * skillDilution, 95);
               return Math.max(Math.round(diluted), currentStepIndex > 0 ? 3 : 0);
             })()}%
          </div>

          {/* More Actions Menu */}
          <BriefingActionsMenu 
            isOwner={!!isOwner} 
            isOnboarding={!!isOnboarding} 
          />
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
          <div className="h-1 bg-gray-200 w-full shrink-0 overflow-hidden">
            <motion.div
              className="h-full rounded-r-full"
              style={{
                background: `linear-gradient(90deg, ${activeColor}, ${branding.brand_accent || '#000000'}, ${activeColor})`,
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
          
          <div className="flex-1 min-h-0" />

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
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[var(--orange)]/5 border border-[var(--orange)]/20 text-[var(--orange)] text-sm font-medium w-fit mb-3 shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--orange)] animate-pulse" />
                    {chosenLanguage === 'en' ? 'Speak freely — the more details, the better the result'
                      : chosenLanguage === 'es' ? 'Habla libremente — cuantos más detalles, mejor el resultado'
                      : 'Fale livremente — quanto mais detalhes, melhor o resultado'}
                  </motion.div>
                )}


                {/* Micro-feedback — subtle strategic insight from the AI (no emojis) */}
                {activeMessage.microFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm w-fit mb-5 max-w-md"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--orange)] mt-2 shrink-0" />
                    <span className="text-[13px] text-gray-500 leading-relaxed font-medium">{activeMessage.microFeedback}</span>
                  </motion.div>
                )}

                {/* The IA Formatted Question — stagger entrance for premium feel */}
                <motion.h1
                  className="text-2xl md:text-5xl font-medium tracking-tight text-[var(--text)] leading-tight"
                  style={{ fontFamily: `"${activeFont}", "Outfit", sans-serif` }}
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
                    className="text-sm text-gray-500 mt-2"
                  >
                    {chosenLanguage === 'en' ? '⚡ Almost there — just a few key questions left.' 
                      : chosenLanguage === 'es' ? '⚡ Ya casi — solo quedan algunas preguntas clave.' 
                      : '⚡ Quase lá — restam poucas perguntas importantes.'}
                  </motion.p>
                )}


                {/* User Answer Confirmation (Visible while loading) */}
                {isLoading && activeMessage.userAnswer && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex justify-center w-full"
                  >
                    <div className="inline-block px-5 py-2.5 rounded-2xl bg-[var(--text)]/5 text-[var(--text)]/70 text-sm md:text-base border border-[var(--text)]/10">
                      {Array.isArray(activeMessage.userAnswer) 
                        ? activeMessage.userAnswer.join(', ') 
                        : (typeof activeMessage.userAnswer === 'string' ? activeMessage.userAnswer : '')}
                    </div>
                  </motion.div>
                )}

                {/* Progressive Loading Feedback — reduces perceived wait time */}
                {isLoading && (
                  <div className="mt-8">
                    <AIThinkingAnimation 
                      language={chosenLanguage} 
                      brandColor={branding.brand_color}
                      accentColor={branding.brand_accent || '#000000'}
                    />
                  </div>
                )}

                {!isLoading && (
                  <>
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
                          className="text-gray-500 hover:text-[var(--text)] rounded-full px-4 h-10 border border-transparent hover:border-gray-200 hover:bg-gray-50"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          {(I18N[chosenLanguage] || I18N.pt).goBackAdjust}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => submitAnswer('(skipped)')}
                          disabled={isLoading}
                          className="text-gray-400 hover:text-gray-600 rounded-full px-4 h-10 text-xs gap-2"
                        >
                          {chosenLanguage === 'en' ? 'Skip' : chosenLanguage === 'es' ? 'Omitir' : 'Pular'}
                          <span className="hidden sm:inline opacity-40 text-[10px] font-mono ml-1">Shift+Enter</span>
                        </Button>
                      </div>
                    )}
                    {/* Mobile swipe hint — only on first few steps */}
                    {currentStepIndex > 0 && currentStepIndex <= 3 && (
                      <motion.p
                        className="text-[10px] text-gray-400 text-center sm:hidden mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 0.5 }}
                      >
                        {chosenLanguage === 'en' ? '← swipe right to go back' : chosenLanguage === 'es' ? '← desliza a la derecha para volver' : '← deslize para a direita para voltar'}
                      </motion.p>
                    )}
                  </>
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

  return (
    <div className="h-full w-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {showSplash && (
          <AILoadingSplash
            key="splash"
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
        )}
      </AnimatePresence>

      {!showSplash && wizardContent}
      
      {!showSplash && !wizardContent && (
        <div className="h-full w-full flex items-center justify-center flex-col gap-4 text-[var(--text)] absolute inset-0 bg-[var(--bg)]" style={{ zIndex: 10 }}>
          <div className="w-6 h-6 border-b-2 border-current rounded-full animate-spin text-[var(--orange)]" />
        </div>
      )}
    </div>
  );
}

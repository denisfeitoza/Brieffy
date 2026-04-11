"use client";

import { useBriefing } from "@/lib/BriefingContext";
import { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AILoadingSplash } from "./AILoadingSplash";
import { ClientThankYouScreen } from "./ClientThankYouScreen";
import { MilestoneScreen } from "./MilestoneScreen";
import { Button } from "@/components/ui/button";

import { ArrowRight, ArrowLeft, RefreshCw, Lock, Copy, Sparkles, LogOut, FastForward, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DynamicInput } from "./DynamicInput";
import { InsightsPanel } from "./InsightsPanel";
import { BrandedLogo } from "./BrandedLogo";
import { AIThinkingAnimation } from "./AIThinkingAnimation";
import { PingMonitor } from "./PingMonitor";

interface TranslationMap {
  docGenerated: string;
  lastStep: string;
  generatingDoc: string;
  analyzingResponses: string;
  downloadDoc: string;
  goToDashboard: string;
  allSet: string;
  uploadRef: string;
  generateDiag: string;
  loadingStep: string;
  goBackAdjust: string;
  docReadyTitle: string;
  docReadyDesc: string;
  secureLink: string;
  secureLinkDesc: string;
  password: string;
  copyAccess: string;
  clipboardMsg: string;
  clipboardPassword: string;
  clipboardSuccess: string;
  thankYouTitle: string;
  thankYouSubtitle: string;
  thankYouBody: string;
  thankYouCta: string;
  reviewAnswers: string;
  reviewDesc: string;
  speakFreely: string;
  skipFiles: string;
  questionTitle: string;
  skipOptional: string;
  skipOptionalSkip: string;
  skipOptionalDesc: string;
  skipText: string;
  fileConstraints: string;
  attachedFiles: string;
  sendFileBtnPrefix: string;
  fileWord: string;
  filesWord: string;
  withTextWord: string;
  forceFinishBtn: string;
  forceFinishTitle: string;
  forceFinishDesc: string;
  forceFinishCancel: string;
  forceFinishConfirm: string;
}

const I18N: Record<string, TranslationMap> = {
  pt: {
    docGenerated: "Diagnóstico Gerado ✓",
    lastStep: "Última Etapa",
    generatingDoc: "Gerando seu Diagnóstico...",
    analyzingResponses: "Criando seu diagnóstico completo baseado em {count} respostas.",
    downloadDoc: "Baixar PDF",
    goToDashboard: "Acessar Painel",
    allSet: "Tudo pronto! Gerando seu diagnóstico.",
    uploadRef: "Estamos processando suas respostas para gerar um briefing estratégico único.",
    generateDiag: "Ver Diagnóstico",
    loadingStep: "Aguarde...",
    goBackAdjust: "Voltar e ajustar anterior",
    docReadyTitle: "Seu Diagnóstico Está Pronto",
    docReadyDesc: "O documento foi gerado com sucesso e está pronto para revisão.",
    secureLink: "Link de Acesso Seguro",
    secureLinkDesc: "Guarde este link para revisar o documento a qualquer momento.",
    password: "Senha",
    copyAccess: "Copiar Link",
    clipboardMsg: "Acesse aqui o seu diagnóstico interativo:",
    clipboardPassword: "Senha:",
    clipboardSuccess: "Copiado com sucesso!",
    thankYouTitle: "Briefing Finalizado!",
    thankYouSubtitle: "Suas respostas foram registradas.",
    thankYouBody: "Nossa equipe analisará cada detalhe para criar algo alinhado com sua visão.",
    thankYouCta: "Voltar ao Hub",
    reviewAnswers: "Revisar Respostas",
    reviewDesc: "Você pode conferir as informações enviadas abaixo.",
    speakFreely: "Fale livremente — quanto mais detalhes, melhor",
    skipFiles: "Pular (Não tenho arquivos no momento)",
    questionTitle: "Pergunta",
    skipOptional: "Opcional",
    skipOptionalSkip: "Pule se quiser!",
    skipOptionalDesc: "Se a pergunta não fizer sentido para o momento atual da empresa, fique à vontade para pular.",
    skipText: "Pular",
    fileConstraints: "PDF, PNG, JPG (Múltiplos permitidos, Max 5MB cada)",
    attachedFiles: "Arquivos anexados:",
    sendFileBtnPrefix: "Enviar",
    fileWord: "arquivo",
    filesWord: "arquivos",
    withTextWord: "+ texto",
    forceFinishBtn: "Forçar Encerrar",
    forceFinishTitle: "Forçar Encerramento?",
    forceFinishDesc: "Faremos apenas as 2 últimas perguntas obrigatórias (algo a acrescentar e anexos de arquivos) e o encerramento do briefing será concluído hoje. Deseja prosseguir?",
    forceFinishCancel: "Cancelar",
    forceFinishConfirm: "Entendi, Encerrar",
  },
  en: {
    docGenerated: "Diagnosis Generated ✓",
    lastStep: "Final Step",
    generatingDoc: "Generating your Diagnosis...",
    analyzingResponses: "Building your complete diagnosis based on {count} responses.",
    downloadDoc: "Download PDF",
    goToDashboard: "Go to Dashboard",
    allSet: "All set! Generating your diagnosis.",
    uploadRef: "We are processing your answers to generate a unique strategic briefing.",
    generateDiag: "View Diagnosis",
    loadingStep: "Waiting...",
    goBackAdjust: "Go back and adjust",
    docReadyTitle: "Your Diagnosis is Ready",
    docReadyDesc: "The document has been successfully generated and is ready for review.",
    secureLink: "Secure Access Link",
    secureLinkDesc: "Save this link to review the document at any time.",
    password: "Password",
    copyAccess: "Copy Link",
    clipboardMsg: "Access your interactive diagnosis here:",
    clipboardPassword: "Password:",
    clipboardSuccess: "Copied successfully!",
    thankYouTitle: "Briefing Completed!",
    thankYouSubtitle: "Your responses have been recorded.",
    thankYouBody: "Our team will analyze every detail to create something aligned with your vision.",
    thankYouCta: "Back to Hub",
    reviewAnswers: "Review Answers",
    reviewDesc: "You can check the submitted information below.",
    speakFreely: "Speak freely — the more details, the better",
    skipFiles: "Skip (I don't have files right now)",
    questionTitle: "Question",
    skipOptional: "Optional",
    skipOptionalSkip: "Skip if needed!",
    skipOptionalDesc: "If this question doesn't make sense for your current context, feel free to skip it.",
    skipText: "Skip",
    fileConstraints: "PDF, PNG, JPG (Multiple allowed, Max 5MB each)",
    attachedFiles: "Attached files:",
    sendFileBtnPrefix: "Send",
    fileWord: "file",
    filesWord: "files",
    withTextWord: "+ text",
    forceFinishBtn: "Force Finish",
    forceFinishTitle: "Force Finish?",
    forceFinishDesc: "We will only ask the last 2 mandatory questions (additional remarks and file attachments) before closing the briefing. Do you wish to continue?",
    forceFinishCancel: "Cancel",
    forceFinishConfirm: "Got it, Finish",
  },
  es: {
    docGenerated: "Diagnóstico Gerado ✓",
    lastStep: "Paso Final",
    generatingDoc: "Generando su Diagnóstico...",
    analyzingResponses: "Creando su diagnóstico completo basado en {count} respuestas.",
    downloadDoc: "Descargar PDF",
    goToDashboard: "Ir al Dashboard",
    allSet: "¡Todo listo! Generando su diagnóstico.",
    uploadRef: "Estamos procesando sus respuestas para generar un briefing estratégico único.",
    generateDiag: "Ver Diagnóstico",
    loadingStep: "Espere...",
    goBackAdjust: "Volver y ajustar",
    docReadyTitle: "Su Diagnóstico Está Listo",
    docReadyDesc: "El documento se ha generado con éxito y está listo para su revisión.",
    secureLink: "Enlace de Acceso Seguro",
    secureLinkDesc: "Guarde este enlace para revisar el documento en cualquier momento.",
    password: "Clave",
    copyAccess: "Copiar Enlace",
    clipboardMsg: "Acceda a su diagnóstico interactivo aquí:",
    clipboardPassword: "Clave:",
    clipboardSuccess: "¡Copiado con éxito!",
    thankYouTitle: "¡Briefing Finalizado!",
    thankYouSubtitle: "Sus respuestas han sido registradas.",
    thankYouBody: "Nuestro equipo analizará cada detalle para crear algo alineado con su visión.",
    thankYouCta: "Volver al Hub",
    reviewAnswers: "Revisar Respuestas",
    reviewDesc: "Puede consultar la información enviada a continuación.",
    speakFreely: "Hable libremente — cuantos más detalles, mejor",
    skipFiles: "Omitir (No tengo archivos en este momento)",
    questionTitle: "Pregunta",
    skipOptional: "Opcional",
    skipOptionalSkip: "¡Omita si lo desea!",
    skipOptionalDesc: "Si la pregunta no tiene sentido para el contexto actual, siéntete libre de omitirla.",
    skipText: "Omitir",
    fileConstraints: "PDF, PNG, JPG (Múltiples permitidos, Máx 5MB c/u)",
    attachedFiles: "Archivos adjuntos:",
    sendFileBtnPrefix: "Enviar",
    fileWord: "archivo",
    filesWord: "archivos",
    withTextWord: "+ texto",
    forceFinishBtn: "Forzar Cierre",
    forceFinishTitle: "¿Forzar Cierre?",
    forceFinishDesc: "Haremos solo las 2 últimas preguntas obligatorias (comentarios iniciales y archivos adjuntos) y el briefing concluirá. ¿Deseas continuar?",
    forceFinishCancel: "Cancelar",
    forceFinishConfirm: "Entendido, Cerrar",
  }
};

interface TypeformWizardProps {
  hasAccessPassword?: boolean;
  accessSessionId?: string;
}

export function TypeformWizard({ hasAccessPassword = false, accessSessionId }: TypeformWizardProps) {
  const {
    messages,
    currentStepIndex,
    goBack,
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
    basalInfo,
    isOwner,
    detectedSignals,
    engagementLevel,
    pendingCheckpoint,
    dismissCheckpoint,
  } = useBriefing();

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [accessUnlocked, setAccessUnlocked] = useState(!hasAccessPassword);
  const [dismissedSkipHint, setDismissedSkipHint] = useState(false);
  const [showForceFinishModal, setShowForceFinishModal] = useState(false);

  // Auto-dismiss milestone after progress bar completes (~2.5s)
  useEffect(() => {
    if (!pendingCheckpoint) return;
    const timer = setTimeout(() => dismissCheckpoint(), 2800);
    return () => clearTimeout(timer);
  }, [pendingCheckpoint, dismissCheckpoint]);
  
  const mainRef = useRef<HTMLElement>(null);
  const [prevStep, setPrevStep] = useState(currentStepIndex);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (currentStepIndex !== prevStep) {
    setDirection(currentStepIndex > prevStep ? 1 : -1);
    setPrevStep(currentStepIndex);
  }

  const activeMessage = messages[currentStepIndex];
  const isFinished = !!generatedDocument;
  const isDiscoveryPhase = currentStepIndex === 0;

  const t = (I18N[chosenLanguage] || I18N.pt);

  const activeColor = useMemo(() => {
    const colorMsg = messages.slice().reverse().find(m => m.questionType === 'color_picker' && Array.isArray(m.userAnswer) && m.userAnswer.length > 0);
    if (colorMsg && Array.isArray(colorMsg.userAnswer)) {
      return colorMsg.userAnswer[0] as string;
    }
    return branding.brand_color || '#171717';
  }, [messages, branding.brand_color]);

  const activeLogoUrl = useMemo(() => {
    const uploadMsg = messages.slice().reverse().find(m => m.userAnswer && typeof m.userAnswer === 'string' && m.userAnswer.includes('[Anexos via UI]:'));
    if (uploadMsg && typeof uploadMsg.userAnswer === 'string') {
      const match = uploadMsg.userAnswer.match(/\[Anexos via UI\]:\s*(.+)/);
      if (match && match[1]) {
        const urls = match[1].split(',').map(s => s.trim());
        const imgUrl = urls.find(u => u.match(/\.(png|jpe?g|webp|svg|gif|avif)/i) || u.includes("supabase.co/storage"));
        if (imgUrl) return imgUrl;
      }
    }
    return branding.logo_url;
  }, [messages, branding.logo_url]);

  const activeFont = useMemo(() => {
    return (branding.brand_font && branding.brand_font !== 'Outfit') ? branding.brand_font : 'DM Sans';
  }, [branding.brand_font]);

  const activeCompanyName = useMemo(() => {
    // If it's the generic placeholder, prioritize a cleaner brand name
    if (branding.company_name === 'Sua Empresa') return 'Brieffy';
    return branding.company_name || 'Brieffy';
  }, [branding.company_name]);


  const displayProgress = useMemo(() => {
    if (isFinished || isUploadStep) return 100;
    const rawPct = (basalInfo.basalCoverage || 0) * 100;
    const skillCount = selectedPackageDetails?.length || 0;
    const skillDilution = 1 / (1 + skillCount * 0.22);
    const dilutedBasal = rawPct * skillDilution;
    const stepsFloor = Math.min(currentStepIndex * 4, 92);
    const combined = Math.max(dilutedBasal, stepsFloor);
    const capped = Math.min(Math.round(combined), 95);
    return Math.max(capped, 3);
  }, [isFinished, isUploadStep, basalInfo.basalCoverage, selectedPackageDetails?.length, currentStepIndex]);

  const handleSend = useCallback((text?: string) => {
    const val = text !== undefined ? text : inputText;
    if (!val.trim()) return;
    submitAnswer(val);
    setInputText("");
  }, [inputText, submitAnswer]);

  const handleAccessUnlocked = useCallback(() => {
    setAccessUnlocked(true);
  }, []);

  const dismissSplash = useCallback(() => setShowSplash(false), []);

  // Early return if no message (safety)
  if (!activeMessage && !isUploadStep && !isFinished) {
     return (
       <div className="h-full w-full flex items-center justify-center bg-[var(--bg)]">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--orange)]" />
       </div>
     );
  }

  // ==========================
  //  CONTENT RENDERERS
  // ==========================

  const renderContent = () => {
    // 1. FINISHED STATE (Thank You Screen)
    if (isFinished) {
      return (
        <ClientThankYouScreen 
          branding={{ ...branding, logo_url: activeLogoUrl }}
          activeColor={activeColor}
          activeCompanyName={activeCompanyName}
          activeFont={activeFont}
          t={t}
          messages={messages}
        />
      );
    }



    // 3. WIZARD FLOW
    return (
      <motion.div
        key={`step-${currentStepIndex}`}
        initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto w-full flex flex-col flex-1 h-full min-h-full py-2 sm:py-6 md:py-12">
          <div className="flex-1 flex flex-col justify-center space-y-6 md:space-y-8 shrink-0 pb-6">
            {/* Discovery Badge */}
            {isDiscoveryPhase && (
               <motion.div
                 initial={{ opacity: 0, y: -8 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--orange)]/5 border border-[var(--orange)]/20 text-[var(--orange)] text-sm font-medium w-fit"
               >
                 <span className="w-2 h-2 rounded-full bg-[var(--orange)] animate-pulse" />
                 {t.speakFreely}
               </motion.div>
             )}

             {/* Micro-feedback */}
             {activeMessage?.microFeedback && (
               <motion.div
                 initial={{ opacity: 0, y: 12 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="inline-flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm w-fit max-w-md"
               >
                 <span className="w-1.5 h-1.5 rounded-full bg-[var(--orange)] mt-2 shrink-0" />
                 <span className="text-[13px] text-gray-500 font-medium">{activeMessage.microFeedback}</span>
               </motion.div>
             )}

             {/* Question Text */}
             <h1 
               className={`font-medium text-[var(--text)] transition-all duration-500 ${
                 activeMessage?.questionType === 'text' || (activeMessage?.questionType === 'single_choice' && (activeMessage?.options?.length || 0) > 5)
                   ? 'text-[42px] sm:text-[56px] md:text-[68px] tracking-[-0.03em] leading-[1.05]'
                   : 'text-[30px] sm:text-[36px] md:text-[44px] tracking-[-0.02em] leading-[1.12] md:leading-[1.1]'
               }`}
               style={{ fontFamily: `"${activeFont}", sans-serif` }}
             >
               {activeMessage?.content}
             </h1>
          </div>

            {/* Input Area */}
            <div className="w-full mt-6 sm:mt-auto shrink-0 flex flex-col justify-end">
              {documentError ? (
                <div className="flex flex-col items-center justify-center p-6 bg-red-50/50 border border-red-100 rounded-3xl w-full mx-auto max-w-xl text-center">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <X className="w-6 h-6" />
                  </div>
                  <h3 className="text-red-900 font-semibold text-lg mb-2">Ops, tivemos um problema!</h3>
                  <p className="text-red-600/80 font-medium mb-6 text-sm">{documentError}</p>
                  <Button 
                    onClick={() => generateDocument()} 
                    className="bg-[var(--orange)] hover:bg-[var(--orange-dark)] text-white rounded-full px-8 h-12 shadow-sm font-medium transition-all hover:scale-105 active:scale-95"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              ) : isLoading || isGeneratingDocument ? (
                <div className="pb-16 md:pb-32 w-full">
                  <AIThinkingAnimation 
                    language={chosenLanguage} 
                    brandColor={activeColor}
                    accentColor={branding.brand_accent || '#000000'}
                  />
                </div>
              ) : (
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
                  showVoiceTutorial={currentStepIndex === 1 || activeMessage?.id === 'final-system-question'}
                />
              )}
            </div>

            {/* Actions / Navigation */}
            {!isLoading && currentStepIndex > 0 && !isDiscoveryPhase && (
              <div className="flex items-center justify-between pt-4">
                <Button 
                  variant="ghost" 
                  onClick={goBack}
                  className="text-gray-500 hover:text-black rounded-full px-4 sm:px-6 h-12"
                >
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t.goBackAdjust}</span>
                </Button>
                <div className="relative shrink-0 flex justify-end items-center gap-2">
                  <AnimatePresence>
                    {currentStepIndex === 6 && !inputText && !dismissedSkipHint && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ delay: 0.5, duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
                        className="absolute bottom-[calc(100%+8px)] right-0 bg-gray-900 border border-white/10 text-white p-4 rounded-[1.25rem] shadow-2xl w-[calc(100vw-2rem)] max-w-[18rem] md:w-72 md:max-w-none pointer-events-none origin-bottom-right z-50 flex items-start gap-3 sm:gap-4"
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDismissedSkipHint(true); }}
                          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors pointer-events-auto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="bg-gray-700/50 rounded-[0.85rem] p-2.5 shrink-0 shadow-inner border border-white/5">
                          <FastForward className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="flex flex-col pt-0.5 text-left pr-4">
                          <span className="font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-1">
                            {t.skipOptional}
                          </span>
                          <span className="font-semibold text-[15px] mb-1 leading-tight">
                            {t.skipOptionalSkip}
                          </span>
                          <span className="text-[13px] text-gray-300 leading-relaxed">
                            {t.skipOptionalDesc}
                          </span>
                        </div>
                        {/* Pointer triangle */}
                        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-gray-900 border-r border-b border-white/10 rotate-45 rounded-sm" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {currentStepIndex >= 30 && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowForceFinishModal(true)}
                      className="text-[var(--orange)] hover:text-orange-600 hover:bg-orange-50 rounded-full px-6 h-12 text-sm transition-colors font-bold mr-1"
                    >
                      {t.forceFinishBtn}
                    </Button>
                  )}

                  <Button 
                    variant="ghost" 
                    onClick={() => submitAnswer('(skipped)')}
                    className="text-gray-400 hover:text-gray-600 rounded-full px-6 h-12 text-sm transition-colors"
                  >
                    {t.skipText}
                  </Button>
                </div>
              </div>
            )}
        </div>
      </motion.div>
    );
  };

  return (
    <div 
      className="h-full w-full relative overflow-hidden bg-[var(--bg)]"
      style={{ fontFamily: '"DM Sans", sans-serif' }}
    >
      <AnimatePresence mode="wait">
        {showSplash && (
          <AILoadingSplash
            key="splash"
            branding={{
              logo_url: activeLogoUrl,
              company_name: activeCompanyName,
              brand_color: activeColor,
              brand_accent: branding.brand_accent,
              tagline: branding.tagline,
            }}
            language={chosenLanguage}
            skillCount={selectedPackageDetails?.length || 0}
            requirePassword={hasAccessPassword && !accessUnlocked}
            sessionId={accessSessionId}
            onAccessUnlocked={handleAccessUnlocked}
            onComplete={dismissSplash}
          />
        )}
      </AnimatePresence>

      {!showSplash && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between p-3 md:p-4 md:px-8 h-16 md:h-20 shrink-0 border-b border-[var(--bd)]">
            <div className="flex items-center gap-4">
              {currentStepIndex > 0 && !isFinished && (
                <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full w-10 h-10 border border-[var(--bd)] bg-white text-black hover:bg-gray-50">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                 <BrandedLogo branding={{ ...branding, logo_url: activeLogoUrl, brand_color: activeColor, company_name: activeCompanyName }} size="sm" isSolid />
                 <span className="font-bold text-sm hidden sm:block">{activeCompanyName}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <PingMonitor />
              {/* Progress Pill entirely removed */}
            </div>
          </header>

          {/* Progress Line */}
          {!isFinished && (
            <div className="h-1 bg-gray-100 w-full shrink-0 relative overflow-hidden">
               <motion.div 
                 className="h-full bg-[var(--orange)]"
                 initial={{ width: 0 }}
                 animate={{ width: `${displayProgress}%` }}
                 transition={{ duration: 0.8, ease: "easeOut" }}
               />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-hidden relative flex flex-col">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </main>

          {/* Force Finish Modal Overlay */}
          <AnimatePresence>
            {showForceFinishModal && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-[22rem] w-full shadow-2xl relative overflow-hidden"
                >
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
                    <LogOut className="w-6 h-6 text-red-500 ml-1" />
                  </div>
                  <h3 className="text-[22px] font-bold text-gray-900 mb-3 tracking-tight leading-tight">{t.forceFinishTitle}</h3>
                  <p className="text-[15px] font-medium text-gray-500 leading-relaxed mb-8">{t.forceFinishDesc}</p>
                  
                  <div className="flex flex-col gap-2.5">
                    <Button 
                      onClick={() => {
                        setShowForceFinishModal(false);
                        submitAnswer('(FINALIZAR_AGORA)');
                      }}
                      className="w-full bg-[var(--orange)] hover:bg-[var(--orange-dark)] text-white h-[3.25rem] rounded-xl text-[15px] shadow-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {t.forceFinishConfirm}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowForceFinishModal(false)}
                      className="w-full text-gray-400 hover:text-gray-900 h-10 rounded-xl font-medium"
                    >
                      {t.forceFinishCancel}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Insights Panel */}
          <InsightsPanel signals={detectedSignals} isOwner={isOwner} />

          {/* Milestone Checkpoint Overlay */}
          <AnimatePresence>
            {pendingCheckpoint && (
              <MilestoneScreen
                key={`milestone-${pendingCheckpoint.block}`}
                block={pendingCheckpoint.block}
                language={chosenLanguage}
                brandColor={activeColor}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

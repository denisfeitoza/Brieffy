"use client";

import { useBriefing } from "@/lib/BriefingContext";
import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, ArrowRight, ArrowLeft, RefreshCw, Paperclip, CheckCircle2, Lock, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import { DynamicInput } from "./DynamicInput";

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
    clipboardSuccess: "Link e senha copiados!"
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
    clipboardSuccess: "Link and password copied!"
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
    clipboardSuccess: "¡Enlace y contraseña copiados!"
  }
};

function getContrastColor(hexcolor: string) {
  if (!hexcolor) return "#ffffff";
  const hex = hexcolor.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return "#ffffff";
  // Convert 3-char hex to 6-char
  const fullHex = hex.length === 3 ? hex.split('').map(x => x + x).join('') : hex;
  const r = parseInt(fullHex.substr(0, 2), 16);
  const g = parseInt(fullHex.substr(2, 2), 16);
  const b = parseInt(fullHex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

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

export function TypeformWizard() {
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
    generateDocument,
    branding,
    editToken,
    editPassphrase,
    selectedPackageDetails,
    briefingState,
    basalInfo,
  } = useBriefing();

  const t = I18N[chosenLanguage] || I18N.pt;

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

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

  // AQUI calculamos previas dinâmicas
  const colorPickerMsg = messages.find(m => m.questionType === 'color_picker' && m.userAnswer && Array.isArray(m.userAnswer) && m.userAnswer.length > 0);
  const activeColor = colorPickerMsg 
    ? (colorPickerMsg.userAnswer as string[])[0] 
    : (briefingState.brand_color as string) || branding.brand_color || '#171717';

  const fontMsg = messages.find(m => {
    const txt = m.content?.toLowerCase() || '';
    const isFontQ = txt.includes('tipografi') || (txt.includes('fonte') && !txt.includes('inspiraç'));
    return isFontQ && typeof m.userAnswer === 'string';
  });
  
  const fontChoiceResult = fontMsg ? (fontMsg.userAnswer as string).split(' - ')[0].trim() : null;
  const fontChoice = fontChoiceResult && !fontChoiceResult.toLowerCase().includes('nenhuma') && !fontChoiceResult.toLowerCase().includes('none') && !fontChoiceResult.toLowerCase().includes('padrão')
    ? fontChoiceResult.replace(/[^a-zA-Z0-9 ]/g, '') 
    : null;
    
  // Default to Outfit se nada for escolhido, e também respeita se veio do DB settings
  const activeFont = fontChoice || branding.brand_font || 'Outfit';

  useEffect(() => {
    // Injeta a fonte escolhida dinamicamente no head para conseguirmos usar no preview
    if (activeFont && activeFont !== 'Outfit' && activeFont !== 'Inter' && activeFont !== 'Aa') {
      const linkId = `google-font-${activeFont.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${activeFont.replace(/ /g, '+')}&display=swap`;
        document.head.appendChild(link);
      }
    }
    // Fix #12: Cleanup injected font links on unmount
    return () => {
      if (activeFont && activeFont !== 'Outfit' && activeFont !== 'Inter' && activeFont !== 'Aa') {
        const linkId = `google-font-${activeFont.replace(/\s+/g, '-')}`;
        const el = document.getElementById(linkId);
        if (el) el.remove();
      }
    };
  }, [activeFont]);

  const dynamicName = (briefingState.nome_empresa as string) || 
                      (briefingState.company_name as string) || 
                      (briefingState.empresa as string) || 
                      (branding.company_name && branding.company_name !== 'Smart Briefing' ? branding.company_name : '');
  const activeCompanyName = dynamicName || 'Sua Empresa';

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

  // Se o usuário der "Avançar" ou "Enviar"
  const handleSend = () => {
    if (!inputText.trim() && !messages[currentStepIndex].userAnswer) {
      // Se ele não digitou nada e já tinha uma resposta lá, não avança. 
      return; 
    }
    
    // Se ele digitou algo novo, ele faz update via API
    if (inputText.trim()) {
      submitAnswer(inputText.trim());
      setInputText("");
    } else {
      // Apenas avançar (temos userAnswer mas ele só quis passar o step pra frente)
      goNext();
    }
  };

  const activeMessage = messages[currentStepIndex];

  // ==========================
  // ESTÁGIO DE FINALIZAÇÃO & DOCUMENTO
  // ==========================
  if (isUploadStep) {
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
                  <div className="relative flex items-center justify-center w-24 h-24 mb-4">
                    <div className="absolute w-full h-full rounded-full border-4 border-indigo-500/20"></div>
                    <div className="absolute w-full h-full rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                    <CheckCircle2 className="w-10 h-10 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-outfit font-medium text-white mb-3">{(I18N[chosenLanguage] || I18N.pt).generatingDoc}</h2>
                    <p className="text-lg text-neutral-400">{(I18N[chosenLanguage] || I18N.pt).analyzingResponses.replace('{count}', String(messages.length))}</p>
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
                      {t.allSet}
                    </h1>
                    <p className="text-lg text-neutral-400 max-w-lg mx-auto leading-relaxed">
                      {t.uploadRef}
                    </p>
                  </div>

                  <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-indigo-400" />
                  </div>
                  
                  <div className="w-full pt-4">
                    <Button 
                        size="lg"
                        className="w-full h-16 bg-white text-black hover:bg-neutral-200 text-lg font-medium rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all"
                        onClick={generateDocument}
                      >
                        {t.generateDiag}
                        {" "}
                        <ArrowRight className="w-5 h-5 ml-2" />
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
  //  TYPEFORM VIEW
  // ==========================
  if (!activeMessage || activeMessage.role !== "assistant") {
     // Safeguard for synchronization delays
     return <div className="h-full flex items-center justify-center flex-col gap-4 text-white">{(I18N[chosenLanguage] || I18N.pt).loadingStep}</div>;
  }

  return (
    <div
      className="flex flex-col h-full bg-neutral-950 text-white selection:bg-indigo-500/30"
      style={{ '--brand-color': branding.brand_color, '--brand-accent': branding.brand_accent } as React.CSSProperties}
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

        {/* Right side: Packages and Progress */}
        <div className="flex items-center gap-4">
          {/* Active AI Packages */}
          {selectedPackageDetails && selectedPackageDetails.length > 0 && (
            <div className="hidden md:flex items-center gap-2 mr-2">
              {selectedPackageDetails.slice(0, 3).map(pkg => (
                <div key={pkg.slug} className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" title={pkg.name}>
                   <Sparkles className="w-3 h-3" />
                   {pkg.name}
                </div>
              ))}
              {selectedPackageDetails.length > 3 && (
                <div className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800">
                   +{selectedPackageDetails.length - 3} skills
                </div>
              )}
            </div>
          )}

          {/* Progresso Simplificado */}
          <div className="text-sm font-medium text-neutral-500 flex items-center gap-2 bg-neutral-900 px-4 py-1.5 rounded-full border border-neutral-800">
             {currentStepIndex + 1}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-neutral-900/50 w-full shrink-0 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 rounded-r-full"
          initial={false}
          animate={{ 
            width: `${Math.max(
              basalInfo.basalCoverage * 100, 
              ((currentStepIndex + 1) / Math.max(messages.length + 2, 8)) * 100
            )}%` 
          }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

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
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_e, info) => {
                  // Swipe right to go back (threshold 100px)
                  if (info.offset.x > 100 && currentStepIndex > 0 && !isLoading) {
                    goBack();
                  }
                }}
              >
                {/* The IA Formatted Question */}
                <h1 className="text-2xl md:text-5xl font-outfit font-medium tracking-tight text-white leading-tight">
                  {activeMessage.content}
                </h1>

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
                />

                {currentStepIndex > 0 && (
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
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex-[2_0_auto]" />

        </div>
      </main>
    </div>
  );
}

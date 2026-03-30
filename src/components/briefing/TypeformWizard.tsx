"use client";

import { useBriefing } from "@/lib/BriefingContext";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, ArrowRight, ArrowLeft, RefreshCw, Paperclip, CheckCircle2, CloudUpload, Lock, Copy } from "lucide-react";
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
    allSet: "Tudo Certo! Tem mais alguma coisa?",
    uploadRef: "Para melhorar nossa análise, anexe referências da marca (cores, logotipos, apresentações, etc). Se não tiver, tudo bem.",
    dragFiles: "Selecione ou arraste arquivos aqui",
    imagesOrPdf: "Imagens ou PDFs (max 10MB)",
    skipAndGenerate: "Pular e Gerar Documento",
    generateDiag: "Gerar Diagnóstico",
    loadingStep: "Carregando etapa...",
    goBackAdjust: "Voltar e ajustar resposta anterior"
  },
  en: {
    docGenerated: "Document Generated ✓",
    lastStep: "Last Step",
    generatingDoc: "Generating your Document...",
    analyzingResponses: "Analyzing all {count} responses to build a complete briefing.",
    downloadDoc: "Download Document (.md)",
    goToDashboard: "Go to Dashboard",
    allSet: "All set! Anything else?",
    uploadRef: "To improve our analysis, attach brand references (colors, logos, presentations, etc). If you don't have any, that's fine.",
    dragFiles: "Select or drag files here",
    imagesOrPdf: "Images or PDFs (max 10MB)",
    skipAndGenerate: "Skip & Generate Document",
    generateDiag: "Generate Diagnosis",
    loadingStep: "Loading step...",
    goBackAdjust: "Go back and adjust previous answer"
  },
  es: {
    docGenerated: "Documento Generado ✓",
    lastStep: "Última Etapa",
    generatingDoc: "Generando su Documento...",
    analyzingResponses: "Analizando las {count} respuestas para crear un briefing completo.",
    downloadDoc: "Descargar Documento (.md)",
    goToDashboard: "Ir al Dashboard",
    allSet: "¡Todo listo! ¿Algo más?",
    uploadRef: "Para mejorar nuestro análisis, adjunte referencias de marca (colores, logotipos, presentaciones, etc). Si no tiene, está bien.",
    dragFiles: "Selecciona o arrastra archivos aquí",
    imagesOrPdf: "Imágenes o PDFs (max 10MB)",
    skipAndGenerate: "Omitir y Generar Documento",
    generateDiag: "Generar Diagnóstico",
    loadingStep: "Cargando etapa...",
    goBackAdjust: "Volver y ajustar respuesta anterior"
  }
};

function BrandedLogo({ branding, size = 'md' }: { branding: { logo_url: string; company_name: string; brand_color: string }; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const initials = branding.company_name
    ? branding.company_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AI';

  if (branding.logo_url) {
    return (
      <img
        src={branding.logo_url}
        alt={branding.company_name}
        className={`${sizeClasses} rounded-xl object-contain bg-white/5 border border-white/10 p-0.5`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-xl flex items-center justify-center font-bold border border-white/10`}
      style={{ background: `linear-gradient(135deg, ${branding.brand_color}40, ${branding.brand_color}20)`, color: branding.brand_color }}
    >
      {initials}
    </div>
  );
}

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
  } = useBriefing();

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on step change if it's an open text question (no options)
  useEffect(() => {
    if (!isUploadStep && messages[currentStepIndex] && !messages[currentStepIndex].options?.length) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentStepIndex, isUploadStep, messages]);

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
          <div className="flex items-center gap-3">
            <BrandedLogo branding={branding} size="md" />
            <div className="hidden sm:block">
              <span className="font-outfit font-semibold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {branding.company_name || 'Smart Briefing'}
              </span>
              {branding.tagline && (
                <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{branding.tagline}</p>
              )}
            </div>
          </div>
          <div className="text-sm font-medium text-neutral-500 flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
            {generatedDocument ? (I18N[chosenLanguage] || I18N.pt).docGenerated : (I18N[chosenLanguage] || I18N.pt).lastStep}
          </div>
        </header>

        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
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
                    <h2 className="text-3xl font-outfit text-white">Seu Diagnóstico Está Pronto</h2>
                    <p className="text-neutral-400">Você pode editar este documento, baixá-lo ou acessar mais tarde pelo link seguro.</p>
                  </div>

                  {/* Public Link Card */}
                  {editToken && editPassphrase && (
                    <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2 text-indigo-400 font-medium">
                          <Lock className="w-4 h-4" /> Link Seguro de Acesso Contínuo
                        </div>
                        <p className="text-sm text-neutral-400">
                          Guarde este link e a palavra-chave para revisar o documento a qualquer momento.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300">
                          Senha: <span className="text-white font-bold">{editPassphrase}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-transparent border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                          onClick={() => {
                            const url = `${window.location.origin}/doc/${editToken}`;
                            navigator.clipboard.writeText(`Aqui está o link para o seu diagnóstico interativo:\n${url}\n\nSenha de acesso: ${editPassphrase}`);
                            toast.success("Link e senha copiados!");
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" /> Copiar Acesso
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

              {/* STATE 3: Initial — upload + generate */}
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
                      {(I18N[chosenLanguage] || I18N.pt).allSet}
                    </h1>
                    <p className="text-lg text-neutral-400 max-w-lg mx-auto leading-relaxed">
                      {(I18N[chosenLanguage] || I18N.pt).uploadRef}
                    </p>
                  </div>

                  {/* Drag n Drop Box Mock */}
                  <button className="w-full h-48 border-2 border-dashed border-neutral-800 hover:border-indigo-500/50 bg-neutral-900/50 rounded-2xl flex flex-col items-center justify-center gap-4 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 group-hover:bg-indigo-500/20 flex items-center justify-center text-neutral-400 group-hover:text-indigo-400 transition-colors">
                      <CloudUpload className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-neutral-300">{(I18N[chosenLanguage] || I18N.pt).dragFiles}</p>
                      <p className="text-sm text-neutral-500">{(I18N[chosenLanguage] || I18N.pt).imagesOrPdf}</p>
                    </div>
                  </button>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                    <Button 
                        variant="outline" 
                        size="lg"
                        className="flex-1 h-14 bg-transparent border-neutral-800 text-neutral-400 hover:text-white"
                        onClick={generateDocument}
                        tabIndex={1}
                      >
                      {(I18N[chosenLanguage] || I18N.pt).skipAndGenerate}
                    </Button>
                    <Button 
                        size="lg"
                        className="flex-1 h-14 bg-white text-black hover:bg-neutral-200"
                        onClick={generateDocument}
                        tabIndex={2}
                      >
                        {(I18N[chosenLanguage] || I18N.pt).generateDiag}
                        {" "}
                        <ArrowRight className="w-4 h-4 ml-2" />
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
          {currentStepIndex > 0 ? (
            <Button variant="ghost" size="icon" className="hover:bg-neutral-800 shrink-0" onClick={goBack}>
              <ArrowLeft className="w-5 h-5 text-neutral-400" />
            </Button>
          ) : (
            <BrandedLogo branding={branding} size="md" />
          )}
          <div className="hidden sm:block">
            <span className="font-outfit font-semibold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              {branding.company_name || 'Smart Briefing'}
            </span>
            {branding.tagline && (
              <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{branding.tagline}</p>
            )}
          </div>
        </div>

        {/* Progresso Simplificado */}
        <div className="text-sm font-medium text-neutral-500 flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
           {currentStepIndex + 1}
        </div>
      </header>

      {/* Main Content Area: Centered, Large Text */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
        <div className="min-h-full w-full flex flex-col items-center p-6 lg:p-12">
          <div className="flex-1 shrink-0" />
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${currentStepIndex}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-3xl flex flex-col space-y-12 shrink-0 py-12"
            >
              {/* The IA Formatted Question */}
              <h1 className="text-3xl md:text-5xl font-outfit font-medium tracking-tight text-white leading-tight">
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
                  <div className="flex justify-center md:justify-start pt-4 opacity-70 hover:opacity-100 transition-opacity">
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
                  </div>
                )}
            </motion.div>
          </AnimatePresence>
          <div className="flex-1 shrink-0" />
        </div>
      </main>
    </div>
  );
}

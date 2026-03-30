"use client";

import { Message, MultiSliderOption, QuestionType } from "@/lib/types";
import { MultiSliderQuestion } from "@/components/briefing/MultiSliderQuestion";
import { ScrollConfirmWrapper } from "@/components/briefing/ScrollConfirmWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Mic, ArrowRight, RefreshCw, CheckCircle2, UploadCloud, Loader2, Plus, X, Pipette } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useBriefing } from "@/lib/BriefingContext";

function DraggableToggle({ onSelect, disabled, t, initialAnswer }: { onSelect: (val: string) => void, disabled: boolean, t: Record<string, string>, initialAnswer?: string | null }) {
  const [answered, setAnswered] = useState<string | null>(initialAnswer || null);
  const x = useMotionValue(0); 
  const trackWidth = 320;
  const knobWidth = 140;
  const maxDrag = (trackWidth - knobWidth) / 2 - 8;

  useEffect(() => {
    if (initialAnswer === t.yes || initialAnswer === t.yes?.toLowerCase()) {
      x.set(-maxDrag);
    } else if (initialAnswer === t.no || initialAnswer === t.no?.toLowerCase()) {
      x.set(maxDrag);
    } else {
      x.set(0);
    }
  }, [initialAnswer, t.yes, t.no, x, maxDrag]);

  const handleSelect = (val: string) => {
    if (disabled) return;
    setAnswered(val);
    if (val === t.yes) {
      animate(x, -maxDrag, { type: "spring", stiffness: 300, damping: 20 });
      setTimeout(() => onSelect(t.yes), 350);
    } else if (val === t.no) {
      animate(x, maxDrag, { type: "spring", stiffness: 300, damping: 20 });
      setTimeout(() => onSelect(t.no), 350);
    }
  };

  const background = useTransform(
    x,
    [-maxDrag, 0, maxDrag],
    [
      "rgba(34, 197, 94, 0.15)", // Yes -> Subtle Green
      "rgba(38, 38, 38, 0.4)", // Center -> Neutral
      "rgba(239, 68, 68, 0.15)"  // No -> Subtle Red
    ]
  );
  
  const borderColor = useTransform(
    x,
    [-maxDrag, 0, maxDrag],
    [
      "rgba(34, 197, 94, 0.4)", 
      "rgba(64, 64, 64, 0.6)", 
      "rgba(239, 68, 68, 0.4)"  
    ]
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div 
        className="relative flex items-center justify-center h-20 rounded-[2.5rem] overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] backdrop-blur-md"
        style={{ width: trackWidth, backgroundColor: background, borderColor, borderWidth: 1 }}
      >
        <div className="absolute inset-0 flex z-20">
          <div className="flex-1 flex items-center justify-center cursor-pointer" onClick={() => handleSelect(t.yes)}>
            <span className={`font-bold text-lg uppercase tracking-widest transition-colors ${answered === t.yes ? 'text-transparent' : 'text-white/40 hover:text-white/80'}`}>{t.yes}</span>
          </div>
          <div className="flex-1 flex items-center justify-center cursor-pointer" onClick={() => handleSelect(t.no)}>
            <span className={`font-bold text-lg uppercase tracking-widest transition-colors ${answered === t.no ? 'text-transparent' : 'text-white/40 hover:text-white/80'}`}>{t.no}</span>
          </div>
        </div>
        
        <motion.div
          className="absolute h-16 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.15),inset_0_-2px_5px_rgba(0,0,0,0.1)] flex items-center justify-center font-bold text-black uppercase tracking-wider z-10 pointer-events-none transition-opacity duration-300"
          style={{ width: knobWidth, x, opacity: answered ? 1 : 0 }}
          initial={false}
          animate={{ x: x.get() }}
        >
          {answered === t.yes ? t.yes : answered === t.no ? t.no : ""}
        </motion.div>
      </motion.div>
    </div>
  );
}

const I18N: Record<string, Record<string, string>> = {
  pt: {
    transcribing: "Transcrevendo áudio...",
    addExtra: "Adicione um comentário extra ou opção...",
    typeFree: "Ou digite sua resposta livremente...",
    selectOnlyOne: "Selecione",
    onlyOneLabel: "apenas 1 (uma)",
    optionLabel: "opção:",
    otherOptions: "Outras Opções",
    addDetails: "Adicione detalhes via texto ou áudio (opcional):",
    confirmSelection: "Confirmar Seleção",
    exactValue: "Ou digite o valor exato no campo abaixo:",
    next: "Avançar",
    step1Title: "Passo 1: Cores Principais",
    step1Sub: "Escolha as 2 cores primárias da sua marca",
    primary: "Principal",
    fetching: "Buscando combinações...",
    step2Title: "Passo 2: Cores Complementares",
    step2Sub: "A IA sugeriu estas 4 cores baseadas nas principais. Selecione exatamente 2 cores.",
    back: "Voltar",
    generating: "Gerando...",
    generateMore: "Gerar Mais",
    continue: "Continuar",
    step3Title: "Passo 3: Cores de Detalhe",
    step3Sub: "Escolha 2 cores adicionais para botões secundários, fundos leves, etc.",
    detail: "Detalhe",
    finishPalette: "Finalizar Paleta",
    yes: "SIM",
    no: "NÃO",
    moreDetails: "Ou dê mais detalhes se preferir:",
    suggestRoutes: "Sugerir outras rotas",
    adjustPalette: "Ou ajuste a paleta com suas palavras:",
    yourResponse: "Sua Resposta",
    dragFiles: "Arraste seus arquivos aqui ou clique",
    sendingFile: "Enviando arquivo...",
    fileTooLarge: "O arquivo não pode ter mais de 5MB.",
    fileUploadError: "Houve um erro ao subir o arquivo. Tente novamente.",
    orTypeFile: "Ou se preferir não enviar nada agora, basta digitar algo:",
    enterToSend: "para enviar",
    shiftToSkip: "pular ou próximo"
  },
  en: {
    transcribing: "Transcribing audio...",
    addExtra: "Add an extra comment or option...",
    typeFree: "Or type your answer freely...",
    selectOnlyOne: "Select",
    onlyOneLabel: "only 1",
    optionLabel: "option:",
    otherOptions: "Other Options",
    addDetails: "Add details via text or audio (optional):",
    confirmSelection: "Confirm Selection",
    exactValue: "Or type the exact value below:",
    next: "Next",
    step1Title: "Step 1: Main Colors",
    step1Sub: "Choose the 2 primary colors of your brand",
    primary: "Primary",
    fetching: "Fetching combinations...",
    step2Title: "Step 2: Complementary Colors",
    step2Sub: "AI suggested these 4 colors based on the main ones. Select exactly 2 colors.",
    back: "Back",
    generating: "Generating...",
    generateMore: "Generate More",
    continue: "Continue",
    step3Title: "Step 3: Detail Colors",
    step3Sub: "Choose 2 additional colors for secondary buttons, light backgrounds, etc.",
    detail: "Detail",
    finishPalette: "Finish Palette",
    yes: "YES",
    no: "NO",
    moreDetails: "Or provide more details if you prefer:",
    suggestRoutes: "Suggest other routes",
    adjustPalette: "Or adjust the palette with your words:",
    yourResponse: "Your Response",
    dragFiles: "Drag your files here or click",
    sendingFile: "Uploading file...",
    fileTooLarge: "File cannot be larger than 5MB.",
    fileUploadError: "There was an error uploading the file. Please try again.",
    orTypeFile: "Or if you prefer not to send anything now, just type something:",
    enterToSend: "to send",
    shiftToSkip: "skip or next"
  },
  es: {
    transcribing: "Transcribiendo audio...",
    addExtra: "Agregue un comentario u opción extra...",
    typeFree: "O escriba su respuesta libremente...",
    selectOnlyOne: "Seleccione",
    onlyOneLabel: "solo 1",
    optionLabel: "opción:",
    otherOptions: "Otras Opciones",
    addDetails: "Agregue detalles vía texto o audio (opcional):",
    confirmSelection: "Confirmar Selección",
    exactValue: "O escriba el valor exacto a continuación:",
    next: "Avanzar",
    step1Title: "Paso 1: Colores Principales",
    step1Sub: "Elija los 2 colores primarios de su marca",
    primary: "Principal",
    fetching: "Buscando combinaciones...",
    step2Title: "Paso 2: Colores Complementarios",
    step2Sub: "La IA sugirió estos 4 colores basados en los principales. Seleccione exactamente 2 colores.",
    back: "Volver",
    generating: "Generando...",
    generateMore: "Generar Más",
    continue: "Continuar",
    step3Title: "Paso 3: Colores de Detalle",
    step3Sub: "Elija 2 colores adicionales para botones secundarios, fondos claros, etc.",
    detail: "Detalle",
    finishPalette: "Finalizar Paleta",
    yes: "SÍ",
    no: "NO",
    moreDetails: "O dé más detalles si lo prefiere:",
    suggestRoutes: "Sugerir otras rutas",
    adjustPalette: "O ajuste la paleta con tus palabras:",
    yourResponse: "Tu Respuesta",
    dragFiles: "Arrastra tus archivos aquí o haz clic",
    sendingFile: "Subiendo archivo...",
    fileTooLarge: "El archivo no puede tener más de 5MB.",
    fileUploadError: "Hubo un error al subir el archivo. Inténtalo de nuevo.",
    orTypeFile: "O si prefieres no enviar nada ahora, solo escribe algo:",
    enterToSend: "para enviar",
    shiftToSkip: "omitir o siguiente"
  }
};

interface DynamicInputProps {
  activeMessage: Message;
  inputText: string;
  setInputText: (text: string) => void;
  submitAnswer: (answer: string | string[] | number) => void;
  handleSend: () => void;
  isLoading: boolean;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  generateMoreOptions: () => void;
  isGeneratingMore: boolean;
  voiceLanguage?: string; // ISO language code for voice transcription (pt, en, es)
  messages?: Message[]; // All current messages to build context
}

export function DynamicInput({
  activeMessage,
  inputText,
  setInputText,
  submitAnswer,
  handleSend,
  isLoading,
  isRecording,
  setIsRecording,
  generateMoreOptions,
  isGeneratingMore,
  voiceLanguage = 'pt',
  messages = []
}: DynamicInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = I18N[voiceLanguage] || I18N['pt'];
  const { isOnboarding } = useBriefing();
  
  // Para controlarmos o estado de multipla escolha antes do usuário dar Submit
  const [selectedMultiples, setSelectedMultiples] = useState<string[]>([]);
  // Para Slider
  const [sliderValue, setSliderValue] = useState<number[]>([Number(activeMessage.minOption) || 0]);
  // Para Color Wizard
  const [colorWizardStep, setColorWizardStep] = useState<1 | 2 | 3>(1);
  const [suggestedMainColors, setSuggestedMainColors] = useState<string[]>([]);
  const [selectedMainColors, setSelectedMainColors] = useState<string[]>([]);
  const [mainColors, setMainColors] = useState<string[]>([]);
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  const [isFetchingColors, setIsFetchingColors] = useState(false);
  const [colorHint, setColorHint] = useState<string>("");
  const [showHintInput, setShowHintInput] = useState(false);
  
  // Instant visual feedback for submission
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  
  // Upload UI state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Quando a activeMessage muda (usuário volta ou avança), restaurar os estados ou resetar
    const ans = activeMessage.userAnswer;
    const isEditing = ans !== undefined && ans !== null;

    if (isLoading || isSubmittingLocal) return; // Não resetar a UI enquanto estiver enviando ou carregando a próxima pergunta

    if (activeMessage.questionType === 'multiple_choice' || activeMessage.questionType === 'card_selector') {
      if (isEditing) {
        if (Array.isArray(ans)) {
          // Put all selected options into selectedMultiples so they display correctly as selected items/pills
          setSelectedMultiples(ans as string[]);
          setInputText("");
        } else if (typeof ans === 'string') {
          setSelectedMultiples([]);
          setInputText(ans);
        }
      } else {
        setSelectedMultiples([]);
        setInputText("");
      }
    } else if (activeMessage.questionType === 'color_picker') {
      if (isEditing && Array.isArray(ans) && ans.length >= 2) {
        // Restore: first half = main, second half = detail
        const mc = Math.min(2, Math.ceil(ans.length / 2));
        setMainColors(ans.slice(0, mc) as string[]);
        setSelectedMainColors(ans.slice(0, mc) as string[]);
        setSuggestedMainColors(ans.slice(0, mc) as string[]);
        setSelectedSuggestions(ans.slice(mc) as string[]);
        setSuggestedColors(ans.slice(mc) as string[]);
        setColorWizardStep(1); // Will be overridden by summary-first check in render
      } else {
        setColorWizardStep(1);
        setSuggestedMainColors([]);
        setSelectedMainColors([]);
        setMainColors([]);
        setSuggestedColors([]);
        setSelectedSuggestions([]);
      }
    } else if (activeMessage.questionType === 'slider') {
      if (isEditing && typeof ans === 'number') {
        setSliderValue([ans]);
      } else if (isEditing && typeof ans === 'string') {
        setSliderValue([parseInt(ans.replace('+', ''), 10) || Number(activeMessage.minOption) || 0]);
      } else {
        setSliderValue([Number(activeMessage.minOption) || 0]);
      }
    } else {
      // Para questionTypes como text, single_choice, etc.
      if (isEditing && typeof ans === 'string') {
        setInputText(ans);
      } else {
        setInputText("");
      }
    }
    
    // Reset local loading state whenever the active message changes
    setIsSubmittingLocal(false);
  }, [activeMessage.id, activeMessage.questionType, activeMessage.minOption, activeMessage.userAnswer, activeMessage.options, setInputText]);

  // Sync local submission state with global loading state
  useEffect(() => {
    if (!isLoading) {
      setIsSubmittingLocal(false);
    }
  }, [isLoading]);


  // Se o usuário JÁ RESPONDEU nesta etapa
  const hasAnswered = Boolean(
    activeMessage.userAnswer && !inputText
    && activeMessage.questionType !== 'color_picker'
    && activeMessage.questionType !== 'boolean_toggle'
    && activeMessage.questionType !== 'slider'
    && activeMessage.questionType !== 'multi_slider'
  );

  // Fallback se não vier questionType na resposta da IA
  let questionTypeStr: string = activeMessage.questionType || (activeMessage.options?.length ? 'single_choice' : 'text');
  
  // Normalizar questionTypes comuns que a IA pode errar
  if (questionTypeStr === 'multi_choice') questionTypeStr = 'multiple_choice';
  if (questionTypeStr === 'boolean') questionTypeStr = 'boolean_toggle';
  // Fallback de segurança: se for single/multiple choice e vier SEM opções, voltar pra text
  if ((questionTypeStr === 'single_choice' || questionTypeStr === 'multiple_choice' || questionTypeStr === 'card_selector' || questionTypeStr === 'multi_slider') && (!activeMessage.options || activeMessage.options.length === 0)) {
    questionTypeStr = 'text';
  }

  const questionType = questionTypeStr as QuestionType;

  // Audio recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the mic
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('language', voiceLanguage);

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) throw new Error('Transcription failed');

          const data = await res.json();
          if (data.text) {
            setInputText(data.text);
          }
        } catch (err) {
          console.error('Transcription error:', err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Foca automaticamente no campo de texto para o usuário já poder digitar logo após a mudança da pergunta
  // Usamos preventScroll para não empurrar a tela para baixo caso a pergunta seja longa (como cards)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current && !isLoading && !isTranscribing) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activeMessage.id, activeMessage.questionType, isLoading, isTranscribing]);

  const handleLocalSend = () => {
    if (questionType === 'multiple_choice' || questionType === 'card_selector') {
      if (selectedMultiples.length > 0 || inputText.trim()) {
        setIsSubmittingLocal(true);
        const finalAnswer = [...selectedMultiples];
        if (inputText.trim() && !selectedMultiples.includes(inputText.trim())) {
          finalAnswer.push(inputText.trim());
        }
        submitAnswer(finalAnswer);
        setInputText("");
        return;
      }
    }
    
    // Prevent freezing if there's nothing to send
    if (!inputText.trim() && !activeMessage.userAnswer && selectedMultiples.length === 0) {
      return;
    }

    setIsSubmittingLocal(true);
    handleSend();
  };

  const doSubmit = (answer: string | string[] | number) => {
    if (typeof answer === 'string' && !answer.trim()) return;
    if (Array.isArray(answer) && answer.length === 0) return;
    
    setIsSubmittingLocal(true);
    submitAnswer(answer);
  };

  const handleAddCustomText = () => {
    if (!inputText.trim()) return;
    if (!selectedMultiples.includes(inputText.trim())) {
      setSelectedMultiples([...selectedMultiples, inputText.trim()]);
    }
    setInputText("");
  };

  const getCustomTexts = () => {
    const optionTitles = (activeMessage.options || []).map((opt: unknown) => {
      const optObj = typeof opt === 'object' && opt !== null ? (opt as Record<string, unknown>) : null;
      return optObj ? String(optObj.label || optObj.title || optObj.name || JSON.stringify(opt)) : String(opt);
    });
    return selectedMultiples.filter(item => !optionTitles.includes(item));
  };

  const renderCustomTexts = () => {
    const customTexts = getCustomTexts();
    if (customTexts.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {customTexts.map((text, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-500/50 animate-in fade-in zoom-in duration-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <span className="text-sm font-medium text-indigo-300 truncate max-w-[200px]" title={text}>{text}</span>
            <button 
              onClick={() => setSelectedMultiples(selectedMultiples.filter(t => t !== text))}
              className="text-indigo-400/70 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // FONT SELECTION CHECK
  const msgText = activeMessage.content?.toLowerCase() || '';
  const isFontSelection = msgText.includes('tipografi') || (msgText.includes('fonte') && !msgText.includes('inspiraç'));
  
  const fontOptions = isFontSelection && activeMessage.options
    ? activeMessage.options.map(opt => {
        const optObj = typeof opt === 'object' && opt !== null ? (opt as Record<string, unknown>) : null;
        return optObj ? String(optObj.label || optObj.title || optObj.name || JSON.stringify(opt)) : String(opt);
      })
    : [];

  // RENDER: TEXT / AUDIO (Real Whisper transcription)
  const renderTextAndAudio = (onAction?: () => void, actionIcon?: React.ReactNode, isAddAction?: boolean) => {
    const actionToRun = onAction || handleLocalSend;
    return (
    <div className="relative group w-full mt-8">
      <Input 
        ref={inputRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            actionToRun();
          }
        }}
        disabled={isLoading || isSubmittingLocal || isTranscribing}
        placeholder={isTranscribing ? t.transcribing : isAddAction ? t.addExtra : t.typeFree}
        className="h-16 w-full bg-neutral-900/50 border-neutral-800 rounded-2xl pl-6 pr-32 text-lg text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all font-inter"
        spellCheck="false"
        autoComplete="off"
        autoCorrect="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      />
      <div className="absolute right-2 top-2 flex gap-1">
          {isTranscribing ? (
            <div className="h-12 w-12 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className={`h-12 w-12 rounded-xl transition-all ${
                isRecording 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}

          <Button
            size="icon"
            className={`h-12 w-12 rounded-xl transition-colors shadow-lg shadow-white/5 ${isAddAction && inputText.trim() ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-white text-black hover:bg-neutral-200"}`}
            disabled={isAddAction ? !inputText.trim() : (!inputText.trim() && selectedMultiples.length === 0 && !activeMessage.userAnswer) || isLoading || isSubmittingLocal || isTranscribing}
            onClick={actionToRun}
          >
            {(isLoading || isSubmittingLocal) && !isAddAction ? (
              <RefreshCw className="w-5 h-5 animate-spin text-neutral-500" />
            ) : actionIcon ? actionIcon : (
                <ArrowRight className="w-5 h-5" />
            )}
          </Button>
      </div>
    </div>
  )};

  // RENDER: SINGLE CHOICE
  const renderSingleChoice = () => (
    <div className="flex flex-col gap-6 w-full mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-sm font-medium text-neutral-400 -mb-2 tracking-wide">
        {t.selectOnlyOne}{" "}
        <strong className="text-indigo-400 font-semibold text-[15px]">{t.onlyOneLabel}</strong>{" "}
        {t.optionLabel}
      </p>
      {isFontSelection ? (() => {
        // Extract company name from the question text for preview (e.g. "Qual tipografia melhor representa a Vindia?")
        const questionText = activeMessage.content || '';
        const companyMatch = questionText.match(/(?:represent[ae]|para|da|d[eo])\s+(?:a\s+|o\s+)?([A-ZÀ-Ú][a-zA-ZÀ-ú0-9]+(?:\s+[A-ZÀ-Ú][a-zA-ZÀ-ú0-9]+)*)/i);
        const companyPreview = companyMatch?.[1] || 'Sua Marca';
        
        // Dynamically load Google Fonts for preview
        const fontNames = (activeMessage.options || [])
          .map((opt: unknown) => {
            const optObj = typeof opt === 'object' && opt !== null ? (opt as Record<string, unknown>) : null;
            const optText = optObj ? String(optObj.label || optObj.title || optObj.name || '') : String(opt);
            const name = optText.split(' - ')[0].trim().replace(/[^a-zA-Z0-9 ]/g, '');
            return name;
          })
          .filter((n: string) => n && !n.toLowerCase().includes('nenhuma') && !n.toLowerCase().includes('none'));
        
        if (fontNames.length > 0) {
          const families = fontNames.map((n: string) => n.replace(/ /g, '+')).join('&family=');
          const linkId = 'google-fonts-preview';
          if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
            document.head.appendChild(link);
          }
        }

        return (
        <div className="flex flex-col gap-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full cursor-pointer">
            {activeMessage.options?.map((opt: unknown, idx: number) => {
              const optObj = typeof opt === 'object' && opt !== null ? (opt as Record<string, unknown>) : null;
              const optText = optObj ? String(optObj.label || optObj.title || optObj.name || JSON.stringify(opt)) : String(opt);
              const optKey = optObj ? String(optObj.id || optText || idx) : String(opt);
              const parts = optText.split(' - ');
              const fontName = parts[0].trim();
              const fontDesc = parts.slice(1).join(' - ').trim() || '';
              const fontNameClean = fontName.replace(/[^a-zA-Z0-9 ]/g, '');
              const isNoneOption = fontName.toLowerCase().includes('nenhuma') || fontName.toLowerCase().includes('none') || fontName.toLowerCase().includes('default');

              return (
                <button
                  key={optKey}
                  onClick={() => doSubmit(optText)}
                  disabled={isLoading || isSubmittingLocal}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all text-center min-h-[200px] group cursor-pointer ${
                    isNoneOption 
                      ? 'border-dashed border-neutral-700 bg-neutral-900/20 hover:bg-neutral-800/40 hover:border-neutral-500' 
                      : 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800 hover:border-neutral-600 hover:-translate-y-1'
                  }`}
                  style={isNoneOption ? undefined : { fontFamily: `"${fontNameClean}", sans-serif` }}
                >
                  {isNoneOption ? (
                    <>
                      <span className="text-[28px] font-medium text-neutral-500 group-hover:text-neutral-300 transition-colors leading-tight">
                        Aa
                      </span>
                      <span className="text-sm text-neutral-500 group-hover:text-neutral-400 font-inter">
                        {fontDesc || 'Padrão do Sistema'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[32px] font-semibold text-neutral-100 group-hover:text-white transition-colors leading-tight">
                        {companyPreview}
                      </span>
                      <span className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-inter font-semibold mt-1">
                        {fontName}
                      </span>
                      {fontDesc && (
                        <span className="text-[13px] text-neutral-400 group-hover:text-neutral-300 leading-relaxed tracking-wide font-inter">
                          {fontDesc}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
          {activeMessage.allowMoreOptions && (
            <div className="flex justify-start">
              <Button
                variant="ghost"
                size="lg"
                onClick={generateMoreOptions}
                disabled={isGeneratingMore || isLoading || isSubmittingLocal}
                className="rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-12 md:h-14 font-medium"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingMore ? 'animate-spin' : ''}`} />
                {t.otherOptions}
              </Button>
            </div>
          )}
        </div>
        );
      })() : (
        <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full">
          {activeMessage.options?.map((opt: unknown, idx: number) => {
            const optObj = typeof opt === 'object' && opt !== null ? (opt as Record<string, unknown>) : null;
            const optText = optObj ? String(optObj.label || optObj.title || optObj.name || JSON.stringify(opt)) : String(opt);
            const optKey = optObj ? String(optObj.id || optText || idx) : String(opt);
            return (
            <Button
              key={optKey}
              variant="outline"
              size="lg"
              onClick={() => doSubmit(optText)}
              disabled={isLoading || isSubmittingLocal}
              className="rounded-full bg-transparent border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 text-neutral-300 h-12 md:h-14 md:px-6 font-medium tracking-wide transition-all"
            >
              {optText}
            </Button>
          )})}
          
          {activeMessage.allowMoreOptions && (
            <Button
              variant="ghost"
              size="lg"
              onClick={generateMoreOptions}
              disabled={isGeneratingMore || isLoading || isSubmittingLocal}
              className="rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-12 md:h-14 font-medium"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingMore ? 'animate-spin' : ''}`} />
              {t.otherOptions}
            </Button>
          )}
        </div>
      )}
      {/* Sempre mostramos o text input embaixo como Híbrido */}
      {renderTextAndAudio()}
    </div>
  );

  // RENDER: MULTIPLE CHOICE
  const renderMultipleChoice = () => (
    <div className="flex flex-col gap-6 w-full mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeMessage.options?.map((opt: unknown, idx: number) => {
          const optObj = typeof opt === 'object' && opt !== null ? (opt as Record<string, unknown>) : null;
          const optText = optObj ? String(optObj.label || optObj.title || optObj.name || JSON.stringify(opt)) : String(opt);
          const optKey = optObj ? String(optObj.id || optText || idx) : String(opt);
          const isSelected = selectedMultiples.includes(optText);
          return (
            <label 
              key={optKey}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
              }`}
            >
              <Checkbox 
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedMultiples([...selectedMultiples, optText]);
                  } else {
                    setSelectedMultiples(selectedMultiples.filter(item => item !== optText));
                  }
                }}
              />
              <span 
                className="text-white font-medium"
                style={isFontSelection ? { fontFamily: `"${optText.split('-')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim()}", sans-serif`, fontSize: '1.25rem' } : undefined}
              >{optText}</span>
            </label>
          )
        })}
      </div>
      <div className="w-full opacity-80 hover:opacity-100 transition-opacity mt-4">
         <p className="text-sm text-center text-neutral-500 mb-2">Adicione detalhes via texto ou áudio (opcional):</p>
         {renderCustomTexts()}
         {renderTextAndAudio(handleAddCustomText, <Plus className="w-5 h-5" />, true)}
      </div>

      <ScrollConfirmWrapper
        containerClassName="flex justify-end mt-6 border-t border-neutral-800 pt-6"
        isDisabled={(selectedMultiples.length === 0 && !inputText.trim()) || isLoading || isSubmittingLocal}
        ActionComponent={
          <Button 
            size="lg" 
            className={`w-full sm:w-auto h-14 px-8 rounded-full font-medium transition-all duration-300 border ${
              (selectedMultiples.length > 0 || inputText.trim())
                ? 'bg-indigo-500 text-white border-indigo-400 hover:bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105'
                : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10'
            }`}
             onClick={handleLocalSend}
             disabled={(selectedMultiples.length === 0 && !inputText.trim()) || isLoading || isSubmittingLocal}
           >
             {(isLoading || isSubmittingLocal) ? <RefreshCw className="w-5 h-5 mr-2 animate-spin text-white/70" /> : null}
             {t.confirmSelection}{" "}<ArrowRight className="w-5 h-5 ml-2" />
           </Button>
        }
      />
    </div>
  );

  // RENDER: SLIDER
  const renderSlider = () => {
    const min = Number(activeMessage.minOption) || 0;
    const max = Number(activeMessage.maxOption) || 10;
    const currentVal = Number(sliderValue[0]) || min;
    
    return (
      <div className="flex flex-col gap-6 w-full mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          
          <div className="absolute inset-0 bg-primary/5 opacity-50 pointer-events-none" />
          
          <div className="text-center mb-10 relative z-10 w-full">
            <span className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-2 block">
              {t.yourResponse}
            </span>
            <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 tabular-nums tracking-tighter filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300">
              {currentVal >= max ? `+${currentVal}` : currentVal}
            </div>
          </div>
          
          <div className="w-full px-4 md:px-8 relative z-10">
            <Slider 
              value={[currentVal]} 
              onValueChange={(val) => {
                const arr = Array.isArray(val) ? val : [val];
                setSliderValue(arr.map(Number));
              }} 
              max={max} 
              min={min} 
              step={1}
              className="w-full cursor-grab active:cursor-grabbing"
            />
          </div>
          
          <div className="flex justify-between w-full mt-6 px-4 md:px-8 text-neutral-400 font-medium text-sm md:text-base relative z-10">
            <span className="bg-neutral-900/50 px-4 py-1.5 rounded-xl border border-white/5 shadow-inner">{min}</span>
            <span className="bg-neutral-900/50 px-4 py-1.5 rounded-xl border border-white/5 shadow-inner">{max}</span>
          </div>

        </div>

        <ScrollConfirmWrapper
           containerClassName="flex justify-end mt-2 w-full"
           isDisabled={isLoading || isSubmittingLocal}
           ActionComponent={
             <Button 
               size="lg" 
               className="w-full sm:w-auto h-14 bg-white text-black hover:bg-neutral-200 px-10 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105"
               onClick={() => doSubmit(currentVal)}
               disabled={isLoading || isSubmittingLocal}
             >
               {(isLoading || isSubmittingLocal) ? <RefreshCw className="w-5 h-5 mr-2 animate-spin text-neutral-500" /> : null}
               {t.next}{" "}<ArrowRight className="w-5 h-5 ml-2" />
             </Button>
           }
        />
        
        <div className="w-full opacity-70 hover:opacity-100 transition-opacity">
           <p className="text-sm text-center text-neutral-500 mb-2">{t.exactValue}</p>
           {renderTextAndAudio()}
        </div>
      </div>
    );
  };

  // RENDER: COLOR WIZARD
  const getBrandContext = () => {
    return messages
      .filter(m => m.role === 'assistant' && m.userAnswer && m.content)
      .map(m => {
        const answerStr = Array.isArray(m.userAnswer) ? m.userAnswer.join(', ') : m.userAnswer || '';
        return `Q: ${m.content} - A: ${answerStr}`;
      })
      .join(' | ');
  };

  const fetchInitialColors = async () => {
    setIsFetchingColors(true);
    try {
      const brandContext = getBrandContext();
      const kept = selectedMainColors.length > 0 ? selectedMainColors : [];
      const res = await fetch("/api/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "initial", 
          context: brandContext, 
          hint: colorHint.trim() || undefined,
          keptColors: kept 
        })
      });
      if (res.ok) {
        const data = await res.json();
        const apiColors: string[] = data.colors || [];
        if (kept.length > 0) {
          // Merge: keep selected + add new ones
          const newOnes = apiColors.filter((c: string) => !kept.includes(c));
          const merged = [...kept, ...newOnes].slice(0, 4);
          setSuggestedMainColors(merged);
        } else {
          setSuggestedMainColors(apiColors.slice(0, 4));
          setSelectedMainColors([]);
        }
      }
    } catch (e) {
      console.error("[Colors] fetchInitial error:", e);
      if (suggestedMainColors.length === 0) {
        setSuggestedMainColors(["#6366F1", "#EC4899", "#14B8A6", "#F97316"]);
      }
    } finally {
      setIsFetchingColors(false);
      setShowHintInput(false);
      setColorHint("");
    }
  };

  const fetchDetailColors = async () => {
    setIsFetchingColors(true);
    try {
      const brandContext = getBrandContext();
      const currentMain = mainColors.length >= 1 ? mainColors : selectedMainColors;
      const kept = selectedSuggestions.length > 0 ? selectedSuggestions : [];
      const res = await fetch("/api/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "detail", 
          mainColors: currentMain, 
          context: brandContext, 
          hint: colorHint.trim() || undefined,
          keptColors: kept 
        })
      });
      if (res.ok) {
        const data = await res.json();
        const apiColors: string[] = data.colors || [];
        if (kept.length > 0) {
          const newOnes = apiColors.filter((c: string) => !kept.includes(c));
          const merged = [...kept, ...newOnes].slice(0, 4);
          setSuggestedColors(merged);
        } else {
          setSuggestedColors(apiColors.slice(0, 4));
          setSelectedSuggestions([]);
        }
        setColorWizardStep(2);
      }
    } catch (e) {
      console.error("[Colors] fetchDetail error:", e);
      if (suggestedColors.length === 0) {
        setSuggestedColors(["#F8FAFC", "#94A3B8", "#CBD5E1", "#E2E8F0"]);
      }
      setColorWizardStep(2);
    } finally {
      setIsFetchingColors(false);
      setShowHintInput(false);
      setColorHint("");
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeMessage.questionType === 'color_picker' && colorWizardStep === 1 && suggestedMainColors.length === 0 && !isFetchingColors) {
      fetchInitialColors();
    }
  }, [activeMessage.questionType, colorWizardStep, suggestedMainColors.length]);

  const renderColorPicker = () => {
    // If answer already submitted, show summary immediately (Bug #3 fix)
    if (activeMessage.userAnswer && Array.isArray(activeMessage.userAnswer) && (activeMessage.userAnswer as string[]).length >= 2) {
      const ansArray = activeMessage.userAnswer as string[];
      const mainCount = mainColors.length || Math.min(2, Math.ceil(ansArray.length / 2));
      return (
        <div className="flex flex-col gap-6 w-full mt-4 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl shadow-2xl">
            <span className="text-sm font-semibold tracking-widest text-primary uppercase mb-2 text-center">
              Paleta Final
            </span>
            <p className="text-[11px] text-neutral-500 mb-6 text-center">Sua paleta de marca selecionada</p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {ansArray.map((hex: string, idx: number) => {
                const label = idx < mainCount ? "Principal" : "Detalhe";
                return (
                  <div key={idx} className="group flex flex-col items-center gap-3 relative">
                    <div 
                      className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] border-2 border-white/10 relative overflow-hidden shadow-lg"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="flex flex-col items-center mt-1">
                       <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider whitespace-nowrap">{label}</span>
                       <span className="text-xs font-mono text-neutral-300 mt-1 px-2 py-0.5 rounded-md bg-neutral-900/50 border border-neutral-800">{hex}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {!isLoading && !isSubmittingLocal && (
               <div className="flex gap-4 mt-8">
                 <Button variant="outline" className="h-11 px-5 rounded-full border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm" onClick={() => { setColorWizardStep(1); }}>
                   Editar Cores
                 </Button>
               </div>
            )}
          </div>
        </div>
      );
    }

    // Step 1: Primary Colors — select 1-2
    if (colorWizardStep === 1) {
      return (
        <div className="flex flex-col gap-6 w-full mt-4 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl shadow-2xl">
            <span className="text-sm font-semibold tracking-widest text-primary uppercase mb-2 text-center">
              {t.step1Title}
            </span>
            <p className="text-[12px] text-neutral-500 mb-6 text-center max-w-md">
              A IA sugeriu cores com base nas suas respostas. {isOnboarding ? "Selecione 1 cor principal para sua marca." : "Selecione 1 ou 2 cores principais para sua marca."}
            </p>

            {isFetchingColors && suggestedMainColors.length === 0 ? (
               <div className="py-12 flex flex-col items-center">
                 <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                 <p className="text-neutral-400 font-medium">Gerando paleta com base no seu perfil...</p>
               </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4">
                 {suggestedMainColors.map((hex, idx) => {
                    const isSelected = selectedMainColors.includes(hex);
                    return (
                      <div 
                        key={`main-${idx}-${hex}`} 
                        className={`cursor-pointer group flex flex-col items-center gap-3 p-4 rounded-2xl relative transition-all border-2 ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--color-primary),0.2)]' : 'border-white/5 hover:border-white/20'}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMainColors(selectedMainColors.filter(c => c !== hex));
                          } else if (isOnboarding) {
                            setSelectedMainColors([hex]);
                          } else if (selectedMainColors.length < 2) {
                            setSelectedMainColors([...selectedMainColors, hex]);
                          }
                        }}
                      >
                        <div className="relative flex items-center justify-center">
                          <div 
                            className="w-16 h-16 rounded-full transition-transform group-hover:scale-110 border border-white/10 relative overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: hex, boxShadow: isSelected ? `0 0 25px ${hex}60` : undefined }}
                          >
                            <input 
                              type="color" 
                              value={hex} 
                              onChange={(e) => {
                                e.stopPropagation();
                                const newHex = e.target.value.toUpperCase();
                                const newColors = [...suggestedMainColors];
                                newColors[idx] = newHex;
                                setSuggestedMainColors(newColors);
                                if (isSelected) {
                                  setSelectedMainColors(selectedMainColors.map(c => c === hex ? newHex : c));
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${isSelected ? 'z-20' : 'pointer-events-none z-[-1]'}`}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                <Pipette className="w-6 h-6 text-white drop-shadow-md" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center z-10 pointer-events-none">
                          <span className="text-xs font-mono text-neutral-300">{hex}</span>
                        </div>
                      </div>
                    );
                 })}
              </div>
            )}

            {/* Hint input — appears when "Gerar Mais" is clicked */}
            {showHintInput && (
              <div className="w-full max-w-sm mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <label className="text-[11px] text-neutral-400 uppercase tracking-wider mb-2 block text-center">Descreva o estilo que você quer</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={colorHint}
                    onChange={(e) => setColorHint(e.target.value)}
                    placeholder="Ex: verde neon, tons pastéis, azul royal..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && colorHint.trim()) {
                        fetchInitialColors();
                      }
                    }}
                  />
                  <Button 
                    className="rounded-xl bg-primary hover:bg-primary/90 text-white px-4"
                    onClick={() => fetchInitialColors()}
                    disabled={isFetchingColors}
                  >
                    {isFetchingColors ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Button 
                variant="outline" 
                className="h-11 px-5 rounded-full border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm"
                onClick={() => {
                  if (showHintInput) {
                    // Already showing hint — just regenerate without hint
                    setColorHint("");
                    fetchInitialColors();
                  } else {
                    setShowHintInput(true);
                  }
                }}
                disabled={isFetchingColors}
              >
                {isFetchingColors ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {showHintInput ? "Gerar sem dica" : t.generateMore}
              </Button>
              <Button
                className="h-11 px-6 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(var(--color-primary),0.4)] transition-all hover:scale-105 text-sm"
                onClick={() => {
                  if (selectedMainColors.length >= 1) {
                    setMainColors(selectedMainColors);
                    setShowHintInput(false);
                    setColorHint("");
                    // Fetch detail colors
                    fetchDetailColors();
                  }
                }}
                disabled={selectedMainColors.length < 1 || isFetchingColors}
              >
                {isFetchingColors ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                {t.next}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Step 2: Detail Colors — select 1-2
    if (colorWizardStep === 2) {
      return (
        <div className="flex flex-col gap-6 w-full mt-4 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl shadow-2xl">
            {/* Show chosen main colors as context */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider mr-2">Principais:</span>
              {mainColors.map((hex, i) => (
                <div key={i} className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: hex }} title={hex} />
              ))}
            </div>

            <span className="text-sm font-semibold tracking-widest text-primary uppercase mb-2 text-center">
              Cores de Detalhe
            </span>
            <p className="text-[12px] text-neutral-500 mb-6 text-center max-w-md">
              {isOnboarding ? "Escolha 1 cor de detalhe que complementa sua cor principal. É usada em bordas, badges e acentos sutis." : "Escolha 1 ou 2 cores de detalhe que complementam suas cores principais. São usadas em bordas, badges e acentos sutis."}
            </p>

            {isFetchingColors && suggestedColors.length === 0 ? (
               <div className="py-12 flex flex-col items-center">
                 <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                 <p className="text-neutral-400 font-medium">Gerando cores que harmonizam com sua paleta...</p>
               </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4">
                 {suggestedColors.map((hex, idx) => {
                    const isSelected = selectedSuggestions.includes(hex);
                    return (
                      <div 
                        key={`detail-${idx}-${hex}`} 
                        className={`cursor-pointer group flex flex-col items-center gap-3 p-4 rounded-2xl relative transition-all border-2 ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--color-primary),0.2)]' : 'border-white/5 hover:border-white/20'}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSuggestions(selectedSuggestions.filter(c => c !== hex));
                          } else if (isOnboarding) {
                            setSelectedSuggestions([hex]);
                          } else if (selectedSuggestions.length < 2) {
                            setSelectedSuggestions([...selectedSuggestions, hex]);
                          }
                        }}
                      >
                        <div className="relative flex items-center justify-center">
                          <div 
                            className="w-16 h-16 rounded-full transition-transform group-hover:scale-110 border border-white/10 relative overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: hex, boxShadow: isSelected ? `0 0 25px ${hex}60` : undefined }}
                          >
                            <input 
                              type="color" 
                              value={hex} 
                              onChange={(e) => {
                                e.stopPropagation();
                                const newHex = e.target.value.toUpperCase();
                                const newColors = [...suggestedColors];
                                newColors[idx] = newHex;
                                setSuggestedColors(newColors);
                                if (isSelected) {
                                  setSelectedSuggestions(selectedSuggestions.map(c => c === hex ? newHex : c));
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${isSelected ? 'z-20' : 'pointer-events-none z-[-1]'}`}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                <Pipette className="w-6 h-6 text-white drop-shadow-md" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center z-10 pointer-events-none">
                          <span className="text-xs font-mono text-neutral-300">{hex}</span>
                        </div>
                      </div>
                    );
                 })}
              </div>
            )}

            {/* Hint input for detail step */}
            {showHintInput && (
              <div className="w-full max-w-sm mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <label className="text-[11px] text-neutral-400 uppercase tracking-wider mb-2 block text-center">Descreva o estilo de detalhe</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={colorHint}
                    onChange={(e) => setColorHint(e.target.value)}
                    placeholder="Ex: tons neutros, cinza quente, bege suave..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && colorHint.trim()) {
                        fetchDetailColors();
                      }
                    }}
                  />
                  <Button 
                    className="rounded-xl bg-primary hover:bg-primary/90 text-white px-4"
                    onClick={() => fetchDetailColors()}
                    disabled={isFetchingColors}
                  >
                    {isFetchingColors ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Button variant="outline" className="h-11 px-5 rounded-full border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm" onClick={() => { setShowHintInput(false); setColorHint(""); setColorWizardStep(1); }}>
                {t.back}
              </Button>
              <Button 
                variant="outline" 
                className="h-11 px-5 rounded-full border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm"
                onClick={() => {
                  if (showHintInput) {
                    setColorHint("");
                    fetchDetailColors();
                  } else {
                    setShowHintInput(true);
                  }
                }}
                disabled={isFetchingColors}
              >
                {isFetchingColors ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {showHintInput ? "Gerar sem dica" : t.generateMore}
              </Button>
              <Button 
                className="h-11 px-6 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(var(--color-primary),0.4)] transition-all hover:scale-105 text-sm"
                onClick={() => doSubmit([...mainColors, ...selectedSuggestions])}
                disabled={selectedSuggestions.length < 1 || isLoading || isSubmittingLocal}
              >
                {(isLoading || isSubmittingLocal) ? <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                {t.finishPalette}
              </Button>
            </div>
          </div>
        </div>
      );
    }
  };

  // RENDER: BOOLEAN TOGGLE (Futuristic Yes/No Switch)
  const renderBooleanToggle = () => {
    let initialVal = null;
    if (activeMessage.userAnswer) {
      if (Array.isArray(activeMessage.userAnswer)) {
        initialVal = activeMessage.userAnswer[0];
      } else {
        initialVal = String(activeMessage.userAnswer);
      }
    }

    return (
      <div className="flex flex-col gap-6 w-full items-center justify-center my-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <DraggableToggle 
          t={t} 
          onSelect={doSubmit} 
          disabled={isLoading || isSubmittingLocal} 
          initialAnswer={initialVal}
        />
        <div className="w-full max-w-lg mt-4 opacity-70 hover:opacity-100 transition-opacity">
          <p className="text-sm text-center text-neutral-500 mb-2">{t.moreDetails}</p>
          {renderTextAndAudio()}
        </div>
      </div>
    );
  };

  // RENDER: CARD SELECTOR (Large Glassmorphism Cards)
  const renderCardSelector = () => (
    <div className="flex flex-col gap-8 w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {activeMessage.options?.map((opt: unknown, idx: number) => {
          const optObj = typeof opt === 'object' && opt !== null ? (opt as Record<string, unknown>) : null;
          const title = optObj ? String(optObj.title || optObj.name || optObj.label || JSON.stringify(opt)) : String(opt);
          const desc = optObj ? String(optObj.description || '') : '';
          const isSelected = selectedMultiples.includes(title);
          
          return (
            <button
              key={idx}
              onClick={() => {
                 if (isSelected) {
                   setSelectedMultiples(selectedMultiples.filter(t => t !== title));
                 } else {
                   setSelectedMultiples([...selectedMultiples, title]);
                 }
              }}
              disabled={isLoading || isSubmittingLocal}
              className={`group flex flex-col items-start text-left p-6 md:p-8 rounded-3xl bg-neutral-900/40 border transition-all ${
                isSelected 
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_5px_30px_rgba(99,102,241,0.15)]' 
                  : 'border-neutral-800 hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(var(--color-primary),0.1)]'
              }`}
            >
              <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center mb-6 transition-colors border ${
                 isSelected 
                   ? 'bg-primary/20 border-primary/50' 
                   : 'bg-neutral-800 border-white/5 group-hover:bg-primary/20'
              }`}>
                <div className={`w-4 h-4 rounded-full transition-all ${
                   isSelected 
                     ? 'bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.8)]' 
                     : 'bg-neutral-500 group-hover:bg-primary group-hover:shadow-[0_0_15px_rgba(var(--color-primary),0.8)]'
                }`} />
              </div>
              <h3 
                className={`text-xl font-bold mb-3 transition-colors ${
                  isSelected ? 'text-primary' : 'text-white group-hover:text-primary'
                }`}
                style={isFontSelection ? { fontFamily: `"${title.split('-')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim()}", sans-serif`, fontSize: '1.5rem', fontWeight: 400 } : undefined}
              >{title}</h3>
              {desc && <p className="text-sm text-neutral-400 font-inter leading-relaxed">{desc}</p>}
            </button>
          )
        })}
      </div>
      
      {activeMessage.allowMoreOptions && (
         <div className="flex justify-center w-full mt-2">
           <Button onClick={generateMoreOptions} disabled={isGeneratingMore} variant="outline" className="rounded-full gap-2 border-neutral-800 bg-transparent text-neutral-300 hover:bg-neutral-900 h-14 px-8 w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 ${isGeneratingMore ? "animate-spin" : ""}`} />
              <span>{t.suggestRoutes}</span>
           </Button>
         </div>
      )}

      <div className="w-full opacity-80 hover:opacity-100 transition-opacity mt-4">
         <p className="text-sm text-center text-neutral-500 mb-2">{t.addDetails}</p>
         {renderCustomTexts()}
         {renderTextAndAudio(handleAddCustomText, <Plus className="w-5 h-5" />, true)}
      </div>

      <ScrollConfirmWrapper
        containerClassName="flex flex-col sm:flex-row gap-4 w-full mt-6 items-center justify-end border-t border-neutral-800 pt-6"
        isDisabled={(selectedMultiples.length === 0 && !inputText.trim()) || isLoading || isSubmittingLocal}
        ActionComponent={
          <Button 
             size="lg" 
             className={`w-full sm:w-auto h-14 px-8 rounded-full font-medium transition-all duration-300 border ${
               (selectedMultiples.length > 0 || inputText.trim())
                 ? 'bg-indigo-500 text-white border-indigo-400 hover:bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105'
                 : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10'
             }`}
             onClick={handleLocalSend}
             disabled={(selectedMultiples.length === 0 && !inputText.trim()) || isLoading || isSubmittingLocal}
          >
             {(isLoading || isSubmittingLocal) ? <RefreshCw className="w-5 h-5 mr-2 animate-spin text-white/70" /> : null}
             {t.confirmSelection}{" "}<ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        }
      />
    </div>
  );

  // RENDER: FILE UPLOAD (Neon Dropzone)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(t.fileTooLarge);
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const { error } = await supabase.storage
        .from('briefing_assets')
        .upload(fileName, file, { upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('briefing_assets')
        .getPublicUrl(fileName);

      doSubmit(`[Arquivo Anexado via UI]: ${publicUrlData.publicUrl}`);
    } catch (err) {
      console.error("Erro no upload do arquivo:", err instanceof Error ? err.message : String(err));
      alert(t.fileUploadError);
    } finally {
      setIsUploading(false);
    }
  };

  const renderFileUpload = () => (
    <div className="flex flex-col gap-6 w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input 
        type="file" 
        accept=".pdf,.png,.jpg,.jpeg" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />
      <div 
        className={`w-full h-56 rounded-3xl border-2 border-dashed border-neutral-700 bg-neutral-900/30 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group hover:shadow-[0_0_30px_rgba(var(--color-primary),0.2)] ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => {
          if (!isUploading) fileInputRef.current?.click();
        }}
      >
        <div className="w-16 h-16 rounded-full bg-neutral-800 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 text-neutral-400 group-hover:text-primary transition-colors" />
          )}
        </div>
        <p className="text-white font-medium text-lg">
          {isUploading ? t.sendingFile : t.dragFiles}
        </p>
        <p className="text-neutral-500 text-sm mt-1">PDF, PNG, JPG (Max 5MB)</p>
      </div>
      <div className="w-full">
         <p className="text-sm text-center text-neutral-500 mb-2">{t.orTypeFile}</p>
         {renderTextAndAudio()}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {isFontSelection && fontOptions.length > 0 && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {fontOptions.map((font, idx) => {
            const sanitized = font.split('-')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '+');
            if (!sanitized) return null;
            return (
              <link 
                key={idx} 
                href={`https://fonts.googleapis.com/css2?family=${sanitized}:wght@300;400;500;600;700&display=swap`} 
                rel="stylesheet" 
              />
            );
          })}
        </>
      )}

      {hasAnswered && (
        <div className="flex mb-6 mt-[-10px]">
          <div className="bg-neutral-800/50 text-neutral-300 px-4 py-3 rounded-2xl flex items-center gap-3 border border-neutral-800">
            <CheckCircle2 className="w-5 h-5 text-green-400/80" />
            <span>
              {Array.isArray(activeMessage.userAnswer) 
                ? activeMessage.userAnswer.join(', ') 
                : activeMessage.userAnswer}
            </span>
          </div>
        </div>
      )}

      {questionType === 'text' && renderTextAndAudio()}
      {questionType === 'single_choice' && renderSingleChoice()}
      {questionType === 'multiple_choice' && renderMultipleChoice()}
      {questionType === 'slider' && renderSlider()}
      {questionType === 'color_picker' && renderColorPicker()}
      {questionType === 'boolean_toggle' && renderBooleanToggle()}
      {questionType === 'card_selector' && renderCardSelector()}
      {questionType === 'file_upload' && renderFileUpload()}
      {questionType === 'multi_slider' && (
        <MultiSliderQuestion
          sliders={(activeMessage.options || []).map((opt: unknown) => {
            const o = opt as MultiSliderOption;
            return {
              label: o.label || 'Dimension',
              min: Number(o.min) || 1,
              max: Number(o.max) || 5,
              minLabel: o.minLabel || '',
              maxLabel: o.maxLabel || '',
              defaultValue: o.defaultValue,
            };
          })}
          onConfirm={(values) => doSubmit(JSON.stringify(values))}
          disabled={isLoading || isSubmittingLocal}
          confirmLabel={t.confirmSelection}
          initialValues={activeMessage.userAnswer ? (() => { try { return JSON.parse(String(activeMessage.userAnswer)); } catch { return undefined; } })() : undefined}
        />
      )}
      
      {questionType === 'text' && (
        <div className="text-neutral-600 font-inter text-sm flex gap-4 mt-2 px-2 items-center justify-center w-full">
            <span><b className="font-semibold text-neutral-400">Enter</b>{" "}{t.enterToSend}</span>
            <span><b className="font-semibold text-neutral-400">Shift + Enter</b>{" "}{t.shiftToSkip}</span>
        </div>
      )}
    </div>
  );
}

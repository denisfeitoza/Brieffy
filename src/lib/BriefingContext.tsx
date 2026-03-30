"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { BriefingState, Message, FinalAssets, BriefingContextType, BasalCoverageInfo, BrandingInfo, PackageDetail, BriefingSignal, SignalCategory } from "./types";

const DEFAULT_BRANDING: BrandingInfo = {
  display_name: 'Sua Empresa',
  company_name: 'Sua Empresa',
  logo_url: '',
  brand_color: '#06b6d4',
  brand_accent: '#8b5cf6',
  tagline: '',
  website: '',
};
import { createClient } from "./supabase/client";

const supabase = createClient();

const BriefingContext = createContext<BriefingContextType | undefined>(undefined);

export interface SerializedTemplate {
  id: string;
  name: string;
  category: string;
  objectives: string[];
  core_fields: string[];
  basal_fields: string[];
  suggested_questions: Record<string, unknown>[];
  sections: { id: string; title: string; priority: number }[];
  briefing_purpose?: string;
  depth_signals?: string[];
}

export function BriefingProvider({ 
  children, 
  activeTemplate,
  sessionId: existingSessionId,
  initialContext,
  selectedPackages: initialSelectedPackages,
  selectedPackageDetails: initialSelectedPackageDetails,
  branding: initialBranding,
  initialPassphrase,
  apiEndpoint,
  isOnboarding
}: { 
  children: ReactNode;
  activeTemplate?: SerializedTemplate | null;
  sessionId?: string;
  initialContext?: string;
  selectedPackages?: string[];
  selectedPackageDetails?: PackageDetail[];
  branding?: BrandingInfo;
  initialPassphrase?: string;
  apiEndpoint?: string;
  isOnboarding?: boolean;
}) {
  const endpoint = apiEndpoint || "/api/briefing";
  const branding = initialBranding || DEFAULT_BRANDING;
  const selectedPackages = initialSelectedPackages || [];
  const selectedPackageDetails = initialSelectedPackageDetails || [];
  // O initial state preencherá o que vier em core_fields.
  const initialBase: Record<string, unknown> = {};
  if (activeTemplate && activeTemplate.core_fields) {
    activeTemplate.core_fields.forEach(f => {
      initialBase[f.trim()] = "";
    });
  } else {
    // Legacy fallback (se não houver template)
    initialBase.empresa = "";
    initialBase.descricao = "";
    initialBase.publico = "";
  }

  const [briefingState, setBriefingState] = useState<BriefingState>(initialBase);

  // Use existing session ID from props (e.g., /b/{id} routes)
  // For new sessions (home page), we lazily create on first submitAnswer
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null);
  const sessionCreatedRef = React.useRef(false);

  // Active Listening — accumulated signals across the session
  const [detectedSignals, setDetectedSignals] = useState<BriefingSignal[]>([]);
  const [engagementLevel, setEngagementLevel] = useState<'high' | 'medium' | 'low'>('high');

  // Lazy session creation — only creates when user actually starts interacting
  const ensureSession = async (): Promise<string | null> => {
    if (sessionId) return sessionId;
    if (sessionCreatedRef.current) return null; // Prevent race condition
    sessionCreatedRef.current = true;

    try {
      const { data, error } = await supabase
        .from('briefing_sessions')
        .insert([{ 
          status: 'in_progress',
          template_id: activeTemplate?.id || null 
        }])
        .select('id')
        .single();
        
      if (!error && data) {
        setSessionId(data.id);
        return data.id;
      } else {
        console.error("Falha ao iniciar sessão no Supabase:", error);
        sessionCreatedRef.current = false;
        return null;
      }
    } catch (err) {
      console.error("Falha ao iniciar sessão:", err);
      sessionCreatedRef.current = false;
      return null;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content: "Em qual idioma você prefere que eu conduza as perguntas? / Which language should I use?",
      type: "question",
      questionType: "single_choice",
      options: ["🇧🇷 Português", "🇺🇸 English", "🇪🇸 Español"],
      allowMoreOptions: false,
    },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [chosenLanguage, setChosenLanguage] = useState("pt"); // Default: Portuguese
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  
  // Controle de estágios do final
  const [isFinished, setIsFinished] = useState(false); // true quando a IA deu o verdict final
  const [isUploadStep, setIsUploadStep] = useState(false); // Tela estática de upload
  
  const [assets, setAssets] = useState<FinalAssets | null>(null);
  const [basalInfo, setBasalInfo] = useState<BasalCoverageInfo>({
    basalCoverage: 0,
    currentSection: 'company',
    basalFieldsCollected: [],
    basalFieldsMissing: [],
  });

  // Performance settings from DB
  const [perfSettings, setPerfSettings] = useState({ timeoutMs: 30000 });
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((rows: { key: string; value: string }[]) => {
        if (!Array.isArray(rows)) return;
        const map: Record<string, string> = {};
        rows.forEach(r => map[r.key] = r.value);
        setPerfSettings({
          timeoutMs: parseInt(map.briefing_timeout_ms || '30000'),
        });
      })
      .catch(() => {}); // Fallback to defaults
  }, []);

  const updateBriefingState = (updates: Partial<BriefingState>) => {
    setBriefingState((prev) => ({ ...prev, ...updates }));
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const goNext = () => {
    // Só deixa avançar se a pergunta atual já tem resposta ou se já encerrou e quer ver a tela de final
    if (currentStepIndex < messages.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else if (isFinished && !isUploadStep) {
      setIsUploadStep(true);
    }
  };

  const addMessage = (msg: Omit<Message, "id">) => {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { ...msg, id }]);
  };

  const submitAnswer = async (answer: string | string[] | number) => {
    // Validação flexível dependendo do tipo da resposta
    if (typeof answer === 'string' && !answer.trim()) return;
    if (Array.isArray(answer) && answer.length === 0) return;

    // Detect language from the initial language selection step (step 0)
    let activeLanguage = chosenLanguage;
    if (currentStepIndex === 0 && typeof answer === 'string') {
      const langMap: Record<string, string> = {
        '🇧🇷 Português': 'pt',
        '🇺🇸 English': 'en',
        '🇪🇸 Español': 'es',
      };
      const detectedLang = langMap[answer.trim()];
      if (detectedLang) {
        setChosenLanguage(detectedLang);
        activeLanguage = detectedLang;
      }
    }

    // Atualiza a resposta na mensagem ATUAL (a pergunta que está na tela)
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[currentStepIndex] = { ...newMessages[currentStepIndex], userAnswer: answer };
      return newMessages;
    });

    setIsLoading(true);

    const currentMsgToLog = messages[currentStepIndex];
    
    // Lazily create session on first interaction (fixes session leak bug)
    const activeSessionId = await ensureSession();
    
    // Log Interaction to Database (await to ensure interactionId is ready for inference update)
    let interactionId: string | null = null;
    if (activeSessionId) {
      try {
        const { data: intData, error: intError } = await supabase
          .from('briefing_interactions')
          .insert([{
            session_id: activeSessionId,
            step_order: currentStepIndex,
            question_type: currentMsgToLog.questionType || 'text',
            question_text: currentMsgToLog.content,
            options_offered: currentMsgToLog.options ? currentMsgToLog.options : null,
            user_answer: answer,
            is_depth_question: currentMsgToLog.isDepthQuestion || false,
          }])
          .select('id')
          .single();
        
        if (intError) console.error("Erro ao salvar interação no Supabase:", intError);
        else if (intData) interactionId = intData.id;
      } catch (dbErr) {
        console.error("Erro ao inserir interação:", dbErr);
      }
    }

    // Constrói o histórico COMPLETO desde a primeira mensagem até o step atual
    const historyPayload = messages.slice(0, currentStepIndex + 1).map(m => {
      const resp = Array.isArray(m.userAnswer) ? m.userAnswer.join(', ') : m.userAnswer;
      return {
        role: m.role,
        content: m.content + (resp ? `\n\nRespondi: ${resp}` : "")
      };
    });

    try {
      // Timeout configurável do DB
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), perfSettings.timeoutMs);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          answer, 
          currentState: briefingState,
          history: historyPayload, 
          generateMore: false,
          activeTemplate,
          initialContext,
          chosenLanguage: activeLanguage,
          selectedPackages,
          // Pass accumulated signals so the AI can avoid duplicating
          detectedSignals: detectedSignals.map(s => s.summary),
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Erro na API");

      const data = await res.json();
      
      if (data.updates) {
        updateBriefingState(data.updates);
      }

      // ================================================================
      // ACTIVE LISTENING — Process new signals from AI response
      // ================================================================
      if (data.active_listening?.signals?.length) {
        const newSignals: BriefingSignal[] = data.active_listening.signals.map((s: {
          category: SignalCategory;
          summary: string;
          relevance_score: number;
        }) => ({
          id: crypto.randomUUID(),
          category: s.category,
          summary: s.summary,
          source_answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
          relevance_score: s.relevance_score,
          step_index: currentStepIndex,
          timestamp: Date.now(),
        }));

        setDetectedSignals(prev => [...prev, ...newSignals]);

        // Persist signals to the session (async, non-blocking)
        if (activeSessionId) {
          supabase.from('briefing_sessions')
            .update({ detected_signals: [...detectedSignals, ...newSignals] })
            .eq('id', activeSessionId)
            .then(({ error }) => {
              if (error) console.error('[ActiveListening] Failed to persist signals:', error);
            });
        }

        // Update interaction row with detected signal summary (async)
        if (interactionId && newSignals.length > 0) {
          supabase.from('briefing_interactions')
            .update({ detected_signal: newSignals[0].summary })
            .eq('id', interactionId)
            .then(({ error }) => {
              if (error) console.error('[ActiveListening] Failed to update interaction signal:', error);
            });
        }

        console.log(`[ActiveListening] ${newSignals.length} new signal(s) detected:`, 
          newSignals.map(s => `[${s.category}] ${s.summary} (${Math.round(s.relevance_score * 100)}%)`).join(', ')
        );
      }

      // Persist inferences to the interaction row (async, non-blocking)
      if (data.inferences && interactionId && activeSessionId) {
        supabase.from('briefing_interactions')
          .update({ inferences: data.inferences })
          .eq('id', interactionId)
          .then(({ error }) => {
            if (error) console.error("Erro ao salvar inferences:", error);
          });
      }

      // Update basal coverage tracking from AI response
      if (data.basalCoverage !== undefined) {
        setBasalInfo({
          basalCoverage: data.basalCoverage,
          currentSection: data.currentSection || 'company',
          basalFieldsCollected: data.basalFieldsCollected || [],
          basalFieldsMissing: data.basalFieldsMissing || [],
        });

        // Persist basal coverage on each step (async, non-blocking)
        if (activeSessionId) {
          supabase.from('briefing_sessions').update({
            basal_coverage: data.basalCoverage,
            basal_fields_collected: data.basalFieldsCollected || [],
            current_section: data.currentSection || 'company',
          })
          .eq('id', activeSessionId)
          .then(({error}) => {
            if (error) console.error('Erro ao salvar basalCoverage:', error);
          });
        }
      }

      if (data.isFinished) {
        setIsFinished(true);
        if (isOnboarding) {
          // If onboarding, just finish right away and redirect to dashboard
          window.location.href = '/dashboard';
          return;
        } else {
          setIsUploadStep(true); // Triggers the upload static step UI
        }
        if (data.assets) setAssets(data.assets);

        // Atualiza a sessão no banco com os dados computados + quality metrics
        if (activeSessionId) {
          supabase.from('briefing_sessions').update({ 
            status: 'finished', 
            company_info: data.updates || briefingState,
            final_assets: data.assets,
            detected_signals: detectedSignals,
            // Quality metrics from AI finalization
            session_quality_score: data.session_quality_score || null,
            engagement_summary: data.engagement_summary || { overall: engagementLevel, by_area: {} },
            data_completeness: data.data_completeness || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeSessionId)
          .then(({error}) => {
             if (error) console.error("Erro ao fechar sessão no DB:", error);
          });
        }
      } else {
        // ================================================================
        // ACTIVE LISTENING — depth_question intercalates normal flow
        // If the AI detected something worth probing deeper, insert it 
        // BEFORE the next regular question.
        // ================================================================
        // Track engagement level from AI analysis
        if (data.engagement_level) {
          setEngagementLevel(data.engagement_level);
        }

        const questionsToAdd: Omit<Message, 'id'>[] = [];

        if (data.active_listening?.depth_question) {
          const dq = data.active_listening.depth_question;
          questionsToAdd.push({
            role: "assistant",
            content: dq.text,
            type: "question",
            questionType: dq.questionType || 'text',
            options: dq.options || [],
            allowMoreOptions: false,
            isDepthQuestion: true,
            depthSignalCategory: dq.signal_category || 'implicit_pain',
          });
          console.log(`[ActiveListening] Depth question intercalated: "${dq.text}"`);
        }

        if (data.nextQuestion) {
          questionsToAdd.push({
            role: "assistant",
            content: data.nextQuestion.text,
            type: "question",
            questionType: data.nextQuestion.questionType || 'text',
            options: data.nextQuestion.options,
            allowMoreOptions: data.nextQuestion.allowMoreOptions || false,
            minOption: data.nextQuestion.minOption,
            maxOption: data.nextQuestion.maxOption,
            microFeedback: data.micro_feedback || undefined,
          });
        }

        if (questionsToAdd.length > 0) {
          setMessages((prev) => {
            const trunc = prev.slice(0, currentStepIndex + 1);
            return [
              ...trunc,
              ...questionsToAdd.map(q => ({ ...q, id: crypto.randomUUID() }))
            ];
          });
          setCurrentStepIndex((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error(error);
      const currentQ = messages[currentStepIndex];
      const fallbackMessage = activeLanguage === 'en' 
        ? `Oops! We had an issue analyzing your answer. Could you try again?\n\n**Original question:** ${currentQ.content}`
        : activeLanguage === 'es'
          ? `¡Vaya! Tuvimos un problema al analizar tu respuesta. ¿Puedes intentarlo de nuevo?\n\n**Pregunta original:** ${currentQ.content}`
          : `Ops! Tivemos um problema para analisar sua resposta. Pode tentar novamente?\n\n**Pergunta original:** ${currentQ.content}`;

      addMessage({
        role: "assistant",
        content: fallbackMessage,
        type: "question",
        questionType: currentQ.questionType,
        options: currentQ.options,
        allowMoreOptions: currentQ.allowMoreOptions,
        minOption: currentQ.minOption,
        maxOption: currentQ.maxOption,
      });
      setCurrentStepIndex((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMoreOptions = async () => {
    // Acionado quando usuário clica em "Gerar mais opções" num step interativo
    setIsGeneratingMore(true);
    try {
      const historyPayload = messages.slice(0, currentStepIndex + 1).map(m => ({
        role: m.role,
        content: m.content + (m.userAnswer ? `\n\nRespondi: ${m.userAnswer}` : "")
      }));

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: "Gere mais opções diferentes das atuais para a última pergunta.",
          currentState: briefingState,
          history: historyPayload,
          generateMore: true,
          chosenLanguage,
          selectedPackages
        }),
      });

      if (!res.ok) throw new Error("Erro na API");
      const data = await res.json();

      if (data.nextQuestion && data.nextQuestion.options) {
        setMessages((prev) => {
          const newMessages = [...prev];
          // Substitui (ou adiciona) as opções da pergunta atual
          const existingOptions = newMessages[currentStepIndex].options || [];
          newMessages[currentStepIndex].options = [...existingOptions, ...data.nextQuestion.options];
          return newMessages;
        });
      }
    } catch (err) {
      console.error("Falha ao gerar mais opções", err);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const finishBriefing = () => {
    // Redireciona via JS para o Dashboard após upload ou cancelamento do upload
    window.location.href = '/dashboard';
  };

  // ================================================================
  // DOCUMENT GENERATION — Uses FULL conversation to create a deliverable
  // ================================================================
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [editToken, setEditToken] = useState<string | null>(null);
  const [editPassphrase, setEditPassphrase] = useState<string | null>(initialPassphrase || null);

  const generateDocument = async () => {
    setIsGeneratingDocument(true);
    try {
      // Build COMPLETE history transcript (all messages with answers)
      const fullHistory = messages.map(m => {
        const resp = Array.isArray(m.userAnswer) ? m.userAnswer.join(', ') : m.userAnswer;
        return {
          role: m.role,
          content: m.content + (resp ? `\n\nRespondi: ${resp}` : "")
        };
      });

      const res = await fetch("/api/briefing/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: fullHistory,
          briefingState,
          assets,
          activeTemplate,
          chosenLanguage,
          // Pass detected signals so the document includes them
          detectedSignals,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate document");
      
      const data = await res.json();
      setGeneratedDocument(data.document);

      // Gera os tokens para edição pública (usando Crypto API e Math.random para a senha amigável)
      const newToken = crypto.randomUUID();
      
      let currentPassphrase = editPassphrase;
      if (!currentPassphrase) {
        const words = ["azul", "sol", "luz", "mar", "rio", "som", "flor", "dia", "mel", "ceu", "lua", "cor", "fim", "paz", "voo", "voz", "ar", "bom", "cais", "eco"];
        currentPassphrase = Array.from({length: 4}, () => words[Math.floor(Math.random() * words.length)]).join("-");
        setEditPassphrase(currentPassphrase);
      }
      
      setEditToken(newToken);

      // Persist the document and link data to the session in DB
      const docSessionId = sessionId;
      if (docSessionId) {
        supabase.from('briefing_sessions').update({
          final_assets: { ...assets, document: data.document },
          document_content: data.document,
          edit_token: newToken,
          edit_passphrase: currentPassphrase,
          detected_signals: detectedSignals,
          updated_at: new Date().toISOString()
        })
        .eq('id', docSessionId)
        .then(({ error }) => {
          if (error) console.error("Erro ao salvar documento no DB:", error);
        });
      }
    } catch (error) {
      console.error("Document generation failed:", error);
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  return (
    <BriefingContext.Provider
      value={{
        briefingState,
        updateBriefingState,
        messages,
        currentStepIndex,
        goBack,
        goNext,
        addMessage,
        isLoading,
        setIsLoading,
        isGeneratingMore,
        isFinished,
        isUploadStep,
        setIsFinished,
        finishBriefing,
        assets,
        setAssets,
        submitAnswer,
        generateMoreOptions,
        basalInfo,
        chosenLanguage,
        generatedDocument,
        isGeneratingDocument,
        generateDocument,
        selectedPackages,
        selectedPackageDetails,
        branding,
        editToken,
        editPassphrase,
        isOnboarding,
        detectedSignals,
        engagementLevel,
      }}
    >
      {children}
    </BriefingContext.Provider>
  );
}

export function useBriefing() {
  const context = useContext(BriefingContext);
  if (!context) {
    throw new Error("useBriefing must be used within a BriefingProvider");
  }
  return context;
}

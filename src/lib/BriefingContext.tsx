"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
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
import {
  ensureSessionInDb,
  persistSnapshotInDb,
  logInteractionInDb,
  clearFutureInteractionsInDb,
  updateSessionStateInDb,
  updateInteractionSignalInDb,
  markSessionAsFinishedInDb,
  finalizeDocumentInDb
} from "@/lib/services/briefingTracker";

const BriefingContext = createContext<BriefingContextType | undefined>(undefined);

// ================================================================
// LOCAL STORAGE HELPERS — fallback when Supabase is unreachable
// ================================================================
const LS_PREFIX = 'brieffy_';

function lsSave(key: string, data: unknown) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(data)); } catch { /* quota or SSR */ }
}

function lsLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
}

function lsRemove(key: string) {
  try { localStorage.removeItem(LS_PREFIX + key); } catch { /* SSR */ }
}

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

// ================================================================
// TYPES
// ================================================================
interface SavedInteraction {
  id: string;
  step_order: number;
  question_text: string;
  question_type: string;
  options_offered: string[] | null;
  user_answer: string | string[] | number;
  is_depth_question: boolean;
  detected_signal?: string | null;
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
  isOnboarding,
  isOwner = false,
  savedInteractions,
  savedState,
  savedSignals,
  savedBasalCoverage,
  savedLanguage,
  savedMessagesSnapshot,
  savedStepIndex,
  initialTimeoutMs,
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
  isOwner?: boolean;
  /** Server-injected timeout setting (avoids client-side fetch) */
  initialTimeoutMs?: number;
  /** Pre-loaded interactions for session resume */
  savedInteractions?: SavedInteraction[];
  /** Pre-loaded company_info state for session resume */
  savedState?: Record<string, unknown>;
  /** Pre-loaded detected signals for session resume */
  savedSignals?: BriefingSignal[];
  /** Pre-loaded basal coverage for session resume */
  savedBasalCoverage?: number;
  /** Pre-loaded language for session resume */
  savedLanguage?: string;
  /** Full messages snapshot for seamless resume */
  savedMessagesSnapshot?: Partial<Message>[];
  /** Step index for exact resume position */
  savedStepIndex?: number;
  /** Pass finished session state */
  initialIsFinished?: boolean;
  /** Pass completed document */
  initialGeneratedDocument?: string | null;
}) {
  const endpoint = apiEndpoint || "/api/briefing";
  const branding = initialBranding || DEFAULT_BRANDING;
  const selectedPackages = initialSelectedPackages || [];
  const selectedPackageDetails = initialSelectedPackageDetails || [];

  // ================================================================
  // RESUME SUPPORT — reconstruct messages from saved interactions or snapshot
  // ================================================================
  const isResume = (savedMessagesSnapshot && savedMessagesSnapshot.length > 0) || (savedInteractions && savedInteractions.length > 0) || initialIsFinished;

  const buildRestoredMessages = (): Message[] => {
    if (!isResume) return [
      {
        id: "initial",
        role: "assistant",
        content: "Em qual idioma você prefere que eu conduza as perguntas? / Which language should I use?",
        type: "question",
        questionType: "single_choice",
        options: ["🇧🇷 Português", "🇺🇸 English", "🇪🇸 Español"],
        allowMoreOptions: false,
      },
    ];

    // Prefer the complete messages_snapshot if available (preserves all metadata)
    if (savedMessagesSnapshot && Array.isArray(savedMessagesSnapshot) && savedMessagesSnapshot.length > 0) {
      return savedMessagesSnapshot.map((m: Partial<Message>) => ({
        id: m.id || crypto.randomUUID(),
        role: (m.role || 'assistant') as Message['role'],
        content: m.content || '',
        type: (m.type || 'question') as Message['type'],
        questionType: (m.questionType as Message['questionType']) || 'text',
        options: m.options || [],
        allowMoreOptions: m.allowMoreOptions || false,
        userAnswer: m.userAnswer,
        isDepthQuestion: m.isDepthQuestion || false,
        microFeedback: m.microFeedback,
        minOption: m.minOption,
        maxOption: m.maxOption,
      }));
    }

    // Fallback: reconstruct from interactions (loses some metadata)
    const sorted = [...savedInteractions!].sort((a, b) => a.step_order - b.step_order);
    return sorted.map((interaction) => ({
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: interaction.question_text,
      type: "question" as const,
      questionType: (interaction.question_type as Message['questionType']) || 'text',
      options: interaction.options_offered || [],
      allowMoreOptions: false,
      userAnswer: interaction.user_answer,
      isDepthQuestion: interaction.is_depth_question || false,
    }));
  };

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

  // Merge saved state on top of initialBase for resume
  const mergedInitialState: BriefingState = savedState
    ? { ...initialBase, ...(savedState as BriefingState) }
    : initialBase;

  const [briefingState, setBriefingState] = useState<BriefingState>(mergedInitialState);
  const briefingStateRef = React.useRef<BriefingState>(mergedInitialState);

  // Use existing session ID from props (e.g., /b/{id} routes)
  // For new sessions (home page), we lazily create on first submitAnswer
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null);
  const sessionCreatedRef = React.useRef(false);

  // Active Listening — accumulated signals across the session
  const detectedSignalsRef = React.useRef<BriefingSignal[]>(savedSignals || []);
  const [detectedSignals, setDetectedSignals] = useState<BriefingSignal[]>(savedSignals || []);
  const [engagementLevel, setEngagementLevel] = useState<'high' | 'medium' | 'low'>('high');

  const [isLoading, setIsLoading] = useState(false);
  const [chosenLanguage, setChosenLanguage] = useState(savedLanguage || "pt"); // Default: Portuguese
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  
  // Controle de estágios do final
  const [isFinished, setIsFinished] = useState(initialIsFinished || false); // true quando a IA deu o verdict final
  const [isUploadStep, setIsUploadStep] = useState(initialIsFinished || false); // Tela estática de upload
  
  const [assets, setAssets] = useState<FinalAssets | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [basalInfo, setBasalInfo] = useState<BasalCoverageInfo>({
    basalCoverage: savedBasalCoverage || 0,
    currentSection: 'company',
    basalFieldsCollected: [],
    basalFieldsMissing: [],
  });

  const sessionPromiseRef = React.useRef<Promise<string | null> | null>(null);

  // Lazy session creation — only creates when user actually starts interacting
  const ensureSession = async (): Promise<string | null> => {
    if (sessionId) return sessionId;
    if (sessionPromiseRef.current) return sessionPromiseRef.current;
    
    sessionPromiseRef.current = ensureSessionInDb(activeTemplate?.id || null).then(newId => {
      if (newId) setSessionId(newId);
      return newId;
    });
    
    return sessionPromiseRef.current;
  };

  const [messages, setMessages] = useState<Message[]>(() => buildRestoredMessages());

  // On resume: start from the LAST answered step + 1 so user sees a "Continue" prompt
  // On new session: start at step 0 (language selection)
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    if (!isResume) return 0;
    if (typeof savedStepIndex === 'number') return savedStepIndex;
    return buildRestoredMessages().length - 1;
  });

  const perfSettings = useMemo(() => ({ timeoutMs: initialTimeoutMs || 30000 }), [initialTimeoutMs]);

  // ================================================================
  // RESUME — After restoring, immediately ask the AI for the next question
  // ================================================================
  const [hasRequestedResumeContinuation, setHasRequestedResumeContinuation] = useState(false);

  useEffect(() => {
    if (!isResume || hasRequestedResumeContinuation || isFinished) return;
    if (messages.length === 0) return;

    // Se a última mensagem do histórico ainda não foi respondida pelo usuário,
    // significa que estamos aguardando a interação dele (ex: tela de linguagem inicial
    // para um link novo). Não devemos forçar continuação.
    if (!messages[messages.length - 1].userAnswer) {
      return;
    }

    // Trigger continuation automatically
    const triggerResumeContinuation = async () => {
      setHasRequestedResumeContinuation(true);
      setIsLoading(true);

      const historyPayload = messages.map(m => {
        const resp = Array.isArray(m.userAnswer) ? m.userAnswer.join(', ') : m.userAnswer;
        return {
          role: m.role,
          content: m.content + (resp ? `\n\nRespondi: ${resp}` : "")
        };
      });

      const activeSessionId = existingSessionId || null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), perfSettings.timeoutMs);

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            answer: "__RESUME__", // special signal to the API
            currentState: briefingState,
            history: historyPayload,
            generateMore: false,
            activeTemplate,
            initialContext,
            chosenLanguage,
            selectedPackages,
            detectedSignals: detectedSignals.map(s => s.summary),
            isResume: true,
            sessionId: activeSessionId,
          }),
        });

        clearTimeout(timeoutId);
        if (!res.ok) throw new Error("Erro na API de retomada");

        const data = await res.json();

        if (data.updates) {
          setBriefingState(prev => ({ ...prev, ...data.updates }));
        }

        if (data.isFinished) {
          setIsFinished(true);
          if (data.assets) setAssets(data.assets);
          setIsUploadStep(true);
        } else {
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
            setMessages(prev => [
              ...prev,
              ...questionsToAdd.map(q => ({ ...q, id: crypto.randomUUID() }))
            ]);
            setCurrentStepIndex(prev => prev + 1);
          }
        }
      } catch (err) {
        console.error("[Resume] Failed to fetch next question:", err);
      } finally {
        setIsLoading(false);
      }
    };

    triggerResumeContinuation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResume, hasRequestedResumeContinuation]);

  const updateBriefingState = useCallback((updates: Partial<BriefingState>) => {
    setBriefingState((prev) => {
      const next = { ...prev, ...updates };
      briefingStateRef.current = next;
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goNext = useCallback(() => {
    setCurrentStepIndex((prev) => prev + 1);
  }, []);

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { ...msg, id }]);
  }, []);

  // ================================================================
  // SNAPSHOT PERSISTENCE — Save full messages + step index to DB
  // Enables seamless resume with all metadata (questionType, options, microFeedback, etc.)
  // ================================================================
  const persistSnapshot = useCallback((updatedMessages: Message[], newStepIndex: number, currentSid?: string | null) => {
    const sid = currentSid || existingSessionId || sessionId;
    if (!sid) return;
    
    const snapshot = updatedMessages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      type: m.type,
      questionType: m.questionType,
      options: m.options,
      allowMoreOptions: m.allowMoreOptions,
      userAnswer: m.userAnswer,
      isDepthQuestion: m.isDepthQuestion,
      microFeedback: m.microFeedback,
      minOption: m.minOption,
      maxOption: m.maxOption,
    }));

    // localStorage backup — immediate, survives network failures
    lsSave(`session_${sid}`, {
      snapshot,
      stepIndex: newStepIndex,
      state: briefingStateRef.current,
      signals: detectedSignalsRef.current,
      language: chosenLanguage,
      ts: Date.now(),
    });

    persistSnapshotInDb(sid, snapshot, newStepIndex);
  }, [existingSessionId, sessionId, chosenLanguage]);

  const submitAnswer = async (answer: string | string[] | number) => {
    if (typeof answer === 'string' && !answer.trim()) return;
    if (Array.isArray(answer) && answer.length === 0) return;

    // Clear any draft saved in localStorage for this step
    const sid = existingSessionId || sessionId;
    if (sid) lsRemove(`draft_${sid}_${currentStepIndex}`);

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
    
    // Log Interaction to Database — UPSERT with retry for network resilience
    let interactionId: string | null = null;
    if (activeSessionId) {
      interactionId = await logInteractionInDb(
        activeSessionId,
        currentStepIndex,
        currentMsgToLog.questionType || 'text',
        currentMsgToLog.content,
        currentMsgToLog.options ? currentMsgToLog.options : null,
        answer,
        currentMsgToLog.isDepthQuestion || false
      );

      // When re-answering a past step (went back), remove stale future interactions
      // because the AI will generate new questions from this point forward
      if (currentStepIndex < messages.length - 1) {
        clearFutureInteractionsInDb(activeSessionId, currentStepIndex);
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
      let newSignals: BriefingSignal[] = [];
      if (data.active_listening?.signals?.length) {
        newSignals = data.active_listening.signals.map((s: {
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

        setDetectedSignals(prev => {
          const merged = [...prev, ...newSignals];
          detectedSignalsRef.current = merged;
          return merged;
        });

        console.log(`[ActiveListening] ${newSignals.length} new signal(s) detected:`, 
          newSignals.map(s => `[${s.category}] ${s.summary} (${Math.round(s.relevance_score * 100)}%)`).join(', ')
        );
      }

      // Update basal coverage tracking from AI response
      if (data.basalCoverage !== undefined) {
        setBasalInfo({
          basalCoverage: data.basalCoverage,
          currentSection: data.currentSection || 'company',
          basalFieldsCollected: data.basalFieldsCollected || [],
          basalFieldsMissing: data.basalFieldsMissing || [],
        });
      } else if (isOnboarding) {
        // Progress bar fallback for onboarding: /api/onboarding never returns basalCoverage
        // Synthesize based on how many steps the user has completed (max 8 steps)
        const onboardingSteps = 8;
        const syntheticCoverage = Math.min((currentStepIndex + 1) / onboardingSteps, 1);
        setBasalInfo(prev => ({
          ...prev,
          basalCoverage: syntheticCoverage,
        }));
      }

      // ================================================================
      // CONSOLIDATED DB WRITE — Single update per step (was 3-4 separate writes)
      // ================================================================
      if (activeSessionId && !data.isFinished) {
        const mergedState = data.updates
          ? { ...briefingStateRef.current, ...data.updates }
          : briefingStateRef.current;

        const sessionUpdate: Record<string, unknown> = {
          status: 'in_progress',
          company_info: mergedState,
          chosen_language: activeLanguage,
          updated_at: new Date().toISOString(),
        };

        if (data.basalCoverage !== undefined) {
          sessionUpdate.basal_coverage = data.basalCoverage;
          sessionUpdate.basal_fields_collected = data.basalFieldsCollected || [];
          sessionUpdate.current_section = data.currentSection || 'company';
        }

        if (newSignals.length > 0) {
          sessionUpdate.detected_signals = detectedSignalsRef.current;
        }

        // Auto session_name from company_name — only on first extraction
        const companyName = mergedState.company_name;
        if (companyName && typeof companyName === 'string' && companyName.trim()) {
          sessionUpdate.session_name = companyName.trim();
        }

        updateSessionStateInDb(activeSessionId, sessionUpdate);

        if (interactionId) {
          const interactionUpdate: Record<string, unknown> = {};
          if (data.inferences) interactionUpdate.inferences = data.inferences;
          if (newSignals.length > 0) interactionUpdate.detected_signal = newSignals[0].summary;
          if (Object.keys(interactionUpdate).length > 0) {
            updateInteractionSignalInDb(interactionId, interactionUpdate);
          }
        }
      }

      if (data.isFinished) {
        setIsFinished(true);
        if (data.assets) setAssets(data.assets);
        if (activeSessionId) lsRemove(`session_${activeSessionId}`);

        // BUG-06 FIX: Always persist metrics BEFORE redirecting (even for onboarding)
        const persistPromise = activeSessionId
          ? markSessionAsFinishedInDb(activeSessionId, { 
              status: 'finished', 
              company_info: (data.updates && Object.keys(data.updates).length > 0)
                ? { ...briefingStateRef.current, ...data.updates }
                : briefingStateRef.current,
              final_assets: data.assets,
              // BUG-01 FIX: Use ref to get the latest accumulated signals
              detected_signals: detectedSignalsRef.current,
              // Quality metrics from AI finalization
              session_quality_score: data.session_quality_score || null,
              engagement_summary: data.engagement_summary || { overall: engagementLevel, by_area: {} },
              data_completeness: data.data_completeness || null,
              updated_at: new Date().toISOString()
            })
          : Promise.resolve();

        if (isOnboarding) {
          // BUG-13 FIX: Set a flag so the dashboard layout knows onboarding just completed
          // and won't redirect back due to DB propagation latency
          try { localStorage.setItem('brieffy_just_onboarded', Date.now().toString()); } catch {}
          // BUG-06 FIX: Wait for metrics to be saved before redirecting
          persistPromise.then(() => {
            window.location.href = '/dashboard';
          });
          return;
        } else {
          setIsUploadStep(true); // Triggers the upload static step UI
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
          let dq = data.active_listening.depth_question;
          if (typeof dq === 'string') {
            dq = { text: dq, questionType: 'text', options: [] };
          }
          if (dq.text && dq.text.trim() !== '') {
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
        }

        if (data.nextQuestion && data.nextQuestion.text && data.nextQuestion.text.trim() !== '') {
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
            const updated = [
              ...trunc,
              ...questionsToAdd.map(q => ({ ...q, id: crypto.randomUUID() }))
            ];
            // Persist snapshot with the new messages array and explicitly passed activeSessionId
            persistSnapshot(updated, currentStepIndex + 1, activeSessionId);
            return updated;
          });
          setCurrentStepIndex((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error(error);
      // ================================================================
      // ERROR UX — Show a polished toast and let user retry on the SAME step.
      // NEVER expose internal data, question text, or stack traces.
      // ================================================================
      const errorLang: Record<string, string> = {
        pt: 'Estamos processando, tente enviar novamente.',
        en: 'Still processing — please try sending again.',
        es: 'Estamos procesando, intente enviar nuevamente.',
      };
      
      // Dynamic import to avoid bundle bloat on success path
      import('sonner').then(({ toast }) => {
        toast.error(errorLang[chosenLanguage] || errorLang.pt, {
          duration: 4000,
          style: {
            background: '#1c1c1c',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e5e5e5',
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
          },
        });
      });

      // Clear the answer so user can re-submit, but DON'T change the step
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[currentStepIndex] = { ...newMessages[currentStepIndex], userAnswer: undefined };
        return newMessages;
      });
      // No setCurrentStepIndex increment — user stays on the same step
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), perfSettings.timeoutMs);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          answer: "Gere mais opções diferentes das atuais para a última pergunta.",
          currentState: briefingState,
          history: historyPayload,
          generateMore: true,
          chosenLanguage,
          selectedPackages,
          activeTemplate,
          sessionId,
          detectedSignals: detectedSignalsRef.current.map(s => s.summary),
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Erro na API");
      const data = await res.json();

      if (data.nextQuestion && data.nextQuestion.options) {
        setMessages((prev) => {
          const newMessages = [...prev];
          const existingOptions = newMessages[currentStepIndex].options || [];
          newMessages[currentStepIndex] = {
            ...newMessages[currentStepIndex],
            options: [...existingOptions, ...data.nextQuestion.options],
          };
          persistSnapshot(newMessages, currentStepIndex, activeSessionId);
          return newMessages;
        });
      }
    } catch (err) {
      console.error("Falha ao gerar mais opções", err);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const finishBriefing = useCallback(() => {
    window.location.href = '/dashboard';
  }, []);

  // ================================================================
  // DOCUMENT GENERATION — Uses FULL conversation to create a deliverable
  // ================================================================
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(initialGeneratedDocument || null);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [editToken, setEditToken] = useState<string | null>(null);

  // BUG-07 is exposed via documentError state (declared above alongside assets)
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);

      const res = await fetch("/api/briefing/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          history: fullHistory,
          briefingState,
          assets,
          activeTemplate,
          chosenLanguage,
          detectedSignals,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed to generate document");
      
      const data = await res.json();
      setGeneratedDocument(data.document);

      // Gera os tokens para edição pública (usando Crypto API e Math.random para a senha amigável)
      const newToken = crypto.randomUUID();
      
      let currentPassphrase = editPassphrase;
      if (!currentPassphrase) {
        const words = ["aurora","cristal","nebula","prisma","zenith","cosmos","atlas","vortex","pulsar","fenix","orion","tesla","helix","quasar","nexus","titan","omega","zephyr","cobalt","onyx","velvet","ember","storm","spark","bloom","forge","haven","crest","summit","jade"];
        currentPassphrase = words[Math.floor(Math.random() * words.length)];
        setEditPassphrase(currentPassphrase);
      }
      
      setEditToken(newToken);

      // Persist the document and link data to the session in DB
      const docSessionId = sessionId;
      if (docSessionId) {
        finalizeDocumentInDb(docSessionId, {
          final_assets: { ...assets, document: data.document },
          document_content: data.document,
          edit_token: newToken,
          edit_passphrase: currentPassphrase,
          detected_signals: detectedSignalsRef.current,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Document generation failed:", error);
      // BUG-07 FIX: Surface the error to the user via state
      setDocumentError(error instanceof Error ? error.message : "Falha ao gerar o documento. Tente novamente.");
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  const contextValue = useMemo(() => ({
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
    documentError,
    generateDocument,
    selectedPackages,
    selectedPackageDetails,
    branding,
    editToken,
    editPassphrase,
    isOnboarding,
    isOwner,
    detectedSignals,
    engagementLevel,
  }), [
    briefingState, messages, currentStepIndex, isLoading, isGeneratingMore,
    isFinished, isUploadStep, assets, basalInfo, chosenLanguage,
    generatedDocument, isGeneratingDocument, documentError, editToken,
    editPassphrase, detectedSignals, engagementLevel,
    updateBriefingState, goBack, goNext, addMessage, finishBriefing,
    submitAnswer, generateMoreOptions, generateDocument,
    selectedPackages, selectedPackageDetails, branding, isOnboarding, isOwner,
  ]);

  return (
    <BriefingContext.Provider value={contextValue}>
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

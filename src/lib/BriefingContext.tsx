"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { BriefingState, Message, FinalAssets, BriefingContextType, BasalCoverageInfo, BrandingInfo, PackageDetail } from "./types";

const DEFAULT_BRANDING: BrandingInfo = {
  display_name: 'Brieffy',
  company_name: 'Brieffy',
  logo_url: '',
  brand_color: '#FF6029',
  brand_accent: '#171717',
  tagline: 'Briefing Inteligente com IA',
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
} from "@/lib/services/briefingTracker";

const BriefingContext = createContext<BriefingContextType | undefined>(undefined);

// ================================================================
// SESSION STORAGE HELPERS — fallback when Supabase is unreachable.
// Switched from localStorage to sessionStorage so client briefing answers
// (which can include sensitive business info) are NOT persisted across
// browser sessions / shared devices, and clear themselves on tab close.
// ================================================================
const LS_PREFIX = 'brieffy_';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.sessionStorage; } catch { return null; }
}

function lsSave(key: string, data: unknown) {
  const store = getStorage();
  if (!store) return;
  try { store.setItem(LS_PREFIX + key, JSON.stringify(data)); } catch { /* quota */ }
}


function lsRemove(key: string) {
  const store = getStorage();
  if (!store) return;
  try { store.removeItem(LS_PREFIX + key); } catch { /* SSR / locked */ }
  // Best-effort: also wipe any legacy localStorage copy from older versions
  try { window.localStorage?.removeItem(LS_PREFIX + key); } catch { /* ignore */ }
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

  savedBasalCoverage,
  savedLanguage,
  savedMessagesSnapshot,
  savedStepIndex,
  initialTimeoutMs,
  initialIsFinished,

  initialPurpose,
  initialDepthSignals,
  initialMaxQuestions,
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
  initialTimeoutMs?: number;
  savedInteractions?: SavedInteraction[];
  savedState?: Record<string, unknown>;

  savedBasalCoverage?: number;
  savedLanguage?: string;
  savedMessagesSnapshot?: Partial<Message>[];
  savedStepIndex?: number;
  initialIsFinished?: boolean;

  initialPurpose?: string;
  initialDepthSignals?: string[];
  initialMaxQuestions?: number;
}) {
  const endpoint = useMemo(() => apiEndpoint || "/api/briefing", [apiEndpoint]);
  const branding = useMemo(() => initialBranding || DEFAULT_BRANDING, [initialBranding]);
  const selectedPackages = useMemo(() => initialSelectedPackages || [], [initialSelectedPackages]);
  const selectedPackageDetails = useMemo(() => initialSelectedPackageDetails || [], [initialSelectedPackageDetails]);

  const isResume = (savedMessagesSnapshot && savedMessagesSnapshot.length > 0) || (savedInteractions && savedInteractions.length > 0) || initialIsFinished;

  const buildRestoredMessages = useCallback((): Message[] => {
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

    if (savedMessagesSnapshot && Array.isArray(savedMessagesSnapshot) && savedMessagesSnapshot.length > 0) {
      const validSnapshot = savedMessagesSnapshot.filter((m: Partial<Message>) => m.content && m.content.trim() !== '');
      
      if (validSnapshot.length > 0) {
        return validSnapshot.map((m: Partial<Message>) => ({
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
    }

    const sorted = [...(savedInteractions || [])].sort((a, b) => a.step_order - b.step_order);
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
  }, [isResume, savedMessagesSnapshot, savedInteractions]);

  const initialBase: Record<string, unknown> = useMemo(() => {
    const base: Record<string, unknown> = {};
    if (activeTemplate && activeTemplate.core_fields) {
      activeTemplate.core_fields.forEach(f => {
        base[f.trim()] = "";
      });
    } else {
      base.empresa = "";
      base.descricao = "";
      base.publico = "";
    }
    return base;
  }, [activeTemplate]);

  const mergedInitialState: BriefingState = useMemo(() => savedState
    ? { ...initialBase, ...(savedState as BriefingState) }
    : (initialBase as BriefingState), [savedState, initialBase]);

  const [briefingState, setBriefingState] = useState<BriefingState>(mergedInitialState);
  const briefingStateRef = React.useRef<BriefingState>(mergedInitialState);

  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null);

  const [engagementLevel, setEngagementLevel] = useState<'high' | 'medium' | 'low'>('high');

  const [isLoading, setIsLoading] = useState(false);
  const [chosenLanguage, setChosenLanguage] = useState(savedLanguage || "pt");
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isFinished, setIsFinished] = useState(initialIsFinished || false);
  const [isFinalTextStep, setIsFinalTextStep] = useState(initialIsFinished || false);
  const [isUploadStep, setIsUploadStep] = useState(initialIsFinished || false);
  
  const [assets, setAssets] = useState<FinalAssets | null>(null);

  const [pendingCheckpoint, setPendingCheckpoint] = useState<{ block: number } | null>(null);
  const [basalInfo, setBasalInfo] = useState<BasalCoverageInfo>({
    basalCoverage: savedBasalCoverage || 0,
    currentSection: 'company',
    basalFieldsCollected: [],
    basalFieldsMissing: [],
  });

  const sessionPromiseRef = React.useRef<Promise<string | null> | null>(null);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionId) return sessionId;
    if (sessionPromiseRef.current) return sessionPromiseRef.current;
    
    sessionPromiseRef.current = ensureSessionInDb(activeTemplate?.id || null).then(newId => {
      if (newId) setSessionId(newId);
      return newId;
    });
    
    return sessionPromiseRef.current;
  }, [sessionId, activeTemplate?.id]);

  const [messages, setMessages] = useState<Message[]>(() => buildRestoredMessages());
  const messagesRef = React.useRef<Message[]>([]);
  
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    if (!isResume) return 0;
    const restored = buildRestoredMessages();
    if (typeof savedStepIndex === 'number' && savedStepIndex < restored.length) {
      return Math.max(0, savedStepIndex);
    }
    return restored.length > 0 ? restored.length - 1 : 0;
  });

  const perfSettings = useMemo(() => ({ timeoutMs: initialTimeoutMs || 30000 }), [initialTimeoutMs]);

  const [hasRequestedResumeContinuation, setHasRequestedResumeContinuation] = useState(false);

  // SNAPSHOT PERSISTENCE
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

    lsSave(`session_${sid}`, {
      snapshot,
      stepIndex: newStepIndex,
      state: briefingStateRef.current,
      language: chosenLanguage,
      ts: Date.now(),
    });

    persistSnapshotInDb(sid, snapshot, newStepIndex);
  }, [existingSessionId, sessionId, chosenLanguage]);

  const triggerResumeContinuation = useCallback(async () => {
    const currentMessages = messagesRef.current;
    if (!isResume || hasRequestedResumeContinuation || isFinished) return;
    if (currentMessages.length === 0) return;

    if (!currentMessages[currentMessages.length - 1].userAnswer) {
      return;
    }

    setHasRequestedResumeContinuation(true);
    setIsLoading(true);

    const historyPayload = currentMessages.map(m => {
      const resp = Array.isArray(m.userAnswer) ? m.userAnswer.join(', ') : m.userAnswer;
      return {
        role: m.role,
        content: m.content + (resp ? `\n\nRespondi: ${resp}` : "")
      };
    });

    const activeSessionId = existingSessionId || null;

    try {
      const controller = new AbortController();
      // Wait long enough for server-side retries + dossier. See submitAnswer for rationale.
      const timeoutId = setTimeout(() => controller.abort(), perfSettings.timeoutMs * 3);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          answer: "__RESUME__",
          currentState: briefingState,
          history: historyPayload,
          generateMore: false,
          activeTemplate,
          initialContext,
          chosenLanguage,
          selectedPackages,

          briefingPurpose: initialPurpose,
          depthSignals: initialDepthSignals,
          isResume: true,
          sessionId: activeSessionId,
        }),
      });

      clearTimeout(timeoutId);
      if (!res.ok) {
        let serverDetail: { detail?: string; errorName?: string; requestId?: string } = {};
        try { serverDetail = await res.json(); } catch { /* not JSON */ }
        const msg = serverDetail.detail ? `${serverDetail.errorName || 'Error'}: ${serverDetail.detail}${serverDetail.requestId ? ` [req ${serverDetail.requestId}]` : ''}` : `API ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();

      if (data.updates) {
        setBriefingState(prev => {
          const next = { ...prev, ...data.updates };
          briefingStateRef.current = next;
          return next;
        });
      }

      if (data.isFinished) {
        if (!isFinalTextStep) {
          setIsFinalTextStep(true);
          const textMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Algo mais a acrescentar antes de finalizar?",
            type: "question",
            questionType: "text",
            allowMoreOptions: false,
          };
          setMessages(prev => {
            const updated = [...prev, textMsg];
            if (activeSessionId) persistSnapshot(updated, currentStepIndex + 1, activeSessionId);
            return updated;
          });
          setCurrentStepIndex(prev => prev + 1);
          setIsLoading(false);
          return;
        }

        if (!isUploadStep) {
          setIsUploadStep(true);
          const uploadMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Deseja enviar algum anexo, imagem ou referência?",
            type: "question",
            questionType: "file_upload",
            allowMoreOptions: false,
          };
          setMessages(prev => {
            const updated = [...prev, uploadMsg];
            if (activeSessionId) persistSnapshot(updated, currentStepIndex + 1, activeSessionId);
            return updated;
          });
          setCurrentStepIndex(prev => prev + 1);
          setIsLoading(false);
          return;
        }

        setIsFinished(true);
        if (data.assets) setAssets(data.assets);
      } else {
        const questionsToAdd: Omit<Message, 'id'>[] = [];

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
          setMessages(prev => {
            const updated = [
              ...prev,
              ...questionsToAdd.map(q => ({ ...q, id: crypto.randomUUID() }))
            ];
            persistSnapshot(updated, prev.length + questionsToAdd.length - 1, activeSessionId);
            return updated;
          });
          setCurrentStepIndex(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error("[Resume] Failed to fetch next question:", err);
      const errMsg = (err as Error)?.message || '';
      const fallback = chosenLanguage === 'pt'
        ? 'Não foi possível continuar de onde você parou. Tente recarregar.'
        : 'Could not resume where you left off. Try reloading.';
      toast.error(
        errMsg && !errMsg.startsWith('API ')
          ? `${fallback} (${errMsg})`
          : fallback
      );
    } finally {
      setIsLoading(false);
    }
  }, [isResume, hasRequestedResumeContinuation, isFinished, existingSessionId, perfSettings.timeoutMs, endpoint, briefingState, activeTemplate, initialContext, chosenLanguage, selectedPackages, persistSnapshot, currentStepIndex, initialDepthSignals, initialPurpose, isUploadStep, isFinalTextStep]);

  useEffect(() => {
    triggerResumeContinuation();
  }, [triggerResumeContinuation]);

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

  const submitAnswer = useCallback(async (answer: string | string[] | number) => {
    if (typeof answer === 'string' && !answer.trim()) return;
    if (Array.isArray(answer) && answer.length === 0) return;

    const currentMsg = messages[currentStepIndex];
    if (currentMsg && currentMsg.userAnswer !== undefined) {
      const isSameAnswer = Array.isArray(answer) && Array.isArray(currentMsg.userAnswer)
        ? JSON.stringify(answer) === JSON.stringify(currentMsg.userAnswer)
        : answer === currentMsg.userAnswer;

      if (isSameAnswer) {
        if (currentStepIndex < messages.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
          return;
        } else if (isFinished) {
          if (!isFinalTextStep) {
            setIsFinalTextStep(true);
          } else {
            setIsUploadStep(true);
          }
          return;
        }
      }
    }

    const sid = existingSessionId || sessionId;
    if (sid) lsRemove(`draft_${sid}_${currentStepIndex}`);

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

    let snapshotMessages: Message[] = [];
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[currentStepIndex] = { ...newMessages[currentStepIndex], userAnswer: answer };
      snapshotMessages = newMessages;
      return newMessages;
    });

    setIsLoading(true);

    const activeSessionPromise = ensureSession();
    
    // Persist immediately so user doesn't lose answer if they refresh
    activeSessionPromise.then(activeSessionId => {
      if (activeSessionId) {
        persistSnapshot(snapshotMessages, currentStepIndex, activeSessionId);
      }
    }).catch((err) => {
      console.warn('[Briefing] ensureSession failed during snapshot persist:', err);
    });

    // Use the FRESH snapshot captured inside setMessages, not the stale `messages`
    // closure (which still reflects the pre-update state). This was logging
    // wrong question/answer pairs to the tracker.
    const currentMsgToLog = snapshotMessages[currentStepIndex] ?? messages[currentStepIndex];
    const interactionPromise = activeSessionPromise.then(activeSessionId => {
      if (activeSessionId) {
        if (currentStepIndex < snapshotMessages.length - 1) {
          clearFutureInteractionsInDb(activeSessionId, currentStepIndex).catch((err) => {
            console.warn('[Briefing] clearFutureInteractionsInDb failed:', err);
          });
        }
        return logInteractionInDb(
          activeSessionId,
          currentStepIndex,
          currentMsgToLog.questionType || 'text',
          currentMsgToLog.content,
          currentMsgToLog.options || null,
          answer,
          currentMsgToLog.isDepthQuestion || false
        ).catch(() => null);
      }
      return null;
    });

    const historyPayload = snapshotMessages.slice(0, currentStepIndex + 1).map(m => {
      const resp = Array.isArray(m.userAnswer) ? m.userAnswer.join(', ') : m.userAnswer;
      return {
        role: m.role,
        content: m.content + (resp ? `\n\nRespondi: ${resp}` : "")
      };
    });

    try {
      const controller = new AbortController();
      // The server can retry the LLM up to 3 times (perfSettings.timeoutMs per attempt)
      // and then run the dossier generator (~45s). Waiting 3× the budget keeps the
      // browser from aborting before the slowest finalization path can finish.
      const timeoutId = setTimeout(() => controller.abort(), perfSettings.timeoutMs * 3);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          answer,
          currentState: briefingState,
          history: historyPayload, 
          activeTemplate,
          initialContext,
          chosenLanguage: activeLanguage,
          selectedPackages,

          briefingPurpose: initialPurpose,
          depthSignals: initialDepthSignals,
          maxQuestions: initialMaxQuestions,
        }),
      });

      clearTimeout(timeoutId);
      if (!res.ok) {
        // Pull the server-provided detail so the catch handler can show it
        // in the toast instead of the generic "Erro na API".
        let serverDetail: { detail?: string; errorName?: string; requestId?: string } = {};
        try { serverDetail = await res.json(); } catch { /* not JSON */ }
        const msg = serverDetail.detail ? `${serverDetail.errorName || 'Error'}: ${serverDetail.detail}${serverDetail.requestId ? ` [req ${serverDetail.requestId}]` : ''}` : `API ${res.status}`;
        throw new Error(msg);
      }
      const data = await res.json();
      
      if (data.updates) updateBriefingState(data.updates);



      if (data.basalCoverage !== undefined) {
        setBasalInfo({
          basalCoverage: data.basalCoverage,
          currentSection: data.currentSection || 'company',
          basalFieldsCollected: data.basalFieldsCollected || [],
          basalFieldsMissing: data.basalFieldsMissing || [],
        });
      }

      const activeSessionId = await activeSessionPromise;
      const interactionId = await interactionPromise;

      if (activeSessionId && !data.isFinished) {
        const mergedState = { ...briefingStateRef.current, ...(data.updates || {}) };
        updateSessionStateInDb(activeSessionId, {
          status: 'in_progress',
          company_info: mergedState,
          chosen_language: activeLanguage,
          basal_coverage: data.basalCoverage,
          session_name: mergedState.company_name || undefined
        }).catch((err) => {
          console.warn('[Briefing] updateSessionStateInDb failed:', err);
        });

        if (interactionId && data.inferences) {
          updateInteractionSignalInDb(interactionId, {
            inferences: data.inferences,
          }).catch((err) => {
            console.warn('[Briefing] updateInteractionSignalInDb failed:', err);
          });
        }
      }

      if (data.isFinished) {
        if (!isFinalTextStep) {
          setIsFinalTextStep(true);
          const textMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Algo mais a acrescentar antes de finalizar?",
            type: "question",
            questionType: "text",
            allowMoreOptions: false,
          };
          setMessages(prev => {
            const updated = [...prev, textMsg];
            if (activeSessionId) persistSnapshot(updated, currentStepIndex + 1, activeSessionId);
            return updated;
          });
          setCurrentStepIndex(prev => prev + 1);
          return;
        }

        if (!isUploadStep) {
          setIsUploadStep(true);
          const uploadMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant", // Using Assistant so it matches Typeform logic
            content: "Deseja enviar algum anexo, imagem ou referência?",
            type: "question",
            questionType: "file_upload",
            allowMoreOptions: false,
          };
          setMessages(prev => {
            const updated = [...prev, uploadMsg];
            if (activeSessionId) persistSnapshot(updated, currentStepIndex + 1, activeSessionId);
            return updated;
          });
          setCurrentStepIndex(prev => prev + 1);
          return;
        }

        // Third time it comes here, we are truly finished
        setIsFinished(true);
        if (data.assets) setAssets(data.assets);
        if (activeSessionId) {
          lsRemove(`session_${activeSessionId}`);
          // AWAIT the finalize so we know the DB row was actually flipped to
          // 'finished'. Without this, a transient failure silently leaves the
          // session as 'in_progress' while the UI claims success — which is
          // exactly the "finalizou mas não finaliza" bug we hit in prod.
          const finalizeResult = await markSessionAsFinishedInDb(activeSessionId, {
            status: 'finished',
            company_info: briefingStateRef.current,
            final_assets: data.assets,
            session_quality_score: data.session_quality_score,
            engagement_summary: data.engagement_summary || { overall: engagementLevel, by_area: {} },
          });
          if (!finalizeResult.ok) {
            toast.error("Tivemos um problema ao fechar o briefing. Sua resposta foi salva, mas confira no dashboard se a sessão aparece como finalizada.");
          }
        }

        if (isOnboarding) {
          try { localStorage.setItem('brieffy_just_onboarded', Date.now().toString()); } catch {}
          window.location.href = '/dashboard';
        }
      } else {
        if (data.engagement_level) setEngagementLevel(data.engagement_level);

        // Checkpoint detection — show milestone screen while AI re-evaluates
        if (data.checkpoint?.reached) {
          setPendingCheckpoint({ block: data.checkpoint.block });
        }

        const questionsToAdd: Omit<Message, 'id'>[] = [];

        if (data.nextQuestion && data.nextQuestion.text && data.nextQuestion.text.trim() !== '') {
          questionsToAdd.push({
            role: "assistant",
            content: data.nextQuestion.text,
            type: "question",
            questionType: data.nextQuestion.questionType || 'text',
            options: data.nextQuestion.options,
            allowMoreOptions: data.nextQuestion.allowMoreOptions || false,
            microFeedback: data.micro_feedback,
          });
        }

        if (questionsToAdd.length > 0) {
          setMessages((prev) => {
            const updated = [...prev.slice(0, currentStepIndex + 1), ...questionsToAdd.map(q => ({ ...q, id: crypto.randomUUID() }))];
            persistSnapshot(updated, currentStepIndex + 1, activeSessionId);
            return updated;
          });
          setCurrentStepIndex(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error(error);
      const errMsg = (error as Error)?.message || '';
      import('sonner').then(({ toast }) => {
        // Show the server-provided detail (errorName + requestId) when available
        // so we can diagnose a 500 without forcing the user to open DevTools.
        toast.error(
          errMsg && !errMsg.startsWith('API ')
            ? `Falha no briefing — ${errMsg}`
            : "Ocorreu um erro. Tente enviar novamente."
        );
      });
      setMessages((prev) => {
        const next = [...prev];
        next[currentStepIndex] = { ...next[currentStepIndex], userAnswer: undefined };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [existingSessionId, sessionId, currentStepIndex, chosenLanguage, messages, briefingState, activeTemplate, initialContext, selectedPackages, engagementLevel, perfSettings.timeoutMs, endpoint, isOnboarding, updateBriefingState, persistSnapshot, ensureSession, initialDepthSignals, initialPurpose, isFinished, isUploadStep, isFinalTextStep]);

  const generateMoreOptions = useCallback(async () => {
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
          answer: "Gere mais opções",
          currentState: briefingState,
          history: historyPayload,
          generateMore: true,
          chosenLanguage,
          selectedPackages,
          activeTemplate,
          sessionId,

          briefingPurpose: initialPurpose,
          depthSignals: initialDepthSignals,
        }),
      });

      if (!res.ok) throw new Error("Erro na API");
      const data = await res.json();

      if (data.nextQuestion?.options) {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[currentStepIndex].options = [...(newMessages[currentStepIndex].options || []), ...data.nextQuestion.options];
          persistSnapshot(newMessages, currentStepIndex, sessionId);
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMore(false);
    }
  }, [messages, currentStepIndex, briefingState, chosenLanguage, selectedPackages, activeTemplate, sessionId, endpoint, persistSnapshot, initialDepthSignals, initialPurpose]);

  const resetBriefing = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      await clearFutureInteractionsInDb(sessionId, -1);
      const initialMsgs = buildRestoredMessages();
      setMessages(initialMsgs);
      setCurrentStepIndex(0);
      setBriefingState(initialBase as BriefingState);
      setAssets(null);
      setIsFinished(false);
      setIsFinalTextStep(false);
      setIsUploadStep(false);

      persistSnapshot(initialMsgs, 0, sessionId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, buildRestoredMessages, initialBase, persistSnapshot]);



  const contextValue = useMemo(() => ({
    sessionId,
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
    isFinalTextStep,
    isUploadStep,
    setIsFinished,
    finishBriefing: () => {
      window.location.href = '/dashboard';
    },
    resetBriefing,
    assets,
    setAssets,
    submitAnswer,
    generateMoreOptions,
    basalInfo,
    chosenLanguage,
    selectedPackages,
    selectedPackageDetails,
    branding,
    isOnboarding,
    isOwner,
    engagementLevel,
    maxQuestions: initialMaxQuestions || 45,
    pendingCheckpoint,
    dismissCheckpoint: () => setPendingCheckpoint(null),
  }), [
    sessionId, briefingState, updateBriefingState, messages, currentStepIndex,
    goBack, goNext, addMessage, isLoading, isGeneratingMore,
    isFinished, isFinalTextStep, isUploadStep, assets, basalInfo, chosenLanguage,
    engagementLevel, pendingCheckpoint,
    resetBriefing,
    submitAnswer, generateMoreOptions,
    selectedPackages, selectedPackageDetails, branding, isOnboarding, isOwner,
  ]);

  return <BriefingContext.Provider value={contextValue}>{children}</BriefingContext.Provider>;
}

export function useBriefing() {
  const context = useContext(BriefingContext);
  if (!context) throw new Error("useBriefing must be used within a BriefingProvider");
  return context;
}

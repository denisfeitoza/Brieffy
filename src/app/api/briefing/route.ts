import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings, getPerformanceConfig, getFormatConfig } from "@/lib/aiConfig";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";
import {
  INTENT_MODULE,
  EXTRACTION_MODULE,
  CONSULTANT_RULES,
  PHASE_MODULES,
  buildActiveListeningModule,
  buildBehaviorRules,
  buildOutputFormat,
  buildCorePersona,
  BriefingPhase
} from '@/lib/ai/promptDictionary';
// BUG-05 FIX: Do NOT create Supabase client at module level.
// At Vercel build time, env vars are not available, causing "supabaseUrl is required" crash.
// The client is created lazily inside each function call.
function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key);
}

// ================================================================
// BUILD PACKAGE PROMPTS — Fetch & Concatenate Active Skill Fragments
// ================================================================
async function buildPackagePrompts(selectedSlugs?: string[]): Promise<{ prompt: string; purposes: string[]; depthSignals: string[] }> {
  const empty = { prompt: '', purposes: [], depthSignals: [] };
  if (!selectedSlugs || selectedSlugs.length === 0) return empty;

  try {
    const { data: packages, error } = await getSupabaseServer()
      .from('briefing_category_packages')
      .select('slug, name, system_prompt_fragment, max_questions, briefing_purpose, depth_signals')
      .in('slug', selectedSlugs)
      .or('is_archived.is.null,is_archived.eq.false');

    if (error || !packages || packages.length === 0) return empty;

    const purposes: string[] = [];
    const depthSignals: string[] = [];

    const fragments = packages.map((pkg: { name: string; max_questions: number | null; system_prompt_fragment: string; briefing_purpose?: string; depth_signals?: string[] }) => {
      if (pkg.briefing_purpose) purposes.push(pkg.briefing_purpose);
      if (pkg.depth_signals) depthSignals.push(...pkg.depth_signals);
      const limit = pkg.max_questions ? `(up to ${pkg.max_questions} unique questions)` : '(UNLIMITED questions — adapt to complexity)';
      return `[ACTIVE PACKAGE: ${pkg.name}] ${limit}\n${pkg.system_prompt_fragment}`;
    }).join('\n\n');

    const prompt = `
═══ PACOTES DE SKILL — Especializações de IA Ativas ═══
Os seguintes pacotes de skill especializados estão ATIVOS nesta sessão de briefing.
Cada pacote adiciona perguntas únicas para sua área. REGRAS CRÍTICAS DE DEDUPLICAÇÃO:
1. Se uma pergunta do Pacote A já é coberta pelo Pacote B ou pelos campos basais universais, NÃO pergunte novamente.
2. Use seu julgamento para MESCLAR tópicos sobrepostos em perguntas mais ricas e combinadas.
3. Quando o tipo multi_slider é especificado num pacote, você DEVE gerar a pergunta usando questionType "multi_slider" com o formato de opções especificado.
4. As perguntas de cada pacote devem ser distribuídas pelas seções relevantes, não agrupadas juntas.
5. NUNCA numere as perguntas (ex: "pergunta 1:", "1."). O chat já tem o fluxo visual.
6. Faça a pergunta DIRETAMENTE ou com uma ponte muito natural. NUNCA adicione justificativas robóticas na própria pergunta (ex: evite dizer "Entender a história ajuda a posicionar. Então...").
7. Mantenha o tom de uma conversa fluida e humana.

${fragments}
═══ FIM DOS PACOTES DE SKILL ═══`;
    return { prompt, purposes, depthSignals };
  } catch (err) {
    console.error('Error building package prompts:', err);
    return empty;
  }
}

// ================================================================
// BASAL CONTRACT — Universal Fields (independent of template)
// ================================================================
const UNIVERSAL_BASAL_FIELDS = [
  "company_name",
  "sector_segment",
  "company_age",
  "services_offered",
  "owner_relationship",
  "brand_name_meaning",
  "keywords",
  "mission_vision_values",
  "target_audience_demographics",
  "competitors",
  "competitive_differentiator",
  "communication_channels",
  "geographic_reach",
  "brand_personality",
  "tone_of_voice"
];

const SECTION_PIPELINE = [
  { id: "company", title: "About the Company", priority: 1 },
  { id: "market", title: "Market & Positioning", priority: 2 },
  { id: "audience", title: "Target Audience", priority: 3 },
  { id: "identity", title: "Identity & Personality", priority: 4 },
  { id: "visual", title: "Visual References", priority: 5 },
  { id: "delivery", title: "Expectations & Delivery", priority: 6 }
];

const ABSOLUTE_MAX_QUESTIONS = 20;
const MIN_MEANINGFUL_VALUE_LENGTH = 3;

function calculateEngagement(history: { role: string; content: string }[]): 'high' | 'medium' | 'low' {
  const recentUserMsgs = history
    .filter(m => m.role === 'user')
    .slice(-3);

  if (recentUserMsgs.length === 0) return 'high';

  const avgWords = recentUserMsgs.reduce((sum, m) => {
    return sum + m.content.trim().split(/\s+/).length;
  }, 0) / recentUserMsgs.length;

  const skippedCount = recentUserMsgs.filter(m =>
    m.content === '(skipped)' || m.content.trim().length < 3
  ).length;

  if (skippedCount >= 2 || avgWords < 5) return 'low';
  if (avgWords < 15 || skippedCount >= 1) return 'medium';
  return 'high';
}

function calculateQualityBasalCoverage(
  currentState: Record<string, unknown>,
  basalFields: string[]
): number {
  const collected = getCollectedBasalFields(currentState, basalFields);
  return collected.length / Math.max(basalFields.length, 1);
}

function getCollectedBasalFields(
  currentState: Record<string, unknown>,
  basalFields: string[]
): string[] {
  const placeholders = ["(não possui)", "(desconhecido)", "(n/a)", "(none)", "(unknown)"];
  return basalFields.filter(field => {
    const val = currentState?.[field];
    if (!val) return false;
    if (typeof val === 'string') {
      const trimmed = val.trim().toLowerCase();
      if (placeholders.some(p => trimmed.includes(p))) return true;
      if (trimmed.length < MIN_MEANINGFUL_VALUE_LENGTH) return false;
      return true;
    }
    if (Array.isArray(val)) return val.length > 0;
    return true;
  });
}

export async function POST(req: Request) {
  try {
    // Rate limit: 20 requests per minute for briefing
    const ip = getRequestIP(req);
    const rl = checkRateLimit(`briefing:${ip}`, { maxRequests: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before trying again." },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json();
    const { currentState, history, generateMore, activeTemplate, chosenLanguage, selectedPackages, detectedSignals: previousSignals, isResume } = body;

    // RESUME SUPPORT: when resuming, use the last real answer from history (not the __RESUME__ token)
    let answer = body.answer;
    if (isResume && answer === '__RESUME__') {
      const lastUserMsg = [...(history || [])].reverse().find((m: { role: string; content: string }) => m.role === 'user');
      answer = lastUserMsg?.content || 'Continuando de onde parei.';
    }

    // Parallel fetch: user profile, DB settings, and package prompts — all independent
    const supabaseSessionPromise = createServerSupabaseClient();
    const dbSettingsPromise = getDBSettings();
    const packageDataPromise = buildPackagePrompts(selectedPackages);

    const [supabaseSession, dbSettings, packageData] = await Promise.all([
      supabaseSessionPromise,
      dbSettingsPromise,
      packageDataPromise,
    ]);

    const { data: { user } } = await supabaseSession.auth.getUser();

    let agencySummary = "";
    let agencyBrandColor = "";

    if (user) {
      const { data: profile } = await getSupabaseServer()
        .from("briefing_profiles")
        .select("company_summary, brand_color")
        .eq("id", user.id)
        .maybeSingle();
        
      if (profile?.company_summary) agencySummary = profile.company_summary;
      if (profile?.brand_color) agencyBrandColor = profile.brand_color;
    }

    const llmConfig = getLLMConfig(dbSettings);
    const perfConfig = getPerformanceConfig(dbSettings);
    const formatConfig = getFormatConfig(dbSettings);

    if (!llmConfig.apiKey) {
      console.warn(`${llmConfig.provider.toUpperCase()} API Key não encontrada. Usando modo MOCK.`);
      return NextResponse.json(mockEngine(answer, currentState, history, generateMore));
    }

    // ================================================================
    // TEMPLATE CONTEXT BUILDER (compact)
    // ================================================================
    const basalFields = activeTemplate?.basal_fields?.length 
      ? activeTemplate.basal_fields 
      : UNIVERSAL_BASAL_FIELDS;

    const sections = activeTemplate?.sections?.length
      ? activeTemplate.sections
      : SECTION_PIPELINE;

    const suggestedQuestions = activeTemplate?.suggested_questions?.length
      ? JSON.stringify(activeTemplate.suggested_questions)
      : "Nenhuma pergunta sugerida disponível. Use sua criatividade baseada nos campos basais.";

    const templateContext = activeTemplate 
      ? `Template: ${activeTemplate.name} (${activeTemplate.category}). Goals: ${activeTemplate.objectives.join(", ")}. Core fields: ${activeTemplate.core_fields.join(", ")}`
      : 'No template. General business interview.';

    const briefingPurpose = activeTemplate?.briefing_purpose || '';
    const depthSignals = activeTemplate?.depth_signals || [];
    const previousSignalsList = Array.isArray(previousSignals) ? previousSignals : [];
    const allPurposes = [briefingPurpose, ...packageData.purposes].filter(Boolean);
    const allDepthSignals = [...depthSignals, ...packageData.depthSignals];
    const mergedPurpose = allPurposes.length > 0 ? allPurposes.join(' | ') : '';
    const mergedDepthSignals = [...new Set(allDepthSignals)]; // deduplicate

    const extraContextStrings = [];
    if (body.initialContext) {
      extraContextStrings.push(`KNOWN CLIENT CONTEXT: ${body.initialContext}`);
    }
    if (isResume) {
      extraContextStrings.push(`SESSION RESUME: This client LEFT and came back to finish the briefing. All previous answers are in the history above. DO NOT repeat or rephrase any question already answered. Start from where the conversation left off and ask ONLY the next unanswered question. Acknowledge the resume naturally (e.g. \"Welcome back! Let's continue where we left off...\") before asking the next question.`);
    }
    if (agencySummary) {
      extraContextStrings.push(`AGENCY/USER PROFILE: You are conducting this briefing on behalf of an agency described as: "${agencySummary}". Use this knowledge to contextualize choices and acknowledge their agency type. Frame questions naturally referencing their agency context if it fits.`);
    }
    if (agencyBrandColor) {
      extraContextStrings.push(`AGENCY BRAND COLOR: Their agency's primary brand color is ${agencyBrandColor}. Keep this in mind if they prefer visuals aligned with their brand.`);
    }
    const extraContext = extraContextStrings.join('\n\n');

    const langMap: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'pt': 'Portuguese (pt-BR)',
    };
    const targetLang = langMap[chosenLanguage || 'pt'] || 'Portuguese (pt-BR)';

    // ================================================================
    // PHASE DETECTION — Uses quality-validated coverage + question count
    // ================================================================
    const questionCount = history.filter((m: { role: string }) => m.role === 'assistant').length;
    const currentBasalCoverage = calculateQualityBasalCoverage(currentState || {}, basalFields);
    const backendEngagement = calculateEngagement(history || []);

    let currentPhase: BriefingPhase = 'discovery';
    if (questionCount >= 3 && currentBasalCoverage >= 0.2) currentPhase = 'confirm';
    if (questionCount >= 6 && currentBasalCoverage >= 0.4) currentPhase = 'depth';
    if (currentBasalCoverage >= perfConfig.basalThreshold && questionCount >= 8) currentPhase = 'finalize';

    // ================================================================
    // CIRCUIT BREAKER — Hard limit enforced in code, not just prompt
    // ================================================================
    const maxQForEngagement = backendEngagement === 'low' ? 8 : backendEngagement === 'medium' ? 12 : 16;
    const effectiveMax = Math.min(maxQForEngagement, ABSOLUTE_MAX_QUESTIONS);
    const forceFinish = questionCount >= effectiveMax;
    if (forceFinish) {
      console.warn(`[Briefing] Circuit breaker: ${questionCount} questions reached (limit: ${effectiveMax}, engagement: ${backendEngagement}). Forcing finalization.`);
      currentPhase = 'finalize';
    }

    // ================================================================
    // HISTORY COMPRESSION — Keep recent messages full, summarize older ones
    // User answers get more space (up to 300 chars) to preserve context
    // ================================================================
    const RECENT_WINDOW = 4;
    let compressedHistory = history;
    if (history.length > RECENT_WINDOW) {
      const oldMessages = history.slice(0, history.length - RECENT_WINDOW);
      const recentMessages = history.slice(history.length - RECENT_WINDOW);
      const summaryParts = oldMessages.map((m: { role: string; content: string }) => {
        const maxLen = m.role === 'user' ? 300 : 120;
        const text = m.content.replace(/\n+/g, ' ').slice(0, maxLen);
        return `[${m.role}] ${text}`;
      });
      const summaryMsg = {
        role: 'system',
        content: `<ConversationSummary>\nEarlier conversation (${oldMessages.length} messages condensed):\n${summaryParts.join('\n')}\n</ConversationSummary>`
      };
      compressedHistory = [summaryMsg, ...recentMessages];
    }

    // ================================================================
    // ALLOWED FORMATS — Build format descriptions
    // ================================================================
    const allowedFormats: string[] = [];
    allowedFormats.push(`  - text: Open-ended names/descriptions.`);
    if (formatConfig.multiple_choice) allowedFormats.push(`  - multiple_choice: Multi-select. EXACTLY 6 options (5 real + 1 "Outro"). Options as string array.`);
    if (formatConfig.single_choice) allowedFormats.push(`  - single_choice: Exclusive choice. EXACTLY 6 options (5 real + 1 "Outro"). For FONTS: use REAL Google Font names "FontName - TwoWordDescription". 6th = "Nenhuma dessas - Padrao do Sistema".`);
    if (formatConfig.boolean_toggle) allowedFormats.push(`  - boolean_toggle: Yes/No binary. No "Other" option.`);
    if (formatConfig.card_selector) allowedFormats.push(`  - card_selector: Strategic routes. Options as [{title,description}]. 6 cards (5 real + 1 "Outro" card).`);
    if (formatConfig.slider) allowedFormats.push(`  - slider: 1-10 scale. Send minOption and maxOption.`);
    if (formatConfig.multi_slider) allowedFormats.push(`  - multi_slider: Multiple dimensions. Options as [{"label","min":1,"max":5,"minLabel","maxLabel"}]. MUST be 1-5 scale. 3-5 dimensions.`);
    if (formatConfig.color_picker) allowedFormats.push(`  - color_picker: Brand color palette wizard. Use ONLY for color gathering.`);
    if (formatConfig.file_upload) allowedFormats.push(`  - file_upload: Assets/references. Use ONLY at the end.`);

    // ================================================================
    // PHASE-SPECIFIC MODULES — Only include what's needed for current phase
    // ================================================================
    const CORE_PERSONA = buildCorePersona({
      targetLang,
      templateContext,
      basalFields,
      sections,
      extraContext,
      selectedPackages,
      packageDataPrompt: packageData.prompt
    });

    const ACTIVE_LISTENING_MODULE = buildActiveListeningModule({
      mergedPurpose,
      mergedDepthSignals,
      previousSignalsList
    });

    const BEHAVIOR_RULES = buildBehaviorRules({
      generateMore,
      basalThreshold: perfConfig.basalThreshold,
      backendEngagement,
      selectedPackages
    });

    const OUTPUT_FORMAT = buildOutputFormat(backendEngagement);

    const systemPrompt = [
      CORE_PERSONA,
      INTENT_MODULE,
      EXTRACTION_MODULE,
      ACTIVE_LISTENING_MODULE,
      PHASE_MODULES[currentPhase](forceFinish),
      CONSULTANT_RULES,
      BEHAVIOR_RULES,
      `<AllowedFormats>\n${allowedFormats.join('\n')}\n</AllowedFormats>`,
      `<PreviousQuestions>\n${history.filter((m: { role: string }) => m.role === 'assistant').map((m: { content: string }, i: number) => `${i + 1}. ${m.content.split('\n')[0].slice(0, 100)}`).join('\n')}\n</PreviousQuestions>`,
      `<CurrentState>${JSON.stringify(currentState)}</CurrentState>`,
      OUTPUT_FORMAT,
    ].join('\n\n');


    // ================================================================
    // DEDUPE GUARD — Jaccard word-similarity to catch semantic repeats
    // ================================================================
    const normalizeText = (t: string) => t.toLowerCase().replace(/[^a-záéíóúàãõâêîôûç\s]/gi, '').split(/\s+/).filter(w => w.length > 2);
    const jaccardSimilarity = (a: string, b: string): number => {
      const setA = new Set(normalizeText(a));
      const setB = new Set(normalizeText(b));
      if (setA.size === 0 || setB.size === 0) return 0;
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      return intersection.size / union.size;
    };
    const previousQuestions = history
      .filter((m: { role: string }) => m.role === 'assistant')
      .map((m: { content: string }) => m.content.split('\n')[0]);

    // Chamada para o provider configurado (Groq, OpenRouter, etc.) — WITH RETRY
    const startTime = Date.now();
    console.log(`[AI] Using ${llmConfig.provider} / ${llmConfig.model}`);

    const llmMessages = [
      { role: "system", content: systemPrompt },
      ...compressedHistory.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      { role: "user", content: typeof answer === 'string' ? answer : JSON.stringify(answer) }
    ];

    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // On retry, bump temperature slightly to help escape JSON generation ruts
        const attemptTemperature = attempt > 0
          ? Math.min(llmConfig.temperature + 0.15, 0.7)
          : llmConfig.temperature;

        if (attempt > 0) {
          console.warn(`[AI] Retry attempt ${attempt + 1}/${MAX_RETRIES} with temperature=${attemptTemperature}`);
        }

        const res = await fetch(llmConfig.baseUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${llmConfig.apiKey}`,
            ...llmConfig.headers,
          },
          body: JSON.stringify({
            model: llmConfig.model,
            response_format: { type: "json_object" },
            temperature: attemptTemperature,
            max_tokens: llmConfig.maxTokens,
            messages: llmMessages,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[${llmConfig.provider.toUpperCase()}] Error (attempt ${attempt + 1}):`, errorText);

          // Retryable: Groq json_validate_failed (400), rate limit (429), server error (5xx)
          const isRetryable = res.status === 400 && errorText.includes('json_validate_failed')
            || res.status === 429
            || res.status >= 500;

          if (isRetryable && attempt < MAX_RETRIES - 1) {
            lastError = new Error(`${llmConfig.provider} API falhou: ${res.status}`);
            // Brief backoff before retry (300ms * attempt)
            await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
            continue;
          }

          throw new Error(`${llmConfig.provider} API falhou: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        const content = data.choices[0].message.content;
        const usage = data.usage;

        console.log(`[AI] Response in ${Date.now() - startTime}ms (attempt ${attempt + 1})`);

        // ================================================================
        // ASYNC LOGGING — Save token usage and estimated cost to db
        // ================================================================
        if (usage) {
          const { estimateCost } = await import('@/lib/aiConfig');
          const cost = estimateCost(llmConfig.provider, llmConfig.model, usage.prompt_tokens || 0, usage.completion_tokens || 0);
          const { sessionId } = body;

          getSupabaseServer().from('api_usage').insert({
            user_id: user?.id || null,
            session_id: sessionId || null,
            provider: llmConfig.provider,
            model: llmConfig.model,
            prompt_tokens: usage.prompt_tokens || 0,
            completion_tokens: usage.completion_tokens || 0,
            estimated_cost_usd: cost
          }).then(({ error }: { error: { message: string } | null }) => {
            if (error) console.error("[API_USAGE] Failed to log usage:", error);
          });
        }

        try {
          const parsed = JSON.parse(content);

          // ================================================================
          // INTENT-AWARE INFERENCE AUTO-MERGE — v2 (Skills-Inspired)
          // Respects intent.mode to prevent accidental state overwrites
          // ================================================================
          const intentMode = parsed.intent?.mode || 'CREATE';
          const intentConfidence = parsed.intent?.confidence || 0.9;
          console.log(`[AI] Intent: ${intentMode} (${Math.round(intentConfidence * 100)}%) | Fields: ${(parsed.intent?.target_fields || []).join(', ') || 'none'}`);

          // Log diff_summary when available (UPDATE mode)
          if (parsed.diff_summary && intentMode === 'UPDATE') {
            console.log(`[AI] Surgical Update — Changed: [${(parsed.diff_summary.changed || []).join(', ')}] | Preserved: [${(parsed.diff_summary.preserved || []).join(', ')}]`);
          }

          // EXPLORE mode: strip any updates the LLM may have hallucinated
          if (intentMode === 'EXPLORE') {
            if (parsed.updates && Object.keys(parsed.updates).length > 0) {
              console.warn(`[AI] EXPLORE mode but LLM sent updates — stripping:`, Object.keys(parsed.updates));
              parsed.updates = {};
            }
          }

          if (parsed.inferences?.extracted?.length) {
            // Determine confidence threshold based on intent mode
            const confidenceThreshold = intentMode === 'UPDATE' ? 0.85 : 0.7;
            
            const highConfidence = parsed.inferences.extracted.filter(
              (inf: { confidence: number; field: string; value: string }) => inf.confidence >= confidenceThreshold && inf.field && inf.value
            );

            if (highConfidence.length > 0) {
              if (!parsed.updates) parsed.updates = {};
              for (const inf of highConfidence) {
                // In UPDATE mode: only merge if the field is in target_fields OR is a cross-field impact
                const targetFields = parsed.intent?.target_fields || [];
                const isTargetField = targetFields.includes(inf.field);
                const isCrossField = inf.source === 'cross_field_impact';
                
                if (intentMode === 'UPDATE' && !isTargetField && !isCrossField) {
                  continue; // Skip: not related to this update
                }
                
                if (!parsed.updates[inf.field] && !currentState[inf.field]) {
                  parsed.updates[inf.field] = inf.value;
                }
              }
              console.log(`[AI] Auto-merged ${highConfidence.length} inferences (threshold: ${confidenceThreshold}):`,
                highConfidence.map((i: { confidence: number; field: string; value: string }) => `${i.field}=${i.value} (${Math.round(i.confidence * 100)}%)`).join(', ')
              );
            }

            if (parsed.inferences.depth_decision) {
              console.log(`[AI] Depth decision: ${parsed.inferences.depth_decision}` +
                (parsed.inferences.skipped_topics?.length ? ` | Skipped: ${parsed.inferences.skipped_topics.join(', ')}` : '')
              );
            }
          }

          // ================================================================
          // DEDUPE GUARD — Check if new question is too similar to a previous one
          // ================================================================
          if (parsed.nextQuestion?.text && !parsed.isFinished) {
            const newQ = parsed.nextQuestion.text;
            const isDuplicate = previousQuestions.some((pq: string) => jaccardSimilarity(pq, newQ) > 0.55);
            
            if (isDuplicate && attempt < MAX_RETRIES - 1) {
              console.warn(`[Briefing] Dedupe guard: "${newQ}" is too similar to a previous question. Retrying (attempt ${attempt + 1}).`);
              // Inject a dedupe instruction into the user message for the retry
              llmMessages[llmMessages.length - 1] = {
                role: "user",
                content: `${typeof answer === 'string' ? answer : JSON.stringify(answer)}\n\n[SYSTEM: The question you generated ("${newQ}") is too similar to a question already asked. Generate a COMPLETELY DIFFERENT question about a DIFFERENT topic.]`
              };
              lastError = new Error("Duplicate question detected");
              await new Promise(r => setTimeout(r, 200));
              continue;
            }
          }

          // ================================================================
          // CIRCUIT BREAKER ENFORCEMENT — Force finish if limit reached
          // ================================================================
          if (forceFinish && !parsed.isFinished) {
            console.warn(`[Briefing] Circuit breaker override: forcing isFinished=true (${questionCount} questions).`);
            parsed.isFinished = true;
            if (!parsed.assets) {
              parsed.assets = {
                score: { clareza_marca: 5, clareza_dono: 5, publico: 5, maturidade: 5 },
                insights: ["Briefing finalizado automaticamente pelo limite de perguntas."]
              };
            }
            const collected = getCollectedBasalFields(currentState || {}, basalFields);
            parsed.basalFieldsCollected = collected;
            parsed.basalFieldsMissing = basalFields.filter((f: string) => !collected.includes(f));
            parsed.session_quality_score = parsed.session_quality_score || Math.round(currentBasalCoverage * 100);
          }

          // Safety auto-fill for UI components
          if (parsed.nextQuestion) {
            // Validation: force fallback to text if AI generated a disabled format
            const qType = parsed.nextQuestion.questionType;
            if (qType && qType !== 'text') {
              const isAllowed = (formatConfig as unknown as Record<string, boolean>)[qType];
              if (isAllowed === false) {
                console.warn(`[Briefing] AI generated disabled format '${qType}'. Forcing fallback to 'text'.`);
                parsed.nextQuestion.questionType = 'text';
                parsed.nextQuestion.options = [];
              }
            }

            if (parsed.nextQuestion.questionType === "multi_slider" && (!parsed.nextQuestion.options || typeof parsed.nextQuestion.options[0] !== 'object')) {
              parsed.nextQuestion.options = [
                { label: "Formalidade", min: 1, max: 5, minLabel: "Descontraído", maxLabel: "Corporativo" },
                { label: "Ousadia", min: 1, max: 5, minLabel: "Tradicional", maxLabel: "Disruptivo" },
                { label: "Comunicação", min: 1, max: 5, minLabel: "Direta/Técnica", maxLabel: "Emocional" }
              ];
            }
          } else if (!parsed.isFinished) {
            console.warn("[Briefing] AI returned null nextQuestion without isFinished=true. Generating smart fallback.");
            
            // Build a smart fallback question targeting the most critical missing field
            const collected = getCollectedBasalFields(currentState || {}, basalFields);
            const missingFields = basalFields.filter((f: string) => !collected.includes(f));
            const fallbackLangMap: Record<string, Record<string, string>> = {
              pt: {
                publico_alvo: "Para quem sua empresa vende? Descreva seu público ideal.",
                segmento: "Em qual segmento ou nicho sua empresa atua?",
                diferencial: "O que diferencia sua empresa dos concorrentes?",
                objetivos: "Quais são seus principais objetivos com esse projeto?",
                default: "Pode me contar um pouco mais sobre esse ponto?",
              },
              en: {
                publico_alvo: "Who does your company sell to? Describe your ideal customer.",
                segmento: "What industry or niche does your company operate in?",
                diferencial: "What sets your company apart from competitors?",
                objetivos: "What are your main goals with this project?",
                default: "Could you tell me a bit more about that?",
              },
              es: {
                publico_alvo: "¿A quién le vende su empresa? Describa su cliente ideal.",
                segmento: "¿En qué sector o nicho opera su empresa?",
                diferencial: "¿Qué diferencia a su empresa de la competencia?",
                objetivos: "¿Cuáles son sus principales objetivos con este proyecto?",
                default: "¿Podría contarme un poco más sobre eso?",
              },
            };
            const langFallbacks = fallbackLangMap[chosenLanguage || 'pt'] || fallbackLangMap['pt'];
            const targetField = missingFields[0];
            const fallbackText = (targetField && langFallbacks[targetField]) || langFallbacks.default;
            
            parsed.nextQuestion = { text: fallbackText, questionType: "text", options: [] };
          }

          return NextResponse.json(parsed);
        } catch (e) {
          console.error("Falha ao fazer parse do JSON do LLM:", content);
          // JSON parse failure is retryable
          if (attempt < MAX_RETRIES - 1) {
            lastError = new Error("Invalid output format from LLM");
            await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
            continue;
          }
          throw new Error("Invalid output format from LLM");
        }

      } catch (attemptError) {
        lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));
        if (attempt < MAX_RETRIES - 1) continue;
      }
    }

    // ================================================================
    // ALL RETRIES EXHAUSTED — Return graceful fallback instead of 500
    // This prevents the frontend from creating an error-message loop
    // where the error message itself becomes a "question" in the
    // conversation history, polluting context for subsequent AI calls.
    // ================================================================
    console.error("[Briefing] All retries exhausted. Returning graceful fallback.", lastError);

    const langMap2: Record<string, { fallbackQ: string; errorFeedback: string }> = {
      'en': {
        fallbackQ: "I had a small hiccup processing your answer. Could you rephrase or add a bit more detail?",
        errorFeedback: "Our AI needed a moment — your previous answer was saved."
      },
      'es': {
        fallbackQ: "Tuve un pequeño problema procesando tu respuesta. ¿Podrías reformularla o agregar más detalle?",
        errorFeedback: "Nuestra IA necesitó un momento — tu respuesta anterior fue guardada."
      },
      'pt': {
        fallbackQ: "Tive uma pequena dificuldade processando sua resposta. Pode reformular ou adicionar mais detalhes?",
        errorFeedback: "Nossa IA precisou de um momento — sua resposta anterior foi salva."
      },
    };
    const fallbackLang = langMap2[chosenLanguage || 'pt'] || langMap2['pt'];

    return NextResponse.json({
      intent: { mode: 'CREATE', confidence: 0.5, target_fields: [] },
      updates: {},
      inferences: { extracted: [] },
      basalCoverage: calculateQualityBasalCoverage(currentState || {}, basalFields),
      currentSection: "company",
      basalFieldsCollected: getCollectedBasalFields(currentState || {}, basalFields),
      basalFieldsMissing: basalFields.filter((f: string) => !getCollectedBasalFields(currentState || {}, basalFields).includes(f)),
      nextQuestion: {
        text: fallbackLang.fallbackQ,
        questionType: "text",
        options: [],
        allowMoreOptions: false,
      },
      isFinished: false,
      assets: null,
      micro_feedback: fallbackLang.errorFeedback,
      engagement_level: backendEngagement,
      active_listening: { signals: [], depth_question: null },
      session_quality_score: null,
    });

  } catch (error) {
    console.error("Briefing API Route Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// ------ MOCK ENGINE (Para desenvolvimento sem API Key) ------
function mockEngine(answer: string, state: Record<string, unknown>, history: { role: string; content: string }[], generateMore?: boolean) {
  const updates: Record<string, unknown> = {};
  let nextQuestion = null;
  let isFinished = false;
  let assets = null;

  if (generateMore) {
    return {
       updates: {},
       basalCoverage: 0,
       currentSection: "company",
       basalFieldsCollected: [],
       basalFieldsMissing: UNIVERSAL_BASAL_FIELDS,
       nextQuestion: {
          text: "Aqui estão mais opções para você escolher:",
          options: ["Opção Extra 1", "Opção Extra 2", "Opção Extra 3", "Opção Extra 4"],
          allowMoreOptions: false,
       },
       isFinished: false,
       assets: null
    };
  }

  // Lógica simples (Fake AI) — agora seguindo o pipeline de seções
  const step = history?.length || 0;

  // ═══ DISCOVERY-FIRST MOCK ═══
  // Steps 1-3: Open text questions (Discovery)
  // Steps 4-6: Confirmation with structured inputs
  // Step 7+: Finalization

  if (step <= 1) {
    // DISCOVERY Q1: About the business
    updates.company_name = answer || "Tech Startup";
    nextQuestion = {
      text: "Vamos começar com uma conversa aberta. Me conte sobre o seu negócio — o que vocês fazem, como começou, qual o momento atual.",
      questionType: "text",
    };
  } else if (step === 2) {
    // DISCOVERY Q2: Challenge / Motivation
    updates.services_offered = answer;
    nextQuestion = {
      text: "O que te trouxe até aqui? Qual desafio ou oportunidade motivou você a buscar esse projeto?",
      questionType: "text",
    };
  } else if (step === 3) {
    // DISCOVERY Q3: Vision
    updates.target_audience = answer;
    nextQuestion = {
      text: "Como você imagina o resultado ideal? Se tudo der certo, como será daqui a alguns meses?",
      questionType: "text",
    };
  } else if (step === 4) {
    // CONFIRMATION Q1: Confirm audience
    updates.competitors = answer;
    nextQuestion = {
      text: "Pelo que você descreveu, seu público principal parece ser empresas. Isso está correto?",
      questionType: "boolean_toggle",
    };
  } else if (step === 5) {
    // CONFIRMATION Q2: Brand personality
    updates.competitive_differentiator = answer;
    nextQuestion = {
      text: "Qual dessas personalidades mais se aproxima da sua marca?",
      questionType: "card_selector",
      options: [
        { title: "Inovadora", description: "Sempre à frente, testando o novo" },
        { title: "Elegante", description: "Sofisticada, premium, cuidado nos detalhes" },
        { title: "Próxima", description: "Acolhedora, acessível, de igual para igual" },
        { title: "Determinada", description: "Focada em resultados, resiliente" },
        { title: "Criativa", description: "Ousada, original, fora da curva" },
        { title: "Outro", description: "Descreva sua própria opção" }
      ],
      allowMoreOptions: false,
    };
  } else if (step === 6) {
    // CONFIRMATION Q3: Tone of voice
    updates.brand_personality = answer;
    nextQuestion = {
      text: "Como sua marca se comunica com seus clientes?",
      questionType: "single_choice",
      options: ["Formal e Técnica", "Informal e Próxima", "Inspiracional", "Direta e Objetiva", "Educativa", "Outro"],
    };
  } else {
    // Finalização
    updates.tone_of_voice = answer;
    isFinished = true;
    assets = {
      slogans: ["Tech For Tomorrow", "Simplifying Business", "Innovate Your Way"],
      cores: [
        { name: "Primary", hex: "#000000" },
        { name: "Accent", hex: "#3b82f6" },
        { name: "Background", hex: "#ffffff" }
      ],
      score: {
        clareza_marca: 8,
        clareza_dono: 7,
        publico: 9,
        maturidade: 6
      },
      insights: [
        "Público B2B bem direcionado, mas falta criar um MVP sólido.",
        "A empresa foca muito em vendas, branding ficou em segundo plano."
      ]
    };
  }

  const collected = Object.keys({ ...state, ...updates }).filter(k => UNIVERSAL_BASAL_FIELDS.includes(k) && (state[k] || updates[k]));
  const missing = UNIVERSAL_BASAL_FIELDS.filter(f => !collected.includes(f));

  return { 
    updates, 
    nextQuestion, 
    isFinished, 
    assets,
    basalCoverage: collected.length / UNIVERSAL_BASAL_FIELDS.length,
    currentSection: step <= 2 ? "company" : step <= 4 ? "market" : step <= 6 ? "identity" : "visual",
    basalFieldsCollected: collected,
    basalFieldsMissing: missing
  };
}

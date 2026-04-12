import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings, getPerformanceConfig, getFormatConfig } from "@/lib/aiConfig";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";
import {
  EXTRACTION_MODULE,
  CONSULTANT_RULES,
  PHASE_MODULES,
  buildBehaviorRules,
  buildOutputFormat,
  buildCorePersona,
  compileSystemPrompt,
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
3. Quando um tipo específico é sugerido num pacote, você deve usá-lo apenas se estiver listado em <AllowedFormats>.
4. As perguntas de cada pacote devem ser distribuídas pelas seções relevantes, não agrupadas juntas.

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

const BASE_MIN_QUESTIONS = 25;
const BLOCK_SIZE = 10;
const ABSOLUTE_MAX_QUESTIONS = 45; // Hard limit — force finish at 45
const MIN_MEANINGFUL_VALUE_LENGTH = 3;

/**
 * Detects user fatigue from the ENTIRE session history.
 * Returns 'exhausted' when:
 *   - 5+ total skips in the session, OR
 *   - Two separate skip-streaks detected (e.g. 2 skips, answered, then 3 more skips)
 * Returns 'fatigue' for 2+ consecutive skips in the last 3 messages.
 */
function calculateEngagement(history: { role: string; content: string }[]): 'high' | 'medium' | 'low' | 'fatigue' | 'exhausted' {
  const allUserMsgs = history.filter(m => m.role === 'user');
  const recentUserMsgs = allUserMsgs.slice(-3);

  if (recentUserMsgs.length === 0) return 'high';

  // Count total skips in the entire session
  const isSkip = (m: { content: string }) => m.content === '(skipped)' || m.content.trim().length < 3;
  const totalSkips = allUserMsgs.filter(isSkip).length;

  // Detect skip-streaks: sequences of 2+ consecutive skips
  let currentStreak = 0;
  for (const msg of allUserMsgs) {
    if (isSkip(msg)) {
      currentStreak++;
    } else {
      currentStreak = 0;
    }
  }

  // EXHAUSTED: user has given up. Override minQuestions entirely.
  // Triggers when: 5+ total skips OR 3 consecutive skips OR manual finish requested via UI
  if (totalSkips >= 5 || currentStreak >= 3) return 'exhausted';
  
  if (recentUserMsgs.some(m => m.content === '(FINALIZAR_AGORA)')) {
    return 'exhausted';
  }

  const avgWords = recentUserMsgs.reduce((sum, m) => {
    return sum + m.content.trim().split(/\s+/).length;
  }, 0) / recentUserMsgs.length;

  const recentSkippedCount = recentUserMsgs.filter(isSkip).length;

  // FATIGUE: 2+ consecutive skips in last 3 messages
  const isFatigue = recentUserMsgs.length >= 2 && recentUserMsgs.slice(-2).every(isSkip);

  if (isFatigue) return 'fatigue';
  if (recentSkippedCount >= 2 || avgWords < 5) return 'low';
  if (avgWords < 15 || recentSkippedCount >= 1) return 'medium';
  return 'high';
}

/** Returns true when engagement signals the user is done and wants out */
function isUserExhausted(engagement: ReturnType<typeof calculateEngagement>): boolean {
  return engagement === 'exhausted';
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

// ════════════════════════════════════════════════════════════════
// ZERO-TRUST SANITIZER — Prevent phantom data wipes from LLM
// ════════════════════════════════════════════════════════════════
function sanitizeUpdates(updates: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!updates || typeof updates !== 'object') return {};
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(updates)) {
    const val = updates[key];
    // Block nulls, undefined, empty strings, or empty arrays from overwriting valid state
    if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
      continue;
    }
    clean[key] = val;
  }
  return clean;
}

// ════════════════════════════════════════════════════════════════
// SMART FALLBACK — Generate fallback question targeting missing fields
// ════════════════════════════════════════════════════════════════
function buildSmartFallback(
  currentState: Record<string, unknown>,
  basalFields: string[],
  chosenLanguage: string
): { text: string; questionType: string; options: string[] } {
  const collected = getCollectedBasalFields(currentState || {}, basalFields);
  const missingFields = basalFields.filter((f: string) => !collected.includes(f));
  const fallbackLangMap: Record<string, Record<string, string>> = {
    pt: {
      target_audience_demographics: "Para quem sua empresa vende? Descreva seu público ideal.",
      sector_segment: "Em qual segmento ou nicho sua empresa atua?",
      competitive_differentiator: "O que diferencia sua empresa dos concorrentes?",
      services_offered: "Quais são seus principais serviços ou produtos?",
      default: "Pode me contar um pouco mais sobre esse ponto?",
    },
    en: {
      target_audience_demographics: "Who does your company sell to? Describe your ideal customer.",
      sector_segment: "What industry or niche does your company operate in?",
      competitive_differentiator: "What sets your company apart from competitors?",
      services_offered: "What are your main services or products?",
      default: "Could you tell me a bit more about that?",
    },
    es: {
      target_audience_demographics: "¿A quién le vende su empresa? Describa su cliente ideal.",
      sector_segment: "¿En qué sector o nicho opera su empresa?",
      competitive_differentiator: "¿Qué diferencia a su empresa de la competencia?",
      services_offered: "¿Cuáles son sus principales servicios o productos?",
      default: "¿Podría contarme un poco más sobre eso?",
    },
  };
  const langFallbacks = fallbackLangMap[chosenLanguage || 'pt'] || fallbackLangMap['pt'];
  const targetField = missingFields[0];
  const fallbackText = (targetField && langFallbacks[targetField]) || langFallbacks.default;

  return { text: fallbackText, questionType: "text", options: [] };
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

    const body = await req.json() || {};
    const { currentState, history = [], generateMore, activeTemplate, chosenLanguage, selectedPackages, isResume, briefingPurpose: sessionPurpose, depthSignals: sessionDepthSignals } = body;

    // RESUME SUPPORT & ZERO-TRUST TRUNCATION: Protect against 10MB payload injections
    let answer = body.answer;
    if (typeof answer === 'string') answer = answer.slice(0, 3000);
    else if (Array.isArray(answer)) answer = answer.map((a: unknown) => String(a).slice(0, 200)).slice(0, 20);
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

    const templateContext = activeTemplate 
      ? `Template: ${activeTemplate.name} (${activeTemplate.category}). Goals: ${activeTemplate.objectives.join(", ")}. Core fields: ${activeTemplate.core_fields.join(", ")}`
      : 'No template. General business interview.';

    const briefingPurpose = sessionPurpose || activeTemplate?.briefing_purpose || '';
    const depthSignals = sessionDepthSignals || activeTemplate?.depth_signals || [];
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
    if (mergedPurpose) {
      extraContextStrings.push(`BRIEFING PURPOSE: ${mergedPurpose}`);
    }
    if (mergedDepthSignals.length > 0) {
      extraContextStrings.push(`DEPTH SIGNALS (topics requiring extra focus): ${mergedDepthSignals.join(', ')}`);
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

    const parsedMax = Number(body.maxQuestions);
    const userMaxQuestions = (!isNaN(parsedMax) && parsedMax > 0 && parsedMax <= 100) ? parsedMax : 40;
    const minQuestions = Math.floor(userMaxQuestions * 0.8);
    const userExhausted = isUserExhausted(backendEngagement);

    // EXHAUSTED override: user has skipped too many times. Respect their time — finalize ASAP.
    // Ignore minQuestions constraint entirely when user is clearly done.
    const effectiveMinQuestions = userExhausted ? Math.min(questionCount, 8) : minQuestions;
    
    let currentPhase: BriefingPhase = 'discovery';
    const confirmThreshold = Math.floor(effectiveMinQuestions * 0.3);
    const depthThreshold = Math.floor(effectiveMinQuestions * 0.6);
    
    if (questionCount >= confirmThreshold && currentBasalCoverage >= 0.2) currentPhase = 'confirm';
    if (questionCount >= depthThreshold && currentBasalCoverage >= 0.4) currentPhase = 'depth';
    if (currentBasalCoverage >= perfConfig.basalThreshold && questionCount >= effectiveMinQuestions) currentPhase = 'finalize';

    // ================================================================
    // CIRCUIT BREAKER — Hard limit enforced in code, not just prompt
    // ================================================================
    const maxQForEngagement =
      backendEngagement === 'exhausted' ? questionCount :     // stop immediately
      backendEngagement === 'fatigue'   ? Math.min(questionCount + 3, minQuestions + 3) :
      backendEngagement === 'low'       ? minQuestions + 5 :
      backendEngagement === 'medium'    ? minQuestions + 10 :
                                          userMaxQuestions;

    const effectiveMax = Math.min(maxQForEngagement, userMaxQuestions);
    const forceFinish = userExhausted || questionCount >= effectiveMax;
    if (forceFinish) {
      const reason = userExhausted ? `user exhausted (${backendEngagement})` : `${questionCount} questions (limit: ${effectiveMax})`;
      console.warn(`[Briefing] Circuit breaker: ${reason}. Forcing finalization.`);
      currentPhase = 'finalize';
    }

    // ================================================================
    // HISTORY COMPRESSION — Keep recent messages full, summarize older ones
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
    // ALLOWED FORMATS — Build format descriptions (compact)
    // ================================================================
    const allowedFormats: string[] = [];
    allowedFormats.push(`  - text: Open-ended names/descriptions.`);
    if (formatConfig.multiple_choice) allowedFormats.push(`  - multiple_choice: Multi-select. EXACTLY 6 options (5 real + 1 "Outro"). Options as string array.`);
    if (formatConfig.boolean_toggle) allowedFormats.push(`  - boolean_toggle: Yes/No binary. No "Other" option.`);
    if (formatConfig.card_selector) allowedFormats.push(`  - card_selector: Strategic routes. Options as [{title,description}]. 6 cards (5 real + 1 "Outro" card).`);
    if (formatConfig.slider) allowedFormats.push(`  - slider: 1-10 scale. Send minOption and maxOption.`);
    if (formatConfig.multi_slider) allowedFormats.push(`  - multi_slider: Multiple dimensions. Options as [{"label","min":1,"max":5,"minLabel","maxLabel"}]. MUST be 1-5 scale. 3-5 dimensions.`);
    if (formatConfig.color_picker) allowedFormats.push(`  - color_picker: Brand color palette wizard. Use ONLY for color gathering.`);
    if (formatConfig.file_upload) allowedFormats.push(`  - file_upload: Assets/references. Use ONLY at the end.`);

    // ================================================================
    // BUILD SYSTEM PROMPT — Phase-aware prompt compiler
    // Only injects modules relevant to the current phase
    // ================================================================
    const blockNumber = Math.floor(questionCount / BLOCK_SIZE) + 1;
    const isCheckpoint = questionCount > 0 && questionCount % BLOCK_SIZE === 0;
    const completedBlock = isCheckpoint ? blockNumber - 1 : 0;

    // Checkpoint data for block evaluation (injected into behavior rules)
    const collected = getCollectedBasalFields(currentState || {}, basalFields);
    const missing = basalFields.filter((f: string) => !collected.includes(f));

    const CORE_PERSONA = buildCorePersona({
      targetLang,
      templateContext,
      basalFields,
      sections,
      extraContext,
      selectedPackages,
      packageDataPrompt: packageData.prompt
    });

    const BEHAVIOR_RULES = buildBehaviorRules({
      generateMore,
      basalThreshold: perfConfig.basalThreshold,
      backendEngagement,
      selectedPackages,
      minQuestions,
      questionCount,
      blockNumber,
      targetFinish: userMaxQuestions,
      // Checkpoint data — only injected at block boundaries
      isCheckpoint,
      collectedFields: isCheckpoint ? collected : undefined,
      missingFields: isCheckpoint ? missing : undefined,
      basalCoverage: isCheckpoint ? currentBasalCoverage : undefined,
    });

    // PreviousQuestions — limited to last 8 for anti-repetition (saves ~2000 tokens on long sessions)
    const assistantMessages = history.filter((m: { role: string }) => m.role === 'assistant');
    const recentQuestions = assistantMessages.slice(-8);
    const previousQuestionsBlock = `<PreviousQuestions>\n${recentQuestions.map((m: { content: string }, i: number) => `${i + 1}. ${m.content.split('\n')[0].slice(0, 100)}`).join('\n')}\n</PreviousQuestions>`;

    // CurrentState — compact format: only collected/missing field names + key values
    const stateCompact = `<CurrentState collected="${collected.join(',')}" missing="${missing.join(',')}" coverage="${Math.round(currentBasalCoverage * 100)}%">${JSON.stringify(currentState)}</CurrentState>`;

    const systemPrompt = compileSystemPrompt({
      phase: currentPhase,
      forceFinish,
      corePersona: CORE_PERSONA,
      behaviorRules: BEHAVIOR_RULES,
      allowedFormats: `<AllowedFormats>\n${allowedFormats.join('\n')}\n</AllowedFormats>`,
      previousQuestions: previousQuestionsBlock,
      currentStateCompact: stateCompact,
    });

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
    const previousQuestions = assistantMessages.map((m: { content: string }) => m.content.split('\n')[0]);

    // LLM call — WITH RETRY
    const startTime = Date.now();
    console.log(`[AI] Using ${llmConfig.provider} / ${llmConfig.model} | Phase: ${currentPhase} | Q: ${questionCount} | Coverage: ${Math.round(currentBasalCoverage * 100)}%`);

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

          // ════════════════════════════════════════════════════════════════
          // SIMPLIFIED PARSE — No more intent/inference/active_listening
          // Everything the LLM extracts goes directly into `updates`.
          // Backend calculates coverage, collected/missing fields.
          // ════════════════════════════════════════════════════════════════

          // ZERO-TRUST: Sanitize updates
          parsed.updates = sanitizeUpdates(parsed.updates);

          // ================================================================
          // DEDUPE GUARD — Check if new question is too similar to a previous one
          // ================================================================
          if (parsed.nextQuestion?.text && !parsed.isFinished) {
            const newQ = parsed.nextQuestion.text;
            const isDuplicate = previousQuestions.some((pq: string) => jaccardSimilarity(pq, newQ) > 0.55);
            
            if (isDuplicate && attempt < MAX_RETRIES - 1) {
              console.warn(`[Briefing] Dedupe guard: "${newQ}" is too similar to a previous question. Retrying (attempt ${attempt + 1}).`);
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
          // CIRCUIT BREAKER ENFORCEMENT & DOCUMENT GENERATION
          // ================================================================
          if (forceFinish && !parsed.isFinished) {
            console.warn(`[Briefing] Circuit breaker override: forcing isFinished=true (${questionCount} questions).`);
            parsed.isFinished = true;
          }

          if (parsed.isFinished) {
            if (!parsed.assets) {
              parsed.assets = {
                score: { clareza_marca: 8, clareza_dono: 8, publico: 8, maturidade: 8 },
                insights: ["Briefing finalizado com sucesso."]
              };
            }
            parsed.session_quality_score = parsed.session_quality_score || Math.round(currentBasalCoverage * 100);

            // ════════════════════════════════════════════════════════════════
            // FINAL DOCUMENT GENERATOR: Transforms mapped data back into the Dossiê
            // ════════════════════════════════════════════════════════════════
            try {
              console.log("[AI] Generating final Markdown Document (Dossiê Estratégico)...");
              const fullState = { ...currentState, ...parsed.updates };
              const docSystemPrompt = `Você é um Consultor Estratégico e Copywriter de Elite.
Com base nos dados extraídos (JSON), no contexto inicial da empresa e no histórico completo da transcrição (anexos e nuances), escreva um Dossiê Estratégico completo em formato Markdown nativo.
O usuário NÃO deve ver o JSON. Você deve compilar todas essas fontes de informação num relatório humano, riquíssimo em detalhes e maravilhosamente formatado.
Dê atenção especial a qualquer "Anexo" ou link mencionado no histórico ou contexto inicial, utilizando essas informações para enriquecer o documento.

ESTRUTURA OBRIGATÓRIA (use headings H1, H2, H3, bullet points e bold):
# Dossiê Estratégico: ${fullState.company_name || 'Projeto'}

## 1. Visão Geral do Negócio
(Descreva a missão, o resumo da empresa e o que ela faz)

## 2. Diferenciais e Posicionamento
(O que torna a marca única e como ela se posiciona no mercado)

## 3. O Público-Alvo
(Detalhe o cliente ideal e as demografias)

## 4. Personalidade, Tom e Voz
(Como a marca fala e se comporta profissionalmente)

## 5. Requisitos Técnicos & Insights Adicionais
(Qualquer restrição, direcionamento de design, anexos ou detalhe técnico extraído)

IMPORTANTE: Seja detalhista (500 a 1500 palavras). Transforme as informações brutas (JSON + Histórico) numa obra-prima de estratégia. NUNCA envolva sua resposta em blocos de código markdown ou texto extra. Apenas retorne o próprio Markdown puro.`;

              const docRes = await fetch(llmConfig.baseUrl, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${llmConfig.apiKey}`,
                  ...llmConfig.headers,
                },
                body: JSON.stringify({
                  model: llmConfig.model,
                  temperature: 0.3,
                  max_tokens: 3000, // large context for full document
                  messages: [
                    { role: "system", content: docSystemPrompt },
                    { role: "user", content: `DADOS EXTRAÍDOS (JSON):\n${JSON.stringify(fullState, null, 2)}\n\nCONTEXTO INICIAL (Preparação):\n${body.initialContext || 'Nenhum contexto inicial fornecido.'}\n\nHISTÓRICO COMPLETO DA SESSÃO (Transcrição e Anexos):\n${JSON.stringify(history, null, 2)}` }
                  ],
                }),
              });

              if (docRes.ok) {
                const docData = await docRes.json();
                const mdContent = docData.choices?.[0]?.message?.content;
                if (mdContent) {
                  parsed.assets.document = mdContent.trim();
                  console.log("[AI] Final document generated successfully.");
                }
              } else {
                console.error("[Briefing] Error from LLM during document generation", await docRes.text());
              }
            } catch (err) {
              console.error("[Briefing] Error executing final document generation:", err);
            }
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
            parsed.nextQuestion = buildSmartFallback(currentState, basalFields, chosenLanguage);
          }

          // Inject checkpoint metadata for frontend milestone screens
          if (isCheckpoint && !parsed.isFinished) {
            parsed.checkpoint = {
              reached: true,
              block: completedBlock,
              questionCount,
            };
          }

          // Inject backend-calculated fields for frontend compatibility
          parsed.basalCoverage = currentBasalCoverage;
          parsed.basalFieldsCollected = collected;
          parsed.basalFieldsMissing = missing;
          parsed.engagement_level = backendEngagement;

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
      updates: {},
      basalCoverage: currentBasalCoverage,
      basalFieldsCollected: collected,
      basalFieldsMissing: missing,
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

  const step = history?.length || 0;

  if (step <= 1) {
    updates.company_name = answer || "Tech Startup";
    nextQuestion = {
      text: "Vamos começar com uma conversa aberta. Me conte sobre o seu negócio — o que vocês fazem, como começou, qual o momento atual.",
      questionType: "text",
    };
  } else if (step === 2) {
    updates.services_offered = answer;
    nextQuestion = {
      text: "O que te trouxe até aqui? Qual desafio ou oportunidade motivou você a buscar esse projeto?",
      questionType: "text",
    };
  } else if (step === 3) {
    updates.target_audience_demographics = answer;
    nextQuestion = {
      text: "Como você imagina o resultado ideal? Se tudo der certo, como será daqui a alguns meses?",
      questionType: "text",
    };
  } else if (step === 4) {
    updates.competitors = answer;
    nextQuestion = {
      text: "Pelo que você descreveu, seu público principal parece ser empresas. Isso está correto?",
      questionType: "boolean_toggle",
    };
  } else if (step === 5) {
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
    updates.brand_personality = answer;
    nextQuestion = {
      text: "Como sua marca se comunica com seus clientes?",
      questionType: "multiple_choice",
      options: ["Formal e Técnica", "Informal e Próxima", "Inspiracional", "Direta e Objetiva", "Educativa", "Outro"],
    };
  } else {
    updates.tone_of_voice = answer;
    isFinished = true;
    assets = {
      score: { clareza_marca: 8, clareza_dono: 7, publico: 9, maturidade: 6 },
      insights: [
        "Público B2B bem direcionado, mas falta criar um MVP sólido.",
        "A empresa foca muito em vendas, branding ficou em segundo plano."
      ],
      document: "# Dossiê Estratégico Mock\n\n## 1. Visão Geral do Negócio\nEste é um documento de teste preenchido pelo mockEngine porque a API Key não foi fornecida."
    };
  }

  const collectedMock = Object.keys({ ...state, ...updates }).filter(k => UNIVERSAL_BASAL_FIELDS.includes(k) && (state[k] || updates[k]));
  const missingMock = UNIVERSAL_BASAL_FIELDS.filter(f => !collectedMock.includes(f));

  return { 
    updates, 
    nextQuestion, 
    isFinished, 
    assets,
    basalCoverage: collectedMock.length / UNIVERSAL_BASAL_FIELDS.length,
    basalFieldsCollected: collectedMock,
    basalFieldsMissing: missingMock,
    engagement_level: 'high',
    session_quality_score: isFinished ? 75 : null,
  };
}

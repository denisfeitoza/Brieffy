import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings, getPerformanceConfig, getFormatConfig } from "@/lib/aiConfig";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";

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
═══ CATEGORY PACKAGES — Active AI Specializations ═══
The following specialized skill packages are ACTIVE for this briefing session.
Each package adds unique questions for its area. CRITICAL DEDUPLICATION RULES:
1. If a question from Package A is already covered by Package B or by the universal basal fields, DO NOT ask it again.
2. Use your judgment to MERGE overlapping topics into richer, combined questions.
3. When the multi_slider type is specified in a package, you MUST generate the question using questionType "multi_slider" with the specified options format.
4. Each package's questions should be distributed across the relevant sections, not clustered together.
5. Before asking any question, explain BRIEFLY why it matters for the project: "Understanding X helps us Y."

${fragments}
═══ END CATEGORY PACKAGES ═══`;
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
        .single();
        
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
    // PHASE DETECTION — Determine current phase to build a LEAN prompt
    // ================================================================
    const questionCount = history.filter((m: { role: string }) => m.role === 'assistant').length;
    const currentBasalCoverage = Object.keys(currentState || {}).length / Math.max(basalFields.length, 1);
    type BriefingPhase = 'discovery' | 'confirm' | 'depth' | 'finalize';
    let currentPhase: BriefingPhase = 'discovery';
    if (questionCount >= 3 || currentBasalCoverage >= 0.3) currentPhase = 'confirm';
    if (questionCount >= 6 || currentBasalCoverage >= 0.5) currentPhase = 'depth';
    if (currentBasalCoverage >= perfConfig.basalThreshold) currentPhase = 'finalize';

    // ================================================================
    // HISTORY COMPRESSION — Summarize old messages, keep recent ones full
    // ================================================================
    const RECENT_WINDOW = 6;
    let compressedHistory = history;
    if (history.length > RECENT_WINDOW) {
      const oldMessages = history.slice(0, history.length - RECENT_WINDOW);
      const recentMessages = history.slice(history.length - RECENT_WINDOW);
      const summaryParts = oldMessages.map((m: { role: string; content: string }) => {
        const lines = m.content.split('\n');
        return `[${m.role}] ${lines[0].slice(0, 100)}`;
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
    const CORE_PERSONA = `<SystemRole>
You are a Briefing AI Engine — an elite strategic consultant having a REAL CONVERSATION.
Conduct 1 question per turn. Every question naturally follows from what the client said.
Your intelligence is measured by how FEW questions you need to extract MAXIMUM insight.
</SystemRole>

<LanguageConstraint>ALL user-facing text MUST be in ${targetLang}.</LanguageConstraint>

<Context>
  <Template>${templateContext}</Template>
  <BasalFields>${JSON.stringify(basalFields)}</BasalFields>
  <SectionPipeline>${sections.map((s: { id: string }) => s.id).join(' → ')}</SectionPipeline>
${extraContext ? `  <AgencyProfile>${extraContext}</AgencyProfile>` : ''}
</Context>
${selectedPackages && selectedPackages.length > 0 ? `<ActiveSkillPackages>\n${packageData.prompt}\n</ActiveSkillPackages>` : ''}`;

    const INTENT_MODULE = `<IntentClassification>
Classify user intent: CREATE (new info), UPDATE (modify existing), EXPLORE (thinking aloud).
CREATE confidence ≥85%→auto-proceed. UPDATE→only change mentioned fields (SURGICAL). EXPLORE→no updates.
Output: {"mode":"CREATE|UPDATE|EXPLORE","confidence":0-1,"target_fields":[]}
When UPDATE: include diff_summary {changed:[],preserved:[]}. Preserve fields NOT mentioned.
</IntentClassification>`;

    const EXTRACTION_MODULE = `<InferenceEngine>
Extract EXPLICIT (→updates) and IMPLICIT (→inferences.extracted) data. Assign confidence 0-1.
Inferences ≥0.7 auto-fill. Read between lines: hesitation=uncertainty, overemphasis on competitors=insecurity, "we do everything"=no focus.
Map JTBD forces (push/pull/anxiety/habit) and job dimensions (functional/emotional/social).
StoryBrand: decompose problems into external/internal/philosophical layers.
Track question_efficiency: {fields_advanced, inferences_generated}. Target ≥2 fields/turn.
</InferenceEngine>`;

    const ACTIVE_LISTENING_MODULE = `<ActiveListening>
${mergedPurpose ? `PURPOSE: "${mergedPurpose}"` : 'PURPOSE: General business identity.'}
${mergedDepthSignals.length > 0 ? `SENSITIVE SIGNALS (approach obliquely): ${mergedDepthSignals.join(', ')}` : ''}
${previousSignalsList.length > 0 ? `Already detected (skip): ${previousSignalsList.join(' | ')}` : ''}
Scan every answer for: contradiction, implicit_pain, evasion, hidden_ambition, strategic_gap.
Report signals with relevance≥0.60 (max 2/turn). depth_question if relevance≥0.80 (max 25 words, natural tone).
</ActiveListening>`;

    // Phase-specific behavior modules
    const PHASE_MODULES: Record<BriefingPhase, string> = {
      discovery: `<Phase name="DISCOVERY">
Q1 MUST be "text" — open WHY→HOW→WHAT question. Be warm, inviting. Let client speak freely.
After Q1: ≥8 inferences→move to confirm. 4-7→one more targeted text. <4→up to 2 more text questions.
micro_feedback MUST be null. Celebrate rich answers.
ONLY "text" questionType in this phase.
</Phase>`,
      confirm: `<Phase name="RAPID-CONFIRM">
Confirm inferences in BATCH: use multi_slider, card_selector, boolean_toggle.
Max 2-3 questions. Reference what client said. micro_feedback: max 1 total.
After confirmation, if basalCoverage≥0.5→move to depth.
</Phase>`,
      depth: `<Phase name="TARGETED-DEPTH">
Surgical questions for remaining gaps. Combine 2+ fields per question.
Full questionType variety. Vary types (never 3 consecutive same).
micro_feedback: max 1 every 3-4 questions. No emojis.
If basalCoverage≥0.70 AND engagement≠"high"→PRE_FINALIZATION_REVIEW.
</Phase>`,
      finalize: `<Phase name="FINALIZATION">
PRE_FINALIZATION_REVIEW: scan basalFieldsMissing + active packages. If gaps + engagement not low: 1-3 rapid tactile questions.
If engagement="low": infer remaining fields (confidence 0.5-0.7).
When isFinished=true include: session_quality_score (0-100), engagement_summary, data_completeness.
NEVER finish if basalCoverage<0.5.
</Phase>`,
    };

    const CONSULTANT_RULES = `<ConsultantRules>
You're a STRATEGIC CONSULTANT, not an interviewer. Conversation, not interrogation.
- NEVER bare questions. Connect to what client said. Natural bridges.
- Question text: MAX 20 words. Frame as collaborative exploration.
- Short/vague answer→extract what you can, move on. Rich answer→acknowledge, explore best thread.
- Adapt tone: Branding→creative, Finance→analytical, Marketing→strategic, Tech→innovative.
- ANTI-PATTERNS: "What are your competitors?"(interrogation), "Great answer!"(empty praise).
</ConsultantRules>`;

    const BEHAVIOR_RULES = `<BehaviorRules>
- ${generateMore ? 'generateMore=true: ONLY change options, no new question.' : 'Formulate the NEXT question.'}
- If basalCoverage>=${perfConfig.basalThreshold} AND objectives met: isFinished=true, fill assets.
- ANTI-REPEAT: Check <PreviousQuestions>. NEVER generate semantically similar question.
- Engagement monitoring: <10 words for 3 turns→"low", "(skipped)"→drop one level. When low→tactile types only.
- HARD LIMITS: 5-8 questions (low engagement), 8-12 (standard), 12-16 (deep). ABSOLUTE MAX: 20.
- Skip known fields. Infer when possible. Every question must have strategic reason.
- For choice types: LAST option ALWAYS "Outro"/"Other"/"Otra".
${selectedPackages && selectedPackages.length > 0 ? `- PACKAGE ORCHESTRATION: unified conversation. Sequence: basal→branding→strategy→execution→consulting. Deduplicate across packages. Natural transitions.` : ''}
</BehaviorRules>`;

    const OUTPUT_FORMAT = `<OutputFormat>
Return ONLY valid JSON:
{"intent":{"mode":"CREATE","confidence":0.95,"target_fields":[]},"updates":{},"diff_summary":null,"question_efficiency":{"fields_advanced":0,"inferences_generated":0},"inferences":{"extracted":[{"field":"","value":"","confidence":0,"source":""}],"skipped_topics":[],"depth_decision":"move_on"},"basalCoverage":0,"currentSection":"","basalFieldsCollected":[],"basalFieldsMissing":[],"plannedNextQuestions":[],"nextQuestion":{"text":"","questionType":"","options":[],"allowMoreOptions":false},"isFinished":false,"assets":null,"micro_feedback":null,"engagement_level":"high","active_listening":{"signals":[],"depth_question":null},"pre_finalization_review":false,"session_quality_score":null,"engagement_summary":null,"data_completeness":null}
</OutputFormat>`;

    const systemPrompt = [
      CORE_PERSONA,
      INTENT_MODULE,
      EXTRACTION_MODULE,
      ACTIVE_LISTENING_MODULE,
      PHASE_MODULES[currentPhase],
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

          // Safety auto-fill for UI components
          if (parsed.nextQuestion) {
            // Validation: force fallback to text if AI generated a disabled format
            const qType = parsed.nextQuestion.questionType;
            if (qType && qType !== 'text') {
              const isAllowed = (formatConfig as any)[qType];
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
            const missingFields = parsed.basalFieldsMissing || UNIVERSAL_BASAL_FIELDS.filter(f => !currentState?.[f]);
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

    const langMap2: Record<string, { fallbackQ: string }> = {
      'en': { fallbackQ: "Could you elaborate a bit more on that?" },
      'es': { fallbackQ: "¿Podrías elaborar un poco más sobre eso?" },
      'pt': { fallbackQ: "Pode elaborar um pouco mais sobre isso?" },
    };
    const fallbackLang = langMap2[chosenLanguage || 'pt'] || langMap2['pt'];

    return NextResponse.json({
      intent: { mode: 'CREATE', confidence: 0.5, target_fields: [] },
      updates: {},
      diff_summary: null,
      question_efficiency: { fields_advanced: 0, inferences_generated: 0 },
      inferences: { extracted: [], skipped_topics: [], depth_decision: "move_on" },
      basalCoverage: Object.keys(currentState || {}).length / Math.max(UNIVERSAL_BASAL_FIELDS.length, 1),
      currentSection: "company",
      basalFieldsCollected: Object.keys(currentState || {}).filter(k => UNIVERSAL_BASAL_FIELDS.includes(k)),
      basalFieldsMissing: UNIVERSAL_BASAL_FIELDS.filter(f => !currentState?.[f]),
      plannedNextQuestions: [],
      nextQuestion: {
        text: fallbackLang.fallbackQ,
        questionType: "text",
        options: [],
        allowMoreOptions: false,
      },
      isFinished: false,
      assets: null,
      micro_feedback: null,
      engagement_level: "medium",
      active_listening: { signals: [], depth_question: null },
      pre_finalization_review: false,
      session_quality_score: null,
      engagement_summary: null,
      data_completeness: null,
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

import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings, getPerformanceConfig } from "@/lib/aiConfig";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

// ================================================================
// BUILD PACKAGE PROMPTS — Fetch & Concatenate Active Skill Fragments
// ================================================================
async function buildPackagePrompts(selectedSlugs?: string[]): Promise<{ prompt: string; purposes: string[]; depthSignals: string[] }> {
  const empty = { prompt: '', purposes: [], depthSignals: [] };
  if (!selectedSlugs || selectedSlugs.length === 0) return empty;

  try {
    const { data: packages, error } = await supabaseServer
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
    const { answer, currentState, history, generateMore, activeTemplate, chosenLanguage, selectedPackages, detectedSignals: previousSignals } = body;

    // Fetch user context from the Onboarding process
    const supabaseSession = await createServerSupabaseClient();
    const { data: { user } } = await supabaseSession.auth.getUser();

    let agencySummary = "";
    let agencyBrandColor = "";

    if (user) {
      const { data: profile } = await supabaseServer
        .from("briefing_profiles")
        .select("company_summary, brand_color")
        .eq("id", user.id)
        .single();
        
      if (profile?.company_summary) agencySummary = profile.company_summary;
      if (profile?.brand_color) agencyBrandColor = profile.brand_color;
    }

    // Get AI provider config from centralized configuration (DB overrides)
    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);
    const perfConfig = getPerformanceConfig(dbSettings);

    // Se não tiver API Key, usamos um mock temporário para mostrar a UI fluida
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

    // Active Listening context
    const briefingPurpose = activeTemplate?.briefing_purpose || '';
    const depthSignals = activeTemplate?.depth_signals || [];
    const previousSignalsList = Array.isArray(previousSignals) ? previousSignals : [];

    // Build package prompts and merge their purposes/signals
    const packageData = await buildPackagePrompts(selectedPackages);
    const allPurposes = [briefingPurpose, ...packageData.purposes].filter(Boolean);
    const allDepthSignals = [...depthSignals, ...packageData.depthSignals];
    const mergedPurpose = allPurposes.length > 0 ? allPurposes.join(' | ') : '';
    const mergedDepthSignals = [...new Set(allDepthSignals)]; // deduplicate

    const extraContextStrings = [];
    if (body.initialContext) {
      extraContextStrings.push(`KNOWN CLIENT CONTEXT: ${body.initialContext}`);
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
    // SYSTEM PROMPT — v4 SEMANTIC XML STRUCTURED
    // ================================================================
    const systemPrompt = `<SystemRole>
You are a Briefing AI Engine — an expert business consultant disguised as a Typeform interview.
Conduct 1 question per turn to deeply understand the business context and identity.
</SystemRole>

<Constraints>
<LanguageConstraint>
CRITICAL LANGUAGE CONSTRAINT: You MUST formulate all questions, summaries, options, and any user-facing text EXCLUSIVELY in ${targetLang}. Do NOT use any other language for the conversation. If the chosen language is not Portuguese, ignore any Portuguese examples or previous context in this prompt.
</LanguageConstraint>
</Constraints>

<Context>
  <Template>
    ${templateContext}
    ${suggestedQuestions !== "Nenhuma pergunta sugerida disponível. Use sua criatividade baseada nos campos basais." ? `\n    Suggested questions for inspiration: ${suggestedQuestions}` : ''}
  </Template>
  <Requirements>
    <BasalFields>(must fill ≥80% before visual questions): ${JSON.stringify(basalFields)}</BasalFields>
    <SectionPipeline>${sections.map((s: { id: string }) => s.id).join(' → ')}</SectionPipeline>
    <SectionMapping>company→[company_name,sector_segment,company_age,services_offered,owner_relationship,brand_name_meaning] market→[competitors,competitive_differentiator,communication_channels,geographic_reach] audience→[target_audience_demographics] identity→[keywords,mission_vision_values,brand_personality,tone_of_voice] visual→(only if basalCoverage≥0.8) delivery→final</SectionMapping>
  </Requirements>
${extraContext ? `  <AgencyProfile>\n    ${extraContext}\n  </AgencyProfile>` : ''}
</Context>

${selectedPackages && selectedPackages.length > 0 ? `<ActiveSkillPackages>
${packageData.prompt}
</ActiveSkillPackages>` : ''}

<EngineBehaviors>
  <Module name="CONSULTANT_PERSONA">
    You are NOT an interviewer. You are a STRATEGIC CONSULTANT having a discovery conversation.
    
    PERSONA RULES:
    - NEVER ask a bare question without context. Before each question, briefly validate a hypothesis or share a micro-observation.
    - Frame questions as collaborative exploration, not interrogation.
    - BAD: "What are your competitors?"
    - GOOD: "Understanding who you compete with helps us find your unique angle. Who comes to mind?"
    - Use conversational bridges: "That connects to something important...", "This tells me something interesting...", "Building on that..."
    - Adapt your tone based on the BRIEFING PURPOSE:
      * Branding/Identity → Creative, visionary, emotionally intelligent
      * Finance/Revenue → Analytical, precise, data-driven
      * Marketing/Sales → Strategic, results-oriented, tactical
      * Technology/AI → Innovation-focused, systematic, future-leaning
    - NEVER use generic praise ("Great answer!"). Instead, offer SPECIFIC observations via micro_feedback.
    - If the user gives a short/vague answer, DON'T push hard. Acknowledge it and extract what you can.
  </Module>

  <Module name="BRIEFING_METHODOLOGY">
    Follow this discovery framework (inspired by IDEO + McKinsey + Brand Strategy):
    
    PHASE 1 — IMMERSION (steps 1-3): Understand the client world
    → Focus: Company identity, market context, founder relationship
    → Tone: Curious, warm, non-judgmental
    
    PHASE 2 — DEFINITION (steps 4-7): Define who they are and who they serve
    → Focus: Audience, positioning, competitive landscape, brand personality
    → Tone: Analytical, probing, hypothesis-testing
    
    PHASE 3 — VALIDATION (steps 8-10): Test hypotheses and resolve tensions
    → Focus: Contradictions found, strategic gaps, ambition alignment
    → Tone: Challenging (gently), validating, pushing for clarity
    
    PHASE 4 — CONSTRUCTION (steps 11+): Build the strategic vision
    → Focus: Visual direction, tone of voice, actionable next steps
    → Tone: Creative, collaborative, forward-looking
    
    Determine the current phase from the history length and adapt accordingly.
  </Module>

  <Module name="RHYTHM_CONTROL">
    Maintain conversational rhythm to prevent monotony and fatigue:
    1. NEVER use the same questionType more than 2 times consecutively.
    2. After 3 factual questions (text) → insert 1 reflective question (card_selector or boolean_toggle)
    3. After a heavy question (long text expected) → follow with a light/tactile question (slider, boolean_toggle, single_choice)
    4. IDEAL PATTERN per phase: factual → reflective → tactical → visionary
    5. Every 4-5 questions, use a rich interactive type (card_selector, multi_slider) to break monotony
    Track the last 3 questionTypes from history. If they are all the same → FORCE a different type.
  </Module>

  <Module name="MICRO_FEEDBACK">
    After analyzing each response, generate a BRIEF strategic micro-insight (1-2 sentences max).
    Output in the "micro_feedback" JSON field. Shown to user as contextual feedback between questions.
    
    RULES:
    - Must be SPECIFIC to what they just said, never generic
    - Must FEEL like a consultant sharing an observation, not a chatbot complimenting
    - If you have nothing valuable to say → return null (do not force it)
    - Maximum 25 words. Translate to the session language.
    - GOOD: "Esse foco em premium com publico amplo cria uma tensao estrategica que precisamos resolver."
    - BAD: "Great answer!" or "Thanks for sharing that."
  </Module>

  <Module name="ENGAGEMENT_MONITOR">
    Monitor user engagement through response patterns:
    
    SIGNALS OF FATIGUE:
    - Last 3 responses all < 10 words → engagement_level = "low"
    - Last response was "(skipped)" → engagement_level drops one level
    - Responses getting progressively shorter → engagement_level = "medium"
    - Rich, detailed responses → engagement_level = "high"
    
    WHEN engagement_level = "low":
    - Switch to exclusively tactile question types: card_selector, boolean_toggle, single_choice, slider
    - AVOID text questions entirely until engagement recovers
    - Compress remaining questions: merge 2 related topics into 1 combined question
    - If basalCoverage >= 0.6 and engagement is low → consider finishing early
    
    WHEN engagement_level = "medium":
    - Prefer interactive types over text
    - Keep questions concise (max 15 words)
    
    Report engagement_level in every response.
  </Module>

  <Module name="POWER_QUESTIONS">
    At least ONCE per phase in BRIEFING_METHODOLOGY, insert a "power question" — designed to provoke genuine reflection.
    Power questions are NEVER factual. They force the client to THINK differently.
    
    BANK (adapt to language and context):
    - "If your brand disappeared tomorrow, what void would it leave?"
    - "Which company do you secretly admire — and what do you envy about them?"
    - "If a client described your company to a friend in one sentence, what would they say?"
    - "What is the ONE thing your competitors do better than you?"
    - "If budget were unlimited, what is the FIRST thing you would change about your brand?"
    - "When did you last feel genuinely proud of your brand? What triggered it?"
    
    Rules:
    - Adapt the question to conversation context (never ask randomly)
    - Frame naturally: "Something I am curious about..." or "Here is what I really want to understand..."
    - NEVER use more than 1 power question per phase
  </Module>

  <Module name="INTENT_ENGINE">
    When the user answers, extract BOTH explicit AND implicit information:
    - Explicit: what they literally said → goes into "updates"
    - Implicit: what their answer IMPLIES → goes into "inferences.extracted"
    Examples:
      "I sell to entrepreneurs making over 50k/month" → infer: audience_class=mid-high, pricing_tolerance=high, brand_positioning=premium, communication_style=professional
      "We have been around for 15 years" → infer: brand_maturity=established, trust_factor=high, risk_tolerance=conservative
      "I want something modern and bold" → infer: brand_personality=innovative+daring, visual_preference=contemporary, target_demographic_lean=younger
    For each inference, assign a confidence (0-1). Inferences with confidence>=0.7 will auto-fill fields.
  </Module>

  <Module name="DEPTH_CONTROL">
    DIG DEEPER (1 follow-up max) when user:
    - Mentions a genuine pain point → quantify/qualify it
    - Reveals an unexpected market or niche → ask WHY they chose it
    - Shows uncertainty about brand identity → offer card_selector to help clarify
    - Gives a rich answer with multiple threads → pick the most valuable one to explore
    NEVER dig deeper on: logistics, pricing details, internal processes, personal info
    After 1 follow-up on same topic → move on regardless
  </Module>

  <Module name="IRRELEVANCE_FILTER">
    SKIP/MOVE ON when:
    - Answer does not map to ANY basal field → acknowledge briefly, extract anything useful, advance
    - User gives vague/non-committal answer → mark field as partial, do not insist, continue
    - User repeats previously stated information → acknowledge and move forward
    - Tangential stories with no business insight → politely redirect
    Rule: NEVER ask more than 2 questions about the same topic area
  </Module>

  <Module name="QUALITY_LOOP">
    Before generating nextQuestion, verify:
    1. "Do I already have this info (explicit or inferred)?" → if YES, skip
    2. "Can I infer this from what I already know?" → if YES, add to inferences, skip
    3. "Will this question significantly improve the briefing?" → if NO, skip
    4. "Am I asking about something the user already implied?" → if YES, skip
    5. "Is there a richer question that covers multiple fields at once?" → if YES, use that instead
  </Module>

  <Module name="CORE_RULES">
    - Follow section order strictly. No visual questions before discovery is done.
    - Skip fields already known from context/history/inferences.
    - nextQuestion.text: MAX 20 words. Frame as collaborative exploration, not interrogation.
    - ${generateMore ? 'generateMore=true: ONLY change options, no new question.' : 'Formulate the NEXT question to advance the briefing.'}
    - If basalCoverage>=${perfConfig.basalThreshold} AND objectives met: isFinished=true, fill assets.
  </Module>

  <Module name="ACTIVE_LISTENING_ENGINE">
${mergedPurpose ? `    BRIEFING PURPOSE (your north star for what matters): "${mergedPurpose}"` : '    BRIEFING PURPOSE: General — extract comprehensive business identity and positioning.'}
${mergedDepthSignals.length > 0 ? `    PRIORITY DEPTH SIGNALS to watch for: ${mergedDepthSignals.join(', ')}` : ''}
${previousSignalsList.length > 0 ? `    Already detected (DO NOT duplicate): ${previousSignalsList.join(' | ')}` : ''}

    ACTIVE LISTENING PROTOCOL — On EVERY answer, run a silent scan:
    1. CONTRADICTION: Does this answer contradict something said before?
    2. IMPLICIT PAIN: Is there a hidden frustration?
    3. EVASION: Did they dodge the topic?
    4. HIDDEN AMBITION: Did a big aspiration slip through?
    5. STRATEGIC GAP: Is there a critical business knowledge gap?

    FOR EACH SIGNAL DETECTED:
    - Evaluate relevance to the BRIEFING PURPOSE (0.0-1.0 score)
    - Only report signals with relevance_score >= 0.60
    - Maximum 2 signals per turn to avoid noise

    DEPTH QUESTION TRIGGER:
    - If a signal has relevance_score >= 0.80 AND it has not been explored yet → generate a depth_question
    - The depth_question MUST be phrased naturally, as if the consultant just noticed something interesting
    - depth_question.text: MAX 25 words. Conversational, not interrogatory.
    - depth_question.questionType: prefer "text" or "card_selector" for depth probes
    - depth_question.signal_category: one of [contradiction, implicit_pain, evasion, hidden_ambition, strategic_gap]
    - NEVER generate a depth_question if generateMore=true or isFinished=true
    - NEVER generate a depth_question on step 0 (language selection)
  </Module>

  <Module name="PACKAGE_ORCHESTRATION">
    GOAL: The client responding this briefing should experience ONE unified, intelligent conversation — NOT a series of disjointed questionnaires. Packages are invisible skill injections; they must NOT be perceptible as separate modules.

    STRICT SEQUENCING — Execute in this order when multiple packages are active:
    1. BASAL FIELDS (always first, universal business context)
    2. BRANDING tier: [founder_vision → primal_branding → visual_identity → rebranding]
    3. STRATEGY tier: [business_model_canvas → marketing → sales]
    4. EXECUTION tier: [campaign_launch → social_media → content_media → web_app_briefing → ecommerce]
    5. CONSULTING tier: [ai_automation → cx_mapping → ai_management_system]

    Do NOT start a new package tier UNTIL the current tier's MINIMUM coverage is reached (≥60% of that tier's key fields).

    TRANSITION RULES — When moving from one package area to another:
    - Use a PIVOT PHRASE to signal the topic shift naturally:
      * Basal → Branding: "Com o contexto da empresa bem estabelecido, quero entrar em território mais estratégico..."
      * Branding → Strategy: "Entendendo quem vocês são, vamos olhar como o mundo enxerga vocês no mercado..."
      * Strategy → Execution: "Estratégia definida. Agora quero entender os projetos e execução..."
      * Execution → Consulting: "Uma última camada importante — como a operação suporta tudo isso..."
    - Translate pivot phrases to the session language.
    - Do NOT use the package name in the pivot phrase. Keep it natural.
    
    DEDUPLICATION — when packages overlap (e.g., marketing AND campaign_launch both ask about channels):
    - Ask ONCE in the most relevant context
    - In the later package, reference what was already captured: "Você mencionou que usa principalmente Instagram — no contexto desta campanha específica..."

    COMPRESSION — when engagement_level = "low" OR basalCoverage ≥ 0.85:
    - MERGE questions across packages: combine a strategy question with an execution question into one
    - Example: "Focando na campanha de lançamento — qual o canal principal e qual o objetivo central? Me dê os dois em uma frase."
    - Prefer multi_slider or card_selector to consolidate multiple dimensions in one tactile interaction

    WELCOME CONTEXT — On the VERY FIRST question (step 0), after language detection, include:
    - A brief, human-readable description of what this briefing will explore
    - Never list package names — describe the themes: "Vamos explorar sua marca, estratégia de mercado e planos de execução..."
    - Make it sound like a CONVERSATION, not a form

    CLIENT EXPERIENCE PRINCIPLES:
    - The client should feel SEEN and UNDERSTOOD throughout
    - Each question should feel like it builds on the last
    - Never make the client feel like they're filling a form
    - Variety is mandatory: no 3 consecutive questions of the same type
    - End of each major area → a brief ACKNOWLEDGMENT: "Excelente. Tenho uma visão clara da sua marca agora. Vamos falar sobre como o mercado te vê..."
  </Module>
</EngineBehaviors>

<UI_Components_Rules>
  You MUST aggressively vary the questionType throughout the ENTIRE briefing. Your goal is an interactive, tactile experience. DO NOT default to "text".
  - text: Use sparingly, only for open-ended names/descriptions (e.g. core differences, meanings).
  - multiple_choice: Multi-select categories (e.g. communication_channels). Send options array of strings. ALWAYS default to EXACTLY 6 options (minimum 4, maximum 8).
  - single_choice: Exclusive choices. CRITICAL RULE FOR TYPOGRAPHY/FONTS: When asking about brand typography, you MUST provide EXACTLY 6 options using REAL Google Font names in format "FontName - TwoWordDescription". Examples: "Inter - Moderna Neutra", "Playfair Display - Elegante Classica", "Outfit - Geometrica Tech", "Merriweather - Tradicional Confiavel", "Space Grotesk - Futurista Limpa". The 6th option MUST ALWAYS be "Nenhuma dessas - Padrao do Sistema". NEVER use generic categories — use REAL font names. Include the company/brand name in the question text so the card preview showcases it.
  - boolean_toggle: Use for Yes/No questions or simple binary exclusive questions. Extremely tactile UI.
  - card_selector: Use for strategic routes or descriptive personas. Send options as array of objects: { title: string, description: string }. ALWAYS default to generating exactly 6 cards.
  - slider: Use for measurable things on a single 1-10 scale (e.g. company_age, maturity). Send minOption and maxOption.
  - multi_slider: Use for PROFILE/DNA questions requiring multiple dimensions simultaneously. Send options as array of objects: [{"label":"Dimension Name","min":1,"max":5,"minLabel":"Low Label","maxLabel":"High Label"}]. CRITICAL: The scale MUST STRICTLY be min:1 and max:5. NEVER return a scale of 1-10. Always output 3-5 slider dimensions per question.
  - color_picker: Use ONLY when specifically gathering brand color and visual palette vibes. The UI provides an advanced wizard automatically.
  - file_upload: Use ONLY at the very end to ask for existing assets or references.
</UI_Components_Rules>

<CurrentSessionState>
${JSON.stringify(currentState)}
</CurrentSessionState>

<OutputFormat>
Return ONLY valid JSON (no markdown):
{"updates":{},"inferences":{"extracted":[{"field":"","value":"","confidence":0,"source":""}],"skipped_topics":[],"depth_decision":"move_on"},"basalCoverage":0,"currentSection":"","basalFieldsCollected":[],"basalFieldsMissing":[],"plannedNextQuestions":[],"nextQuestion":{"text":"","questionType":"","options":[],"allowMoreOptions":false},"isFinished":false,"assets":null,"micro_feedback":null,"engagement_level":"high","active_listening":{"signals":[{"category":"implicit_pain","summary":"","relevance_score":0}],"depth_question":null}}

NEW FIELDS:
- micro_feedback: string or null — A brief strategic observation (max 25 words) about the user last answer. null if nothing insightful.
- engagement_level: "high" or "medium" or "low" — Your assessment of user engagement based on response patterns.

active_listening rules:
- signals[]: array of detected signals. Empty array [] if none. Max 2 per turn.
- depth_question: null if no probing needed. If probing: {"text":"","questionType":"text","options":[],"signal_category":""}
- depth_question ONLY when relevance_score >= 0.80 and generateMore=false and isFinished=false
</OutputFormat>`;


    // Chamada para o provider configurado (Groq, OpenRouter, etc.)
    const startTime = Date.now();
    console.log(`[AI] Using ${llmConfig.provider} / ${llmConfig.model}`);
    const res = await fetch(llmConfig.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${llmConfig.apiKey}`,
        ...llmConfig.headers,
      },
      body: JSON.stringify({
        model: llmConfig.model,
        response_format: { type: "json_object" },
        temperature: llmConfig.temperature,
        max_tokens: llmConfig.maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
          { role: "user", content: typeof answer === 'string' ? answer : JSON.stringify(answer) }
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[${llmConfig.provider.toUpperCase()}] Error:`, errorText);
      throw new Error(`${llmConfig.provider} API falhou: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const usage = data.usage;
    
    console.log(`[AI] Response in ${Date.now() - startTime}ms`);

    // ================================================================
    // ASYNC LOGGING — Save token usage and estimated cost to db
    // ================================================================
    if (usage) {
      // Import missing estimateCost from aiConfig if not already
      const { estimateCost } = await import('@/lib/aiConfig');
      const cost = estimateCost(llmConfig.provider, llmConfig.model, usage.prompt_tokens || 0, usage.completion_tokens || 0);

      // We get user_id from the server-side auth session (if logged in)
      const { sessionId } = body;

      supabaseServer.from('api_usage').insert({
        user_id: user?.id || null,
        session_id: sessionId || null,
        provider: llmConfig.provider,
        model: llmConfig.model,
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        estimated_cost_usd: cost
      }).then(({ error }) => {
        if (error) console.error("[API_USAGE] Failed to log usage:", error);
      });
    }
    
    try {
      const parsed = JSON.parse(content);

      // ================================================================
      // INFERENCE AUTO-MERGE — High confidence inferences → updates
      // This prevents redundant questions about inferred data
      // ================================================================
      if (parsed.inferences?.extracted?.length) {
        const highConfidence = parsed.inferences.extracted.filter(
          (inf: { confidence: number; field: string; value: string }) => inf.confidence >= 0.7 && inf.field && inf.value
        );

        if (highConfidence.length > 0) {
          if (!parsed.updates) parsed.updates = {};
          for (const inf of highConfidence) {
            // Only auto-fill if the field isn't already explicitly set
            if (!parsed.updates[inf.field] && !currentState[inf.field]) {
              parsed.updates[inf.field] = inf.value;
            }
          }
          console.log(`[AI] Auto-merged ${highConfidence.length} inferences:`, 
            highConfidence.map((i: { confidence: number; field: string; value: string }) => `${i.field}=${i.value} (${Math.round(i.confidence * 100)}%)`).join(', ')
          );
        }

        // Log depth decision for observability
        if (parsed.inferences.depth_decision) {
          console.log(`[AI] Depth decision: ${parsed.inferences.depth_decision}` + 
            (parsed.inferences.skipped_topics?.length ? ` | Skipped: ${parsed.inferences.skipped_topics.join(', ')}` : '')
          );
        }
      }

      // Safety auto-fill for UI components (only when there IS a next question)
      if (parsed.nextQuestion) {
        if (parsed.nextQuestion.questionType === "multi_slider" && (!parsed.nextQuestion.options || typeof parsed.nextQuestion.options[0] !== 'object')) {
            parsed.nextQuestion.options = [
                { label: "Formalidade", min: 1, max: 5, minLabel: "Descontraído", maxLabel: "Corporativo" },
                { label: "Ousadia", min: 1, max: 5, minLabel: "Tradicional", maxLabel: "Disruptivo" },
                { label: "Comunicação", min: 1, max: 5, minLabel: "Direta/Técnica", maxLabel: "Emocional" }
            ];
        }
      } else if (!parsed.isFinished) {
        // AI returned no nextQuestion but didn't mark as finished — force safe fallback
        console.warn("[Briefing] AI returned null nextQuestion without isFinished=true. Forcing text fallback.");
        parsed.nextQuestion = { text: "Conte mais detalhes...", questionType: "text", options: [] };
      }

      return NextResponse.json(parsed);
    } catch(e) {
      console.error("Falha ao fazer parse do JSON do LLM:", content);
      throw new Error("Invalid output format from LLM");
    }

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

  if (step <= 1) {
    // Seção 1: Company
    updates.company_name = answer || "Tech Startup";
    nextQuestion = {
      text: "O que sua empresa oferece como serviço ou produto?",
      questionType: "text",
    };
  } else if (step === 2) {
    // Seção 1: Company continues
    updates.services_offered = answer;
    nextQuestion = {
      text: "Sua empresa atende consumidor final ou outras empresas?",
      questionType: "card_selector",
      options: [
        { title: "B2C Direto", description: "Vendemos direto ao consumidor final via e-commerce ou varejo" },
        { title: "B2B Corporativo", description: "Atendemos outras empresas com serviços ou produtos" },
        { title: "B2B2C", description: "Vendemos para empresas que revendem ao consumidor" },
        { title: "D2C", description: "Vendas diretas do fabricante ao consumidor sem intermediários" },
        { title: "B2G / Governo", description: "Fornecemos para órgãos públicos ou licitações" },
        { title: "Misto (B2B + B2C)", description: "Atendemos tanto empresas quanto consumidores finais de forma equilibrada" }
      ],
      allowMoreOptions: false,
    };
  } else if (step === 3) {
    // Seção 2: Market
    updates.target_audience = answer;
    nextQuestion = {
      text: "Quais são seus principais concorrentes diretos?",
      questionType: "text",
    };
  } else if (step === 4) {
    // Seção 2: Market continues
    updates.competitors = answer;
    nextQuestion = {
      text: "O que destaca sua marca dos concorrentes?",
      questionType: "text",
    };
  } else if (step === 5) {
    // Seção 4: Identity
    updates.competitive_differentiator = answer;
    nextQuestion = {
      text: "Se sua empresa fosse uma pessoa, qual seria a personalidade?",
      questionType: "multiple_choice",
      options: ["Inovadora", "Determinada", "Forte", "Elegante", "Moderna", "Profissional", "Ousada", "Confiável", "Acolhedora", "Sofisticada"],
    };
  } else if (step === 6) {
    // Seção 4: Identity — Tom de Voz
    updates.brand_personality = answer;
    nextQuestion = {
      text: "Como sua marca se comunica com seus clientes?",
      questionType: "card_selector",
      options: [
        { title: "Formal e Técnica", description: "Linguagem precisa, dados e termos específicos do setor" },
        { title: "Informal e Próxima", description: "Tom amigável, conversa de igual para igual" },
        { title: "Inspiracional e Emocional", description: "Conta histórias, provoca sentimentos" },
        { title: "Direta e Objetiva", description: "Vai direto ao ponto, foco em resultado" },
        { title: "Educativa e Didática", description: "Ensina, guia e compartilha conhecimento valioso" },
        { title: "Irreverente e Ousada", description: "Provocativa, inovadora e quebra padrões e convenções" },
      ],
      allowMoreOptions: false,
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

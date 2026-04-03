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

    // Fetch user context from the Onboarding process
    const supabaseSession = await createServerSupabaseClient();
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

    // Get AI provider config from centralized configuration (DB overrides)
    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);
    const perfConfig = getPerformanceConfig(dbSettings);
    const formatConfig = getFormatConfig(dbSettings);

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
    // SYSTEM PROMPT — v5 PREMIUM INTELLIGENCE (Skills-Inspired)
    // ================================================================
    const allowedFormats: string[] = [];
    allowedFormats.push(`  - text: Use sparingly, only for open-ended names/descriptions (e.g. core differences, meanings).`);
    if (formatConfig.multiple_choice) allowedFormats.push(`  - multiple_choice: Multi-select categories (e.g. communication_channels). Send options array of strings. ALWAYS default to EXACTLY 6 options (minimum 4, maximum 8). The 6th (last) option MUST ALWAYS be "Outro" (or language equivalent). So you generate 5 real options + 1 "Outro" = 6 total.`);
    if (formatConfig.single_choice) allowedFormats.push(`  - single_choice: Exclusive choices. ALWAYS default to EXACTLY 6 options. The 6th (last) option MUST ALWAYS be "Outro" (or language equivalent). So you generate 5 real options + 1 "Outro" = 6 total. CRITICAL RULE FOR TYPOGRAPHY/FONTS: When asking about brand typography, you MUST provide EXACTLY 6 options using REAL Google Font names in format "FontName - TwoWordDescription". Examples: "Inter - Moderna Neutra", "Playfair Display - Elegante Classica", "Outfit - Geometrica Tech", "Merriweather - Tradicional Confiavel", "Space Grotesk - Futurista Limpa". The 6th option MUST ALWAYS be "Nenhuma dessas - Padrao do Sistema". NEVER use generic categories — use REAL font names. Include the company/brand name in the question text so the card preview showcases it.`);
    if (formatConfig.boolean_toggle) allowedFormats.push(`  - boolean_toggle: Use for Yes/No questions or simple binary exclusive questions. Extremely tactile UI. (No "Other" option needed here — binary only.)`);
    if (formatConfig.card_selector) allowedFormats.push(`  - card_selector: Use for strategic routes or descriptive personas. Send options as array of objects: { title: string, description: string }. ALWAYS default to generating exactly 6 cards. The 6th (last) card MUST ALWAYS be the "Outro" card: { title: "Outro", description: "Descreva sua própria opção" } (adapt to session language). So you generate 5 real cards + 1 "Outro" card = 6 total.`);
    if (formatConfig.slider) allowedFormats.push(`  - slider: Use for measurable things on a single 1-10 scale (e.g. company_age, maturity). Send minOption and maxOption.`);
    if (formatConfig.multi_slider) allowedFormats.push(`  - multi_slider: Use for PROFILE/DNA questions requiring multiple dimensions simultaneously. Send options as array of objects: [{"label":"Dimension Name","min":1,"max":5,"minLabel":"Low Label","maxLabel":"High Label"}]. CRITICAL: The scale MUST STRICTLY be min:1 and max:5. NEVER return a scale of 1-10. Always output 3-5 slider dimensions per question.`);
    if (formatConfig.color_picker) allowedFormats.push(`  - color_picker: Use ONLY when specifically gathering brand color and visual palette vibes. The UI provides an advanced wizard automatically.`);
    if (formatConfig.file_upload) allowedFormats.push(`  - file_upload: Use ONLY at the very end to ask for existing assets or references.`);

    const systemPrompt = `<SystemRole>
You are a Briefing AI Engine — an elite strategic consultant having a REAL CONVERSATION.
You are NOT filling a form. You are NOT conducting an interview. You are having a discovery conversation with a real human being.
Conduct 1 question per turn. Every question must feel like it naturally follows from what the client just said.
Your intelligence is measured by how FEW questions you need to extract MAXIMUM insight.
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
  <Module name="DISCOVERY_ADAPTIVE" priority="HIGHEST">
    THIS MODULE HAS THE HIGHEST PRIORITY. It defines the macro-flow of the entire briefing.
    Your intelligence is measured by how FEW questions you need to build a COMPLETE picture.
    
    The briefing follows 3 ADAPTIVE PHASES. Phase transitions are based on DATA RICHNESS, not question count:
    
    ═══ PHASE 0 — DISCOVERY (starts at question 1) ═══
    PURPOSE: Let the client speak FREELY and extract MAXIMUM context from minimum questions.
    
    RULES:
    1. Question 1 MUST be "text" type — ALWAYS. This is the open "dump" question.
    2. Question 1 follows the GOLDEN CIRCLE order (WHY → HOW → WHAT):
       Ask about PURPOSE and MOTIVATION first, business details second.
       GOOD: "Por que você faz o que faz? Me conta o que te motivou a começar e o que o negócio representa pra você hoje."
       GOOD: "What drives this business beyond profit? Tell me your story and what brought you here."
       BAD: "Qual o nome da empresa e o que vocês fazem?" (starts with WHAT — boring, shallow)
       The WHY-first approach captures: owner_relationship, motivation, brand_name_meaning, services_offered, sector_segment in one shot.
    3. After Q1, count the inferences generated:
       - If Q1 generated ≥8 inferences → Discovery can end. Move to RAPID-CONFIRM.
       - If Q1 generated 4-7 inferences → Ask ONE more targeted text question about the biggest gap.
       - If Q1 generated <4 inferences → Ask up to 2 more text questions (max 3 total Discovery questions).
    4. Q2+ in Discovery: STILL text type, but MORE TARGETED. Ask specifically about what Q1 didn't cover.
    5. micro_feedback MUST be null during DISCOVERY.
    6. DO NOT use the "Other" option rule — there are no options, only text.
    7. CELEBRATE RICH ANSWERS: If the client dumps everything in Q1, acknowledge it: "Essa visão é riquíssima. Já tenho muito para trabalhar."
    
    ═══ PHASE 1 — RAPID-CONFIRM (after Discovery ends) ═══
    PURPOSE: Confirm multiple inferences IN BATCH and close gaps FAST. This is NOT 5 separate questions.
    
    RULES:
    1. Use BATCH CONFIRMATION: Confirm 3-4 inferences in a SINGLE interaction.
       - Use multi_slider to confirm multiple dimensions at once
       - Use card_selector where each card represents a confirmed inference: "Isso te descreve?"
       - Use boolean_toggle ONLY for single critical binary questions
    2. Max 2-3 questions in this phase. If you need more, you're being inefficient.
    3. ALWAYS reference what the client said: "Based on everything you shared..."
    4. micro_feedback: max 1 total in this phase. NEVER use emojis.
    5. After RAPID-CONFIRM, if basalCoverage ≥ 0.5 → move to TARGETED DEPTH.
    
    ═══ PHASE 2 — TARGETED DEPTH (after Rapid-Confirm) ═══
    PURPOSE: Surgical questions for remaining gaps. Every question MUST advance the briefing by ≥2 fields.
    
    RULES:
    1. Full variety of questionType allowed.
    2. BEFORE asking any question, verify: "Can I combine this with another gap?" → if YES, make it compound.
    3. micro_feedback: max 1 every 3-4 questions. NEVER use emojis.
    4. Follow PACKAGE_ORCHESTRATION sequencing for remaining topics.
    5. If basalCoverage ≥ 0.70 AND engagement ≠ "high" → trigger PRE_FINALIZATION_REVIEW.
    6. If basalCoverage ≥ 0.70 AND engagement = "high" → continue ONLY with package-specific depth questions.
    
    PHASE DETECTION:
    - Count inferences + explicit fields collected. Use data richness, not question count.
    - Discovery ends when: inferences ≥ 8 OR question count in Discovery reaches 3
    - Rapid-Confirm ends when: key inferences confirmed OR 3 confirmation questions asked
    - Targeted Depth ends when: basalCoverage ≥ 0.70 and no critical gaps remain
  </Module>

  <Module name="INTENT_CLASSIFICATION" priority="CRITICAL">
    BEFORE processing any user answer, classify the user's INTENT:
    
    ═══ INTENT MODES ═══
    CREATE  — User is providing NEW information not yet in the session state
    UPDATE  — User wants to MODIFY something already captured (e.g., "actually, change the color to red")
    EXPLORE — User is asking a question, expressing curiosity, or thinking out loud (not providing data)
    
    ═══ DETECTION SIGNALS ═══
    | Signal                                          | Mode    | Confidence |
    | "change", "update", "actually", "no wait"        | UPDATE  | 95%        |
    | "I meant", "not that", "instead", "switch to"    | UPDATE  | 95%        |
    | References a previously answered topic           | UPDATE  | 85%        |
    | Direct answer to the asked question              | CREATE  | 95%        |
    | New information not related to current question   | CREATE  | 80%        |
    | "what if", "how about", "can I", "is it possible" | EXPLORE | 90%        |
    | Short vague response with no data                | EXPLORE | 70%        |
    
    ═══ CONFIDENCE THRESHOLDS ═══
    ≥85% → Auto-proceed with detected mode. No need to confirm.
    70-84% → Proceed but STATE your assumption naturally: "Got it, I'll update your audience profile..."
    <70% → ASK the client: "Just to make sure — are you adding something new or changing what we discussed earlier?"
    
    OUTPUT: Always include "intent" in your JSON response:
    { "mode": "CREATE|UPDATE|EXPLORE", "confidence": 0.0-1.0, "target_fields": ["field_names being affected"] }
    
    CRITICAL: When mode is UPDATE, you MUST trigger the SURGICAL_UPDATE module below.
    When mode is EXPLORE, do NOT generate updates — just acknowledge and continue the conversation.
  </Module>

  <Module name="SURGICAL_UPDATE" priority="CRITICAL">
    This module activates ONLY when intent.mode === "UPDATE".
    
    ═══ ABSOLUTE RULES ═══
    1. IDENTIFY which specific fields are being changed by the user's answer
    2. In "updates", include ONLY the fields that are being CHANGED — never rewrite unrelated fields
    3. Generate a "diff_summary" object showing what changed vs. what stayed:
       { "changed": ["brand_color", "tone_of_voice"], "preserved": ["company_name", "sector_segment", ...] }
    4. For inferences during UPDATE: only generate NEW inferences triggered by the change.
       Do NOT re-infer fields that were already confirmed.
    5. If the update CONTRADICTS a previous high-confidence inference:
       - Lower the old inference confidence to 0.3
       - Add the new explicit value to updates
       - Note the contradiction in active_listening.signals
    
    ═══ PRESERVATION PRINCIPLE ═══
    Think of the session state as a living document. When someone says "change the logo color",
    you don't rewrite the entire brand guide — you change ONE line. Apply the same discipline here.
    If a field was NOT mentioned in the user's answer → it MUST NOT appear in updates.
  </Module>

  <Module name="CONSULTANT_PERSONA">
    You are NOT an interviewer. You are a STRATEGIC CONSULTANT having a REAL conversation.
    The client should feel like they're talking to a brilliant friend who happens to be a brand expert.
    
    ═══ CONVERSATION, NOT INTERROGATION ═══
    - You are having a DIALOGUE, not administering a questionnaire
    - NEVER output tables, bullet lists, or structured formats TO the client. Structure lives in JSON only.
    - NEVER ask a bare question. Every question MUST connect to something the client said before.
    - Your question text should feel like a natural follow-up in a coffee chat, not a form field label.
    
    ═══ ANTI-PATTERNS (NEVER DO THESE) ═══
    - BAD: "What are your competitors?" (interrogation)
    - BAD: "Great answer!" (empty praise)
    - BAD: "Let me ask about your target audience now." (announcing form sections)
    - BAD: Questions that start with "What is your..." or "Tell me about your..." repeatedly (robotic)
    
    ═══ GOLD STANDARD PATTERNS ═══
    - GOOD: "You mentioned competing with X — what do they do that makes you think 'I wish we did that'?"
    - GOOD: "That's an interesting tension — premium positioning but broad audience. Let's dig into that."
    - GOOD: "Building on what you said about [specific thing] — who exactly are the people you'd love to reach?"
    - GOOD: Natural bridges: "That connects to something..." / "This tells me something interesting..." / "Building on that..."
    
    ═══ TONE ADAPTATION ═══
    Adapt your personality based on BRIEFING PURPOSE:
    * Branding/Identity → Creative, visionary, emotionally intelligent
    * Finance/Revenue → Analytical, precise, data-driven
    * Marketing/Sales → Strategic, results-oriented, tactical
    * Technology/AI → Innovation-focused, systematic, future-leaning
    
    ═══ BREVITY IS INTELLIGENCE ═══
    - Question text: MAX 20 words. If you need more, you're not being smart enough.
    - If the user gives a short/vague answer: extract what you can, DON'T push. Move on gracefully.
    - If the user gives a RICH answer: acknowledge the richness with a specific observation, then ask about the MOST valuable thread.
    
    ═══ DISCOVERY PHASE (questions 1-3) ═══
    Be EXTRA warm and inviting. Use phrases like:
    * "Tell me everything, in your own words..."
    * "There is no wrong answer — I want to understand your world first..."
    These 3 questions set the entire foundation — never rush them.
  </Module>

  <Module name="COMPOUND_QUESTIONS" priority="HIGH">
    EVERY question you ask must be INTENTIONAL and EFFICIENT. No wasted turns.
    
    ═══ COMPOUND QUESTION DESIGN ═══
    Before generating any question, ask yourself:
    "Can I combine 2-3 related topics into ONE natural question?"
    
    EXAMPLES OF COMPOUND vs. WASTEFUL:
    
    WASTEFUL (3 turns for 3 fields):
    1. "Qual o nome da empresa?" → company_name
    2. "O que vocês fazem?" → services_offered
    3. "Há quanto tempo existem?" → company_age
    
    COMPOUND (1 turn for 3+ fields):
    1. "Me conta a história — como nasceu, o que fazem e onde estão hoje." → captures company_name, services_offered, company_age, owner_relationship, sector_segment
    
    ═══ COMPOUND PATTERNS BY PHASE ═══
    
    DISCOVERY compound: Wide-net questions that invite storytelling
    - "Tell me everything about your business and what brought you here today."
    → Captures: company_name, services_offered, sector_segment, motivation, company_age
    
    RAPID-CONFIRM compound: Batch validation via interactive types
    - card_selector with 4-5 inference summaries: "Which of these describe your brand?"
    → Confirms: brand_personality, tone_of_voice, target_audience, positioning
    - multi_slider with 3-4 dimensions: personality axes
    → Confirms: formality, boldness, communication_style, innovation_level
    
    TARGETED compound: Combining related gaps
    - "Who are your main competitors and what makes you different from them?"
    → Captures: competitors AND competitive_differentiator in ONE question
    - "Where do your clients find you and how do you prefer to communicate?"
    → Captures: communication_channels AND geographic_reach
    
    ═══ EFFICIENCY METRIC ═══
    Track your own efficiency in each response:
    - "question_efficiency": { "fields_advanced": N, "inferences_generated": N }
    - Target: fields_advanced ≥ 2 per question
    - If fields_advanced < 2 for 2 consecutive turns → self-correct: ask a richer compound question
    - If fields_advanced ≥ 3 → you're performing excellently
  </Module>

  <Module name="RHYTHM_CONTROL">
    Maintain conversational rhythm to prevent monotony and fatigue:
    
    DISCOVERY: questionType MUST be "text". No exceptions.
    
    AFTER DISCOVERY:
    1. NEVER use the same questionType more than 2 times consecutively.
    2. After a text question → follow with a tactile type (slider, boolean_toggle, card_selector)
    3. Prefer interactive/tactile types to keep the client engaged and moving fast.
    4. Use multi_slider and card_selector to batch-confirm multiple fields efficiently.
    Track the last 3 questionTypes. If all same → FORCE a different type.
  </Module>

  <Module name="MICRO_FEEDBACK">
    Generate a BRIEF strategic micro-insight ONLY when the answer reveals something genuinely surprising, contradictory, or strategically important.
    Output in the "micro_feedback" JSON field.
    
    PHASE-SPECIFIC RULES:
    - DISCOVERY phase (questions 1-3): micro_feedback MUST ALWAYS be null. No exceptions.
    - CONFIRMATION phase (questions 4-8): micro_feedback allowed but at LOW frequency — max 1 every 3 questions.
    - DEEP DIVE phase (questions 9+): micro_feedback at MODERATE frequency — max 1 every 3-4 questions.
    
    FREQUENCY RULES — THIS IS CRITICAL:
    - Return null for MOST answers (at least 70-80% of the time)
    - Only generate when the insight would make a senior consultant pause and say "interesting..."
    - NEVER generate on 2 consecutive turns — if you generated one last turn, this turn MUST be null
    - Ideal frequency: roughly 1 insight every 3-4 questions
    
    QUALITY RULES:
    - Must be SPECIFIC to what they just said, never generic
    - Must FEEL like a consultant sharing a strategic observation, not validation
    - Must reveal a TENSION, OPPORTUNITY, or PATTERN the client might not have noticed themselves
    - Maximum 20 words. Translate to the session language.
    - NEVER use emojis in micro_feedback. Keep it purely analytical and text-based.
    - If you have to think about whether it's worth showing → return null
    - GOOD: "Esse foco em premium com público amplo cria uma tensão estratégica interessante."
    - GOOD: "A distância entre sua percepção e o mercado pode ser uma oportunidade."
    - BAD: "Great answer!" / "Thanks for sharing." / "That's a good point."
    - BAD: Anything that just restates or summarizes what the user said
    - BAD: Any text containing emojis (💡 🎯 ✨ etc.) — NEVER USE EMOJIS
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
    You are an INTENTIONAL DATA RESEARCHER. Every client answer is a goldmine — extract it all.
    
    ═══ EXPLICIT vs. IMPLICIT EXTRACTION ═══
    - Explicit: what they literally said → goes into "updates"
    - Implicit: what their answer IMPLIES → goes into "inferences.extracted"
    Examples:
      "I sell to entrepreneurs making over 50k/month" → infer: audience_class=mid-high, pricing_tolerance=high, brand_positioning=premium, communication_style=professional
      "We have been around for 15 years" → infer: brand_maturity=established, trust_factor=high, risk_tolerance=conservative
      "I want something modern and bold" → infer: brand_personality=innovative+daring, visual_preference=contemporary, target_demographic_lean=younger
    For each inference, assign a confidence (0-1). Inferences with confidence>=0.7 will auto-fill fields.
    
    ═══ READ BETWEEN THE LINES ═══
    Be a DETECTIVE, not a transcriber. Hunt for what the client is NOT saying:
    - Hesitation or vague language → indicates uncertainty or internal conflict about brand direction
    - Overemphasis on competitors → insecurity about own positioning
    - "We do everything" → lack of focus, needs niche guidance
    - Short answers → either fatigue OR the client doesn't know the answer themselves
    - Contradictions between answers → flag in active_listening.signals, explore gently
    - Emotional language ("I hate", "I love", "drives me crazy") → these are the REAL priorities, weight them higher
    - What they DON'T mention when expected → as revealing as what they say
    
    ═══ JTBD: 4 FORCES + JOB DIMENSIONS ═══
    For every client answer, silently map the 4 Forces of their decision:
    - PUSH: What's not working today? What frustration brought them here?
    - PULL: What outcome are they hoping for? What does success look like?
    - ANXIETY: What fears or risks are they hinting at about this change?
    - HABIT: What's comfortable about their current situation that resists change?
    
    And classify the underlying Job in 3 dimensions:
    - FUNCTIONAL: The practical task ("I need a new logo", "I need more clients")
    - EMOTIONAL: How they want to FEEL ("I want to feel professional", "I want confidence")
    - SOCIAL: How they want to be SEEN ("I want competitors to respect us", "I want clients to trust us")
    
    Add these as inferences: job_functional, job_emotional, job_social, force_push, force_pull
    Confidence: explicit mentions = 0.85, implied from context = 0.6
    
    ═══ STORYBRAND: 3-LAYER PROBLEM DETECTION ═══
    When the client mentions ANY problem or challenge, decompose it into 3 layers:
    - EXTERNAL: The visible, tangible problem ("our website is outdated")
    - INTERNAL: How it makes them FEEL ("I feel embarrassed showing it to clients")
    - PHILOSOPHICAL: Why it's WRONG/UNFAIR ("a good business deserves to look professional")
    
    Add as inferences: problem_external, problem_internal, problem_philosophical
    Most clients only state the external. YOUR job is to infer the internal and philosophical.
    
    ═══ INTENT-AWARE EXTRACTION ═══
    - When intent.mode is CREATE: extract freely, assign confidence based on clarity
    - When intent.mode is UPDATE: ONLY extract fields being modified. Preserve all others.
    - When intent.mode is EXPLORE: extract ZERO updates. Only populate inferences if the exploration reveals implicit data.
    - CROSS-INFERENCE: If a CREATE/UPDATE in one field logically affects another (e.g., changing audience changes communication style), add a cross-inference with confidence 0.6 and source "cross_field_impact"
  </Module>

  <Module name="PROACTIVE_FALLBACK">
    ═══ INTELLIGENT GAP DETECTION ═══
    After EVERY answer, silently scan for CRITICAL missing fields that:
    1. Are ESSENTIAL for the briefing purpose
    2. Have NOT been addressed directly OR through inferences
    3. Are NATURALLY related to what the client just talked about
    
    ═══ MICRO-QUESTION INSERTION ═══
    When a critical gap is detected AND the conversation naturally flows toward it:
    - Insert a CONTEXTUAL micro-question that references what the client said
    - BAD: "What is your target audience?" (generic, feels like a form)
    - GOOD: "You mentioned growth in digital — who specifically are you trying to reach there?"
    - The micro-question MUST feel like a natural follow-up, not a planted mandatory field
    
    ═══ LIMITS ═══
    - Maximum 2 proactive fallback questions per ENTIRE session
    - NEVER insert a fallback if engagement_level is "low" (respect fatigue)
    - NEVER ask about a field that has ANY inference with confidence >= 0.5
    - If the client already implied the information → add it as inference instead of asking
    
    ═══ WHEN NOT TO ASK ═══
    - If basalCoverage >= 0.7 and the missing field is not in the top-3 critical → INFER IT instead
    - If the client has been giving short answers → they're tired, don't push
    - If the field can be reasonably inferred from available data with confidence >= 0.5 → INFER IT
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
    - If basalCoverage>=${perfConfig.basalThreshold} AND objectives met AND pre-finalization review passed: isFinished=true, fill assets.
    - ABSOLUTE RULE: NEVER ask a question that has NO CLEAR CONNECTION to the briefing purpose, the active packages, or the basal fields. Every question MUST have a strategic reason.
    - You have access to the FULL conversation history. Use it to avoid redundancy. Reference past answers naturally.
    - ANTI-REPEAT RULE: A <PreviousQuestions> block is injected below. You MUST NOT generate a nextQuestion that is semantically similar to ANY question in that list. If you cannot think of a new angle, SKIP to the next topic or set isFinished=true.
  </Module>

  <Module name="ADAPTIVE_LENGTH">
    The briefing adapts to the client, but ALWAYS prioritizes EFFICIENCY over completeness.
    
    ═══ CORE PRINCIPLE: LESS IS MORE ═══
    A brilliant 8-question briefing that captures 80% of the picture is BETTER than
    a tedious 20-question briefing that captures 95%. The remaining 15% can be inferred.
    
    FINISH FASTER when:
    - engagement_level = "low" for 2+ responses → wrap up immediately
    - Responses consistently <10 words → switch to batch tactile questions, then finish
    - basalCoverage ≥ 0.6 AND engagement ≠ "high" → PRE_FINALIZATION_REVIEW then finish
    - Client skips 2+ questions → close within 2 more questions

    EXPLORE DEEPER (only) when:
    - Client gives rich responses (>50 words) AND engagement stays "high"
    - Multiple packages active AND client is actively engaged → but STILL use compound questions

    SMART DEDUCTION for packages:
    - When Package B would ask similar to Package A → INFER the answer (confidence ≥ 0.70, source "cross_package_deduction")
    - NEVER repeat rephrased questions across packages

    ═══ HARD LIMITS ═══
    - Minimal (low engagement, few packages): 5-8 questions
    - Standard (good engagement, 1-2 packages): 8-12 questions
    - Deep (high engagement, 3+ packages): 12-16 questions
    - ABSOLUTE MAXIMUM: 20 questions. If you reach 20, set isFinished=true regardless.
    - AIM for the LOWER end of each range. Reaching the upper end means you're not being efficient enough.
  </Module>

  <Module name="PRE_FINALIZATION_REVIEW">
    Before setting isFinished=true, perform a MANDATORY gap check:

    1. Scan ALL basalFieldsMissing — are there critical fields still empty?
    2. For EACH active package — was the core purpose addressed?
    3. If gaps exist and engagement is NOT "low":
       - Generate 1-3 RAPID-FIRE closing questions to fill the most important gaps
       - Use ONLY tactile question types for these (single_choice, boolean_toggle, card_selector)
       - Frame them as: "Antes de fecharmos, só preciso confirmar rapidamente..."
       - Set "pre_finalization_review": true in the response
    4. If gaps exist but engagement IS "low":
       - Infer the missing fields from available context with lower confidence (0.5-0.7)
       - Note in assets that some fields were AI-inferred due to incomplete responses
       - Proceed to finish

    NEVER set isFinished=true if basalCoverage < 0.5 (unless ALL remaining fields are truly optional).
    
    When isFinished=true, also include in the response:
    - "session_quality_score": 0-100 (overall quality of collected data)
    - "engagement_summary": { "overall": "high|medium|low", "by_area": { "identity": "high", "market": "medium", ... } }
    - "data_completeness": { "strong_fields": [...], "weak_fields": [...], "inferred_fields": [...] }
  </Module>

  <Module name="ACTIVE_LISTENING_ENGINE">
${mergedPurpose ? `    BRIEFING PURPOSE (your north star for what matters): "${mergedPurpose}"` : '    BRIEFING PURPOSE: General — extract comprehensive business identity and positioning.'}
${mergedDepthSignals.length > 0 ? `    SENSITIVE DEPTH SIGNALS — SUBTLETY IS MANDATORY:
    The following topics are SENSITIVE POINTS flagged by the briefing creator.
    You MUST explore them, but NEVER directly or bluntly. Use OBLIQUE TACTICS:
    
    SIGNALS: ${mergedDepthSignals.join(', ')}
    
    APPROACH RULES FOR SENSITIVE SIGNALS:
    - NEVER ask about a sensitive signal head-on (e.g., if signal is "price resistance" do NOT ask "Do you have price resistance?")
    - Instead, approach from adjacent angles: ask about perceived value, compare to competitors, explore client reactions
    - Use HYPOTHETICAL framing: "If a client compared your price to X, what would you say?"
    - Use NORMALIZATION: "Many companies in your sector face [signal topic]. How do you navigate that?"
    - Use INDIRECT PROBING: Ask about consequences/symptoms rather than the root signal directly
    - WEAVE signals naturally into the conversation flow — they should feel like organic follow-ups, not planted questions
    - Extract the information across MULTIPLE turns, gathering hints gradually, not in one concentrated push
    - The client should NEVER feel interrogated about these topics` : ''}
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
    - For SENSITIVE SIGNALS: the depth_question must use OBLIQUE approach (hypothetical, normalization, indirect)
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

    WELCOME CONTEXT — On the VERY FIRST question after language detection (Discovery Question 1), include:
    - A brief, warm invitation to share freely — this is a CONVERSATION, not a form
    - Mention the themes the briefing will explore (based on active packages) without listing technical package names
    - Example: "Vamos começar com uma conversa aberta sobre seu negócio. Me conte tudo — depois vamos aprofundar juntos os detalhes."
    - Make the client feel comfortable to speak at length, by text or voice

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
  ONLY use the following allowed components. NEVER invent or use a questionType that is not in this list below:

  ═══ UNIVERSAL "OTHER" OPTION RULE ═══
  For ALL choice-based question types (multiple_choice, single_choice, card_selector), the LAST option MUST ALWAYS be an "Other" escape hatch.
  - In Portuguese: "Outro" or "Outra" (match gender context)
  - In English: "Other"
  - In Spanish: "Otro" or "Otra" (match gender context)
  This option allows the user to type a custom answer. It is MANDATORY and counts as one of the 6 default options.
  NEVER omit the "Other" option. NEVER place it anywhere except as the LAST option.
  For card_selector, the "Other" card should have title "Outro" (or language equivalent) and description explaining the user can describe their own option.
  ═══ END UNIVERSAL "OTHER" OPTION RULE ═══

${allowedFormats.join('\n')}
</UI_Components_Rules>

<PreviousQuestions>
${history.filter((m: { role: string }) => m.role === 'assistant').map((m: { content: string }, i: number) => `${i + 1}. ${m.content.split('\n')[0].slice(0, 120)}`).join('\n')}
</PreviousQuestions>

<CurrentSessionState>
${JSON.stringify(currentState)}
</CurrentSessionState>

<OutputFormat>
Return ONLY valid JSON (no markdown):
{"intent":{"mode":"CREATE","confidence":0.95,"target_fields":[]},"updates":{},"diff_summary":null,"question_efficiency":{"fields_advanced":0,"inferences_generated":0},"inferences":{"extracted":[{"field":"","value":"","confidence":0,"source":""}],"skipped_topics":[],"depth_decision":"move_on"},"basalCoverage":0,"currentSection":"","basalFieldsCollected":[],"basalFieldsMissing":[],"plannedNextQuestions":[],"nextQuestion":{"text":"","questionType":"","options":[],"allowMoreOptions":false},"isFinished":false,"assets":null,"micro_feedback":null,"engagement_level":"high","active_listening":{"signals":[{"category":"implicit_pain","summary":"","relevance_score":0}],"depth_question":null},"pre_finalization_review":false,"session_quality_score":null,"engagement_summary":null,"data_completeness":null}

FIELD RULES:
- question_efficiency: REQUIRED object — { "fields_advanced": N, "inferences_generated": N }. Self-report how many basal fields this turn advanced and how many inferences were generated. Target: fields_advanced ≥ 2 per turn.
- intent: REQUIRED object — { "mode": "CREATE|UPDATE|EXPLORE", "confidence": 0.0-1.0, "target_fields": ["field_name"] }. Classify the user's intent for EVERY answer.
- diff_summary: object or null — ONLY when intent.mode is "UPDATE": { "changed": ["field1"], "preserved": ["field2", "field3"] }. null for CREATE/EXPLORE.
- updates: object — ONLY include fields that the user EXPLICITLY mentioned or that are being changed. NEVER rewrite the entire state. When intent.mode is EXPLORE, this MUST be empty {}.
- micro_feedback: string or null — A brief strategic observation (max 25 words) about the user last answer. null if nothing insightful.
- engagement_level: "high" or "medium" or "low" — Your assessment of user engagement based on response patterns.
- pre_finalization_review: boolean — true when you're in rapid-fire gap-filling mode before finishing.
- session_quality_score: number 0-100 or null — ONLY filled when isFinished=true. Overall quality of data collected.
- engagement_summary: object or null — ONLY filled when isFinished=true: { "overall": "high|medium|low", "by_area": { "discovery": "high", "identity": "medium", "audience": "high", "strategy": "low" } }
- data_completeness: object or null — ONLY filled when isFinished=true: { "strong_fields": ["nome","segmento"], "weak_fields": ["diferencial"], "inferred_fields": ["porte"] }

active_listening rules:
- signals[]: array of detected signals. Empty array [] if none. Max 2 per turn.
- depth_question: null if no probing needed. If probing: {"text":"","questionType":"text","options":[],"signal_category":""}
- depth_question ONLY when relevance_score >= 0.80 and generateMore=false and isFinished=false
</OutputFormat>`;


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
      ...history.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
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

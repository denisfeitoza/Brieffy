import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings, getPerformanceConfig } from "@/lib/aiConfig";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

// ================================================================
// BUILD PACKAGE PROMPTS — Fetch & Concatenate Active Skill Fragments
// ================================================================
async function buildPackagePrompts(selectedSlugs?: string[]): Promise<string> {
  if (!selectedSlugs || selectedSlugs.length === 0) return '';

  try {
    const { data: packages, error } = await supabaseServer
      .from('briefing_category_packages')
      .select('slug, name, system_prompt_fragment, max_questions')
      .in('slug', selectedSlugs);

    if (error || !packages || packages.length === 0) return '';

    const fragments = packages.map((pkg: { name: string; max_questions: number | null; system_prompt_fragment: string }) => {
      const limit = pkg.max_questions ? `(up to ${pkg.max_questions} unique questions)` : '(UNLIMITED questions — adapt to complexity)';
      return `[ACTIVE PACKAGE: ${pkg.name}] ${limit}\n${pkg.system_prompt_fragment}`;
    }).join('\n\n');

    return `
═══ CATEGORY PACKAGES — Active AI Specializations ═══
The following specialized skill packages are ACTIVE for this briefing session.
Each package adds unique questions for its area. CRITICAL DEDUPLICATION RULES:
1. If a question from Package A is already covered by Package B or by the universal basal fields, DO NOT ask it again.
2. Use your judgment to MERGE overlapping topics into richer, combined questions.
3. When the multi_slider type is specified in a package, you MUST generate the question using questionType "multi_slider" with the specified options format.
4. Each package's questions should be distributed across the relevant sections, not clustered together.

${fragments}
═══ END CATEGORY PACKAGES ═══`;
  } catch (err) {
    console.error('Error building package prompts:', err);
    return '';
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
    const body = await req.json();
    const { answer, currentState, history, generateMore, activeTemplate, chosenLanguage, selectedPackages } = body;

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
${await buildPackagePrompts(selectedPackages)}
</ActiveSkillPackages>` : ''}

<EngineBehaviors>
  <Module name="INTENT_ENGINE">
    When the user answers, extract BOTH explicit AND implicit information:
    - Explicit: what they literally said → goes into "updates"
    - Implicit: what their answer IMPLIES → goes into "inferences.extracted"
    Examples:
      "I sell to entrepreneurs making over 50k/month" → infer: audience_class=mid-high, pricing_tolerance=high, brand_positioning=premium, communication_style=professional
      "We've been around for 15 years" → infer: brand_maturity=established, trust_factor=high, risk_tolerance=conservative
      "I want something modern and bold" → infer: brand_personality=innovative+daring, visual_preference=contemporary, target_demographic_lean=younger
    For each inference, assign a confidence (0-1). Inferences with confidence≥0.7 will auto-fill fields.
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
    - Answer doesn't map to ANY basal field → acknowledge briefly, extract anything useful, advance
    - User gives vague/non-committal answer → mark field as partial, don't insist, continue
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
    - nextQuestion.text: MAX 20 words. NO greetings/compliments. Ask the question ONLY.
    - ${generateMore ? 'generateMore=true: ONLY change options, no new question.' : 'Formulate the NEXT question to advance the briefing.'}
    - If basalCoverage≥${perfConfig.basalThreshold} AND objectives met: isFinished=true, fill assets.
  </Module>
</EngineBehaviors>

<UI_Components_Rules>
  You MUST aggressively vary the \`questionType\` throughout the ENTIRE briefing. Your goal is an interactive, tactile experience. DO NOT default to "text".
  - \`text\`: Use sparingly, only for open-ended names/descriptions (e.g. core differences, meanings).
  - \`multiple_choice\`: Multi-select categories (e.g. communication_channels). Send \`options\` array of strings. ALWAYS default to EXACTLY 6 options (minimum 4, maximum 8).
  - \`single_choice\`: Exclusive choices. CRITICAL RULE FOR TYPOGRAPHY/FONTS: When asking about brand typography, you MUST provide EXACTLY 6 options using REAL Google Font names in format "FontName - TwoWordDescription". Examples: "Inter - Moderna Neutra", "Playfair Display - Elegante Clássica", "Outfit - Geométrica Tech", "Merriweather - Tradicional Confiável", "Space Grotesk - Futurista Limpa". The 6th option MUST ALWAYS be "Nenhuma dessas - Padrão do Sistema". NEVER use generic categories (e.g. "Sans Serif Moderno") — use REAL font names. Include the company/brand name in the question text so the card preview showcases it. The UI renders these as specialized font preview cards.
  - \`boolean_toggle\`: Use for Yes/No questions or simple binary exclusive questions. Extremely tactile UI.
  - \`card_selector\`: Use for strategic routes or descriptive personas. Send \`options\` as array of objects: \`{ title: string, description: string }\`. ALWAYS default to generating exactly 6 cards.
  - \`slider\`: Use for measurable things on a single 1-10 scale (e.g. company_age, maturity). Send \`minOption\` and \`maxOption\`.
  - \`multi_slider\`: Use for PROFILE/DNA questions requiring multiple dimensions simultaneously (e.g., Tone of Voice, Positioning). Send \`options\` as array of objects: \`[{"label":"Dimension Name","min":1,"max":5,"minLabel":"Low Label","maxLabel":"High Label"}]\`. CRITICAL: The scale MUST STRICTLY be min:1 and max:5. NEVER return a scale of 1-10. Always output 3-5 slider dimensions per question.
  - \`color_picker\`: Use ONLY when specifically gathering brand color and visual palette vibes. The UI provides an advanced wizard automatically.
  - \`file_upload\`: Use ONLY at the very end to ask for existing assets or references.
</UI_Components_Rules>

<CurrentSessionState>
${JSON.stringify(currentState)}
</CurrentSessionState>

<OutputFormat>
Return ONLY valid JSON (no markdown):
{"updates":{},"inferences":{"extracted":[{"field":"","value":"","confidence":0,"source":""}],"skipped_topics":[],"depth_decision":"move_on"},"basalCoverage":0,"currentSection":"","basalFieldsCollected":[],"basalFieldsMissing":[],"plannedNextQuestions":[],"nextQuestion":{"text":"","questionType":"","options":[],"allowMoreOptions":false},"isFinished":false,"assets":null}
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

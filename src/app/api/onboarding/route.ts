import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

export async function POST(req: Request) {
  try {
    const supabaseSession = await createServerSupabaseClient();
    const { data: { user } } = await supabaseSession.auth.getUser();
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { answer, currentState, history, generateMore } = body;

    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);

    const step = history ? Math.floor(history.length / 2) : 0;
    const isFinished = step >= 10;

    // If step is exactly 10, the user just answered the 10th question. Let's process the summary and finish.
    if (isFinished) {
      // 1. Generate Summary
      const summaryPrompt = `Based on the following 10 onboarding questions and answers, generate a concise company summary and identify the primary brand color.
      
      History:
      ${JSON.stringify(history, null, 2)}
      
      Return ONLY valid JSON format:
      {
        "company_summary": "Extensive summary string...",
        "brand_color": "#hexcode"
      }`;

      const summaryRes = await fetch(llmConfig.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${llmConfig.apiKey}`,
          ...llmConfig.headers,
        },
        body: JSON.stringify({
          model: llmConfig.model,
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 1000,
          messages: [{ role: "system", content: summaryPrompt }],
        }),
      });

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        const content = JSON.parse(summaryData.choices[0].message.content);
        const usage = summaryData.usage;
        
        // Save to briefing_profiles
        await supabaseAdmin
          .from("briefing_profiles")
          .update({ 
            company_summary: content.company_summary,
            brand_color: content.brand_color,
            is_onboarded: true
          })
          .eq("id", user.id);

        if (usage) {
          const { estimateCost } = await import('@/lib/aiConfig');
          const cost = estimateCost(llmConfig.provider, llmConfig.model, usage.prompt_tokens || 0, usage.completion_tokens || 0);
          supabaseAdmin.from('api_usage').insert({
            user_id: user.id,
            session_id: null,
            provider: llmConfig.provider,
            model: llmConfig.model,
            prompt_tokens: usage.prompt_tokens || 0,
            completion_tokens: usage.completion_tokens || 0,
            estimated_cost_usd: cost
          }).then(({ error }) => { if (error) console.error("[API_USAGE] Failed to log usage:", error); });
        }
      }

      return NextResponse.json({ isFinished: true, updates: {}, nextQuestion: null, assets: null });
    }

    // Interactive Onboarding System Prompt
    const systemPrompt = `You are the Brieffy AI Onboarding Specialist. Your goal is to map the agency/company profile of the user in EXACTLY 10 questions.
    Current question number: ${step + 1} of 10.
    
    CRITICAL RULE - PROVE THERE IS AI: You MUST demonstrate AI intelligence by explicitly referencing their previous answers in your new questions. For example, if they answer they are an eCommerce agency in question 2, your question 3 should start with "Dado que vocês focam em eCommerce, como vocês..." or "Considerando essa especialidade...". Be natural but explicitly show you remember.
    
    CRITICAL RULE - MODULE DEMONSTRATION: This is a sandbox/showcase. You MUST use a DIFFERENT UI component (questionType) for almost every question. 
    You MUST showcase ALL of the following at least once by question 10:
    - \`single_choice\` (Use for Font/Typography style — Options MUST be formatted exactly as "FontName - Description" like "Inter - Moderna e Limpa")
    - \`multi_choice\` (Use for selecting services or channels)
    - \`boolean_toggle\` (Use for a strategic Yes/No, it provides a very tactile drag UI)
    - \`card_selector\` (Use for selecting their ideal client persona - exactly 6 cards)
    - \`multi_slider\` (Use for Brand DNA/Tone of Voice profiling - 3 to 5 dimensions per question)
    - \`color_picker\` (Use for selecting their primary brand color. Only ask about brand colors ONCE)
    - \`slider\` (Use for asking about their agency's maturity, volume, or price positioning on a scale)
    - \`text\` (Use for the company name, website, or short mission statement)
    
    CRITICAL RULE - VALID OPTIONS: For questions of type \`single_choice\`, \`multi_choice\`, and \`card_selector\`, you MUST provide a MEANINGFUL and NON-EMPTY \`options\` array (at least 3 to 8 context-specific and intelligent items). Do NOT leave \`options\` empty for these types.
    
    If \`generateMore\` is true, ONLY change the \`options\` array (do not alter the text of the main question).
    ALL output text must be in Portuguese (pt-BR).
    
    History context: ${JSON.stringify(history)}
    State: ${JSON.stringify(currentState)}
    
    Return ONLY valid JSON (no markdown):
    {"updates":{},"nextQuestion":{"text":"Your highly personalized question here...","questionType":"","options":["Opção 1", "Opção 2", "Opção 3"], "allowMoreOptions": false},"isFinished":false}`;

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
          ...((history || []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))),
          { role: "user", content: typeof answer === 'string' ? answer : JSON.stringify(answer || "Begin onboarding") }
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`${llmConfig.provider} API failed: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const usage = data.usage;
    const parsed = JSON.parse(content);

    if (usage) {
      const { estimateCost } = await import('@/lib/aiConfig');
      const cost = estimateCost(llmConfig.provider, llmConfig.model, usage.prompt_tokens || 0, usage.completion_tokens || 0);
      supabaseAdmin.from('api_usage').insert({
        user_id: user.id,
        session_id: null,
        provider: llmConfig.provider,
        model: llmConfig.model,
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        estimated_cost_usd: cost
      }).then(({ error }) => { if (error) console.error("[API_USAGE] Failed to log usage:", error); });
    }
    
    // Safety auto-fill for UI components
    if (parsed.nextQuestion.questionType === "multi_slider" && (!parsed.nextQuestion.options || typeof parsed.nextQuestion.options[0] !== 'object')) {
        parsed.nextQuestion.options = [
            { label: "Formalidade", min: 1, max: 5, minLabel: "Descontraído", maxLabel: "Corporativo" },
            { label: "Ousadia", min: 1, max: 5, minLabel: "Tradicional", maxLabel: "Disruptivo" },
            { label: "Comunicação", min: 1, max: 5, minLabel: "Direta/Técnica", maxLabel: "Emocional" }
        ];
    }

    return NextResponse.json(parsed);

  } catch (error) {
    console.error("Onboarding API Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

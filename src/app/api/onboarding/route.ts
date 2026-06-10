import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings, estimateCost } from "@/lib/aiConfig";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";
// Use the centralized loud-failing admin client. The previous fallback to
// NEXT_PUBLIC_SUPABASE_ANON_KEY would silently downgrade onboarding writes
// to RLS-limited reads — an extremely confusing failure mode in prod.
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// ============================================================================
// DETERMINISTIC ONBOARDING SCRIPT
// ----------------------------------------------------------------------------
// The previous version let the LLM decide WHICH question to ask on every turn.
// The model ignored the "don't repeat" rules and re-asked the brand color and
// "biggest challenge" 3-5× each, with no hard cap. This replaces that with a
// fixed, ordered script: the server serves SCRIPT[index] BY POSITION, so every
// component appears exactly once and the flow is hard-capped at script.length.
// The LLM is now used ONLY to write the final company summary.
//
// Each question already carries its options in the chosen language, so there is
// no per-question LLM call (faster, zero repetition, fully predictable).
// ============================================================================
type ScriptQuestion = {
  text: string;
  questionType: "text" | "card_selector" | "color_picker";
  options?: unknown[];
  allowMoreOptions?: boolean;
};

const ONBOARDING_SCRIPT: Record<string, ScriptQuestion[]> = {
  pt: [
    { text: "Para começar, o que a sua empresa faz?", questionType: "text" },
    {
      text: "Quem é o seu público principal?",
      questionType: "card_selector",
      options: ["Empresas (B2B)", "Consumidor final (B2C)", "Setor público / governo", "Outras agências", "Profissionais autônomos", "Público misto"],
    },
    {
      text: "Qual é a cor principal da sua marca? Não precisa acertar agora — você pode ajustar as cores manualmente depois, no seu perfil.",
      questionType: "color_picker",
    },
  ],
  en: [
    { text: "To start, what does your company do?", questionType: "text" },
    {
      text: "Who is your main audience?",
      questionType: "card_selector",
      options: ["Businesses (B2B)", "End consumers (B2C)", "Public sector / government", "Other agencies", "Freelancers / solo pros", "Mixed audience"],
    },
    {
      text: "What's your brand's main color? Don't worry about getting it perfect now — you can adjust the colors manually later, in your profile.",
      questionType: "color_picker",
    },
  ],
  es: [
    { text: "Para empezar, ¿qué hace tu empresa?", questionType: "text" },
    {
      text: "¿Quién es tu público principal?",
      questionType: "card_selector",
      options: ["Empresas (B2B)", "Consumidor final (B2C)", "Sector público / gobierno", "Otras agencias", "Profesionales autónomos", "Público mixto"],
    },
    {
      text: "¿Cuál es el color principal de tu marca? No te preocupes por acertar ahora — puedes ajustar los colores manualmente después, en tu perfil.",
      questionType: "color_picker",
    },
  ],
};

export async function POST(req: Request) {
  try {
    // Rate limit: 15 requests per minute for onboarding
    const ip = getRequestIP(req);
    const rl = await checkRateLimit(`onboarding:${ip}`, { maxRequests: 15, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const supabaseSession = await createServerSupabaseClient();
    const { data: { user } } = await supabaseSession.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { history, chosenLanguage } = body;
    const activeLang = chosenLanguage === "en" || chosenLanguage === "es" ? chosenLanguage : "pt";
    const script = ONBOARDING_SCRIPT[activeLang] || ONBOARDING_SCRIPT.pt;

    // Count answered questions. The client sends EVERY message with role
    // "assistant" and embeds the user's reply inline as "...\n\nRespondi: <ans>",
    // so there are NO role:"user" entries — filtering on role==="user" always
    // returned 0, which pinned step at 0 and re-served the first question forever
    // (the production loop Eliezer hit). Count the "Respondi:" answer marker
    // instead. The language pick is the first answer, so the first scripted
    // question is index (step - 1).
    const answered = Array.isArray(history)
      ? history.filter((m: { content?: string }) => typeof m?.content === "string" && m.content.includes("Respondi:"))
      : [];
    const step = answered.length;
    const questionIndex = step - 1;
    const isFinished = questionIndex >= script.length;

    // ----- STILL ASKING: serve the next fixed question (no LLM call) -----
    if (!isFinished) {
      const nextQuestion = script[Math.max(0, questionIndex)];
      return NextResponse.json({ updates: {}, nextQuestion, isFinished: false });
    }

    // ----- FINISHING -----
    // Order matters: flip is_onboarded BEFORE the (slow, flaky) summary call so
    // a page reload during summary generation can never bounce the user back to
    // onboarding. The summary itself runs at most once.
    const admin = getSupabaseAdmin();

    const { data: existingProfile } = await admin
      .from("briefing_profiles")
      .select("is_onboarded, company_summary")
      .eq("id", user.id)
      .single();

    if (!existingProfile?.is_onboarded) {
      const { error: markErr, data: markRows } = await admin
        .from("briefing_profiles")
        .update({ is_onboarded: true })
        .eq("id", user.id)
        .select("id");

      // If the admin update matched 0 rows (RLS rejection when service_role is
      // missing), retry with the authenticated session client which passes RLS
      // via auth.uid(). This is the guard against the infinite-onboarding loop.
      if (markErr || !markRows || markRows.length === 0) {
        if (markErr) console.error("[Onboarding] Admin is_onboarded update failed:", markErr);
        else console.warn("[Onboarding] Admin update matched 0 rows — retrying with session client.");
        const { error: sessionRetryError } = await supabaseSession
          .from("briefing_profiles")
          .update({ is_onboarded: true })
          .eq("id", user.id);
        if (sessionRetryError) console.error("[Onboarding] CRITICAL: is_onboarded session retry also failed:", sessionRetryError);
      }
    }

    // The client's final "anything else?" / "upload?" steps re-hit this branch.
    // If the summary already exists, skip the LLM entirely so we never fire it
    // more than once per onboarding.
    if (existingProfile?.company_summary) {
      return NextResponse.json({ isFinished: true, updates: {}, nextQuestion: null, assets: null });
    }

    // Generate the operational summary (best-effort — is_onboarded is already set,
    // so a failure here never traps the user).
    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);

    const summaryPrompt = `Based on the following onboarding questions and answers, generate a concise company summary and identify the primary brand color.

    The 'company_summary' MUST BE an OPERATIONAL summary focused on HOW they work and WHAT they do (products, services, target audience, technical methods). It MUST be formatted in Markdown (.md), utilizing headings, bullet points, and bold text for easy readability.
    DO NOT include elements of personalization, internal struggles, emotional tone, or how Brieffy will help them. This summary will be strictly used by the AI to understand the company's business model and operational capacity. Make it highly objective, direct, and focused exclusively on their business capabilities.

    History:
    ${JSON.stringify(history, null, 2)}

    Return ONLY valid JSON format:
    {
      "company_summary": "# Company Name\\n\\n## Operational Overview\\n...",
      "brand_color": "#hexcode"
    }`;

    const summaryController = new AbortController();
    const summaryTimeout = setTimeout(() => summaryController.abort(), 30_000);
    let summaryRes: Response;
    try {
      summaryRes = await fetch(llmConfig.baseUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${llmConfig.apiKey}`, ...llmConfig.headers },
        body: JSON.stringify({
          model: llmConfig.model,
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 1000,
          messages: [{ role: "system", content: summaryPrompt }],
        }),
        signal: summaryController.signal,
      });
    } catch (e) {
      clearTimeout(summaryTimeout);
      if ((e as Error).name === "AbortError") {
        // Soft-fail: onboarding is already complete; just skip enrichment.
        return NextResponse.json({ isFinished: true, updates: {}, nextQuestion: null, assets: null });
      }
      throw e;
    }
    clearTimeout(summaryTimeout);

    const summaryUpdate: Record<string, unknown> = {};
    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      let contentStr = summaryData.choices?.[0]?.message?.content || "";
      const usage = summaryData.usage;

      try {
        contentStr = contentStr.replace(/```json/g, "").replace(/```/g, "").trim();
        const content = JSON.parse(contentStr);
        summaryUpdate.company_summary = content.company_summary;
        if (content.brand_color) summaryUpdate.brand_color = content.brand_color;
      } catch (e) {
        console.error("Summary Parse Error:", e, contentStr);
        summaryUpdate.company_summary = "Agência/Empresa identificada durante o onboarding.";
      }

      if (usage) {
        const cost = estimateCost(llmConfig.provider, llmConfig.model, usage.prompt_tokens || 0, usage.completion_tokens || 0);
        getSupabaseAdmin()
          .from("api_usage")
          .insert({
            user_id: user.id,
            session_id: null,
            provider: llmConfig.provider,
            model: llmConfig.model,
            prompt_tokens: usage.prompt_tokens || 0,
            completion_tokens: usage.completion_tokens || 0,
            estimated_cost_usd: cost,
          })
          .then(({ error }: { error: { message: string } | null }) => {
            if (error) console.error("[API_USAGE] Failed to log usage:", error);
          });
      }
    } else {
      console.error("[Onboarding] Summary LLM call failed:", summaryRes.status, await summaryRes.text().catch(() => "N/A"));
      summaryUpdate.company_summary = "Empresa cadastrada via onboarding.";
    }

    // Persist the enrichment. is_onboarded is already true from above, so even
    // if this write fails the user is not trapped.
    const { error: enrichErr, data: enrichRows } = await admin
      .from("briefing_profiles")
      .update(summaryUpdate)
      .eq("id", user.id)
      .select("id");
    if (enrichErr || !enrichRows || enrichRows.length === 0) {
      await supabaseSession.from("briefing_profiles").update({ company_summary: summaryUpdate.company_summary }).eq("id", user.id);
    }

    return NextResponse.json({ isFinished: true, updates: {}, nextQuestion: null, assets: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Onboarding API Error:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

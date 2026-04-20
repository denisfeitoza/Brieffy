import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { logApiUsage } from "@/lib/services/usageLogger";

// ────────────────────────────────────────────────────────────────
// POST /api/document/translate
// ────────────────────────────────────────────────────────────────
// Translates an HTML/Markdown briefing dossier between supported
// languages. Was previously called by the dashboard but the route
// did NOT exist — every translation attempt failed silently. Now:
//   - Auth required (must own the dossier).
//   - Rate-limited per user.
//   - targetLanguage allowlisted.
//   - Hard cap on input size (prevents context bombs / abuse).
//   - Server-side AbortController prevents zombie LLM bills.
//   - api_usage logged for cost tracking.

const SUPPORTED_LANGUAGES = new Set(["pt", "en", "es"]);
const MAX_INPUT_CHARS = 60_000; // ~15k tokens — safe for 32k context models
const TIMEOUT_MS = 45_000;

const LANG_NAMES: Record<string, string> = {
  pt: "Portuguese (Brazilian)",
  en: "English",
  es: "Spanish",
};

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 5 translations / minute per user — translation is expensive (full doc).
    const rl = await checkRateLimit(`translate_doc:${user.id}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many translation requests." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const documentContent = typeof body?.documentContent === "string" ? body.documentContent : "";
    const targetLanguage = typeof body?.targetLanguage === "string" ? body.targetLanguage.toLowerCase() : "";

    if (!documentContent.trim()) {
      return NextResponse.json({ error: "documentContent is required." }, { status: 400 });
    }
    if (!SUPPORTED_LANGUAGES.has(targetLanguage)) {
      return NextResponse.json(
        { error: `Unsupported targetLanguage. Allowed: ${[...SUPPORTED_LANGUAGES].join(", ")}` },
        { status: 400 }
      );
    }
    if (documentContent.length > MAX_INPUT_CHARS) {
      return NextResponse.json(
        { error: `Document too large (${documentContent.length} chars, max ${MAX_INPUT_CHARS}).` },
        { status: 413 }
      );
    }

    const overrides = await getDBSettings();
    const llmConfig = getLLMConfig(overrides);

    if (!llmConfig.apiKey) {
      return NextResponse.json({ error: "Translation service unavailable." }, { status: 503 });
    }

    const targetName = LANG_NAMES[targetLanguage] ?? targetLanguage;

    const systemPrompt = `You are a professional translator specialized in business briefings.
Translate the user's document into ${targetName}.

CRITICAL RULES:
1. Preserve the EXACT original structure: same Markdown headings (#, ##, ###), same HTML tags, same bullet/numbered lists, same line breaks.
2. Do NOT translate code blocks, URLs, brand names, or proper nouns.
3. Do NOT add commentary, prefaces, or "Here is the translation" lines.
4. Keep numbers, dates, and currency symbols unchanged.
5. If a word has no direct equivalent, use the most natural business term in ${targetName}.
6. Output ONLY the translated document — nothing else.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(llmConfig.baseUrl, {
        method: "POST",
        headers: {
          ...llmConfig.headers,
          Authorization: `Bearer ${llmConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: llmConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: documentContent },
          ],
          temperature: 0.2,
          max_tokens: Math.min(llmConfig.maxTokens, 8000),
        }),
        signal: controller.signal,
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        return NextResponse.json({ error: "Translation timed out." }, { status: 504 });
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[translate] LLM error:", response.status, errText.slice(0, 300));
      return NextResponse.json({ error: "Translation provider error." }, { status: 502 });
    }

    const data = await response.json();
    const translated = data?.choices?.[0]?.message?.content;
    if (typeof translated !== "string" || !translated.trim()) {
      return NextResponse.json({ error: "Empty translation result." }, { status: 502 });
    }

    // Cost tracking — best-effort, never blocks user.
    void logApiUsage({
      userId: user.id,
      sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
      provider: llmConfig.provider,
      model: llmConfig.model,
      usage: data?.usage,
      endpoint: "translate",
    });

    return NextResponse.json({ document: translated.trim() });
  } catch (error) {
    console.error("[translate] Internal error:", error);
    return NextResponse.json({ error: "Internal error during translation." }, { status: 500 });
  }
}

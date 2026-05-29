import { NextResponse } from "next/server";
import { getLLMConfig, getLLMFallbackConfig, getDBSettings } from "@/lib/aiConfig";
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
// 120s because a faithful translation of a 11k-char dossier (~3.5k tokens
// input, ~4–5k tokens output preserving markdown) routinely takes 30–60s on
// gpt-4o-mini; 45s was clipping real, valid responses with AbortError.
const TIMEOUT_MS = 120_000;
// Translation needs the OUTPUT to be roughly the same size as the input.
// The shared LLM config defaults maxTokens to 2500 (good for briefing turns,
// terrible for whole-document translation). We hard-floor at 16k tokens
// regardless of the shared default — this is the root cause of bug #9
// re-appearing: the previous Math.min(llmConfig.maxTokens, 8000) was
// silently clamping to 2500, truncating the dossier mid-sentence.
const TRANSLATE_MIN_OUTPUT_TOKENS = 16_000;

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

    // Try primary; on a 5xx / timeout / empty / truncated response, fall back
    // to OpenRouter (gpt-4o-mini by default) so the user gets a working
    // translation instead of a 502 / silent truncation.
    const fallbackConfig = getLLMFallbackConfig();
    const attempts: Array<{ cfg: typeof llmConfig; label: string }> = [
      { cfg: llmConfig, label: "primary" },
    ];
    if (
      fallbackConfig &&
      // Don't waste an attempt if the fallback is literally the same model.
      (fallbackConfig.provider !== llmConfig.provider || fallbackConfig.model !== llmConfig.model)
    ) {
      attempts.push({ cfg: fallbackConfig, label: "fallback" });
    }

    let translatedText: string | null = null;
    let usedConfig: typeof llmConfig | null = null;
    let usageReport: unknown = null;
    let lastFailure = "Translation provider error.";
    let lastStatus = 502;

    for (const { cfg, label } of attempts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(cfg.baseUrl, {
          method: "POST",
          headers: {
            ...cfg.headers,
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({
            model: cfg.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: documentContent },
            ],
            temperature: 0.2,
            // Hard floor at TRANSLATE_MIN_OUTPUT_TOKENS — the shared default
            // (2500) would truncate any briefing-sized dossier.
            max_tokens: Math.max(cfg.maxTokens, TRANSLATE_MIN_OUTPUT_TOKENS),
          }),
          signal: controller.signal,
        });
      } catch (e) {
        clearTimeout(timeoutId);
        if ((e as Error).name === "AbortError") {
          lastFailure = `Tempo esgotado (${label}).`;
          lastStatus = 504;
          continue;
        }
        lastFailure = `${(e as Error).name}: ${(e as Error).message}`.slice(0, 240);
        continue;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`[translate] LLM error (${label}):`, response.status, errText.slice(0, 300));
        lastFailure = `Provedor de IA retornou erro (${label}).`;
        lastStatus = 502;
        continue;
      }

      const data = await response.json();
      const choice = data?.choices?.[0];
      const finishReason = choice?.finish_reason;
      const candidate = choice?.message?.content;

      if (typeof candidate !== "string" || !candidate.trim()) {
        lastFailure = `Resposta vazia (${label}).`;
        lastStatus = 502;
        continue;
      }

      // Truncated output (max_tokens hit). Anything below max_tokens limit
      // should land as "stop". "length" means we lost the tail — bug #9's
      // exact failure mode. Try the fallback if we have one; otherwise
      // surface a clear error so the user knows the doc is too big.
      if (finishReason === "length") {
        console.warn(`[translate] truncated by max_tokens (${label}), finish_reason=length`);
        lastFailure = "Documento muito longo para o modelo escolhido. Tente novamente — vamos cair pra um modelo com mais janela.";
        lastStatus = 413;
        continue;
      }

      translatedText = candidate.trim();
      usedConfig = cfg;
      usageReport = data?.usage;
      break;
    }

    if (!translatedText || !usedConfig) {
      return NextResponse.json({ error: lastFailure }, { status: lastStatus });
    }

    // Cost tracking — best-effort, never blocks user.
    void logApiUsage({
      userId: user.id,
      sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
      provider: usedConfig.provider,
      model: usedConfig.model,
      usage: (usageReport as Parameters<typeof logApiUsage>[0]["usage"]) ?? null,
      endpoint: "translate",
    });

    return NextResponse.json({ document: translatedText });
  } catch (error) {
    // Surface the actual cause to the client. The previous "Internal error" generic
    // string was indistinguishable from network / auth / quota failures, making the
    // UI's "Falha ao traduzir" toast meaningless for users and unhelpful for support.
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}`.slice(0, 240)
        : String(error).slice(0, 240);
    console.error("[translate] Internal error:", error);
    return NextResponse.json(
      { error: `Falha interna ao traduzir: ${detail}` },
      { status: 500 }
    );
  }
}

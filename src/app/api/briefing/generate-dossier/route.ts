import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";
import { logApiUsage } from "@/lib/services/usageLogger";
import { createLogger } from "@/lib/logger";

const log = createLogger("dossier");

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit per user: 10 dossiers / minute (LLM cost guard)
    const rl = await checkRateLimit(`dossier:${user.id}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests, please slow down." },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // 1. Fetch Session Data
    const { data: session, error: sessionError } = await supabase
      .from('briefing_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      console.error("[generate-dossier] Session Query Error:", sessionError, "SessionID:", sessionId);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // CRITICAL: ownership check (defense in depth on top of RLS)
    if (session.user_id && session.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let templateContext = 'Nenhum contexto inicial fornecido.';
    if (session.template_id) {
       const { data: tmpl } = await supabase
         .from('briefing_templates')
         .select('initial_context, user_id')
         .eq('id', session.template_id)
         .maybeSingle();
       // Extra guard: template must also belong to caller (or be public template w/o user_id)
       if (tmpl && tmpl.user_id && tmpl.user_id !== user.id) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
       }
       if (tmpl?.initial_context) templateContext = tmpl.initial_context;
    }

    // The unused IP read keeps lint quiet if rateLimit is later swapped to IP-based
    void getRequestIP(req);

    // 2. Prepare Context (same logic as the standard endpoint)
    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);
    
    if (!llmConfig.apiKey) {
       return NextResponse.json({ error: "AI API Key missing" }, { status: 500 });
    }

    const fullState = session.company_info || {};
    const history = session.messages_snapshot || [];

    // ────────────────────────────────────────────────────────────
    // Compact dossier inputs before sending to the LLM.
    // Why: messages_snapshot can grow to thousands of tokens after a long
    // briefing; pasting it raw doubles cost and can blow context windows.
    // We keep role + truncated content (cap each message at 600 chars) and
    // strip null/empty fields from fullState (cap each value at 500 chars).
    // ────────────────────────────────────────────────────────────
    const MAX_MSG_CHARS = 600;
    const MAX_FIELD_CHARS = 500;

    type HistMsg = { role?: string; content?: unknown };
    const compactHistory = (Array.isArray(history) ? history : []).reduce<Array<{ role: string; content: string }>>((acc, raw: HistMsg) => {
      const role = typeof raw?.role === "string" ? raw.role : "user";
      const rawContent = typeof raw?.content === "string" ? raw.content : (raw?.content == null ? "" : JSON.stringify(raw.content));
      const trimmed = rawContent.trim();
      if (!trimmed) return acc;
      const content = trimmed.length > MAX_MSG_CHARS
        ? `${trimmed.slice(0, MAX_MSG_CHARS)}…[truncated ${trimmed.length - MAX_MSG_CHARS} chars]`
        : trimmed;
      acc.push({ role, content });
      return acc;
    }, []);

    const compactFullState = Object.entries(fullState).reduce<Record<string, unknown>>((acc, [k, v]) => {
      if (v === null || v === undefined) return acc;
      if (typeof v === "string") {
        const trimmed = v.trim();
        if (!trimmed) return acc;
        acc[k] = trimmed.length > MAX_FIELD_CHARS
          ? `${trimmed.slice(0, MAX_FIELD_CHARS)}…[truncated]`
          : trimmed;
        return acc;
      }
      if (typeof v === "number" || typeof v === "boolean") { acc[k] = v; return acc; }
      try {
        const json = JSON.stringify(v);
        if (!json || json === "{}" || json === "[]") return acc;
        acc[k] = json.length > MAX_FIELD_CHARS ? `${json.slice(0, MAX_FIELD_CHARS)}…[truncated]` : json;
      } catch { /* skip unserializable */ }
      return acc;
    }, {});

    log.info(`Generating dossier for session ${sessionId} (compact: ${compactHistory.length} msgs, ${Object.keys(compactFullState).length} fields)…`);

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    let docRes: Response;
    try {
      docRes = await fetch(llmConfig.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${llmConfig.apiKey}`,
          ...llmConfig.headers,
        },
        body: JSON.stringify({
          model: llmConfig.model,
          temperature: 0.3,
          max_tokens: 3000,
          messages: [
            { role: "system", content: docSystemPrompt },
            { role: "user", content: `DADOS EXTRAÍDOS (JSON, valores compactados):\n${JSON.stringify(compactFullState, null, 2)}\n\nCONTEXTO INICIAL (Preparação):\n${templateContext}\n\nHISTÓRICO DA SESSÃO (mensagens truncadas a ${MAX_MSG_CHARS} chars cada):\n${JSON.stringify(compactHistory, null, 2)}` }
          ],
        }),
        signal: controller.signal,
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        return NextResponse.json({ error: "Dossier generation timed out." }, { status: 504 });
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!docRes.ok) {
       console.error("LLM Error:", await docRes.text());
       return NextResponse.json({ error: "Failed generating document from LLM" }, { status: 500 });
    }

    const docData = await docRes.json();
    const mdContent = docData.choices?.[0]?.message?.content?.trim();

    void logApiUsage({
      userId: user.id,
      sessionId,
      provider: llmConfig.provider,
      model: llmConfig.model,
      usage: docData?.usage,
      endpoint: "dossier_regen",
    });

    if (!mdContent) {
       return NextResponse.json({ error: "Empty generation" }, { status: 500 });
    }

    // 3. Save directly to Final Assets
    let finalAssets = session.final_assets || {};
    if (typeof finalAssets !== 'object') finalAssets = {};
    finalAssets.document = mdContent;
    
    if (!finalAssets.score) {
       finalAssets.score = { clareza_marca: 8, clareza_dono: 8, publico: 8, maturidade: 8 };
       finalAssets.insights = ["Dossiê gerado retroativamente."];
    }

    const { error: updateError } = await supabase
      .from('briefing_sessions')
      .update({ final_assets: finalAssets, status: 'finished' })
      .eq('id', sessionId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save generated document" }, { status: 500 });
    }

    return NextResponse.json({ success: true, document: mdContent });

  } catch (error) {
    console.error("API Error (generate-dossier):", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { logApiUsage } from "@/lib/services/usageLogger";

// Sanitize untrusted file names before injecting into a system prompt
// to mitigate prompt injection via crafted file names.
function sanitizeFileName(raw: unknown): string {
  if (typeof raw !== 'string') return 'documento';
  return raw
    .replace(/[\r\n\t<>{}`"\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'documento';
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`summarize_doc:${user.id}`, { maxRequests: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many summarization requests." },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { text, fileName } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto inválido ou não fornecido." }, { status: 400 });
    }

    // Limit the maximum input to 24,000 caracteres (~6000-7000 tokens)
    // to strictly prevent 400 Bad Request (Context Length Exceeded) errors on 8K models like Llama 3!
    const safeText = text.substring(0, 24000);
    const safeFileName = sanitizeFileName(fileName);

    const systemPrompt = `Você é um Estrategista de Projetos Sênior focado em extrair essencialidades para briefings. 
O usuário enviará o conteúdo bruto de um documento (chamado ${safeFileName}). 
Sua tarefa é criar um Resumo Executivo ultra-denso e objetivo desse material.

Foque EXCLUSIVAMENTE em extrair:
1. Identidade, Personalidade e Valores da Marca
2. Público-Alvo e Perfil de Cliente citado
3. Dores, Problemas ou Desafios relatados
4. Objetivos (Estratégicos, Financeiros, de Marketing)
5. Regras, Restrições ou Especificações Técnicas importantes

Regras:
- Ignore todo o conteúdo irrelevante (sumários, índices, introduções vazias, páginas em branco).
- Use bullet points objetivos.
- Seja extremamente conciso para economizar tokens, mas não perca nenhuma informação estratégica vital.
- O formato de saída NÃO deve usar formatações MD exageradas (nada de tabelas complexas), apenas títulos e bullet points simples.
- Retorne apenas o resumo, sem introduções amigáveis como "Aqui está o resumo...".`;

    const overrides = await getDBSettings();
    const llmConfig = getLLMConfig(overrides);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000); // 25s timeout for longer docs

    const response = await fetch(llmConfig.baseUrl, {
      method: "POST",
      headers: {
        ...llmConfig.headers,
        Authorization: `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Conteúdo Bruto para sumariar:\n\n${safeText}` },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error("LLM Summarization API error:", errText);
      return NextResponse.json({ error: "Falha na API de inteligência artificial ao resumir." }, { status: 502 });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "";

    void logApiUsage({
      userId: user.id,
      sessionId: null,
      provider: llmConfig.provider,
      model: llmConfig.model,
      usage: data?.usage,
      endpoint: "summarize_doc",
    });

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error("Error in summarize-document:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

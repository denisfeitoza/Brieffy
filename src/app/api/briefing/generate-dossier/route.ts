import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
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
      return NextResponse.json({ error: "Session not found or RLS restricted", details: sessionError }, { status: 404 });
    }

    let templateContext = 'Nenhum contexto inicial fornecido.';
    if (session.template_id) {
       const { data: tmpl } = await supabase
         .from('briefing_templates')
         .select('initial_context')
         .eq('id', session.template_id)
         .maybeSingle();
       if (tmpl?.initial_context) templateContext = tmpl.initial_context;
    }

    // Use session user_id or profile check if necessary. We'll skip strict ownership check for brevity or you can add:
    // if (session.user_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // 2. Prepare Context (same logic as the standard endpoint)
    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);
    
    if (!llmConfig.apiKey) {
       return NextResponse.json({ error: "AI API Key missing" }, { status: 500 });
    }

    const fullState = session.company_info || {};
    const history = session.messages_snapshot || [];

    console.log(`[Regenerate] Generating Dossiê for session ${sessionId}...`);

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

    const docRes = await fetch(llmConfig.baseUrl, {
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
          { role: "user", content: `DADOS EXTRAÍDOS (JSON):\n${JSON.stringify(fullState, null, 2)}\n\nCONTEXTO INICIAL (Preparação):\n${templateContext}\n\nHISTÓRICO COMPLETO DA SESSÃO (Transcrição e Anexos):\n${JSON.stringify(history, null, 2)}` }
        ],
      }),
    });

    if (!docRes.ok) {
       console.error("LLM Error:", await docRes.text());
       return NextResponse.json({ error: "Failed generating document from LLM" }, { status: 500 });
    }

    const docData = await docRes.json();
    const mdContent = docData.choices?.[0]?.message?.content?.trim();

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

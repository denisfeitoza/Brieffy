import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings, estimateCost } from "@/lib/aiConfig";
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
    const { answer, currentState, history, generateMore, chosenLanguage } = body;
    const activeLang = chosenLanguage || "pt";

    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);

    const step = history ? Math.floor(history.length / 2) : 0;
    const isFinished = step >= 8;

    // If step is exactly 8, the user just answered the 8th question. Let's process the summary and finish.
    if (isFinished) {
      // 1. Generate Summary
      const summaryPrompt = `Based on the following 8 onboarding questions and answers, generate a concise company summary and identify the primary brand color.
      
      The 'company_summary' MUST BE a VERY CONCISE, rapid briefing about the company (What they do, their target audience, and their tone/style/identity). This summary will be injected into future AI system prompts to provide context about this company when generating briefings for their own clients. 
      DO NOT include their internal struggles, difficulties, or how Brieffy will help them in this summary, as this is only context for the AI to emulate their brand. Make it short and direct.
      
      History:
      ${JSON.stringify(history, null, 2)}
      
      Return ONLY valid JSON format:
      {
        "company_summary": "Concise Context Summary...",
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
        let contentStr = summaryData.choices?.[0]?.message?.content || "";
        const usage = summaryData.usage;
        
        let content;
        try {
          contentStr = contentStr.replace(/```json/g, "").replace(/```/g, "").trim();
          content = JSON.parse(contentStr);
        } catch(e) {
          console.error("Summary Parse Error:", e, contentStr);
          content = {
            company_summary: "Agência/Empresa identificada durante o onboarding.",
            brand_color: "#06b6d4"
          };
        }
        
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
    const systemPrompt = `Você é o Consultor de Onboarding da Brieffy. Seu objetivo é entender a empresa do usuário em EXATAMENTE 8 interações curtas.
    Pergunta atual: ${step + 1} de 8.
    
    OBJETIVO PRINCIPAL: DEMONSTRAR CAPACIDADE DE UI E LEVANTAR DADOS BÁSICOS.
    O onboarding deve ser RÁPIDO e focado em mostrar a variedade de formatos de pergunta da nossa plataforma.
    NUNCA OFEREÇA, prometa ou pergunte se o usuário deseja receber um "plano de ação", "relatório", "diagnóstico" ou entregáveis. A Brieffy não faz isso neste momento. Seja objetivo e avance para a próxima pergunta.

    Durante as 8 interações, você deve cobrir assuntos para usar TODOS os componentes visuais sem repetí-los:
    Sugestão de fluxo: O que a empresa faz (text) -> Tempo de mercado (slider) -> Público-alvo (card_selector) -> Posicionamento (multi_slider) -> Cor (color_picker) -> Identidade/Fonte (single_choice) -> Desafios (multiple_choice) -> Decisão Estratégica (boolean_toggle).

    REGRA CRÍTICA - IDIOMA OBRIGATÓRIO:
    O usuário selecionou o idioma ISO '${activeLang}'. TODAS as suas respostas, perguntas e opções do array MUST BE IN THIS EXACT LANGUAGE ('${activeLang}'). If '${activeLang}' is 'en', answer in English. If 'es', answer in Spanish.
    
    REGRA CRÍTICA - TOM CONVERSACIONAL E NATURAL (PROIBIDO SER ROBÔ):
    1. É ESTRITAMENTE PROIBIDO fazer resumos de validação chatos como: "Considerando os serviços que..."
    2. Não seja prolixo. Faça a pergunta de forma mais limpa e direta humanamente possível.
    
    REGRA CRÍTICA - EXPERIÊNCIA VISUAL MÁGICA: Para que a experiência surpreenda, você DEVE usar cada um dos 8 componentes (questionType) listados abaixo APENAS UMA VEZ durante o onboarding de 8 perguntas:
    - \`single_choice\` (Para estilos, opções excludentes. Ex: "Inter - Minimalista")
    - \`multiple_choice\` (Para múltiplas seleções: serviços, desafios, canais)
    - \`boolean_toggle\` (Para dilemas Sim/Não ou decisões estratégicas binárias)
    - \`card_selector\` (Excelente para escolher Persona/Perfil do Cliente Ideal - exatamente 6 cartas descritivas)
    - 'multi_slider' (Excelente para DNA de Marca, Perfil de Marketing. Defina de 3 a 5 dimensões numéricas numa escala OBRIGATÓRIA de 1 a 5)
    - 'color_picker' (Exclusivo para tom de identidade visual/cor base. Peça apenas 1 vez)
    - 'slider' (Para maturidade, preço ou escalas simples de 0 a 10)
    - 'text' (Para nome, site, e respostas curtas abertas)
    
    REGRA CRÍTICA - PROIBIDO REPETIR PERGUNTAS DE CORES: 
    Se a questão for sobre cores, paletas de cores ou identidade visual, VOCÊ DEVE USAR EXCLUSIVAMENTE o questionType 'color_picker'.
    
    REGRA CRÍTICA - VALID OPTIONS: Para 'single_choice', 'multiple_choice', e 'card_selector', você PRECISA fornecer um array 'options' de strings RICO e INTELIGENTE (3 a 8 opções).
    Para 'multi_slider', você DEVE fornecer um array de objetos, onde CADA objeto possui os campos: "label" (string), "min" (numero 1), "max" (numero 5), "minLabel" (string) e "maxLabel" (string). Exemplo: {"label": "Design", "min": 1, "max": 5, "minLabel": "Clássico", "maxLabel": "Moderno"}.
    
    Se 'generateMore' for true, preserve o texto da pergunta mas reinvente completamente o array de 'options' para entregar novas opções criativas.
    
    Histórico da conversa: ${JSON.stringify(history)}
    Estado acumulado: ${JSON.stringify(currentState)}
    
    Responda EXCLUSIVAMENTE em JSON válido, garantindo o formato e obedecendo o idioma '${activeLang}':
    {"updates":{},"nextQuestion":{"text":"Pergunta curta humana direta...","questionType":"tipo_aqui","options":["Opção 1", "Opção 2"], "allowMoreOptions": false},"isFinished":false}`;


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
    let content = data.choices?.[0]?.message?.content;
    const usage = data.usage;
    
    if (!content || content.trim() === '') {
      console.error("[Onboarding] LLM returned empty content. Full response:", JSON.stringify(data));
      return NextResponse.json({ error: "AI returned empty response. Please try again." }, { status: 500 });
    }

    let parsed;
    try {
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("[Onboarding parse error]:", parseError, "Raw content:", content);
      return NextResponse.json({ error: "Invalid response from AI. Please try again." }, { status: 500 });
    }

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

  } catch (error: any) {
    console.error("Onboarding API Error:", error?.message || error, error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

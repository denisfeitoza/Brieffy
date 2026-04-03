import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";

// ================================================================
// DOCUMENT GENERATOR — Creates the final structured briefing document
// Uses FULL conversation history to generate a comprehensive deliverable
// ================================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { history, briefingState, assets, activeTemplate, chosenLanguage, detectedSignals } = body;

    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);

    if (!llmConfig.apiKey) {
      return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    const templateName = activeTemplate?.name || "Briefing Geral";
    const objectives = activeTemplate?.objectives?.join(", ") || "Criar briefing completo do negócio";
    const briefingPurpose = activeTemplate?.briefing_purpose || "";

    const roleLabels: Record<string, { ai: string; client: string }> = {
      en: { ai: 'AI', client: 'Client' },
      es: { ai: 'IA', client: 'Cliente' },
      pt: { ai: 'IA', client: 'Cliente' },
    };
    const roles = roleLabels[chosenLanguage || 'pt'] || roleLabels.pt;
    const conversationTranscript = history.map((m: { role: string; content: string }) => {
      const role = m.role === "assistant" ? roles.ai : roles.client;
      return `[${role}]: ${m.content}`;
    }).join("\n\n");

    const langMap: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'pt': 'Portuguese (pt-BR)',
    };
    const targetLang = langMap[chosenLanguage || 'pt'] || 'Portuguese (pt-BR)';

    const categoryLabelMap: Record<string, Record<string, string>> = {
      pt: {
        contradiction: '⚡ Contradição',
        implicit_pain: '🔥 Dor Implícita',
        evasion: '👁 Evasão',
        hidden_ambition: '💡 Ambição Oculta',
        strategic_gap: '🗺 Lacuna Estratégica'
      },
      en: {
        contradiction: '⚡ Contradiction',
        implicit_pain: '🔥 Implicit Pain',
        evasion: '👁 Evasion',
        hidden_ambition: '💡 Hidden Ambition',
        strategic_gap: '🗺 Strategic Gap'
      },
      es: {
        contradiction: '⚡ Contradicción',
        implicit_pain: '🔥 Dolor Implícito',
        evasion: '👁 Evasión',
        hidden_ambition: '💡 Ambición Oculta',
        strategic_gap: '🗺 Brecha Estratégica'
      }
    };
    const catLabels = categoryLabelMap[chosenLanguage || 'pt'] || categoryLabelMap.pt;

    // i18n document structure — section headers and instructions per language
    const docI18n: Record<string, {
      listeningTitle: string; listeningSubtitle: string; relevanceLabel: string; triggeredBy: string;
      role: string; langRule: string; task: string; objectivesLabel: string; purposeLabel: string;
      collectedLabel: string; assetsLabel: string; transcriptLabel: string;
      structureHeader: string; structureInstructions: string; adaptiveRule: string;
      title: string;
      s1: string; s1desc: string; s1who: string; s1what: string; s1where: string; s1action: string;
      s2: string; s2items: string;
      s3: string; s3items: string; s3map: string; s3mapInstr: string; s3mapCond: string;
      s4: string; s4items: string;
      s5: string; s5items: string;
      s6: string; s6items: string; s6fallback: string;
      s7: string; s7items: string;
      s8: string; s8instr: string; s8headers: string; s8cond: string;
      s9: string; s9instr: string; s9legend: string; s9dims: string; s9overall: string;
      s10: string; s10instr: string; s10what: string; s10why: string; s10impact: string;
      rules: string[];
      watermark: string;
      userMsg: string;
    }> = {
      pt: {
        listeningTitle: '🔍 Inteligência de Escuta Ativa',
        listeningSubtitle: 'Insights capturados a partir de sinais subliminares nas respostas do cliente. Visível apenas no relatório da agência.',
        relevanceLabel: 'de relevância', triggeredBy: 'Ativado por',
        role: 'Você é um Estrategista de Marca Sênior e consultor nível McKinsey criando um Documento de Briefing premium que um CEO teria orgulho de apresentar ao conselho.',
        langRule: 'REGRA ABSOLUTA DE IDIOMA: Escreva o documento INTEIRO em Portuguese (pt-BR). Todos os cabeçalhos, bullet points, rótulos e texto analítico DEVEM ser em Portuguese (pt-BR).',
        task: 'TAREFA: Analise TODA a conversa abaixo e produza um documento de briefing completo e estruturado que destila respostas brutas em INTELIGÊNCIA ESTRATÉGICA.',
        objectivesLabel: 'OBJETIVOS', purposeLabel: 'PROPÓSITO ESTRATÉGICO',
        collectedLabel: 'DADOS COLETADOS (estruturados)', assetsLabel: 'ASSETS GERADOS', transcriptLabel: 'TRANSCRIÇÃO COMPLETA DA CONVERSA',
        structureHeader: 'ESTRUTURA DO DOCUMENTO', structureInstructions: 'Gere um documento rico e profissional em formato Markdown com estas seções.',
        adaptiveRule: 'REGRA ADAPTATIVA: Se uma seção NÃO tem dados coletados durante a conversa, NÃO inclua uma seção vazia. Em vez disso, substitua por uma nota breve de "Recomendações" explicando POR QUE esses dados importam e como coletá-los.',
        title: '📋 Briefing Estratégico — [Nome da Empresa]',
        s1: '⚡ Resumo Executivo', s1desc: 'Esta é a seção MAIS importante. Escreva 3-4 bullet points que um CEO leria em 30 segundos:', s1who: 'QUEM são (1 frase)', s1what: 'O QUE os torna únicos (1 frase)', s1where: 'ONDE está a oportunidade (1 frase)', s1action: 'O QUE devem fazer PRIMEIRO (1 ação)',
        s2: '🏢 Perfil da Empresa', s2items: '- Nome, idade, setor\n- Serviços/produtos oferecidos\n- Relação do fundador com a marca\n- Significado/história do nome da marca\n- Avaliação do estágio de maturidade',
        s3: '🎯 Mercado & Posicionamento Estratégico', s3items: '- Concorrentes diretos mencionados\n- Diferenciais competitivos\n- Canais de comunicação usados\n- Alcance geográfico\n- Estratégia de posicionamento', s3map: 'Mapa de Posicionamento Competitivo', s3mapInstr: 'Crie uma análise de posicionamento em TEXTO comparando a empresa contra seus concorrentes mencionados em dimensões-chave (preço, qualidade, inovação, reconhecimento). Use tabela markdown:', s3mapCond: 'Inclua apenas se concorrentes foram discutidos.',
        s4: '👥 Público-Alvo', s4items: '- Demografia (idade, renda, localização, profissão)\n- Psicografia (valores, interesses, dores)\n- Resumo da persona compradora (escreva como um "mini retrato" narrativo)',
        s5: '🎨 Identidade & Personalidade da Marca', s5items: '- Palavras-chave que definem a marca\n- Traços de personalidade da marca\n- Tom de voz (com exemplos de como soa na prática)\n- Missão, visão, valores (se capturados)',
        s6: '🖼 Direção Visual', s6items: '- Preferências de paleta de cores (com códigos HEX se disponíveis)\n- Referências de estilo e preferências visuais\n- Direção tipográfica\n- Direção de logo (se discutido)', s6fallback: 'Se poucos dados visuais foram coletados, renomeie para "Recomendações de Direção Visual" e sugira o que explorar.',
        s7: '🧠 Insights Estratégicos & Inteligência', s7items: '- Inferências-chave extraídas (o que o cliente DISSE vs o que QUIS DIZER)\n- Oportunidades estratégicas identificadas\n- Contradições ou tensões encontradas durante a conversa\n- Observações "nas entrelinhas"',
        s8: '⚠️ Matriz de Riscos & Oportunidades', s8instr: 'Apresente como tabela markdown:', s8headers: '| Categoria | Risco / Oportunidade | Impacto | Prioridade | Recomendação |', s8cond: 'Inclua 4-6 itens cobrindo: riscos de mercado, riscos de marca, riscos de audiência e oportunidades estratégicas.',
        s9: '📊 Score de Saúde da Marca', s9instr: 'Avalie cada dimensão de 1-10 com indicador visual e justificativa breve:', s9legend: '🟢 (7-10) Forte | 🟡 (4-6) Precisa atenção | 🔴 (1-3) Crítico', s9dims: '- Clareza de Marca\n- Compreensão de Mercado\n- Definição de Audiência\n- Coesão Visual\n- Maturidade Estratégica', s9overall: 'Score Geral: X/50 → [Nível de avaliação]',
        s10: '🚀 Próximos Passos Acionáveis', s10instr: 'Lista ordenada das TOP 5 ações recomendadas, cada uma com:', s10what: 'O que', s10why: 'Por que', s10impact: 'Impacto Esperado',
        rules: [
          `Escreva em ${targetLang}`,
          'Extraia CADA informação da conversa — nada deve ser perdido',
          'Inclua citações diretas do cliente onde impactantes (use blockquotes)',
          'Seja ESPECÍFICO, não genérico — use dados reais da conversa',
          'Use linguagem baseada em dados: "Com base em X, recomendamos Y porque Z"',
          'Faça parecer um entregável de consultoria de R$50.000',
          'Use emojis apenas nos cabeçalhos de seção',
          'Inclua dados quantitativos onde possível',
          'Se a seção 11 (Escuta Ativa) existir, use linguagem estratégica profissional, agrupada por categoria com citações diretas',
        ],
        watermark: 'Este briefing foi gerado pela Brieffy AI.',
        userMsg: 'Gere o documento de briefing completo agora com base em todas as informações coletadas.',
      },
      en: {
        listeningTitle: '🔍 Active Listening Intelligence',
        listeningSubtitle: 'Insights captured from subliminal signals in client responses. Visible only in the agency report.',
        relevanceLabel: 'relevance', triggeredBy: 'Triggered by',
        role: 'You are a Senior Brand Strategist and McKinsey-level consultant creating a premium Briefing Document that a CEO would be proud to present to their board.',
        langRule: 'CRITICAL LANGUAGE CONSTRAINT: Write the ENTIRE document in English. All section headers, bullet points, labels, and analytical text MUST be in English.',
        task: 'TASK: Analyze the ENTIRE conversation below and produce a comprehensive, structured briefing document that distills raw answers into STRATEGIC INTELLIGENCE.',
        objectivesLabel: 'OBJECTIVES', purposeLabel: 'STRATEGIC PURPOSE',
        collectedLabel: 'COLLECTED DATA (structured)', assetsLabel: 'GENERATED ASSETS', transcriptLabel: 'FULL CONVERSATION TRANSCRIPT',
        structureHeader: 'DOCUMENT STRUCTURE', structureInstructions: 'Generate a rich, professional document in Markdown format with these sections.',
        adaptiveRule: 'ADAPTIVE RULE: If a section has NO data collected during the conversation, do NOT include an empty section. Instead, replace it with a brief "Recommendations" note explaining WHY this data matters and how to collect it.',
        title: '📋 Strategic Briefing — [Company Name]',
        s1: '⚡ Executive Summary', s1desc: 'This is the MOST important section. Write 3-4 bullet points that a CEO would read in 30 seconds:', s1who: 'WHO they are (1 sentence)', s1what: 'WHAT makes them unique (1 sentence)', s1where: 'WHERE the opportunity lies (1 sentence)', s1action: 'WHAT they should do FIRST (1 action)',
        s2: '🏢 Company Profile', s2items: '- Company name, age, sector\n- Services/products offered\n- Founder\'s relationship with the brand\n- Brand name meaning/story\n- Company maturity stage assessment',
        s3: '🎯 Market & Strategic Positioning', s3items: '- Direct competitors mentioned\n- Competitive differentiators\n- Communication channels used\n- Geographic reach\n- Market positioning strategy', s3map: 'Competitor Positioning Map', s3mapInstr: 'Create a TEXT-BASED positioning analysis comparing the company against its mentioned competitors across key dimensions (price, quality, innovation, brand recognition). Use a simple markdown table:', s3mapCond: 'Only include this if competitors were discussed.',
        s4: '👥 Target Audience', s4items: '- Demographics (age, income, location, profession)\n- Psychographics (values, interests, pain points)\n- Buyer persona summary (write as a narrative "mini portrait")',
        s5: '🎨 Brand Identity & Personality', s5items: '- Keywords that define the brand\n- Brand personality traits\n- Tone of voice (with examples of how it sounds in practice)\n- Mission, vision, values (if captured)',
        s6: '🖼 Visual Direction', s6items: '- Color palette preferences (with HEX codes if available)\n- Style references and visual preferences\n- Typography direction\n- Logo direction (if discussed)', s6fallback: 'If minimal visual data was collected, rename to "Visual Direction Recommendations" and suggest what to explore next.',
        s7: '🧠 Strategic Insights & Intelligence', s7items: '- Key inferences extracted (what the client SAID vs what they MEANT)\n- Strategic opportunities identified\n- Contradictions or tensions found during the conversation\n- "Between the lines" observations',
        s8: '⚠️ Risk & Opportunity Matrix', s8instr: 'Present as a markdown table:', s8headers: '| Category | Risk / Opportunity | Impact | Priority | Recommendation |', s8cond: 'Include 4-6 items covering: market risks, brand risks, audience risks, and strategic opportunities.',
        s9: '📊 Brand Health Score', s9instr: 'Rate each dimension 1-10 with visual indicator and brief justification:', s9legend: '🟢 (7-10) Strong | 🟡 (4-6) Needs attention | 🔴 (1-3) Critical', s9dims: '- Brand Clarity\n- Market Understanding\n- Audience Definition\n- Visual Cohesion\n- Strategic Maturity', s9overall: 'Overall Score: X/50 → [Assessment level]',
        s10: '🚀 Actionable Next Steps', s10instr: 'Ordered list of TOP 5 recommended actions, each with:', s10what: 'What', s10why: 'Why', s10impact: 'Expected Impact',
        rules: [
          'Write in English',
          'Extract EVERY piece of information from the conversation — nothing should be lost',
          'Include direct quotes from the client where impactful (use blockquotes)',
          'Be SPECIFIC, not generic — use actual data from the conversation',
          'Use data-driven language: "Based on X, we recommend Y because Z"',
          'Make it feel like a $10,000 consulting deliverable',
          'Use emojis for section headers only, sparingly',
          'Include quantitative data where possible',
          'If section 11 (Active Listening Intelligence) is present, use professional strategic language, grouped by category with direct quoted triggers',
        ],
        watermark: 'This briefing was generated by Brieffy AI.',
        userMsg: 'Generate the complete briefing document now based on all the information collected.',
      },
      es: {
        listeningTitle: '🔍 Inteligencia de Escucha Activa',
        listeningSubtitle: 'Insights capturados a partir de señales subliminales en las respuestas del cliente. Visible solo en el informe de la agencia.',
        relevanceLabel: 'de relevancia', triggeredBy: 'Activado por',
        role: 'Eres un Estratega de Marca Senior y consultor nivel McKinsey creando un Documento de Briefing premium que un CEO estaría orgulloso de presentar a su junta directiva.',
        langRule: 'REGLA ABSOLUTA DE IDIOMA: Escribe el documento ENTERO en Spanish. Todos los encabezados, bullet points, etiquetas y texto analítico DEBEN ser en Spanish.',
        task: 'TAREA: Analiza TODA la conversación a continuación y produce un documento de briefing completo y estructurado que destila respuestas brutas en INTELIGENCIA ESTRATÉGICA.',
        objectivesLabel: 'OBJETIVOS', purposeLabel: 'PROPÓSITO ESTRATÉGICO',
        collectedLabel: 'DATOS RECOPILADOS (estructurados)', assetsLabel: 'ASSETS GENERADOS', transcriptLabel: 'TRANSCRIPCIÓN COMPLETA DE LA CONVERSACIÓN',
        structureHeader: 'ESTRUCTURA DEL DOCUMENTO', structureInstructions: 'Genera un documento rico y profesional en formato Markdown con estas secciones.',
        adaptiveRule: 'REGLA ADAPTATIVA: Si una sección NO tiene datos recopilados durante la conversación, NO incluyas una sección vacía. En su lugar, sustitúyela por una nota breve de "Recomendaciones" explicando POR QUÉ esos datos importan y cómo recopilarlos.',
        title: '📋 Briefing Estratégico — [Nombre de la Empresa]',
        s1: '⚡ Resumen Ejecutivo', s1desc: 'Esta es la sección MÁS importante. Escribe 3-4 bullet points que un CEO leería en 30 segundos:', s1who: 'QUIÉNES son (1 frase)', s1what: 'QUÉ los hace únicos (1 frase)', s1where: 'DÓNDE está la oportunidad (1 frase)', s1action: 'QUÉ deben hacer PRIMERO (1 acción)',
        s2: '🏢 Perfil de la Empresa', s2items: '- Nombre, antigüedad, sector\n- Servicios/productos ofrecidos\n- Relación del fundador con la marca\n- Significado/historia del nombre de la marca\n- Evaluación de la etapa de madurez',
        s3: '🎯 Mercado & Posicionamiento Estratégico', s3items: '- Competidores directos mencionados\n- Diferenciadores competitivos\n- Canales de comunicación utilizados\n- Alcance geográfico\n- Estrategia de posicionamiento', s3map: 'Mapa de Posicionamiento Competitivo', s3mapInstr: 'Crea un análisis de posicionamiento en TEXTO comparando la empresa contra sus competidores mencionados en dimensiones clave (precio, calidad, innovación, reconocimiento). Usa tabla markdown:', s3mapCond: 'Incluye solo si se discutieron competidores.',
        s4: '👥 Público Objetivo', s4items: '- Demografía (edad, ingresos, ubicación, profesión)\n- Psicografía (valores, intereses, dolores)\n- Resumen de buyer persona (escríbelo como un "mini retrato" narrativo)',
        s5: '🎨 Identidad & Personalidad de Marca', s5items: '- Palabras clave que definen la marca\n- Rasgos de personalidad de la marca\n- Tono de voz (con ejemplos de cómo suena en la práctica)\n- Misión, visión, valores (si fueron capturados)',
        s6: '🖼 Dirección Visual', s6items: '- Preferencias de paleta de colores (con códigos HEX si están disponibles)\n- Referencias de estilo y preferencias visuales\n- Dirección tipográfica\n- Dirección de logo (si se discutió)', s6fallback: 'Si se recopilaron pocos datos visuales, renombra a "Recomendaciones de Dirección Visual" y sugiere qué explorar.',
        s7: '🧠 Insights Estratégicos & Inteligencia', s7items: '- Inferencias clave extraídas (lo que el cliente DIJO vs lo que QUISO DECIR)\n- Oportunidades estratégicas identificadas\n- Contradicciones o tensiones encontradas durante la conversación\n- Observaciones "entre líneas"',
        s8: '⚠️ Matriz de Riesgos & Oportunidades', s8instr: 'Presenta como tabla markdown:', s8headers: '| Categoría | Riesgo / Oportunidad | Impacto | Prioridad | Recomendación |', s8cond: 'Incluye 4-6 ítems cubriendo: riesgos de mercado, riesgos de marca, riesgos de audiencia y oportunidades estratégicas.',
        s9: '📊 Score de Salud de Marca', s9instr: 'Evalúa cada dimensión de 1-10 con indicador visual y justificación breve:', s9legend: '🟢 (7-10) Fuerte | 🟡 (4-6) Necesita atención | 🔴 (1-3) Crítico', s9dims: '- Claridad de Marca\n- Comprensión de Mercado\n- Definición de Audiencia\n- Cohesión Visual\n- Madurez Estratégica', s9overall: 'Score General: X/50 → [Nivel de evaluación]',
        s10: '🚀 Próximos Pasos Accionables', s10instr: 'Lista ordenada de las TOP 5 acciones recomendadas, cada una con:', s10what: 'Qué', s10why: 'Por qué', s10impact: 'Impacto Esperado',
        rules: [
          'Escribe en Spanish',
          'Extrae CADA información de la conversación — nada debe perderse',
          'Incluye citas directas del cliente donde sean impactantes (usa blockquotes)',
          'Sé ESPECÍFICO, no genérico — usa datos reales de la conversación',
          'Usa lenguaje basado en datos: "Con base en X, recomendamos Y porque Z"',
          'Hazlo parecer un entregable de consultoría de $10,000 USD',
          'Usa emojis solo en los encabezados de sección',
          'Incluye datos cuantitativos donde sea posible',
          'Si la sección 11 (Escucha Activa) existe, usa lenguaje estratégico profesional, agrupado por categoría con citas directas',
        ],
        watermark: 'Este briefing fue generado por Brieffy AI.',
        userMsg: 'Genera el documento de briefing completo ahora con base en toda la información recopilada.',
      },
    };

    const t = docI18n[chosenLanguage || 'pt'] || docI18n.pt;

    const activeListeningSection = (Array.isArray(detectedSignals) && detectedSignals.length > 0)
      ? `\n## 11. ${t.listeningTitle}\n*${t.listeningSubtitle}*\n\n${
          detectedSignals.map((s: { category: string; summary: string; relevance_score: number; source_answer: string }) => {
            const label = catLabels[s.category] || s.category;
            const score = Math.round((s.relevance_score || 0) * 100);
            const src = s.source_answer ? s.source_answer.substring(0, 120) + (s.source_answer.length > 120 ? '...' : '') : '';
            return `### ${label} — ${score}% ${t.relevanceLabel}\n${s.summary}\n${src ? `> *${t.triggeredBy}:* "${src}"\n` : ''}`;
          }).join('\n')
        }`
      : '';

    const systemPrompt = `${t.role}

${t.langRule}

${t.task}

TEMPLATE: ${templateName}
${t.objectivesLabel}: ${objectives}
${briefingPurpose ? `${t.purposeLabel}: ${briefingPurpose}` : ''}

${t.collectedLabel}:
${JSON.stringify(briefingState, null, 2)}

${assets ? `${t.assetsLabel}: ${JSON.stringify(assets, null, 2)}` : ""}

${t.transcriptLabel}:
${conversationTranscript}

═══ ${t.structureHeader} ═══
${t.structureInstructions}
${t.adaptiveRule}

# ${t.title}

## 1. ${t.s1}
${t.s1desc}
- ${t.s1who}
- ${t.s1what}
- ${t.s1where}
- ${t.s1action}

## 2. ${t.s2}
${t.s2items}

## 3. ${t.s3}
${t.s3items}

### ${t.s3map}
${t.s3mapInstr}
| ${chosenLanguage === 'en' ? 'Dimension' : chosenLanguage === 'es' ? 'Dimensión' : 'Dimensão'} | [${chosenLanguage === 'en' ? 'Company' : chosenLanguage === 'es' ? 'Empresa' : 'Empresa'}] | ${chosenLanguage === 'en' ? 'Competitor 1' : chosenLanguage === 'es' ? 'Competidor 1' : 'Concorrente 1'} | ${chosenLanguage === 'en' ? 'Competitor 2' : chosenLanguage === 'es' ? 'Competidor 2' : 'Concorrente 2'} |
|---|---|---|---|
| ${chosenLanguage === 'en' ? 'Price' : chosenLanguage === 'es' ? 'Precio' : 'Preço'} | ★★★ | ★★ | ★★★★ |
${t.s3mapCond}

## 4. ${t.s4}
${t.s4items}

## 5. ${t.s5}
${t.s5items}

## 6. ${t.s6}
${t.s6items}
${t.s6fallback}

## 7. ${t.s7}
${t.s7items}

## 8. ${t.s8}
${t.s8instr}
${t.s8headers}
|---|---|---|---|---|
| ${chosenLanguage === 'en' ? 'Market' : chosenLanguage === 'es' ? 'Mercado' : 'Mercado'} | ... | ${chosenLanguage === 'en' ? 'High/Med/Low' : chosenLanguage === 'es' ? 'Alto/Medio/Bajo' : 'Alto/Médio/Baixo'} | P1/P2/P3 | ... |
${t.s8cond}

## 9. ${t.s9}
${t.s9instr}
- ${t.s9legend}
${t.s9dims}

${t.s9overall}

## 10. ${t.s10}
${t.s10instr}
- **${t.s10what}**
- **${t.s10why}**
- **${t.s10impact}** (${chosenLanguage === 'en' ? 'High/Medium/Low' : chosenLanguage === 'es' ? 'Alto/Medio/Bajo' : 'Alto/Médio/Baixo'})
${activeListeningSection}

═══ ${chosenLanguage === 'en' ? 'PREMIUM RULES' : chosenLanguage === 'es' ? 'REGLAS PREMIUM' : 'REGRAS PREMIUM'} ═══
${t.rules.map(r => `- ${r}`).join('\n')}
- ${t.watermark}`;

    console.log(`[Document] Generating final document using ${llmConfig.provider} / ${llmConfig.model}`);
    const startTime = Date.now();

    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.warn(`[Document] Retry attempt ${attempt + 1}/${MAX_RETRIES}`);
        }

        const res = await fetch(llmConfig.baseUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${llmConfig.apiKey}`,
            ...llmConfig.headers,
          },
          body: JSON.stringify({
            model: llmConfig.model,
            temperature: attempt > 0 ? 0.4 : 0.3,
            max_tokens: 6000,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: t.userMsg }
            ],
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[Document] Error (attempt ${attempt + 1}):`, errorText);
          const isRetryable = res.status === 429 || res.status >= 500;
          if (isRetryable && attempt < MAX_RETRIES - 1) {
            lastError = new Error(`Document API failed: ${res.status}`);
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            continue;
          }
          throw new Error(`Document generation failed: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        const document = data.choices?.[0]?.message?.content;

        if (!document || document.trim().length < 100) {
          console.error("[Document] LLM returned empty or too-short content");
          if (attempt < MAX_RETRIES - 1) {
            lastError = new Error("Document too short");
            await new Promise(r => setTimeout(r, 500));
            continue;
          }
          throw new Error("Document generation returned empty content");
        }

        console.log(`[Document] Generated in ${Date.now() - startTime}ms (attempt ${attempt + 1}, ${document.length} chars)`);
        return NextResponse.json({ document });

      } catch (attemptError) {
        lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));
        if (attempt < MAX_RETRIES - 1) continue;
      }
    }

    console.error("[Document] All retries exhausted.", lastError);
    return NextResponse.json(
      { error: lastError?.message || "Document generation failed after retries" },
      { status: 500 }
    );

  } catch (error) {
    console.error("Document Generation Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

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
        role: 'Você é um Analista Estratégico sintetizando as respostas brutas de um cliente de forma estruturada e interpretativa.',
        langRule: 'REGRA ABSOLUTA DE IDIOMA: Escreva o documento INTEIRO em Portuguese (pt-BR). Todos os cabeçalhos, bullet points, rótulos e texto analítico DEVEM ser em Portuguese (pt-BR).',
        task: 'TAREFA: Analise TODA a conversa abaixo e produza um documento de briefing completo e estruturado que destila respostas brutas em INTERPRETAÇÕES REAIS do que o cliente disse. NÃO ADICIONE NENHUMA SUGESTÃO OU RECOMENDAÇÃO.',
        objectivesLabel: 'OBJETIVOS', purposeLabel: 'PROPÓSITO ESTRATÉGICO',
        collectedLabel: 'DADOS COLETADOS (estruturados)', assetsLabel: 'ASSETS GERADOS', transcriptLabel: 'TRANSCRIÇÃO COMPLETA DA CONVERSA',
        structureHeader: 'ESTRUTURA DO DOCUMENTO', structureInstructions: 'Gere um documento rico e profissional. **VOCÊ DEVE USAR MARKDOWN ESTRUTURADO E NÃO DEVE DAR SUGESTÕES:** Use amplamente vários níveis de cabeçalhos (##, ###), listas organizadas com marcadores (-), formatação em negrito (**) e citações em bloco (>) para tornar o documento escaneável, limpo e hierárquico.',
        adaptiveRule: 'REGRA ADAPTATIVA: Se uma seção NÃO tem dados coletados durante a conversa, NÃO inclua uma seção vazia e APENAS a oculte. NÃO CRIE nenhuma nota de recomendação ou dica.',
        title: '📋 Briefing Estratégico — [Nome da Empresa]',
        s1: '⚡ Resumo Executivo', s1desc: 'Resumo das respostas coletas. Escreva 3 bullet points descrevendo a essência do que o cliente relatou:', s1who: 'QUEM são (1 frase)', s1what: 'O QUE os torna únicos (1 frase)', s1where: 'ONDE eles dizem estar a oportunidade (1 frase)', s1action: '',
        s2: '🏢 Perfil da Empresa', s2items: '- Nome, idade, setor\n- Serviços/produtos oferecidos\n- Relação do fundador com a marca\n- Significado/história do nome da marca\n- Avaliação do estágio de maturidade',
        s3: '🎯 Mercado & Posicionamento Estratégico', s3items: '- Concorrentes diretos mencionados\n- Diferenciais competitivos relatados\n- Canais de comunicação usados\n- Alcance geográfico\n- Visão de posicionamento do cliente', s3map: 'Mapa de Posicionamento Competitivo', s3mapInstr: 'Crie uma análise de posicionamento em TEXTO comparando a empresa contra seus concorrentes mencionados em dimensões-chave (preço, qualidade, inovação, reconhecimento) estritamente baseado no que foi dito. Usa tabela markdown:', s3mapCond: 'Inclua apenas se concorrentes foram discutidos.',
        s4: '👥 Público-Alvo', s4items: '- Demografia declarada (idade, renda, localização, profissão)\n- Psicografia declarada (valores, interesses, dores)\n- Resumo da persona baseada nas respostas',
        s5: '🎨 Identidade & Personalidade da Marca', s5items: '- Palavras-chave relatadas que definem a marca\n- Traços de personalidade da marca declarados\n- Tom de voz (com exemplos de como soa na prática segundo eles)\n- Missão, visão, valores (se capturados)',
        s6: '🖼 Direção Visual', s6items: '- Preferências de paleta de cores mencionadas (com códigos HEX se disponíveis)\n- Referências de estilo indicadas e preferências visuais ditas\n- Direção tipográfica desejada\n- Ideias para o logo (se discutido)', s6fallback: 'Se poucos dados visuais foram coletados, apenas omita a seção.',
        s7: '🧠 Insights Estratégicos & Inteligência', s7items: '- Inferências-chave extraídas (o que o cliente DISSE vs o que QUIS DIZER factualmente, sem sugerir ações)\n- Dores observadas que o cliente não relatou diretamente\n- Contradições ou tensões encontradas durante a conversa\n- Observações "nas entrelinhas"',
        s8: '🚨 Inteligência de Escuta Ativa', s8items: '- VOCÊ DEVE LER os "DETECTED SIGNALS" fornecidos nos dados acima.\n- Para cada sinal detectado, explique de forma aprofundada O CONTEXTO GERAL (o que estava sendo discutido) e escreva UMA ANÁLISE COMPLETA do por que aquela fala é estrategicamente importante.\n- NUNCA apenas liste citações. Você deve desenvolver a ideia baseada na transcrição completa.\n- Inclua também a citação exata (Ativado por: "...") e a pontuação de relevância de cada sinal.', s8instr: '', s8headers: '', s8cond: '',
        s9: '', s9instr: '', s9legend: '', s9dims: '', s9overall: '',
        s10: '', s10instr: '', s10what: '', s10why: '', s10impact: '',
        rules: [
          `Escreva em ${targetLang}`,
          'Extraia CADA informação da conversa — nada deve ser perdido',
          'Inclua citações diretas do cliente onde impactantes (use blockquotes)',
          'Seja ESPECÍFICO, não genérico — use dados reais da conversa',
          'NÃO DÊ NENHUMA SUGESTÃO, IDEAÇÃO, RECOMENDAÇÃO OU PRÓXIMO PASSO. O intuito é registrar as respostas, fato e inferência. Zero sugestões.',
          'Proibido fazer recomendações de como melhorar ou resolver.',
          'É ESTRITAMENTE PROIBIDO O USO DE EMOJIS EM TODO O DOCUMENTO. NENHUM EMOJI DEVE SER GERADO.',
          'A seção de Inteligência da Escuta Ativa NÃO PODE SER uma lista crua. Tem que ser uma elaboração em formato de texto contínuo contextualizando cada sinal.',
        ],
        watermark: 'Este briefing foi gerado pela Brieffy AI.',
        userMsg: 'Gere o documento de briefing estritamente representativo agora com base em todas as informações coletadas, sem sugestões.',
      },
      en: {
        listeningTitle: '🔍 Active Listening Intelligence',
        listeningSubtitle: 'Insights captured from subliminal signals in client responses. Visible only in the agency report.',
        relevanceLabel: 'relevance', triggeredBy: 'Triggered by',
        role: 'You are a Strategic Analyst synthesizing the raw answers of a client in a structured and interpretative manner.',
        langRule: 'CRITICAL LANGUAGE CONSTRAINT: Write the ENTIRE document in English. All section headers, bullet points, labels, and analytical text MUST be in English.',
        task: 'TASK: Analyze the ENTIRE conversation below and produce a comprehensive, structured briefing document that distills raw answers into REAL INTERPRETATIONS of what the client said. DO NOT ADD ANY SUGGESTIONS OR RECOMMENDATIONS.',
        objectivesLabel: 'OBJECTIVES', purposeLabel: 'STRATEGIC PURPOSE',
        collectedLabel: 'COLLECTED DATA (structured)', assetsLabel: 'GENERATED ASSETS', transcriptLabel: 'FULL CONVERSATION TRANSCRIPT',
        structureHeader: 'DOCUMENT STRUCTURE', structureInstructions: 'Generate a rich, professional document. **YOU MUST USE STRUCTURED MARKDOWN AND MUST NOT GIVE SUGGESTIONS:** Heavily utilize multiple heading levels (##, ###), organized bulleted lists (-), bold formatting (**), and blockquotes (>) to make the document highly scannable, clean, and hierarchical.',
        adaptiveRule: 'ADAPTIVE RULE: If a section has NO data collected during the conversation, do NOT include an empty section. Just hide it. DO NOT create any recommendation or tip notes.',
        title: '📋 Strategic Briefing — [Company Name]',
        s1: '⚡ Executive Summary', s1desc: 'Summary of collected responses. Write 3 bullet points describing the essence of what the client reported:', s1who: 'WHO they are (1 sentence)', s1what: 'WHAT they claim makes them unique (1 sentence)', s1where: 'WHERE they say the opportunity lies (1 sentence)', s1action: '',
        s2: '🏢 Company Profile', s2items: '- Company name, age, sector\n- Services/products offered\n- Founder\'s relationship with the brand\n- Brand name meaning/story\n- Company maturity stage assessment',
        s3: '🎯 Market & Strategic Positioning', s3items: '- Direct competitors mentioned\n- Stated competitive differentiators\n- Communication channels used\n- Geographic reach\n- Client\'s vision of market positioning strategy', s3map: 'Competitor Positioning Map', s3mapInstr: 'Create a TEXT-BASED positioning analysis comparing the company against its mentioned competitors across key dimensions strictly based on what was said. Use a simple markdown table:', s3mapCond: 'Only include this if competitors were discussed.',
        s4: '👥 Target Audience', s4items: '- Stated demographics (age, income, location, profession)\n- Stated psychographics (values, interests, pain points)\n- Buyer persona summary based on responses',
        s5: '🎨 Brand Identity & Personality', s5items: '- Reported keywords that define the brand\n- Stated brand personality traits\n- Tone of voice (with examples of how it sounds in practice according to them)\n- Mission, vision, values (if captured)',
        s6: '🖼 Visual Direction', s6items: '- Mentioned color palette preferences (with HEX codes if available)\n- Indicated style references and visual preferences\n- Desired typography direction\n- Logo direction/ideas (if discussed)', s6fallback: 'If minimal visual data was collected, simply omit the section.',
        s7: '🧠 Strategic Insights & Intelligence', s7items: '- Key inferences extracted (factually what the client SAID vs what they MEANT, without suggesting actions)\n- Observed pain points that the client did not directly state\n- Contradictions or tensions found during the conversation\n- "Between the lines" observations',
        s8: '🚨 Active Listening Intelligence', s8items: '- YOU MUST READ the "DETECTED SIGNALS" provided in the data above.\n- For each detected signal, thoroughly explain THE BROAD CONTEXT (what was being discussed) and write a DEEP ANALYSIS on why that statement is strategically important.\n- NEVER just list quotes. You must develop the idea based on the full transcript.\n- Also include the exact quote (Triggered by: "...") and the relevance score for each signal.', s8instr: '', s8headers: '', s8cond: '',
        s9: '', s9instr: '', s9legend: '', s9dims: '', s9overall: '',
        s10: '', s10instr: '', s10what: '', s10why: '', s10impact: '',
        rules: [
          'Write in English',
          'Extract EVERY piece of information from the conversation — nothing should be lost',
          'Include direct quotes from the client where impactful (use blockquotes)',
          'Be SPECIFIC, not generic — use actual data from the conversation',
          'DO NOT PROVIDE ANY SUGGESTION, IDEATION, RECOMMENDATION OR NEXT STEP. The goal is to record responses, facts, and inference. Zero suggestions.',
          'It is strictly forbidden to make recommendations on how to improve or resolve things.',
          'IT IS STRICTLY PROHIBITED TO USE EMOJIS ANYWHERE IN THE DOCUMENT.',
          'The Active Listening Intelligence section CANNOT BE a raw list. It must be an elaboration in prose contextualizing each signal.',
        ],
        watermark: 'This briefing was generated by Brieffy AI.',
        userMsg: 'Generate the strictly representative briefing document now based on all collected information, without any suggestions.',
      },
      es: {
        listeningTitle: '🔍 Inteligencia de Escucha Activa',
        listeningSubtitle: 'Insights capturados a partir de señales subliminales en las respuestas del cliente. Visible solo en el informe de la agencia.',
        relevanceLabel: 'de relevancia', triggeredBy: 'Activado por',
        role: 'Eres un Analista Estratégico sintetizando las respuestas brutas de un cliente de forma estructurada e interpretativa.',
        langRule: 'REGLA ABSOLUTA DE IDIOMA: Escribe el documento ENTERO en Spanish. Todos los encabezados, bullet points, etiquetas y texto analítico DEBEN ser en Spanish.',
        task: 'TAREA: Analiza TODA la conversación a continuación y produce un documento de briefing completo y estructurado que destila respuestas brutas en INTERPRETACIONES REALES de lo que el cliente dijo. NO AÑADAS NINGUNA SUGERENCIA O RECOMENDACIÓN.',
        objectivesLabel: 'OBJETIVOS', purposeLabel: 'PROPÓSITO ESTRATÉGICO',
        collectedLabel: 'DATOS RECOPILADOS (estructurados)', assetsLabel: 'ASSETS GENERADOS', transcriptLabel: 'TRANSCRIPCIÓN COMPLETA DE LA CONVERSACIÓN',
        structureHeader: 'ESTRUCTURA DEL DOCUMENTO', structureInstructions: 'Genera un documento rico y profesional. **DEBES USAR MARKDOWN ESTRUCTURADO Y NO DEBES DAR SUGERENCIAS:** Utiliza ampliamente varios niveles de encabezados (##, ###), listas organizadas con viñetas (-), formato en negrita (**) y citas en bloque (>) para hacer el documento escaneable, limpio y jerárquico.',
        adaptiveRule: 'REGLA ADAPTATIVA: Si una sección NO tiene datos recopilados durante la conversación, NO incluyas una sección vacía. Solamente ocúltala. NO CRES notas de sugerencia o recomendación.',
        title: '📋 Briefing Estratégico — [Nombre de la Empresa]',
        s1: '⚡ Resumen Ejecutivo', s1desc: 'Resumen de las respuestas recolectadas. Escribe 3 bullet points describiendo la esencia de lo que el cliente relató:', s1who: 'QUIÉNES son (1 frase)', s1what: 'QUÉ dicen que los hace únicos (1 frase)', s1where: 'DÓNDE dicen que está la oportunidad (1 frase)', s1action: '',
        s2: '🏢 Perfil de la Empresa', s2items: '- Nombre, antigüedad, sector\n- Servicios/productos ofrecidos\n- Relación del fundador con la marca\n- Significado/historia del nombre de la marca\n- Evaluación de la etapa de madurez',
        s3: '🎯 Mercado & Posicionamiento Estratégico', s3items: '- Competidores directos mencionados\n- Diferenciadores competitivos declarados\n- Canales de comunicación utilizados\n- Alcance geográfico\n- Visión del posicionamiento por parte del cliente', s3map: 'Mapa de Posicionamiento Competitivo', s3mapInstr: 'Crea un análisis de posicionamiento en TEXTO comparando la empresa contra sus competidores mencionados en dimensiones clave estrictamente basado en lo que se dijo. Usa tabla markdown:', s3mapCond: 'Incluye solo si se discutieron competidores.',
        s4: '👥 Público Objetivo', s4items: '- Demografía declarada (edad, ingresos, ubicación, profesión)\n- Psicografía declarada (valores, intereses, dolores)\n- Resumen de buyer persona basado en las respuestas',
        s5: '🎨 Identidad & Personalidad de Marca', s5items: '- Palabras clave relatadas que definen la marca\n- Rasgos de personalidad de la marca declarados\n- Tono de voz (con ejemplos de cómo suena en la práctica según ellos)\n- Misión, visión, valores (si fueron capturados)',
        s6: '🖼 Dirección Visual', s6items: '- Preferencias de paleta de colores mencionadas (con códigos HEX si están disponibles)\n- Referencias de estilo indicadas y preferencias visuales discutidas\n- Dirección tipográfica deseada\n- Dirección/ideas de logo (si se discutió)', s6fallback: 'Si se recopilaron pocos datos visuales, simplemente omite la sección.',
        s7: '🧠 Insights Estratégicos & Inteligencia', s7items: '- Inferencias clave extraídas (lo que el cliente DIJO vs lo que QUISO DECIR factualmente, sin sugerir acciones)\n- Dolores observados que el cliente no declaró directamente\n- Contradicciones o tensiones encontradas durante la conversación\n- Observaciones "entre líneas"',
        s8: '🚨 Inteligencia de Escucha Activa', s8items: '- DEBES LEER los "DETECTED SIGNALS" proporcionados en los datos anteriores.\n- Para cada señal detectada, explica detalladamente EL CONTEXTO GENERAL (lo que se estaba discutiendo) y escribe un ANÁLISIS PROFUNDO de por qué esa afirmación es estratégicamente importante.\n- NUNCA hagas simplemente una lista de citas. Debes desarrollar la idea basándote en la transcripción completa.\n- Incluye también la cita exacta (Activado por: "...") y el puntaje de relevancia de cada señal.', s8instr: '', s8headers: '', s8cond: '',
        s9: '', s9instr: '', s9legend: '', s9dims: '', s9overall: '',
        s10: '', s10instr: '', s10what: '', s10why: '', s10impact: '',
        rules: [
          'Escribe en Spanish',
          'Extrae CADA información de la conversación — nada debe perderse',
          'Incluye citas directas del cliente donde sean impactantes (usa blockquotes)',
          'Sé ESPECÍFICO, no genérico — usa datos reales de la conversación',
          'NO DES NINGUNA SUGERENCIA, IDEACIÓN, RECOMENDACIÓN O PRÓXIMO PASO. El objetivo es registrar las respuestas, hechos e inferencias. Cero sugerencias.',
          'Está terminantemente prohibido hacer recomendaciones sobre cómo mejorar o resolver.',
          'ESTÁ ESTRICTAMENTE PROHIBIDO EL USO DE EMOJIS EN TODO EL DOCUMENTO.',
          'La sección Inteligencia de Escucha Activa NO PUEDE SER una lista cruda. Tiene que ser una elaboración en formato de prosa contextualizando cada señal.',
        ],
        watermark: 'Este briefing fue generado por Brieffy AI.',
        userMsg: 'Genera el documento de briefing estrictamente representativo ahora con base en toda la información recopilada, sin sugerencias.',
      },
    };

    const t = docI18n[chosenLanguage || 'pt'] || docI18n.pt;

    let signalsDataPayload = '';
    
    if (Array.isArray(detectedSignals) && detectedSignals.length > 0) {
      signalsDataPayload = `\nDETECTED SIGNALS (${t.listeningSubtitle})\nA IA marcou os seguintes trechos precisos como cruciais. Use esses sinais detalhadamente na seção 8.\n\n` + 
        detectedSignals.map((s: { category: string; summary: string; relevance_score: number; source_answer: string }) => {
          const label = catLabels[s.category] || s.category;
          const score = Math.round((s.relevance_score || 0) * 100);
          const src = s.source_answer ? s.source_answer.substring(0, 180) + (s.source_answer.length > 180 ? '...' : '') : '';
          return `Sinal (${label}) [Score: ${score}%]\nResumo da IA que captou o sinal: ${s.summary}\nCitação exata do cliente ("${src}")`;
        }).join('\n\n');
    }

    const systemPrompt = `${t.role}

${t.langRule}

${t.task}

TEMPLATE: ${templateName}
${t.objectivesLabel}: ${objectives}
${briefingPurpose ? `${t.purposeLabel}: ${briefingPurpose}` : ''}

${t.collectedLabel}:
${JSON.stringify(briefingState, null, 2)}

${assets ? `${t.assetsLabel}: ${JSON.stringify(assets, null, 2)}` : ""}

${signalsDataPayload}

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

${signalsDataPayload ? `## 8. ${t.s8}\n${t.s8items}` : ''}

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

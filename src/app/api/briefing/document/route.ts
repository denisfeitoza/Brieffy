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

    // Build the full conversation transcript for the document
    const conversationTranscript = history.map((m: { role: string; content: string }) => {
      const role = m.role === "assistant" ? "IA" : "Cliente";
      return `[${role}]: ${m.content}`;
    }).join("\n\n");

    const langMap: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'pt': 'Portuguese (pt-BR)',
    };
    const targetLang = langMap[chosenLanguage || 'pt'] || 'Portuguese (pt-BR)';

    // Build active listening section if signals exist
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

    const activeListeningSection = (Array.isArray(detectedSignals) && detectedSignals.length > 0)
      ? `\n## 10. 🔍 Inteligência de Escuta Ativa\n*Estes insights foram capturados a partir de sinais subliminares e implicações nas respostas do cliente. Visível apenas no relatório da agência.*\n\n${
          detectedSignals.map((s: { category: string; summary: string; relevance_score: number; source_answer: string }) => {
            const label = catLabels[s.category] || s.category;
            const score = Math.round((s.relevance_score || 0) * 100);
            const src = s.source_answer ? s.source_answer.substring(0, 120) + (s.source_answer.length > 120 ? '...' : '') : '';
            return `### ${label} — ${score}% de relevância\n${s.summary}\n${src ? `> *Ativado por:* "${src}"\n` : ''}`;
          }).join('\n')
        }`
      : '';

    const systemPrompt = `You are a Senior Brand Strategist and McKinsey-level consultant creating a premium Briefing Document that a CEO would be proud to present to their board.

CRITICAL LANGUAGE CONSTRAINT: Write the ENTIRE document in ${targetLang}. All section headers, bullet points, labels, and analytical text MUST be in ${targetLang}. If ${targetLang} is not Portuguese, translate any Portuguese template instructions into ${targetLang}.

TASK: Analyze the ENTIRE conversation below and produce a comprehensive, structured briefing document that distills raw answers into STRATEGIC INTELLIGENCE.

TEMPLATE: ${templateName}
OBJECTIVES: ${objectives}
${briefingPurpose ? `STRATEGIC PURPOSE: ${briefingPurpose}` : ''}

COLLECTED DATA (structured):
${JSON.stringify(briefingState, null, 2)}

${assets ? `GENERATED ASSETS: ${JSON.stringify(assets, null, 2)}` : ""}

FULL CONVERSATION TRANSCRIPT:
${conversationTranscript}

═══ DOCUMENT STRUCTURE ═══
Generate a rich, professional document in Markdown format with these sections.
ADAPTIVE RULE: If a section has NO data collected during the conversation, do NOT include an empty section. Instead, replace it with a brief "Recommendations" note explaining WHY this data matters and how to collect it.

# 📋 Strategic Briefing — [Company Name]

## 1. ⚡ Executive Summary
This is the MOST important section. Write 3-4 bullet points that a CEO would read in 30 seconds:
- WHO they are (1 sentence)
- WHAT makes them unique (1 sentence)  
- WHERE the opportunity lies (1 sentence)
- WHAT they should do FIRST (1 action)

## 2. 🏢 Company Profile
- Company name, age, sector
- Services/products offered
- Founder's relationship with the brand
- Brand name meaning/story
- Company maturity stage assessment

## 3. 🎯 Market & Strategic Positioning
- Direct competitors mentioned
- Competitive differentiators
- Communication channels used
- Geographic reach
- Market positioning strategy

### Competitor Positioning Map
Create a TEXT-BASED positioning analysis comparing the company against its mentioned competitors across key dimensions (price, quality, innovation, brand recognition). Use a simple markdown table:
| Dimension | [Company] | Competitor 1 | Competitor 2 |
|---|---|---|---|
| Price | ★★★ | ★★ | ★★★★ |
Only include this if competitors were discussed.

## 4. 👥 Target Audience
- Demographics (age, income, location, profession)
- Psychographics (values, interests, pain points)
- Buyer persona summary (write as a narrative "mini portrait")

## 5. 🎨 Brand Identity & Personality
- Keywords that define the brand
- Brand personality traits
- Tone of voice (with examples of how it sounds in practice)
- Mission, vision, values (if captured)

## 6. 🖼 Visual Direction
- Color palette preferences (with HEX codes if available)
- Style references and visual preferences
- Typography direction
- Logo direction (if discussed)
If minimal visual data was collected, rename to "Visual Direction Recommendations" and suggest what to explore next.

## 7. 🧠 Strategic Insights & Intelligence
- Key inferences extracted (what the client SAID vs what they MEANT)
- Strategic opportunities identified
- Contradictions or tensions found during the conversation
- "Between the lines" observations

## 8. ⚠️ Risk & Opportunity Matrix
Present as a markdown table:
| Category | Risk / Opportunity | Impact | Priority | Recommendation |
|---|---|---|---|---|
| Market | ... | High/Med/Low | P1/P2/P3 | ... |
Include 4-6 items covering: market risks, brand risks, audience risks, and strategic opportunities.

## 9. 📊 Brand Health Score
Rate each dimension 1-10 with visual indicator and brief justification:
- 🟢 (7-10) Strong | 🟡 (4-6) Needs attention | 🔴 (1-3) Critical
- Brand Clarity
- Market Understanding
- Audience Definition
- Visual Cohesion
- Strategic Maturity

Overall Score: X/50 → [Assessment level]

## 10. 🚀 Actionable Next Steps
Ordered list of TOP 5 recommended actions, each with:
- **What** to do
- **Why** it matters
- **Expected Impact** (High/Medium/Low)
${activeListeningSection}

═══ PREMIUM RULES ═══
- Write in ${targetLang}
- Extract EVERY piece of information from the conversation — nothing should be lost
- Include direct quotes from the client where impactful (use blockquotes)
- Be SPECIFIC, not generic — use actual data from the conversation
- Use data-driven language: "Based on X, we recommend Y because Z"
- Make it feel like a $10,000 consulting deliverable
- Use emojis for section headers only, sparingly
- Include quantitative data where possible
- Section 11 (Active Listening Intelligence) if present should use professional strategic language, grouped by category with direct quoted triggers
- End with a brief "This briefing was generated by Brieffy AI." watermark line

Return the complete Markdown document.`;

    console.log(`[Document] Generating final document using ${llmConfig.provider} / ${llmConfig.model}`);
    const startTime = Date.now();

    const res = await fetch(llmConfig.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${llmConfig.apiKey}`,
        ...llmConfig.headers,
      },
      body: JSON.stringify({
        model: llmConfig.model,
        temperature: 0.3, // Slightly creative for document writing
        max_tokens: 6000, // Premium document with adaptive sections
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the complete briefing document now based on all the information collected." }
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Document] Error:`, errorText);
      throw new Error(`Document generation failed: ${res.status}`);
    }

    const data = await res.json();
    const document = data.choices[0].message.content;
    console.log(`[Document] Generated in ${Date.now() - startTime}ms`);

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Document Generation Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";

// ================================================================
// DOCUMENT GENERATOR — Creates the final structured briefing document
// Uses FULL conversation history to generate a comprehensive deliverable
// ================================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { history, briefingState, assets, activeTemplate, chosenLanguage } = body;

    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);

    if (!llmConfig.apiKey) {
      return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    const templateName = activeTemplate?.name || "Briefing Geral";
    const objectives = activeTemplate?.objectives?.join(", ") || "Criar briefing completo do negócio";

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

    const systemPrompt = `You are a Senior Brand Strategist creating a professional Briefing Document.

CRITICAL LANGUAGE CONSTRAINT: Write the ENTIRE document in ${targetLang}. All section headers, bullet points, labels, and analytical text MUST be in ${targetLang}. If ${targetLang} is not Portuguese, translate any Portuguese template instructions into ${targetLang}.

TASK: Analyze the ENTIRE conversation below and produce a comprehensive, structured briefing document in the SAME LANGUAGE the client used during the conversation.

TEMPLATE: ${templateName}
OBJECTIVES: ${objectives}

COLLECTED DATA (structured):
${JSON.stringify(briefingState, null, 2)}

${assets ? `GENERATED ASSETS: ${JSON.stringify(assets, null, 2)}` : ""}

FULL CONVERSATION TRANSCRIPT:
${conversationTranscript}

═══ DOCUMENT STRUCTURE ═══
Generate a rich, professional document in Markdown format with these sections:

# 📋 Briefing Document — [Company Name]

## 1. Executive Summary
A 3-4 sentence overview of the company, its market position, and the project scope.

## 2. Company Profile
- Company name, age, sector
- Services/products offered
- Founder's relationship with the brand
- Brand name meaning/story

## 3. Market & Positioning
- Direct competitors
- Competitive differentiators  
- Communication channels used
- Geographic reach
- Market positioning strategy

## 4. Target Audience
- Demographics (age, income, location, profession)
- Psychographics (values, interests, pain points)
- Buyer persona summary

## 5. Brand Identity & Personality
- Keywords that define the brand
- Brand personality traits
- Tone of voice
- Mission, vision, values (if captured)

## 6. Visual Direction
- Color palette preferences (with HEX codes if available)
- Style references and visual preferences
- Typography direction
- Logo direction (if discussed)

## 7. Strategic Insights
- Key inferences extracted from the conversation
- Opportunities identified
- Potential risks or gaps
- Recommendations for next steps

## 8. Brand Health Score
Rate each dimension 1-10 with a brief justification:
- Brand Clarity
- Market Understanding  
- Audience Definition
- Visual Cohesion
- Strategic Maturity

## 9. Actionable Next Steps
Ordered list of recommended actions based on everything collected.

═══ RULES ═══
- Write in ${targetLang}
- Extract EVERY piece of information from the conversation — nothing should be lost
- Include direct quotes from the client where impactful
- Be specific, not generic — use actual data from the conversation
- If information wasn't discussed, mark as "Not collected / Not discussed" (translate to ${targetLang}) 
- Make it feel premium and professional
- Use emojis sparingly for section headers only
- Include quantitative data where possible

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
        max_tokens: 4000, // Larger output for full document
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

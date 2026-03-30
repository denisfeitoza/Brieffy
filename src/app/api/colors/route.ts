import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";

export async function POST(req: Request) {
  try {
    const { mainColors, context, type = "complementary", hint, keptColors = [] } = await req.json();

    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);

    const numToGenerate = Math.max(1, 4 - (keptColors?.length || 0));

    if (!llmConfig.apiKey) {
      console.warn("API Key não encontrada. Usando modo MOCK para cores.");
      return NextResponse.json({
        colors: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"].slice(0, numToGenerate)
      });
    }

    let systemPrompt = "";
    
    // hint injection
    const hintInstruction = hint 
      ? `\n\nCRITICAL OVERRIDE: The user provided a specific hint for the colors they want: "${hint}". You MUST prioritize this hint above all other rules while keeping the colors harmonious.`
      : "";

    const keptInstruction = keptColors && keptColors.length > 0
      ? `\n\nThe user has already selected and kept these colors: ${keptColors.join(", ")}. Do not include them in your output, but ensure your new generated colors harmonize perfectly with them.`
      : "";

    if (type === "initial") {
      systemPrompt = `You are an expert color theorist and UI designer. The user has provided the following context about their brand/company/project:
"${context || 'No specific context provided'}"

Your task is to suggest EXACTLY ${numToGenerate} brand colors (in HEX format) to be used as UI details and accents in a briefing interface that represents their brand.
IMPORTANT: We are NOT redefining their entire visual identity. We need beautiful, UI-friendly palette colors that match their brand DNA for elements like buttons, highlights, and borders.
${hintInstruction}${keptInstruction}
IMPORTANT: The ${numToGenerate} generated color(s) must NOT be too similar to each other (if generating > 1)! Make them distinct to provide a good variety of options.

Output strictly valid JSON only, with exactly ${numToGenerate} items:
{"colors": ["#HEX1", ...]}`;
    } else {
      if (!mainColors || mainColors.length < 1) {
        return NextResponse.json({ error: "Pelo menos uma cor principal é obrigatória para gerar complementares." }, { status: 400 });
      }
      systemPrompt = `You are an expert color theorist and brand designer. The user has provided 1 or 2 main brand colors in HEX format. 
Also, consider the following brand context to ensure the colors are harmonious with the brand's identity:
"${context || 'No specific context provided'}"

Your task is to generate EXACTLY ${numToGenerate} complementary HEX colors that perfectly harmonize with the main color(s) and the brand context, and are suitable for modern web design (UI backgrounds, typography accents, secondary buttons, etc).
Focus on contrast and aesthetic beauty.
${hintInstruction}${keptInstruction}
IMPORTANT: The ${numToGenerate} generated color(s) must NOT be too similar to each other, nor too similar to the main/kept colors! Make them distinctly different from each other.

Output strictly valid JSON only, with exactly ${numToGenerate} items:
{"colors": ["#HEX1", ...]}`;
    }

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt }
    ];

    if (type === "complementary") {
      messages.push({ role: "user", content: `Main Color(s): ${mainColors.join(", ")}` });
    } else {
       messages.push({ role: "user", content: `Please provide the initial 4 primary color suggestions.` });
    }

    const res = await fetch(llmConfig.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${llmConfig.apiKey}`,
        ...llmConfig.headers,
      },
      body: JSON.stringify({
        model: llmConfig.model,
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 200,
        messages,
      }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`AI API failed: ${err}`);
    }

    const data = await res.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json({
      colors: content.colors || content.complementaryColors || content.initialColors || ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"]
    });

  } catch (error) {
    console.error("Color API Error:", error);
    return NextResponse.json({ colors: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"] });
  }
}

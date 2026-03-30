import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";

export async function POST(req: Request) {
  try {
    const { mainColors, context, type = "complementary", hint } = await req.json();

    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);

    if (!llmConfig.apiKey) {
      console.warn("API Key não encontrada. Usando modo MOCK para cores.");
      return NextResponse.json({
        colors: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"]
      });
    }

    let systemPrompt = "";
    
    // hint injection
    const hintInstruction = hint 
      ? `\n\nCRITICAL OVERRIDE: The user provided a specific hint for the colors they want: "${hint}". You MUST prioritize this hint above all other rules while keeping the colors harmonious.`
      : "";

    if (type === "initial") {
      systemPrompt = `You are an expert color theorist and brand designer. The user has provided the following context about their brand/company/project:
"${context || 'No specific context provided'}"

Your task is to suggest exactly 4 primary brand colors (in HEX format) that strongly represent this brand's identity based on the context.${hintInstruction}
IMPORTANT: The 4 generated colors must NOT be too similar to each other! Make them distinctly different from each other to provide a good variety of options for the user to decide.

Output strictly valid JSON only:
{"colors": ["#HEX1", "#HEX2", "#HEX3", "#HEX4"]}`;
    } else {
      if (!mainColors || mainColors.length < 1) {
        return NextResponse.json({ error: "Pelo menos uma cor principal é obrigatória para gerar complementares." }, { status: 400 });
      }
      systemPrompt = `You are an expert color theorist and brand designer. The user has provided 1 or 2 main brand colors in HEX format. 
Also, consider the following brand context to ensure the colors are harmonious with the brand's identity:
"${context || 'No specific context provided'}"

Your task is to generate exactly 4 complementary HEX colors that perfectly harmonize with the main color(s) and the brand context, and are suitable for modern web design (UI backgrounds, typography accents, secondary buttons, etc).
Focus on contrast and aesthetic beauty.${hintInstruction}
IMPORTANT: The 4 generated colors must NOT be too similar to each other! Make them distinctly different from each other to provide a good variety of options for the user to decide.
Do not provide the same colors provided by the user.

Output strictly valid JSON only:
{"colors": ["#HEX1", "#HEX2", "#HEX3", "#HEX4"]}`;
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

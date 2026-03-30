import { NextResponse } from "next/server";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";

export async function POST(req: Request) {
  try {
    const { mainColors, context, type = "initial", hint, keptColors = [] } = await req.json();

    // Validate type parameter
    if (type !== "initial" && type !== "detail") {
      return NextResponse.json({ error: `Invalid type: ${type}. Must be 'initial' or 'detail'.` }, { status: 400 });
    }

    const dbSettings = await getDBSettings();
    const llmConfig = getLLMConfig(dbSettings);

    const kept = Array.isArray(keptColors) ? keptColors : [];
    const numToGenerate = Math.max(1, 4 - kept.length);

    if (!llmConfig.apiKey) {
      console.warn("[Colors API] No API key — returning random palette");
      return NextResponse.json({ colors: generateFallbackColors(numToGenerate) });
    }

    const hintInstruction = hint?.trim()
      ? `\n\nUSER STYLE HINT: "${hint}". This is the user's explicit preference — PRIORITIZE this above default choices. If they say "verde neon", your palette MUST center around neon green. If they say "tons pastéis", use pastel tones. ALWAYS honor this hint.`
      : "";

    const keptInstruction = kept.length > 0
      ? `\n\nALREADY CHOSEN: ${kept.join(", ")}. Do NOT include these exact colors. Generate colors that COMPLEMENT and HARMONIZE with them to form a cohesive palette.`
      : "";

    let systemPrompt = "";

    if (type === "initial") {
      // Step 1: Generate main/primary brand colors
      systemPrompt = `You are a world-class brand color strategist. Your job is to generate a COHESIVE color palette for a brand's UI.

Brand context from the user's previous answers:
"${context || 'Modern brand'}"

Generate EXACTLY ${numToGenerate} PRIMARY brand colors (HEX format).
These colors will be used as the MAIN accent colors in the brand's UI — primary buttons, headers, key highlights.
${hintInstruction}${keptInstruction}

PALETTE RULES:
- Colors must form a HARMONIOUS palette together (not random)
- Use color theory: analogous, complementary, or triadic relationships
- Each color must be vibrant enough for UI buttons/accents on a dark background
- No whites, no near-blacks, no grays — these are ACCENT colors
- Each color must be visually DISTINCT from the others
- Make them feel premium and modern

Return ONLY valid JSON: {"colors": [${Array.from({length: numToGenerate}, (_, i) => `"#HEX${i+1}"`).join(', ')}]}`;
    } else if (type === "detail") {
      // Step 2: Generate detail/accent colors that complement the main ones
      if (!mainColors || mainColors.length < 1) {
        return NextResponse.json({ error: "At least one main color is required." }, { status: 400 });
      }
      systemPrompt = `You are a world-class brand color strategist. The user has chosen their PRIMARY brand colors: ${mainColors.join(", ")}.

Brand context: "${context || 'Modern brand'}"

Now generate EXACTLY ${numToGenerate} DETAIL/ACCENT colors (HEX format).
These are SECONDARY colors for: subtle backgrounds, text accents, borders, badges, and UI details.
${hintInstruction}${keptInstruction}

PALETTE RULES:
- These MUST harmonize perfectly with the main colors (${mainColors.join(", ")})
- Detail colors should be SOFTER or more MUTED than the primaries
- Think: lighter tints, desaturated versions, or complementary soft tones
- They should provide CONTRAST when paired with the main colors
- NO pure white (#FFFFFF) or pure black (#000000)
- Good examples: soft slate, muted teal, warm cream, light lavender
- Each must be distinct from each other AND from the main colors

Return ONLY valid JSON: {"colors": [${Array.from({length: numToGenerate}, (_, i) => `"#HEX${i+1}"`).join(', ')}]}`;
    }

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: type === "detail" 
        ? `Main colors: ${mainColors.join(", ")}. Generate ${numToGenerate} detail colors now.`
        : `Generate ${numToGenerate} primary brand colors now.`
      }
    ];

    console.log(`[Colors API] type=${type}, num=${numToGenerate}, hint="${hint || ''}", kept=${JSON.stringify(kept)}`);

    const res = await fetch(llmConfig.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${llmConfig.apiKey}`,
        ...llmConfig.headers,
      },
      body: JSON.stringify({
        model: llmConfig.model,
        response_format: { type: "json_object" },
        temperature: 0.85,
        max_tokens: 500,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Colors API] LLM failed (${res.status}):`, errText);
      return NextResponse.json({ colors: generateFallbackColors(numToGenerate) });
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("[Colors API] Empty content from LLM:", JSON.stringify(data));
      return NextResponse.json({ colors: generateFallbackColors(numToGenerate) });
    }

    console.log("[Colors API] Raw output:", rawContent);

    const parsed = JSON.parse(rawContent);
    const colors: string[] = parsed.colors || parsed.complementaryColors || parsed.initialColors || [];

    // Validate hex format and clean
    const validColors = colors
      .filter((c: string) => typeof c === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c))
      .map((c: string) => c.toUpperCase())
      .slice(0, numToGenerate);

    if (validColors.length === 0) {
      console.error("[Colors API] No valid hex colors in:", parsed);
      return NextResponse.json({ colors: generateFallbackColors(numToGenerate) });
    }

    console.log("[Colors API] Returning:", validColors);
    return NextResponse.json({ colors: validColors });

  } catch (error) {
    console.error("[Colors API] Error:", error);
    return NextResponse.json({ colors: generateFallbackColors(4) });
  }
}

function generateFallbackColors(count: number): string[] {
  const palettes = [
    ["#6366F1", "#EC4899", "#14B8A6", "#F97316"],
    ["#8B5CF6", "#F43F5E", "#06B6D4", "#EAB308"],
    ["#A855F7", "#E11D48", "#0EA5E9", "#84CC16"],
    ["#7C3AED", "#DB2777", "#0891B2", "#D97706"],
  ];
  const palette = palettes[Math.floor(Math.random() * palettes.length)];
  return palette.slice(0, count);
}

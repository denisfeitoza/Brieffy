import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLLMConfig, getDBSettings } from "@/lib/aiConfig";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { initialContext } = await req.json();

    if (!initialContext || typeof initialContext !== "string" || !initialContext.trim()) {
      return NextResponse.json({ suggested_slugs: [], reasoning: "" });
    }

    // Fetch all active packages
    const { data: packages, error } = await supabase
      .from("briefing_category_packages")
      .select("slug, name, description, department, briefing_purpose")
      .or("is_archived.is.null,is_archived.eq.false")
      .order("sort_order", { ascending: true });

    if (error || !packages || packages.length === 0) {
      return NextResponse.json({ suggested_slugs: [], reasoning: "No packages available" });
    }

    // Build the prompt
    const packagesList = packages
      .map((p) => `- ${p.slug}: ${p.name} — ${p.description || ""}${p.briefing_purpose ? ` (Purpose: ${p.briefing_purpose})` : ""}`)
      .join("\n");

    const systemPrompt = `You are an AI briefing strategist. Given context about a company/client, suggest which AI briefing packages would be most relevant.

Available packages:
${packagesList}

Rules:
1. Suggest 3-7 packages that are MOST relevant to the context
2. Always include packages that seem directly relevant to the company's industry/needs
3. Return ONLY a JSON object with this exact format: {"suggested_slugs": ["slug1", "slug2"], "reasoning": "brief explanation in Portuguese"}
4. Reasoning should be 1-2 sentences in Portuguese explaining the selection
5. Return valid JSON only, no markdown formatting`;

    const userPrompt = `Context about the client/company:\n\n${initialContext.trim().slice(0, 2000)}`;

    // Call LLM
    const overrides = await getDBSettings();
    const llmConfig = getLLMConfig(overrides);

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("LLM API error:", await response.text());
      return NextResponse.json({ suggested_slugs: [], reasoning: "AI unavailable" });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed: { suggested_slugs: string[]; reasoning: string };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error("Failed to parse LLM response:", content);
      return NextResponse.json({ suggested_slugs: [], reasoning: "" });
    }

    // Validate slugs against known packages
    const validSlugs = new Set(packages.map((p) => p.slug));
    const filteredSlugs = (parsed.suggested_slugs || []).filter((s: string) => validSlugs.has(s));

    return NextResponse.json({
      suggested_slugs: filteredSlugs,
      reasoning: parsed.reasoning || "",
    });
  } catch (error) {
    console.error("Error in suggest-packages:", error);
    return NextResponse.json({ suggested_slugs: [], reasoning: "" }, { status: 500 });
  }
}

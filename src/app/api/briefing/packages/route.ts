import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const adminSupabase = await createServerSupabaseClient();
  const { data: { user }, error } = await adminSupabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
  if (!isAdmin) {
    const { data: profile } = await adminSupabase
      .from("briefing_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return { supabase: null, error: NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 }) };
    }
  }

  return { supabase: adminSupabase, error: null };
}

const FRAGMENT_MIN_LENGTH = 50;
const FRAGMENT_RECOMMENDED_KEYWORDS = [
  "EXTRAIR", "extrair", "EXTRACT", "extract",
  "CAMPOS", "campos", "FIELDS", "fields",
  "ESTRATÉGIA", "estratégia", "STRATEGY", "strategy",
  "PERGUNTA", "pergunta", "QUESTION", "question",
];

function validateFragment(fragment: string | undefined): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (!fragment || fragment.trim().length === 0) {
    return { valid: true, warnings: ["Fragment vazio — o pacote não adicionará perguntas específicas."] };
  }
  if (fragment.trim().length < FRAGMENT_MIN_LENGTH) {
    warnings.push(`Fragment muito curto (${fragment.trim().length} chars). Mínimo recomendado: ${FRAGMENT_MIN_LENGTH}. Fragments curtos podem não gerar perguntas relevantes.`);
  }
  const hasKeyword = FRAGMENT_RECOMMENDED_KEYWORDS.some(kw => fragment.includes(kw));
  if (!hasKeyword) {
    warnings.push("Fragment não contém palavras-chave de instrução (ex: EXTRAIR, CAMPOS, ESTRATÉGIA, PERGUNTA). Considere usar um Skill Template como base.");
  }
  return { valid: true, warnings };
}

// GET - List all packages (ordered by sort_order)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeArchived = url.searchParams.get('include_archived') === 'true';

    let query = supabase
      .from("briefing_category_packages")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!includeArchived) {
      query = query.or('is_archived.is.null,is_archived.eq.false');
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching packages:", msg);
    return NextResponse.json(
      { error: "Failed to fetch packages", details: msg },
      { status: 500 }
    );
  }
}

// POST - Create a new package (admin)
export async function POST(req: Request) {
  const { supabase: adminSupabase, error: authError } = await requireAdmin();
  if (authError) return authError;
  try {
    const body = await req.json();
    const { slug, name, description, icon, system_prompt_fragment, max_questions, is_default_enabled, sort_order, department } = body;

    if (!slug || !name) {
      return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
    }

    const fragmentCheck = validateFragment(system_prompt_fragment);

    const { data, error } = await adminSupabase!
      .from("briefing_category_packages")
      .insert([{
        slug,
        name,
        description: description || "",
        icon: icon || "Package",
        system_prompt_fragment: system_prompt_fragment || "",
        max_questions: max_questions ?? 10,
        is_default_enabled: is_default_enabled ?? false,
        sort_order: sort_order ?? 0,
        department: department || "general",
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...data, _warnings: fragmentCheck.warnings });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}

// PUT - Update a package (admin)
export async function PUT(req: Request) {
  const { supabase: adminSupabase, error: authError } = await requireAdmin();
  if (authError) return authError;
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const fragmentCheck = updates.system_prompt_fragment !== undefined
      ? validateFragment(updates.system_prompt_fragment)
      : { valid: true, warnings: [] };

    const { data, error } = await adminSupabase!
      .from("briefing_category_packages")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...data, _warnings: fragmentCheck.warnings });
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a package (admin)
export async function DELETE(req: Request) {
  const { supabase: adminSupabase, error: authError } = await requireAdmin();
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await adminSupabase!
      .from("briefing_category_packages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}

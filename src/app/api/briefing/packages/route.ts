import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAuth() {
  const adminSupabase = await createServerSupabaseClient();
  const { data: { user }, error } = await adminSupabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, user: null, isAdmin: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  let isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
  if (!isAdmin) {
    const { data: profile } = await adminSupabase
      .from("briefing_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    isAdmin = !!profile?.is_admin;
  }

  return { supabase: adminSupabase, user, isAdmin, error: null };
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

// GET - List skills based on user context
export async function GET(req: Request) {
  try {
    const { user } = await requireAuth(); // Non-blocking if unauthenticated, but we get the user.
    
    const url = new URL(req.url);
    const includeArchived = url.searchParams.get('include_archived') === 'true';

    let orFilter = 'skill_type.eq.official';
    if (user) {
      // If user is logged in, show official skills + their personal skills
      orFilter = `skill_type.eq.official,and(skill_type.eq.personal,author_id.eq.${user.id})`;
    }

    let query = supabase
      .from("briefing_category_packages")
      .select("*")
      .or(orFilter)
      .order("sort_order", { ascending: true });

    if (!includeArchived) {
      // We need to carefully construct the query for RLS bypass since we fetch with admin client?
      // Wait, we're using anon client (`supabase`), so we must pass explicit filters. Actually, since we're the backend, we filter manually.
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

// POST - Create a new package (Admin or User)
export async function POST(req: Request) {
  const { supabase: adminSupabase, user, isAdmin, error: authError } = await requireAuth();
  if (authError || !user) return authError;
  try {
    const body = await req.json();
    let { slug, name, description, icon, system_prompt_fragment, max_questions, is_default_enabled, sort_order, department, skill_type } = body;

    if (!slug || !name) {
      return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
    }

    // Security: Only Admins can create Official or Community skills for now
    if (!isAdmin) {
      skill_type = 'personal';
      slug = `custom-${user.id.slice(0, 6)}-${slug}`; // ensure unique slug
      is_default_enabled = false;
    } else {
      skill_type = skill_type || 'official';
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
        skill_type,
        author_id: user.id
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

// PUT - Update a package (Admin or Creator)
export async function PUT(req: Request) {
  const { supabase: adminSupabase, user, isAdmin, error: authError } = await requireAuth();
  if (authError || !user) return authError;
  try {
    const body = await req.json();
    const { id, skill_type, author_id, ...updates } = body; // Filter immutable/sensitive fields

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Ownership Verification
    const { data: existing } = await adminSupabase!
      .from("briefing_category_packages")
      .select("author_id, skill_type")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    if (!isAdmin && existing.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You don't own this skill" }, { status: 403 });
    }

    const fragmentCheck = updates.system_prompt_fragment !== undefined
      ? validateFragment(updates.system_prompt_fragment)
      : { valid: true, warnings: [] };

    // Standard user overrides
    if (!isAdmin) {
      updates.is_default_enabled = false;
    }

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

// DELETE - Delete a package (Admin or Creator)
export async function DELETE(req: Request) {
  const { supabase: adminSupabase, user, isAdmin, error: authError } = await requireAuth();
  if (authError || !user) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Ownership Verification
    if (!isAdmin) {
      const { data: existing } = await adminSupabase!
        .from("briefing_category_packages")
        .select("author_id")
        .eq("id", id)
        .single();
        
      if (!existing || existing.author_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: You don't own this skill" }, { status: 403 });
      }
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

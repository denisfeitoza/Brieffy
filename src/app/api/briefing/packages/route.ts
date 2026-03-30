import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - List all packages (ordered by sort_order)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("briefing_category_packages")
      .select("*")
      .order("sort_order", { ascending: true });

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
  try {
    const body = await req.json();
    const { slug, name, description, icon, system_prompt_fragment, max_questions, is_default_enabled, sort_order, department } = body;

    if (!slug || !name) {
      return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
    }

    const { data, error } = await supabase
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

    return NextResponse.json(data);
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
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("briefing_category_packages")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
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
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
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

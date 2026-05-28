import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET /api/assistant/conversations
// Returns the caller's conversations sorted by most-recently-touched first
// (the touch_assistant_conversation trigger keeps updated_at fresh on every
// message insert, so this works without N+1 lookups).
//
// User-scoped Supabase client + explicit user_id filter — same defense-in-
// depth pattern as the rest of the codebase. RLS is the primary gate, the
// explicit filter is the suspenders.
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("assistant_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[assistant/conversations] list error:", error);
      return NextResponse.json({ error: "Falha ao listar conversas." }, { status: 500 });
    }

    return NextResponse.json({ conversations: data || [] });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Falha interna: ${detail}` }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET /api/assistant/conversations/[id] — fetch a conversation's messages.
// DELETE /api/assistant/conversations/[id] — delete the conversation (cascades messages).
// Both require ownership; RLS would already enforce it but we keep the
// explicit eq('user_id', ...) on the conversation lookup as defense-in-depth.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership upfront — clearer 404 than letting RLS return empty.
    const { data: conv, error: convError } = await supabase
      .from("assistant_conversations")
      .select("id, title, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (convError || !conv) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    const { data: messages, error: msgError } = await supabase
      .from("assistant_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      // System messages live in the prompt builder, not the DB row stream —
      // we still filter defensively so accidental inserts don't leak to UI.
      .neq("role", "system")
      .limit(200);

    if (msgError) {
      console.error("[assistant/conversations/[id]] msg fetch error:", msgError);
      return NextResponse.json({ error: "Falha ao carregar mensagens." }, { status: 500 });
    }

    return NextResponse.json({ conversation: conv, messages: messages || [] });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Falha interna: ${detail}` }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // .select('id') so we can verify a row was actually deleted; without it,
    // PostgREST silently returns success even when no row matched.
    const { data, error } = await supabase
      .from("assistant_conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id");

    if (error) {
      console.error("[assistant/conversations/[id]] delete error:", error);
      return NextResponse.json({ error: "Falha ao deletar conversa." }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Falha interna: ${detail}` }, { status: 500 });
  }
}

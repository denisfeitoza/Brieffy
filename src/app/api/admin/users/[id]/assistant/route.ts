import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// PATCH /api/admin/users/[id]/assistant
// Body: { enabled: boolean }
//
// Toggles briefing_quotas.assistant_enabled for a target user. Admin-only.
// Uses the service-role client to upsert the quota row because admins
// editing other users' rows is exactly what RLS blocks by design — the
// authorization gate is the is_admin check below, not RLS.

interface PatchBody {
  enabled?: unknown;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    // Authorize: caller must be authenticated AND have is_admin = true.
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("briefing_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "targetUserId inválido" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as PatchBody;
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled deve ser boolean" },
        { status: 400 }
      );
    }
    const enabled: boolean = body.enabled;

    // Service role: we're editing someone else's quota row. The is_admin
    // check above is the authorization; RLS would (correctly) block this
    // for a regular user, so we step around it explicitly here.
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the target exists before mutating anything — prevents an admin
    // typo from silently inserting a phantom quota row.
    const { data: targetProfile, error: targetError } = await admin
      .from("briefing_profiles")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();
    if (targetError || !targetProfile) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Upsert so users without an existing quota row also get the flag set
    // — the toggle is meaningless if it only works for users who already
    // have a quota record.
    const { error: upsertError } = await admin
      .from("briefing_quotas")
      .upsert(
        { user_id: targetUserId, assistant_enabled: enabled, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (upsertError) {
      console.error("[admin/assistant] upsert failed:", upsertError);
      return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });
    }

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[admin/assistant] internal error:", error);
    return NextResponse.json({ error: `Erro interno: ${detail}` }, { status: 500 });
  }
}

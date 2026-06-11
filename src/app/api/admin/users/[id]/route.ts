import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/admin/users/[id]
// Returns a single user's profile + quota + sessions for the admin detail page.
//
// Why this route exists: the detail page used to read these via the browser
// supabase client, which is the logged-in admin's session — RLS scopes
// briefing_profiles/quotas/sessions reads to `auth.uid() = id`, so an admin
// could only ever load their OWN row and every other user rendered as
// "User not found." The authorization is the is_admin check below (mirrors
// the sibling /assistant route and the updateUserAdminRecord action); the
// service-role client then reads across users by design.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "targetUserId inválido" }, { status: 400 });
    }

    // Authorize: caller must be authenticated AND have is_admin = true.
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: callerProfile } = await supabase
      .from("briefing_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (!callerProfile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Service role: cross-user read, authorized by the is_admin gate above.
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile } = await admin
      .from("briefing_profiles")
      .select("*")
      .eq("id", targetUserId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const { data: quota } = await admin
      .from("briefing_quotas")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const { count: sessionCount } = await admin
      .from("briefing_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .not("template_id", "is", null);

    const { data: sessions } = await admin
      .from("briefing_sessions")
      .select("id, session_name, status, created_at")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      profile,
      quota: quota ?? null,
      sessionCount: sessionCount ?? 0,
      sessions: sessions ?? [],
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[admin/users/[id]] internal error:", error);
    return NextResponse.json({ error: `Erro interno: ${detail}` }, { status: 500 });
  }
}

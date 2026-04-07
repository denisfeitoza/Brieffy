import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { invalidateSettingsCache } from "@/lib/aiConfig";

// BUG-03 FIX: All settings endpoints now require an authenticated admin session.
// Both GET and PUT are protected; non-admins receive 401.

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Check admin role in user metadata or profiles table
  const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
  if (!isAdmin) {
    // Also try checking the profiles table as fallback
    const { data: profile } = await supabase
      .from("briefing_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return { supabase: null, error: NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 }) };
    }
  }

  return { supabase, error: null };
}

// GET — Fetch all settings (admin only)
export async function GET() {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const { data, error } = await supabase!
      .from("app_settings")
      .select("*")
      .order("category");

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/settings Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

// PUT — Batch update settings (admin only)
export async function PUT(req: Request) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await req.json();
    const updates: { key: string; value: string }[] = body.settings;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Batch upsert all settings
    const promises = updates.map(({ key, value }) =>
      supabase!
        .from("app_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    );

    const results = await Promise.all(promises);
    
    // Check for any errors in the responses
    for (const result of results) {
      if (result.error) {
        throw new Error(result.error.message);
      }
    }

    // BUG-10 FIX: Immediately bust the in-memory settings cache so the next
    // briefing request picks up the new values without waiting for TTL expiry.
    invalidateSettingsCache();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

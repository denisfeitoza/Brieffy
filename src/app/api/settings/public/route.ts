import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Public allowlist — ONLY keys safe to expose to unauthenticated users.
// Never expose API keys, model names, or admin-sensitive values here.
const PUBLIC_KEYS = [
  "briefing_timeout_ms",
];

// GET — Public, no auth required. Returns a safe subset of app_settings.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", PUBLIC_KEYS);

    if (error) throw error;

    // Return as a flat key→value map for easy consumption
    const map: Record<string, string> = {};
    (data || []).forEach((row: { key: string; value: string }) => {
      map[row.key] = row.value;
    });

    return NextResponse.json(map, {
      headers: {
        // Cache for 60s on CDN — these rarely change
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    // Fallback: return empty object — callers must use their own defaults
    console.error("[/api/settings/public] Error:", err);
    return NextResponse.json({});
  }
}

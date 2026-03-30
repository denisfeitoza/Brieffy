import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET — Fetch all settings
export async function GET() {
  try {
    const { data, error } = await supabase
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

// PUT — Batch update settings
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updates: { key: string; value: string }[] = body.settings;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Batch upsert all settings
    const promises = updates.map(({ key, value }) =>
      supabase
        .from("app_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key)
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

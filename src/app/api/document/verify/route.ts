import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

// BUG-05 FIX: Lazy client to avoid build-time env var crash
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Constant-time string comparison to prevent timing attacks on passphrase validation.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { token, passphrase } = await req.json();

    if (!token || !passphrase) {
      return NextResponse.json({ error: "Missing token or passphrase" }, { status: 400 });
    }

    const { data: session, error } = await getSupabaseAdmin()
      .from('briefing_sessions')
      .select('id, document_content, edit_passphrase, final_assets, company_info, chosen_language')
      .eq('edit_token', token)
      .single();

    if (error || !session) {
      return NextResponse.json({ valid: false, error: "Invalid or expired link." }, { status: 404 });
    }

    if (!session.edit_passphrase || !safeCompare(session.edit_passphrase, passphrase)) {
      return NextResponse.json({ valid: false, error: "Incorrect passphrase." }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      document: session.document_content || session.final_assets?.document || "",
      companyInfo: session.company_info,
      chosenLanguage: session.chosen_language || 'pt',
    });

  } catch (err: unknown) {
    console.error("Error verifying document:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

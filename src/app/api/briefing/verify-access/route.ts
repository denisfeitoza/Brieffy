import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  try {
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, password } = await req.json();

    if (!sessionId || typeof sessionId !== "string" || typeof password !== "string") {
      return NextResponse.json({ valid: false, error: "Incomplete data." }, { status: 400 });
    }

    // Brute-force protection: cap attempts per (IP+session) AND per session globally.
    const ip = getRequestIP(req);
    const [ipRl, sessionRl] = await Promise.all([
      checkRateLimit(`verify_access:ip:${ip}:${sessionId}`, { maxRequests: 5, windowMs: 15 * 60_000 }),
      checkRateLimit(`verify_access:session:${sessionId}`, { maxRequests: 50, windowMs: 15 * 60_000 }),
    ]);
    if (!ipRl.allowed || !sessionRl.allowed) {
      const reset = Math.max(ipRl.resetAt, sessionRl.resetAt);
      return NextResponse.json(
        { valid: false, error: "Too many attempts. Try again later." },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
      );
    }

    const { data: session, error } = await getSupabaseAdmin()
      .from("briefing_sessions")
      .select("access_password")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ valid: false, error: "Session not found." }, { status: 404 });
    }

    if (!session.access_password) {
      return NextResponse.json({ valid: true });
    }

    if (!safeCompare(session.access_password, password)) {
      return NextResponse.json({ valid: false, error: "Incorrect password." }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch (err: unknown) {
    console.error("[verify-access] Error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

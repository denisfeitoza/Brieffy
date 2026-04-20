import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";

// BUG-02 FIX: This endpoint is intentionally public (serves the briefing wizard share page),
// but we now validate the userId UUID format to prevent injection/enumeration attacks,
// and only return non-sensitive branding fields (no email, no PII).
// The Supabase Anon key is acceptable here since briefing_profiles has RLS allowing
// read on fields used for branding display.
function isValidUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Public endpoint — fetches branding for a given user_id (template owner)
// Used by the public briefing wizard to display the owner's branding
export async function GET(request: Request) {
  try {
    const ip = getRequestIP(request);
    const rl = await checkRateLimit(`profile_branding:${ip}`, { maxRequests: 60, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Você atingiu o limite de requisições. Tente novamente em alguns instantes." },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // BUG-02 FIX: Reject non-UUID values to prevent probing/injection
    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('briefing_profiles')
      // BUG-02 FIX: Only select non-sensitive, branding-only fields
      .select('display_name, company_name, logo_url, brand_color, brand_accent, tagline, website')
      .eq('id', userId)
      .single();

    if (error) {
      // Return default branding if profile not found
      return NextResponse.json({
        display_name: 'Sua Empresa',
        company_name: 'Sua Empresa',
        logo_url: '',
        brand_color: '#06b6d4',
        brand_accent: '#8b5cf6',
        tagline: '',
        website: '',
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

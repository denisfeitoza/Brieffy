import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Public endpoint — fetches branding for a given user_id (template owner)
// Used by the public briefing wizard to display the owner's branding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('briefing_profiles')
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

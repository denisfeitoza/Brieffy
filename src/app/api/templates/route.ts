import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit, getRequestIP } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = getRequestIP(req);
    const rl = checkRateLimit(`template_create:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Você atingiu o limite de criação. Tente novamente em alguns instantes." },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, objectives, core_fields, briefing_purpose, depth_signals } = body;

    // validation — briefing_purpose is mandatory
    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    if (!briefing_purpose || !briefing_purpose.trim()) {
      return NextResponse.json({ error: 'O Propósito Estratégico é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('briefing_templates')
      .insert([
        { 
          name, 
          category: category || 'Geral',
          objectives: Array.isArray(objectives) ? objectives : [],
          core_fields: Array.isArray(core_fields) ? core_fields : [],
          briefing_purpose: briefing_purpose.trim(),
          depth_signals: Array.isArray(depth_signals) ? depth_signals : [],
          user_id: user.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Erro de servidor' }, { status: 500 });
  }
}

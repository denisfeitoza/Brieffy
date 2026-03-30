import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, objectives, core_fields } = body;

    // validation
    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('briefing_templates')
      .insert([
        { 
          name, 
          category: category || 'Geral',
          objectives: Array.isArray(objectives) ? objectives : [],
          core_fields: Array.isArray(core_fields) ? core_fields : [],
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


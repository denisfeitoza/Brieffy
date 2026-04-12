import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Verify user owns this template
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: template } = await supabase
    .from('briefing_templates')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!template || template.user_id !== user.id) {
    return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
  }

  // Find all sessions linked to this template
  const { data: sessions } = await supabase
    .from('briefing_sessions')
    .select('id')
    .eq('template_id', id);

  const sessionIds = (sessions || []).map(s => s.id);

  // Delete interactions for all related sessions
  if (sessionIds.length > 0) {
    await supabase
      .from('briefing_interactions')
      .delete()
      .in('session_id', sessionIds);

    // Delete api_usage for all related sessions
    await supabase
      .from('api_usage')
      .delete()
      .in('session_id', sessionIds);

    // Delete all related sessions
    await supabase
      .from('briefing_sessions')
      .delete()
      .in('id', sessionIds);
  }

  // Delete the template itself
  const { error } = await supabase
    .from('briefing_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Verify user owns this template
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: template } = await supabase
      .from('briefing_templates')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!template || template.user_id !== user.id) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { name, category, objectives, core_fields, briefing_purpose, depth_signals } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    if (!briefing_purpose || !briefing_purpose.trim()) {
      return NextResponse.json({ error: 'O Propósito Estratégico é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('briefing_templates')
      .update({
        name,
        category: category || 'Geral',
        objectives: Array.isArray(objectives) ? objectives : [],
        core_fields: Array.isArray(core_fields) ? core_fields : [],
        briefing_purpose: briefing_purpose.trim(),
        depth_signals: Array.isArray(depth_signals) ? depth_signals : [],
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Erro de servidor' }, { status: 500 });
  }
}

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

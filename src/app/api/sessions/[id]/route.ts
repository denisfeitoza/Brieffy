import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Verify user owns this session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: session } = await supabase
    .from('briefing_sessions')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
  }

  // Delete interactions first (FK constraint)
  await supabase
    .from('briefing_interactions')
    .delete()
    .eq('session_id', id);

  // Delete api_usage records
  await supabase
    .from('api_usage')
    .delete()
    .eq('session_id', id);

  // Delete the session
  const { error } = await supabase
    .from('briefing_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionName, initialContext, selectedPackages, editPassphrase, accessPassword, briefingPurpose, depthSignals } = await request.json();

  if (!sessionName) {
    return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
  }

  // Update session
  const { error } = await supabase
    .from('briefing_sessions')
    .update({
      session_name: sessionName.trim(),
      initial_context: initialContext?.trim() || null,
      selected_packages: selectedPackages || [],
      edit_passphrase: editPassphrase?.trim() || null,
      access_password: accessPassword?.trim() || null,
      briefing_purpose: briefingPurpose?.trim() || null,
      depth_signals: depthSignals || [],
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

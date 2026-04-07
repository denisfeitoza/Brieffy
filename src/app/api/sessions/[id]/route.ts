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

  const body = await request.json();

  // Permite update seletivo (parcial) de features
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if ('sessionName' in body) updateData.session_name = body.sessionName?.trim();
  if ('initialContext' in body) updateData.initial_context = body.initialContext?.trim() || null;
  if ('selectedPackages' in body) updateData.selected_packages = body.selectedPackages || [];
  if ('editPassphrase' in body) updateData.edit_passphrase = body.editPassphrase?.trim() || null;
  if ('accessPassword' in body) updateData.access_password = body.accessPassword?.trim() || null;
  if ('briefingPurpose' in body) updateData.briefing_purpose = body.briefingPurpose?.trim() || null;
  if ('depthSignals' in body) updateData.depth_signals = body.depthSignals || [];
  if ('finalAssets' in body) updateData.final_assets = body.finalAssets;

  // Se não tem absolutamente nada para atualizar, erro
  if (Object.keys(updateData).length <= 1) {
    return NextResponse.json({ error: 'No data to update' }, { status: 400 });
  }

  // Se tem `sessionName`, não permite ficar vazio.
  if ('sessionName' in body && (!body.sessionName || body.sessionName.trim() === '')) {
     return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
  }

  // Update session
  const { error } = await supabase
    .from('briefing_sessions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

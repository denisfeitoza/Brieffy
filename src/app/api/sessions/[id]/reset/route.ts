import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resetSession } from '@/lib/services/briefingService';

export async function POST(
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

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await resetSession(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error resetting session API:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to reset session' }, { status: 500 });
  }
}

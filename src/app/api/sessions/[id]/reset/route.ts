import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resetSession } from '@/lib/services/briefingService';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { password } = await request.json().catch(() => ({ password: '' }));
  
  if (!password) {
    return NextResponse.json({ error: 'Senha é obrigatória' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Verify user owns this session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the password (using a standalone client to avoid modifying the current session)
  const rawSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { error: signInError } = await rawSupabase.auth.signInWithPassword({
    email: user.email,
    password: password,
  });

  if (signInError) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
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

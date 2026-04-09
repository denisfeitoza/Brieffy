'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function updateUserAdminRecord(
  userId: string,
  data: { maxBriefings: number; isBlocked: boolean; blockedReason: string; plan: string }
) {
  const supabase = await createServerSupabaseClient();

  // Verify Admin privileges using the current session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('briefing_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('Forbidden: Admin access required');
  }

  // Create an admin client to bypass user RLS policies when editing other accounts
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Update quotas
  const { error: quotaError } = await adminDb
    .from('briefing_quotas')
    .update({
      max_briefings: data.maxBriefings,
      is_blocked: data.isBlocked,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (quotaError) throw new Error(`Failed to update quota: ${quotaError.message}`);

  // Revalidate admin paths
  revalidatePath('/admin');
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);

  return { success: true };
}

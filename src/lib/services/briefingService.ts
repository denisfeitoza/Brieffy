import { createServerSupabaseClient } from '@/lib/supabase/server';

// ========================
// SESSIONS
// ========================

export async function getSessions() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('briefing_sessions')
    .select('*')
    .not('template_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return data || [];
}

export async function getSessionsByStatus(status?: string) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('briefing_sessions')
    .select('*')
    .not('template_id', 'is', null)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sessions by status:', error);
    return [];
  }

  return data || [];
}

export async function getSessionStats() {
  const supabase = await createServerSupabaseClient();

  const { data: sessions, error } = await supabase
    .from('briefing_sessions')
    .select('id, status, created_at')
    .not('template_id', 'is', null);

  if (error) {
    console.error('Error fetching session stats:', error);
    return {
      total: 0,
      finished: 0,
      inProgress: 0,
      pending: 0,
      completionRate: 0,
      weeklyData: [],
    };
  }

  const all = sessions || [];
  const finished = all.filter(s => s.status === 'finished').length;
  const inProgress = all.filter(s => s.status === 'in_progress').length;
  const pending = all.filter(s => s.status === 'pending').length;
  const completionRate = all.length > 0 ? Math.round((finished / all.length) * 100) : 0;

  // Build weekly data for last 4 weeks
  const now = new Date();
  const weeklyData: { week: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = all.filter(s => {
      const d = new Date(s.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;

    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    weeklyData.push({ week: label, count });
  }

  return { total: all.length, finished, inProgress, pending, completionRate, weeklyData };
}

export async function getSessionById(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('briefing_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching session ${id}:`, error);
    throw new Error('Session not found');
  }

  return data;
}

export async function getInteractionsBySession(sessionId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('briefing_interactions')
    .select('*')
    .eq('session_id', sessionId)
    .order('step_order', { ascending: true });

  if (error) {
    console.error(`Error fetching interactions for session ${sessionId}:`, error);
    return [];
  }

  return data || [];
}

export async function deleteSession(sessionId: string) {
  const supabase = await createServerSupabaseClient();

  // Delete interactions first (FK constraint)
  await supabase
    .from('briefing_interactions')
    .delete()
    .eq('session_id', sessionId);

  const { error } = await supabase
    .from('briefing_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error(`Error deleting session ${sessionId}:`, error);
    throw new Error('Failed to delete session');
  }
}

export async function resetSession(sessionId: string) {
  const supabase = await createServerSupabaseClient();

  // 1. Delete all interactions
  const { error: deleteError } = await supabase
    .from('briefing_interactions')
    .delete()
    .eq('session_id', sessionId);

  if (deleteError) {
    console.error(`Error deleting interactions for session ${sessionId}:`, deleteError);
    throw new Error('Failed to clear briefing history');
  }

  // 2. Reset session state
  const { error: updateError } = await supabase
    .from('briefing_sessions')
    .update({
      status: 'in_progress',
      final_assets: null,
      detected_signals: [],
      document_content: null,
      basal_coverage: 0,
      basal_fields_collected: [],
      current_section: 'company',
      messages_snapshot: null,
      current_step_index: 0,
      session_quality_score: null,
      engagement_summary: null,
      data_completeness: null,
      company_info: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error(`Error resetting session ${sessionId}:`, updateError);
    throw new Error('Failed to reset session state');
  }
}

// ========================
// PACKAGES
// ========================

export async function getPackagesBySlugs(slugs: string[]) {
  if (!slugs || slugs.length === 0) return [];
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('briefing_category_packages')
    .select('slug, name, icon, department, tier, briefing_purpose')
    .in('slug', slugs)
    .or('is_archived.is.null,is_archived.eq.false');
    
  if (error) {
    console.error('Error fetching packages by slugs:', error);
    return [];
  }
  return data || [];
}

// ========================
// TEMPLATES
// ========================

export async function getTemplates() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('briefing_templates')
    .select(`
      *,
      briefing_sessions(id, edit_passphrase, access_password, status, session_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error.message || error);
    return [];
  }

  return data || [];
}

export async function getTemplateById(id: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('briefing_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching template ${id}:`, error?.message || JSON.stringify(error));
    throw new Error('Template not found');
  }

  return data;
}

export async function getSessionsByTemplate(templateId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('briefing_sessions')
    .select('id, status, created_at, session_name, company_info, session_quality_score, basal_coverage, selected_packages, edit_passphrase, edit_token')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching sessions for template ${templateId}:`, error);
    return [];
  }

  return data || [];
}

// ========================
// USER PROFILE & QUOTA
// ========================

export async function getUserProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('briefing_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function getBrandingByUserId(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('briefing_profiles')
    .select('display_name, company_name, logo_url, brand_color, brand_accent, tagline, website')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return {
      display_name: 'Brieffy',
      company_name: 'Brieffy',
      logo_url: '',
      brand_color: '#FF6029',
      brand_accent: '#171717',
      tagline: '',
      website: '',
    };
  }

  return data;
}

export async function getUserQuota() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: quota } = await supabase
    .from('briefing_quotas')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { count: sessionCount } = await supabase
    .from('briefing_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('template_id', 'is', null);

  if (quota) {
    quota.used_briefings = sessionCount || 0;
  }

  return quota;
}

// ========================
// USER — RECENT ACTIVITY & PACKAGES USAGE
// ========================

export async function getUserDashboardExtras() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { lastSession: null, topPackages: [] };

  // Last session (non-onboarding)
  const { data: lastSession } = await supabase
    .from('briefing_sessions')
    .select('id, status, created_at, company_info, session_quality_score, basal_coverage, data_completeness, edit_token, final_assets')
    .eq('user_id', user.id)
    .not('template_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // All sessions for package aggregation
  const { data: allSessions } = await supabase
    .from('briefing_sessions')
    .select('selected_packages')
    .eq('user_id', user.id)
    .not('template_id', 'is', null);

  // Aggregate package usage
  const pkgCount: Record<string, number> = {};
  (allSessions || []).forEach(s => {
    const pkgs = s.selected_packages as string[] | null;
    if (Array.isArray(pkgs)) {
      pkgs.forEach(p => { pkgCount[p] = (pkgCount[p] || 0) + 1; });
    }
  });
  const topPackages = Object.entries(pkgCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug, count]) => ({ slug, count }));

  return { lastSession, topPackages };
}

// ========================
// ADMIN — ALL USERS
// ========================

export async function getAllUsersAdmin() {
  const supabase = await createServerSupabaseClient();

  const { data: profiles } = await supabase
    .from('briefing_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (!profiles) return [];

  // Get quotas for all users
  const userIds = profiles.map(p => p.id);
  const { data: quotas } = await supabase
    .from('briefing_quotas')
    .select('*')
    .in('user_id', userIds);

  // Get session counts per user
  const { data: sessions } = await supabase
    .from('briefing_sessions')
    .select('user_id, status');

  // Merge data
  return profiles.map(profile => {
    const userSessions = sessions?.filter(s => s.user_id === profile.id) || [];
    
    let quota = quotas?.find(q => q.user_id === profile.id) || { max_briefings: 10, used_briefings: 0, is_blocked: false };
    
    // Override stale DB usage count with live session count
    quota = { ...quota, used_briefings: userSessions.length };
    
    return {
      ...profile,
      quota,
      sessionCount: userSessions.length,
      finishedCount: userSessions.filter(s => s.status === 'finished').length,
    };
  });
}

export async function getAllSessionsAdmin() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('briefing_sessions')
    .select('*, briefing_profiles!briefing_sessions_user_id_fkey(display_name, company_name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all sessions (admin):', error);
    return [];
  }

  return data || [];
}

export async function getGlobalStats() {
  const supabase = await createServerSupabaseClient();

  const { data: profiles } = await supabase.from('briefing_profiles').select('id');
  const { data: sessions } = await supabase.from('briefing_sessions').select('id, status, created_at');

  const allSessions = sessions || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessions = allSessions.filter(s => new Date(s.created_at) >= today);

  return {
    totalUsers: profiles?.length || 0,
    totalSessions: allSessions.length,
    todaySessions: todaySessions.length,
    finishedSessions: allSessions.filter(s => s.status === 'finished').length,
  };
}

// ========================
// ADMIN — COSTS & API USAGE
// ========================

export async function getAdminCostMetrics() {
  const supabase = await createServerSupabaseClient();

  const { data: usageLogs, error } = await supabase
    .from('api_usage')
    .select('*, briefing_profiles!api_usage_user_id_fkey(company_name, display_name)')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching API usage logs:', error);
    return { totalCostUSD: 0, totalCostBRL: 0, costByCompany: [], timelineData: [] };
  }

  const EXCHANGE_RATE_BRL = 6.0;
  let totalCostUSD = 0;

  const companyCosts: Record<string, { companyName: string; costUsd: number; tokens: number }> = {};
  const timelineCosts: Record<string, { date: string; costUsd: number; costBrl: number }> = {};

  (usageLogs || []).forEach(log => {
    const profile = Array.isArray(log.briefing_profiles) ? log.briefing_profiles[0] : log.briefing_profiles;
    const companyName = profile?.company_name || profile?.display_name || 'Usuário Avulso';
    const cost = Number(log.estimated_cost_usd) || 0;
    const tokens = (log.prompt_tokens || 0) + (log.completion_tokens || 0);
    
    totalCostUSD += cost;

    if (!companyCosts[companyName]) {
      companyCosts[companyName] = { companyName, costUsd: 0, tokens: 0 };
    }
    companyCosts[companyName].costUsd += cost;
    companyCosts[companyName].tokens += tokens;

    const dateStr = new Date(log.created_at).toISOString().split('T')[0];
    if (!timelineCosts[dateStr]) {
      timelineCosts[dateStr] = { date: dateStr, costUsd: 0, costBrl: 0 };
    }
    timelineCosts[dateStr].costUsd += cost;
    timelineCosts[dateStr].costBrl += (cost * EXCHANGE_RATE_BRL);
  });

  const costByCompany = Object.values(companyCosts)
    .sort((a, b) => b.costUsd - a.costUsd);

  const timelineData = Object.values(timelineCosts)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    totalCostUSD,
    totalCostBRL: totalCostUSD * EXCHANGE_RATE_BRL,
    costByCompany,
    timelineData,
  };
}

// ========================
// ADMIN — EXTENDED STATS
// ========================

export async function getAdminExtendedStats() {
  const supabase = await createServerSupabaseClient();

  const { data: profiles } = await supabase
    .from('briefing_profiles')
    .select('id, is_admin, is_onboarded, created_at')
    .order('created_at', { ascending: true });

  const { data: recentSessionsRaw } = await supabase
    .from('briefing_sessions')
    .select('id, status, created_at, user_id, session_quality_score, briefing_profiles!briefing_sessions_user_id_fkey(display_name, company_name)')
    .not('template_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: allSessions } = await supabase
    .from('briefing_sessions')
    .select('id, status')
    .not('template_id', 'is', null);

  const { data: usageLogs } = await supabase
    .from('api_usage')
    .select('estimated_cost_usd');

  const { data: blockedQuotas } = await supabase
    .from('briefing_quotas')
    .select('user_id, is_blocked')
    .eq('is_blocked', true);

  const nonAdmin = (profiles || []).filter(p => !p.is_admin);
  const onboardedCount = nonAdmin.filter(p => p.is_onboarded).length;
  const onboardingRate = nonAdmin.length > 0 ? Math.round((onboardedCount / nonAdmin.length) * 100) : 0;

  // Plan distribution (column not yet in DB — default all to 'free')
  const planDistribution = nonAdmin.length > 0
    ? [{ plan: 'free', count: nonAdmin.length }]
    : [];

  // Avg cost per finished briefing
  const totalCostUSD = (usageLogs || []).reduce((sum, l) => sum + (Number(l.estimated_cost_usd) || 0), 0);
  const finishedCount = (allSessions || []).filter(s => s.status === 'finished').length;
  const avgCostPerBriefingUSD = finishedCount > 0 ? totalCostUSD / finishedCount : 0;

  // New users per week (last 8 weeks)
  const now = new Date();
  const newUsersWeekly: { week: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = nonAdmin.filter(p => {
      const d = new Date(p.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    newUsersWeekly.push({ week: label, count });
  }

  const blockedCount = blockedQuotas?.length || 0;

  // Format recent sessions
  const recentSessions = (recentSessionsRaw || []).map(s => {
    const profile = Array.isArray(s.briefing_profiles) ? s.briefing_profiles[0] : s.briefing_profiles;
    return {
      id: s.id,
      status: s.status,
      created_at: s.created_at,
      user_id: s.user_id,
      session_quality_score: s.session_quality_score as number | null,
      display_name: (profile as { display_name?: string } | null)?.display_name,
      company_name: (profile as { company_name?: string } | null)?.company_name,
    };
  });

  return {
    onboardingRate,
    onboardedCount,
    totalNonAdminUsers: nonAdmin.length,
    avgCostPerBriefingUSD,
    newUsersWeekly,
    planDistribution,
    blockedCount,
    recentSessions,
  };
}

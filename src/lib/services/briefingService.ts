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
    .order('created_at', { ascending: true });

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

// ========================
// PACKAGES
// ========================

export async function getPackagesBySlugs(slugs: string[]) {
  if (!slugs || slugs.length === 0) return [];
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('briefing_category_packages')
    .select('slug, name, icon, department')
    .in('slug', slugs);
    
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
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error.message || error);
    return [];
  }

  return data || [];
}

export async function getTemplateById(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('briefing_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching template ${id}:`, error);
    throw new Error('Template not found');
  }

  return data;
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
      display_name: 'Smart Briefing',
      company_name: 'Smart Briefing',
      logo_url: '',
      brand_color: '#06b6d4',
      brand_accent: '#8b5cf6',
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

  const { data } = await supabase
    .from('briefing_quotas')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data;
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
    const quota = quotas?.find(q => q.user_id === profile.id);
    const userSessions = sessions?.filter(s => s.user_id === profile.id) || [];
    
    return {
      ...profile,
      quota: quota || { max_briefings: 10, used_briefings: 0, is_blocked: false },
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

  // Fetch all usage logs, joining with profiles to get the company name
  const { data: usageLogs, error } = await supabase
    .from('api_usage')
    .select('*, briefing_profiles!api_usage_user_id_fkey(company_name, display_name)')
    .order('created_at', { ascending: true }); // Ascending for time-series charts

  if (error) {
    console.error('Error fetching API usage logs:', error);
    return { totalCostUSD: 0, totalCostBRL: 0, costByCompany: [], timelineData: [] };
  }

  const EXCHANGE_RATE_BRL = 6.0; // Current approx conversion rate, can be dynamic later
  let totalCostUSD = 0;

  // Track costs grouped by company
  const companyCosts: Record<string, { companyName: string; costUsd: number; tokens: number }> = {};
  
  // Track costs by day for timeline chart
  const timelineCosts: Record<string, { date: string; costUsd: number; costBrl: number }> = {};

  (usageLogs || []).forEach(log => {
    // Note: Database might return the relation as an object or array of objects depending on schema
    const profile = Array.isArray(log.briefing_profiles) ? log.briefing_profiles[0] : log.briefing_profiles;
    const companyName = profile?.company_name || profile?.display_name || 'Usuário Avulso';
    const cost = Number(log.estimated_cost_usd) || 0;
    const tokens = (log.prompt_tokens || 0) + (log.completion_tokens || 0);
    
    totalCostUSD += cost;

    // Group by company
    if (!companyCosts[companyName]) {
      companyCosts[companyName] = { companyName, costUsd: 0, tokens: 0 };
    }
    companyCosts[companyName].costUsd += cost;
    companyCosts[companyName].tokens += tokens;

    // Group by date (YYYY-MM-DD)
    const dateStr = new Date(log.created_at).toISOString().split('T')[0];
    if (!timelineCosts[dateStr]) {
      timelineCosts[dateStr] = { date: dateStr, costUsd: 0, costBrl: 0 };
    }
    timelineCosts[dateStr].costUsd += cost;
    timelineCosts[dateStr].costBrl += (cost * EXCHANGE_RATE_BRL);
  });

  // Convert dicts to arrays and sort
  const costByCompany = Object.values(companyCosts)
    .sort((a, b) => b.costUsd - a.costUsd);

  const timelineData = Object.values(timelineCosts)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    totalCostUSD,
    totalCostBRL: totalCostUSD * EXCHANGE_RATE_BRL,
    costByCompany,
    timelineData
  };
}

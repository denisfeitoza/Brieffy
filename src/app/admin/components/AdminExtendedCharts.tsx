'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, UserCheck, TrendingUp, AlertTriangle, Search,
  CheckCircle2, Clock, AlertCircle, ExternalLink, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ScoreRing } from '@/components/dashboard/ScoreRing';

interface AdminExtendedChartsProps {
  onboardingRate: number;
  onboardedCount: number;
  totalNonAdminUsers: number;
  avgCostPerBriefingUSD: number;
  newUsersWeekly: { week: string; count: number }[];
  planDistribution: { plan: string; count: number }[];
  blockedCount: number;
  recentSessions: {
    id: string;
    status: string;
    created_at: string;
    user_id: string;
    display_name?: string;
    company_name?: string;
    session_quality_score?: number | null;
  }[];
  users: {
    id: string;
    display_name?: string;
    company_name?: string;
    is_admin?: boolean;
    plan?: string;
    sessionCount: number;
    finishedCount: number;
    quota: { max_briefings: number; used_briefings: number; is_blocked: boolean };
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  finished: { label: 'Completed', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock },
  pending: { label: 'Pending', color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20', icon: AlertCircle },
};

const PLAN_COLORS: Record<string, string> = {
  free: '#71717a',
  pro: '#a78bfa',
  enterprise: '#f59e0b',
};

const PAGE_SIZE = 8;

export function AdminExtendedCharts({
  onboardingRate, onboardedCount, totalNonAdminUsers, avgCostPerBriefingUSD,
  newUsersWeekly, planDistribution, blockedCount, recentSessions, users,
}: AdminExtendedChartsProps) {
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(0);

  const nonAdminUsers = users.filter(u => !u.is_admin);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    if (!q) return nonAdminUsers;
    return nonAdminUsers.filter(u =>
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.company_name || '').toLowerCase().includes(q)
    );
  }, [nonAdminUsers, userSearch]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-8">

      {/* Extra KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Onboarding Rate */}
        <Card className="bg-zinc-900/50 border-purple-500/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              Onboarding Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-purple-300">{onboardingRate}%</p>
            <p className="text-xs text-zinc-500 mt-1">{onboardedCount}/{totalNonAdminUsers} users</p>
          </CardContent>
        </Card>

        {/* Avg Cost per Briefing */}
        <Card className="bg-zinc-900/50 border-purple-500/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Avg Cost/Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-emerald-400">${avgCostPerBriefingUSD.toFixed(4)}</p>
            <p className="text-xs text-zinc-500 mt-1">Per finished session</p>
          </CardContent>
        </Card>

        {/* Blocked Users */}
        <Card className={`bg-zinc-900/50 ${blockedCount > 0 ? 'border-red-500/20' : 'border-purple-500/10'}`}>
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${blockedCount > 0 ? 'text-red-400' : 'text-zinc-500'}`} />
              Blocked Users
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className={`text-2xl md:text-3xl font-bold ${blockedCount > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
              {blockedCount}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Quota exceeded</p>
          </CardContent>
        </Card>

        {/* Plan Dist Summary */}
        <Card className="bg-zinc-900/50 border-purple-500/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Plan Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 space-y-1">
            {planDistribution.map(p => (
              <div key={p.plan} className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 capitalize">{p.plan}</span>
                <span className="font-bold" style={{ color: PLAN_COLORS[p.plan] || '#a1a1aa' }}>{p.count}</span>
              </div>
            ))}
            {planDistribution.length === 0 && <p className="text-zinc-600 text-xs">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: New Users + Plan Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Users / Week Chart */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-purple-500/10">
          <CardHeader>
            <CardTitle className="text-xs sm:text-sm text-zinc-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="truncate">New Users / Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={newUsersWeekly} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="week" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7', borderRadius: '8px' }}
                    itemStyle={{ color: '#a78bfa' }}
                      formatter={(v: unknown) => [String(v), 'new users']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2.5} fill="url(#usersGrad)" dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution Donut */}
        <Card className="bg-zinc-900/50 border-purple-500/10">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution.length > 0 ? planDistribution : [{ plan: 'free', count: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {(planDistribution.length > 0 ? planDistribution : [{ plan: 'free', count: 1 }]).map((entry) => (
                      <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] || '#a1a1aa'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: unknown, _: unknown, payload: { payload?: { plan?: string } }) => [String(v), (payload?.payload?.plan) || '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {planDistribution.map(p => (
                <div key={p.plan} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[p.plan] || '#a1a1aa' }} />
                  <span className="text-zinc-400 capitalize">{p.plan}</span>
                  <span className="text-zinc-200 font-medium">{p.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Global Sessions */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Recent Sessions (All Users)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentSessions.length === 0 ? (
            <Card className="md:col-span-2 bg-zinc-900/30 border-white/5">
              <CardContent className="py-8 text-center text-zinc-500 text-sm">No sessions yet.</CardContent>
            </Card>
          ) : recentSessions.map(s => {
            const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
            const StIcon = st.icon;
            return (
              <Card key={s.id} className="bg-zinc-900/40 border-white/8 hover:border-purple-500/20 transition-all">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  {s.session_quality_score != null && (
                    <ScoreRing score={s.session_quality_score} size={40} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {s.company_name || s.display_name || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${st.color}`}>
                        <StIcon className="w-2.5 h-2.5" />
                        {st.label}
                      </span>
                      <span className="text-[10px] text-zinc-500">{format(new Date(s.created_at), 'MMM dd, HH:mm')}</span>
                    </div>
                  </div>
                  <Link href={`/admin/users/${s.user_id}`}>
                    <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 rounded-lg text-xs px-2">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Users Table with Search & Pagination */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Registered Users
            {blockedCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20">
                {blockedCount} blocked
              </span>
            )}
          </h3>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
              placeholder="Search name or company..."
              className="pl-9 bg-zinc-900/50 border-white/10 focus-visible:ring-purple-500 rounded-xl h-9 text-sm"
            />
          </div>
        </div>

        {pagedUsers.length === 0 ? (
          <Card className="bg-zinc-900/30 border-white/5">
            <CardContent className="text-center py-10 text-zinc-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No users match your search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pagedUsers.map(user => (
              <Card key={user.id} className="bg-zinc-900/40 border-white/8 hover:border-purple-500/20 transition-all">
                <CardContent className="py-3 px-3 sm:px-4 md:px-6">
                  <div className="flex flex-col gap-3">
                    {/* Identity Row */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                        {(user.display_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-zinc-100 truncate">{user.display_name || 'Unnamed'}</p>
                        <p className="text-[11px] sm:text-xs text-zinc-500 truncate">{user.company_name || 'No company'}</p>
                      </div>
                      {/* Plan + Blocked */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border ${
                          user.plan === 'enterprise' ? 'text-amber-300 bg-amber-400/10 border-amber-400/20' :
                          user.plan === 'pro' ? 'text-purple-300 bg-purple-400/10 border-purple-400/20' :
                          'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
                        }`}>
                          {user.plan || 'free'}
                        </span>
                        {user.quota.is_blocked && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-red-400 bg-red-400/10 border border-red-400/20">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Stats + Manage Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-white">{user.sessionCount}</span>
                          <span className="hidden sm:inline">Briefings</span>
                          <span className="sm:hidden">Total</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-emerald-400">{user.finishedCount}</span>
                          <span className="hidden sm:inline">Completed</span>
                          <span className="sm:hidden">Done</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-cyan-400">{user.quota.used_briefings}/{user.quota.max_briefings}</span>
                          <span>Quota</span>
                        </div>
                      </div>
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 rounded-lg text-xs px-2 sm:px-3">
                          <ExternalLink className="w-3.5 h-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Manage</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-zinc-500">
              {filteredUsers.length} users · Page {userPage + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserPage(p => Math.max(0, p - 1))}
                disabled={userPage === 0}
                className="border-white/10 text-zinc-400 hover:bg-white/5 rounded-xl h-8 px-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={userPage === totalPages - 1}
                className="border-white/10 text-zinc-400 hover:bg-white/5 rounded-xl h-8 px-3"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

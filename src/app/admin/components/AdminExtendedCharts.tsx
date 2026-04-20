'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, UserCheck, TrendingUp, AlertTriangle, Search,
  CheckCircle2, Clock, AlertCircle, ExternalLink, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import { AdminUsersTable } from './AdminUsersTable';

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
  finished: { label: 'Completed', color: 'text-[var(--orange)] bg-[var(--acbg)] border-[var(--acbd)]', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-[var(--text)] bg-[var(--bg2)] border-[var(--bd)]', icon: Clock },
  pending: { label: 'Pending', color: 'text-[var(--text2)] bg-[var(--bg3)] border-[var(--bd)]', icon: AlertCircle },
};

const PLAN_COLORS: Record<string, string> = {
  free: 'var(--text3)',
  pro: 'var(--orange)',
  enterprise: 'var(--text)',
};

export function AdminExtendedCharts({
  onboardingRate, onboardedCount, totalNonAdminUsers, avgCostPerBriefingUSD,
  newUsersWeekly, planDistribution, blockedCount, recentSessions, users,
}: AdminExtendedChartsProps) {

  return (
    <div className="space-y-8">

      {/* Extra KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Onboarding Rate */}
        <Card className="bg-[var(--bg2)] border-[var(--bd)]">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[var(--orange)]" />
              Onboarding Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-[var(--orange)]">{onboardingRate}%</p>
            <p className="text-xs text-[var(--text3)] mt-1">{onboardedCount}/{totalNonAdminUsers} users</p>
          </CardContent>
        </Card>

        {/* Avg Cost per Briefing */}
        <Card className="bg-[var(--bg2)] border-[var(--bd)]">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--orange)]" />
              Avg Cost/Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-[var(--orange)]">${avgCostPerBriefingUSD.toFixed(4)}</p>
            <p className="text-xs text-[var(--text3)] mt-1">Per finished session</p>
          </CardContent>
        </Card>

        {/* Blocked Users */}
        <Card className={`bg-[var(--bg2)] ${blockedCount > 0 ? 'border-[var(--acbd)]' : 'border-[var(--bd)]'}`}>
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${blockedCount > 0 ? 'text-[var(--orange)]' : 'text-[var(--text3)]'}`} />
              Blocked Users
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className={`text-2xl md:text-3xl font-bold ${blockedCount > 0 ? 'text-[var(--orange)]' : 'text-[var(--text2)]'}`}>
              {blockedCount}
            </p>
            <p className="text-xs text-[var(--text3)] mt-1">Quota exceeded</p>
          </CardContent>
        </Card>

        {/* Plan Dist Summary */}
        <Card className="bg-[var(--bg2)] border-[var(--bd)]">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[var(--orange)]" />
              Plan Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 space-y-1">
            {planDistribution.map(p => (
              <div key={p.plan} className="flex justify-between items-center text-xs">
                <span className="text-[var(--text2)] capitalize">{p.plan}</span>
                <span className="font-bold" style={{ color: PLAN_COLORS[p.plan] || '#6b7280' }}>{p.count}</span>
              </div>
            ))}
            {planDistribution.length === 0 && <p className="text-[var(--text3)] text-xs">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: New Users + Plan Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Users / Week Chart */}
        <Card className="lg:col-span-2 bg-[var(--bg2)] border-[var(--bd)]">
          <CardHeader>
            <CardTitle className="text-xs sm:text-sm text-[var(--text2)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--orange)]" />
              <span className="truncate">New Users / Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={newUsersWeekly} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6029" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff6029" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
                  <XAxis dataKey="week" stroke="var(--text3)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text3)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--text)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--orange)' }}
                      formatter={(v: unknown) => [String(v), 'new users']}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--orange)" strokeWidth={2.5} fill="url(#usersGrad)" dot={{ r: 4, fill: 'var(--bg)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution Donut */}
        <Card className="bg-[var(--bg2)] border-[var(--bd)]">
          <CardHeader>
            <CardTitle className="text-sm text-[var(--text2)]">Plan Distribution</CardTitle>
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
                      <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bd)', color: 'var(--text)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: unknown, _: unknown, payload: { payload?: { plan?: string } }) => [String(v), (payload?.payload?.plan) || '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {planDistribution.map(p => (
                <div key={p.plan} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[p.plan] || '#6b7280' }} />
                  <span className="text-[var(--text2)] capitalize">{p.plan}</span>
                  <span className="text-zinc-200 font-medium">{p.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Global Sessions */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-[var(--text)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--orange)]" />
          Recent Sessions (All Users)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentSessions.length === 0 ? (
            <Card className="md:col-span-2 bg-[var(--bg)] border-[var(--bd)]">
              <CardContent className="py-8 text-center text-[var(--text3)] text-sm">No sessions yet.</CardContent>
            </Card>
          ) : recentSessions.map(s => {
            const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
            const StIcon = st.icon;
            return (
              <Card key={s.id} className="bg-[var(--bg2)] border-[var(--bd)] hover:focus-visible:border-[var(--orange)] border-[var(--orange)]/30 transition-all">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  {s.session_quality_score != null && (
                    <ScoreRing score={s.session_quality_score} size={40} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {s.company_name || s.display_name || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${st.color}`}>
                        <StIcon className="w-2.5 h-2.5" />
                        {st.label}
                      </span>
                      <span className="text-[10px] text-[var(--text3)]">{format(new Date(s.created_at), 'MMM dd, HH:mm')}</span>
                    </div>
                  </div>
                  <Link href={`/admin/users/${s.user_id}`}>
                    <Button variant="ghost" size="sm" className="text-[var(--orange)] hover:text-[var(--orange)] rounded-lg text-xs px-2">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <AdminUsersTable users={users} blockedCount={blockedCount} />
    </div>
  );
}

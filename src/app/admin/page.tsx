import { getGlobalStats, getAllUsersAdmin, getAdminCostMetrics } from '@/lib/services/briefingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, CalendarDays, CheckCircle2, ExternalLink, Shield } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [stats, users, costMetrics] = await Promise.all([
    getGlobalStats(),
    getAllUsersAdmin(),
    getAdminCostMetrics()
  ]);

  // Import locally (only rendered on client)
  const { CostCharts } = await import('./components/CostCharts');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
          Admin Overview
        </h2>
        <p className="text-zinc-400 mt-1 text-sm">Global platform metrics and user management.</p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="bg-zinc-900/50 border-purple-500/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-purple-300">{stats.totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-purple-500/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Total Briefings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-white">{stats.totalSessions}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-purple-500/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-amber-400">{stats.todaySessions}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-purple-500/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-emerald-400">{stats.finishedSessions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Charts Component */}
      <CostCharts 
        totalCostUSD={costMetrics.totalCostUSD}
        totalCostBRL={costMetrics.totalCostBRL}
        costByCompany={costMetrics.costByCompany}
        timelineData={costMetrics.timelineData}
      />

      {/* Users Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Registered Users
        </h3>

        {users.length === 0 ? (
          <Card className="bg-zinc-900/30 border-white/5">
            <CardContent className="text-center py-12 text-zinc-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No users registered yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.filter(u => !u.is_admin).map(user => (
              <Card key={user.id} className="bg-zinc-900/40 border-white/8 hover:border-purple-500/20 transition-all">
                <CardContent className="py-4 px-4 md:px-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                        {(user.display_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-100 truncate">{user.display_name || 'Unnamed'}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.company_name || 'No company'}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <div className="flex flex-col items-center">
                        <span className="text-base font-bold text-white">{user.sessionCount}</span>
                        <span>Briefings</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-base font-bold text-emerald-400">{user.finishedCount}</span>
                        <span>Completed</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-base font-bold text-cyan-400">{user.quota.used_briefings}/{user.quota.max_briefings}</span>
                        <span>Quota</span>
                      </div>
                    </div>

                    {/* Plan Badge + Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        user.plan === 'enterprise' ? 'text-amber-300 bg-amber-400/10 border-amber-400/20' :
                        user.plan === 'pro' ? 'text-purple-300 bg-purple-400/10 border-purple-400/20' :
                        'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
                      }`}>
                        {user.plan || 'free'}
                      </span>
                      {user.quota.is_blocked && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-red-400 bg-red-400/10 border border-red-400/20">
                          Blocked
                        </span>
                      )}
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 rounded-lg text-xs">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

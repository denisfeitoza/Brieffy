import {
  getSessions, getSessionStats, getUserProfile,
  getUserQuota, getUserDashboardExtras
} from '@/lib/services/briefingService';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CalendarDays, ExternalLink, Activity, Sparkles, CheckCircle2,
  Plus, FileText, TrendingUp, Clock, BarChart3, AlertCircle,
  Zap, Package, ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { ActivitySparkline } from '@/components/dashboard/ActivitySparkline';
import { ScoreRing } from '@/components/dashboard/ScoreRing';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [sessions, stats, profile, quota, extras] = await Promise.all([
    getSessions(),
    getSessionStats(),
    getUserProfile(),
    getUserQuota(),
    getUserDashboardExtras(),
  ]);

  const displayName = profile?.display_name || 'there';
  const usedBriefings = quota?.used_briefings || 0;
  const maxBriefings = quota?.max_briefings || 3;
  const isBlocked = quota?.is_blocked || false;
  const usagePercent = maxBriefings > 0 ? Math.round((usedBriefings / maxBriefings) * 100) : 0;
  const isNearLimit = usagePercent >= 67 && !isBlocked; // 2 of 3 used
  const remainingBriefings = Math.max(0, maxBriefings - usedBriefings);

  const lastSession = extras.lastSession as {
    id: string; status: string; created_at: string;
    company_info?: { company_name?: string };
    session_quality_score?: number | null;
    basal_coverage?: number | null;
    edit_token?: string | null;
    final_assets?: Record<string, unknown> | null;
  } | null;

  const topPackages = extras.topPackages as { slug: string; count: number }[];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Hello, {displayName}! 👋
          </h2>
          <p className="text-zinc-400 mt-1 text-sm md:text-base">
            Manage your intelligent briefings and track results.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{usedBriefings}/{maxBriefings} briefings</span>
          </div>
        </div>
      </div>

      {/* Blocked Warning */}
      {isBlocked && (
        <div className="flex items-start gap-3 bg-red-950/40 border border-red-900/50 text-red-300 px-5 py-4 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">You&apos;ve used all your free briefings</p>
            <p className="text-sm text-red-400 mt-0.5">Purchase additional briefing credits to continue creating.</p>
          </div>
          <Button size="sm" className="bg-red-500 hover:bg-red-400 text-white rounded-xl shrink-0 text-xs gap-1">
            <Zap className="w-3.5 h-3.5" />
            Buy More
          </Button>
        </div>
      )}

      {/* Upgrade Banner — Near Limit (2 of 3 used) */}
      {isNearLimit && (
        <div className="flex items-center gap-3 bg-amber-950/30 border border-amber-800/40 text-amber-300 px-5 py-3.5 rounded-2xl">
          <Zap className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {remainingBriefings === 0
                ? 'Last free briefing used'
                : `Only ${remainingBriefings} free briefing${remainingBriefings > 1 ? 's' : ''} left`}
            </p>
            <p className="text-xs text-amber-500 mt-0.5 hidden md:block">
              Each briefing costs a single credit — buy in bulk for the best value.
            </p>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl shrink-0 text-xs gap-1">
            <Zap className="w-3.5 h-3.5" />
            Buy Credits
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
          <CardHeader className="pb-1 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Total Briefings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-3">
            <p className="text-2xl md:text-3xl font-bold text-white">{stats.total}</p>
            <div className="mt-2">
              <ActivitySparkline data={stats.weeklyData} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-emerald-400">{stats.finished}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-amber-400">{stats.inProgress}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-cyan-400">{stats.completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Last Briefing Card + Packages Used */}
      {(lastSession || topPackages.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Last Briefing */}
          {lastSession && (
            <Card className="md:col-span-2 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border-white/10 backdrop-blur-md">
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-start gap-4">
                  {lastSession.session_quality_score != null && (
                    <ScoreRing score={lastSession.session_quality_score} size={56} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Last Briefing</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        lastSession.status === 'finished' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                        lastSession.status === 'in_progress' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                        'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
                      }`}>
                        {lastSession.status === 'finished' ? '✓ Completed' :
                         lastSession.status === 'in_progress' ? '● In Progress' : '○ Pending'}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-zinc-100 truncate">
                      {(lastSession.company_info as { company_name?: string } | null)?.company_name || 'Untitled Briefing'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {format(new Date(lastSession.created_at), 'MMM dd, yyyy')}
                    </p>

                    {/* Coverage Bar */}
                    {lastSession.basal_coverage != null && lastSession.status !== 'finished' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                          <span>Coverage</span>
                          <span>{Math.round(Number(lastSession.basal_coverage))}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Number(lastSession.basal_coverage))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href={`/dashboard/${lastSession.id}`}>
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs gap-1 w-full">
                        <ExternalLink className="w-3 h-3" />
                        {lastSession.status === 'in_progress' ? 'Continue' : 'View'}
                      </Button>
                    </Link>
                    {lastSession.edit_token && lastSession.status === 'finished' && (
                      <Link href={`/doc/${lastSession.edit_token}`} target="_blank">
                        <Button size="sm" variant="outline" className="border-white/10 text-zinc-300 hover:bg-white/5 rounded-xl text-xs gap-1 w-full">
                          <FileText className="w-3 h-3" />
                          Doc
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Packages Used */}
          <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-zinc-400 font-normal flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-purple-400" />
                Top AI Packages Used
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {topPackages.length === 0 ? (
                <p className="text-xs text-zinc-600">No packages used yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {topPackages.map(pkg => (
                    <div key={pkg.slug} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-300 font-medium truncate capitalize">
                        {pkg.slug.replace(/-/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-purple-300 shrink-0 bg-purple-400/10 border border-purple-400/20 px-1.5 py-0.5 rounded-full">
                        ×{pkg.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/dashboard/templates/new" className="block mt-4">
                <Button size="sm" variant="ghost" className="w-full justify-between text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-xl text-xs px-2 group">
                  Explore packages
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={isBlocked ? '#' : '/dashboard/templates/new'}>
          <Button
            disabled={isBlocked}
            className="bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)] disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Briefing
          </Button>
        </Link>
        <Link href="/dashboard/templates">
          <Button variant="outline" className="border-white/10 text-zinc-300 hover:bg-white/5 rounded-xl">
            <FileText className="w-4 h-4 mr-2" />
            Ver Meus Briefings
          </Button>
        </Link>
      </div>

      {/* Sessions List — Client Component for filters/search */}
      <DashboardClient sessions={sessions} />
    </div>
  );
}

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
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

// ── Async components — each streams independently ─────────────────

async function DashboardHeader() {
  const [profile, quota] = await Promise.all([getUserProfile(), getUserQuota()]);

  const displayName = profile?.display_name || 'there';
  const usedBriefings = quota?.used_briefings || 0;
  const maxBriefings = quota?.max_briefings || 3;
  const isBlocked = quota?.is_blocked || false;
  const usagePercent = maxBriefings > 0 ? Math.round((usedBriefings / maxBriefings) * 100) : 0;
  const isNearLimit = usagePercent >= 67 && !isBlocked;
  const remainingBriefings = Math.max(0, maxBriefings - usedBriefings);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)]">
            Hello, {displayName}! 👋
          </h2>
          <p className="text-[var(--text2)] mt-1 text-sm md:text-base">
            Manage your intelligent briefings and track results.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--acbg)] border border-[var(--acbd)] text-[var(--actext)] px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{usedBriefings}/{maxBriefings} briefings</span>
          </div>
        </div>
      </div>

      {isBlocked && (
        <div className="flex flex-col sm:flex-row items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 sm:px-5 py-4 rounded-2xl">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">You&apos;ve used all your free briefings</p>
              <p className="text-xs sm:text-sm text-red-500 mt-0.5">Purchase additional briefing credits to continue creating.</p>
            </div>
          </div>
          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white rounded-full btn-pill shrink-0 text-xs gap-1 w-full sm:w-auto">
            <Zap className="w-3.5 h-3.5" />
            Buy More
          </Button>
        </div>
      )}

      {isNearLimit && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 sm:px-5 py-3.5 rounded-2xl">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Zap className="w-4 h-4 flex-shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium">
                {remainingBriefings === 0
                  ? 'Last free briefing used'
                  : `Only ${remainingBriefings} free briefing${remainingBriefings > 1 ? 's' : ''} left`}
              </p>
              <p className="text-xs text-amber-600 mt-0.5 hidden md:block">
                Each briefing costs a single credit — buy in bulk for the best value.
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-full btn-pill shrink-0 text-xs gap-1 w-full sm:w-auto">
            <Zap className="w-3.5 h-3.5" />
            Buy Credits
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
        <Link href={isBlocked ? '#' : '/dashboard/templates/new'} className="col-span-1">
          <Button
            disabled={isBlocked}
            className="bg-[var(--orange)] hover:bg-[#e8552a] text-black font-semibold rounded-xl disabled:opacity-50 w-full sm:w-auto text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            Novo Briefing
          </Button>
        </Link>
        <Link href="/dashboard/templates" className="col-span-1">
          <Button variant="outline" className="border-[var(--bd)] text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)] rounded-xl w-full sm:w-auto text-xs sm:text-sm">
            <FileText className="w-4 h-4 mr-1 sm:mr-2" />
            Meus Briefings
          </Button>
        </Link>
      </div>
    </>
  );
}

async function DashboardStats() {
  const stats = await getSessionStats();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      <div className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-1.5 mb-2">
          <FileText className="w-3.5 h-3.5 text-[var(--text3)]" />
          <span className="label-caps">Total Briefings</span>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-[var(--text)]">{stats.total}</p>
        <div className="mt-2">
          <ActivitySparkline data={stats.weeklyData} />
        </div>
      </div>

      <div className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-1.5 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="label-caps">Completed</span>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-[var(--text)]">
          {stats.finished}<span className="text-emerald-500 text-lg ml-1">✓</span>
        </p>
      </div>

      <div className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="label-caps">In Progress</span>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-[var(--text)]">{stats.inProgress}</p>
      </div>

      <div className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-[var(--orange)]" />
          <span className="label-caps">Completion Rate</span>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-[var(--text)]">
          {stats.completionRate}<span className="text-[var(--orange)]">%</span>
        </p>
      </div>
    </div>
  );
}

async function DashboardExtras() {
  const extras = await getUserDashboardExtras();

  const lastSession = extras.lastSession as {
    id: string; status: string; created_at: string;
    company_info?: { company_name?: string };
    session_quality_score?: number | null;
    basal_coverage?: number | null;
    edit_token?: string | null;
    final_assets?: Record<string, unknown> | null;
  } | null;

  const topPackages = extras.topPackages as { slug: string; count: number }[];

  if (!lastSession && topPackages.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {lastSession && (
        <div className="md:col-span-2 bg-[var(--text)] text-[var(--bg)] rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              {lastSession.session_quality_score != null && (
                <ScoreRing score={lastSession.session_quality_score} size={48} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-[11px] uppercase tracking-wider font-medium opacity-50">Last Briefing</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    lastSession.status === 'finished' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' :
                    lastSession.status === 'in_progress' ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' :
                    'opacity-50 border-current/20'
                  }`}>
                    {lastSession.status === 'finished' ? '✓ Completed' :
                     lastSession.status === 'in_progress' ? '● In Progress' : '○ Pending'}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold truncate">
                  {(lastSession.company_info as { company_name?: string } | null)?.company_name || 'Untitled Briefing'}
                </p>
                <p className="text-xs opacity-50 mt-0.5">
                  {format(new Date(lastSession.created_at), 'MMM dd, yyyy')}
                </p>

                {lastSession.basal_coverage != null && lastSession.status !== 'finished' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] opacity-50 mb-1">
                      <span>Coverage</span>
                      <span>{Math.round(Number(lastSession.basal_coverage) * 100)}%</span>
                    </div>
                    <div className="score-bar">
                      <div
                        className="score-fill transition-all"
                        style={{ width: `${Math.min(100, Math.round(Number(lastSession.basal_coverage) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <Link href={`/dashboard/${lastSession.id}`} className="flex-1 sm:flex-none">
                <Button size="sm" className="bg-[var(--orange)] hover:bg-[#e8552a] text-black font-semibold rounded-xl text-xs gap-1 w-full">
                  <ExternalLink className="w-3 h-3" />
                  {lastSession.status === 'in_progress' ? 'Continue' : 'View'}
                </Button>
              </Link>
              {lastSession.edit_token && lastSession.status === 'finished' && (
                <Link href={`/doc/${lastSession.edit_token}`} target="_blank" className="flex-1 sm:flex-none">
                  <Button size="sm" variant="outline" className="border-current/20 hover:bg-white/10 rounded-xl text-xs gap-1 w-full text-[var(--bg)]">
                    <FileText className="w-3 h-3" />
                    Doc
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl">
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Package className="w-3.5 h-3.5 text-[var(--orange)]" />
            <span className="label-caps">Top AI Packages</span>
          </div>
          {topPackages.length === 0 ? (
            <p className="text-xs text-[var(--text3)]">No packages used yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topPackages.map(pkg => (
                <div key={pkg.slug} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--text)] font-medium truncate capitalize">
                    {pkg.slug.replace(/-/g, ' ')}
                  </span>
                  <span className="text-xs font-bold text-[var(--actext)] shrink-0 bg-[var(--acbg)] border border-[var(--acbd)] px-1.5 py-0.5 rounded-full">
                    ×{pkg.count}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/templates/new" className="block mt-4">
            <Button size="sm" variant="ghost" className="w-full justify-between text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] rounded-xl text-xs px-2 group">
              Explore packages
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

async function DashboardSessionList() {
  const sessions = await getSessions();
  return <DashboardClient sessions={sessions} />;
}

// ── Skeletons ─────────────────────────────────────────────────────
function HeaderSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="h-9 w-56 bg-[var(--bg2)] rounded-lg" />
          <div className="h-4 w-72 bg-[var(--bg3)] rounded mt-2" />
        </div>
        <div className="h-8 w-32 bg-[var(--acbg)] rounded-full" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-36 bg-[var(--acbg)] border border-[var(--acbd)] rounded-xl" />
        <div className="h-10 w-32 bg-[var(--bg2)] border border-[var(--bd)] rounded-xl" />
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-4 md:p-6">
          <div className="h-3 w-24 bg-[var(--bg3)] rounded mb-3" />
          <div className="h-8 w-16 bg-[var(--bg3)] rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function ExtrasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      <div className="md:col-span-2 bg-[var(--text)] rounded-xl p-5">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-white/10 rounded" />
            <div className="h-5 w-40 bg-white/10 rounded" />
            <div className="h-3 w-24 bg-white/5 rounded" />
          </div>
        </div>
      </div>
      <div className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-4 space-y-3">
        <div className="h-3 w-32 bg-[var(--bg3)] rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-28 bg-[var(--bg3)] rounded" />
            <div className="h-5 w-8 bg-[var(--acbg)] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-5 w-40 bg-[var(--bg2)] rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-4 bg-[var(--bg3)] rounded" style={{ width: `${120 + i * 40}px` }} />
                <div className="h-5 w-20 bg-[var(--bg3)] rounded-full" />
              </div>
              <div className="h-3 w-28 bg-[var(--bg3)] rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-[var(--bg3)] rounded-lg" />
              <div className="h-8 w-14 bg-[var(--bg3)] rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page shell — renders INSTANTLY, data streams in ───────────────
export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<ExtrasSkeleton />}>
        <DashboardExtras />
      </Suspense>

      <Suspense fallback={<SessionsSkeleton />}>
        <DashboardSessionList />
      </Suspense>
    </div>
  );
}

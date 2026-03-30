import { getSessions, getSessionStats, getUserProfile, getUserQuota } from '@/lib/services/briefingService';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, ExternalLink, Activity, Sparkles, CheckCircle2, 
  Plus, FileText, TrendingUp, Clock, BarChart3, Trash2, Copy, 
  Search, Filter, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [sessions, stats, profile, quota] = await Promise.all([
    getSessions(),
    getSessionStats(),
    getUserProfile(),
    getUserQuota(),
  ]);

  const displayName = profile?.display_name || 'there';
  const usedBriefings = quota?.used_briefings || 0;
  const maxBriefings = quota?.max_briefings || 10;
  const isBlocked = quota?.is_blocked || false;

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
        <div className="flex items-center gap-3 bg-red-950/40 border border-red-900/50 text-red-300 px-5 py-4 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Account paused</p>
            <p className="text-sm text-red-400">Your briefing quota has been reached. Contact support to upgrade.</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-zinc-400 font-normal flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Total Briefings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-white">{stats.total}</p>
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

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/templates/new">
          <Button className="bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)]">
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

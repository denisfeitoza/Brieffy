import { getGlobalStats, getAllUsersAdmin, getAdminCostMetrics, getAdminExtendedStats } from '@/lib/services/briefingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CalendarDays, CheckCircle2, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [stats, users, costMetrics, extendedStats] = await Promise.all([
    getGlobalStats(),
    getAllUsersAdmin(),
    getAdminCostMetrics(),
    getAdminExtendedStats(),
  ]);

  const { CostCharts } = await import('./components/CostCharts');
  const { AdminExtendedCharts } = await import('./components/AdminExtendedCharts');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
            <Shield className="w-7 h-7 text-[var(--orange)]" />
            Admin<span className="text-[var(--orange)]">.</span> Overview
          </h2>
          <p className="text-[var(--text2)] mt-1 text-sm">Global platform metrics and user management.</p>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="bg-[var(--bg2)] border-[var(--bd)] shadow-none">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[var(--orange)]" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-[var(--orange)]">{stats.totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--bg2)] border-[var(--bd)] shadow-none">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Total Briefings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-[var(--text)]">{stats.totalSessions}</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--bg2)] border-[var(--bd)] shadow-none">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[var(--text)]" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-[var(--text)]">{stats.todaySessions}</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--bg2)] border-[var(--bd)] shadow-none">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm text-[var(--text2)] font-normal flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--orange)]" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <p className="text-2xl md:text-3xl font-bold text-[var(--orange)]">{stats.finishedSessions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Charts */}
      <CostCharts
        totalCostUSD={costMetrics.totalCostUSD}
        totalCostBRL={costMetrics.totalCostBRL}
        costByCompany={costMetrics.costByCompany}
        timelineData={costMetrics.timelineData}
      />

      {/* Extended Stats: extra KPIs, charts, sessions, users table */}
      <AdminExtendedCharts
        onboardingRate={extendedStats.onboardingRate}
        onboardedCount={extendedStats.onboardedCount}
        totalNonAdminUsers={extendedStats.totalNonAdminUsers}
        avgCostPerBriefingUSD={extendedStats.avgCostPerBriefingUSD}
        newUsersWeekly={extendedStats.newUsersWeekly}
        planDistribution={extendedStats.planDistribution}
        blockedCount={extendedStats.blockedCount}
        recentSessions={extendedStats.recentSessions}
        users={users}
      />
    </div>
  );
}

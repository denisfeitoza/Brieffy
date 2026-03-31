import { getTemplateById, getSessionsByTemplate } from '@/lib/services/briefingService';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Clock, FileText, Target, Sparkles,
  CheckCircle2, Activity, BarChart3, Zap, Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GenerateLinkModal } from '@/components/dashboard/GenerateLinkModal';
import { TemplateSessionActions } from './TemplateSessionActions';

export const dynamic = 'force-dynamic';

function statusConfig(status: string) {
  switch (status) {
    case 'finished':
      return { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
    case 'in_progress':
      return { label: 'Em Progresso', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
    default:
      return { label: 'Pendente', icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' };
  }
}

function qualityGradient(score: number) {
  if (score >= 80) return 'from-emerald-500 to-cyan-500';
  if (score >= 60) return 'from-cyan-500 to-blue-500';
  if (score >= 40) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-pink-500';
}

export default async function TemplateDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getTemplateById(id);
  const sessions = await getSessionsByTemplate(id);

  const depthSignals = (template.depth_signals as string[]) || [];
  const finishedCount = sessions.filter(s => s.status === 'finished').length;
  const inProgressCount = sessions.filter(s => s.status === 'in_progress').length;
  const avgQuality = sessions.filter(s => s.session_quality_score != null).length > 0
    ? Math.round(sessions.filter(s => s.session_quality_score != null).reduce((sum, s) => sum + (s.session_quality_score as number), 0) / sessions.filter(s => s.session_quality_score != null).length)
    : null;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/templates">
          <Button variant="ghost" className="w-fit text-zinc-400 hover:text-white -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Meus Briefings
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              {template.name}
            </h2>
            {template.briefing_purpose && (
              <div className="flex items-start gap-2 mt-3">
                <Target className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {template.briefing_purpose}
                </p>
              </div>
            )}
            <div className="flex items-center text-zinc-500 text-xs mt-3 gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Criado em {format(new Date(template.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
              </span>
              <span className="text-zinc-700">·</span>
              <span>{sessions.length} sessão(ões)</span>
            </div>
          </div>
          <div className="shrink-0">
            <GenerateLinkModal templateId={template.id} templateName={template.name} />
          </div>
        </div>
      </div>

      {/* Depth Signals */}
      {depthSignals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3" />
            Pontos Sensíveis
          </span>
          {depthSignals.map((signal: string) => (
            <span
              key={signal}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/8 text-amber-400/80 border border-amber-500/15 font-medium"
            >
              {signal}
            </span>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Total</span>
              <Users className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{sessions.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Concluídos</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-emerald-400">{finishedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Em Progresso</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-amber-400">{inProgressCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 backdrop-blur-md border-white/10">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Qualidade Média</span>
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            {avgQuality !== null ? (
              <div className="flex items-end gap-1.5">
                <span className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${qualityGradient(avgQuality)} bg-clip-text text-transparent`}>
                  {avgQuality}
                </span>
                <span className="text-zinc-600 text-sm mb-0.5">/100</span>
              </div>
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-zinc-600">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Sessões
          </h3>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => {
              const cfg = statusConfig(session.status);
              const StatusIcon = cfg.icon;
              const companyName = (session.company_info as { company_name?: string } | null)?.company_name;
              const sessionLabel = session.session_name || companyName || 'Sessão sem nome';
              const packages = (session.selected_packages as string[]) || [];
              const qualityScore = session.session_quality_score as number | null;
              const coverage = session.basal_coverage as number | null;

              return (
                <Card
                  key={session.id}
                  className="bg-zinc-900/40 border-white/5 hover:border-cyan-500/20 transition-all duration-300 backdrop-blur-md group"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Main Content */}
                      <Link
                        href={`/dashboard/${session.id}`}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {/* Quality Ring */}
                          {qualityScore != null && (
                            <div className="relative w-10 h-10 shrink-0 hidden sm:flex">
                              <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-zinc-800" strokeWidth="3" />
                                <circle
                                  cx="18" cy="18" r="15" fill="none"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeDasharray={`${qualityScore * 0.942} 100`}
                                  className={qualityScore >= 80 ? 'text-emerald-400' : qualityScore >= 60 ? 'text-cyan-400' : qualityScore >= 40 ? 'text-amber-400' : 'text-red-400'}
                                  stroke="currentColor"
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                                {qualityScore}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            {/* Title + Status */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                                {sessionLabel}
                              </h4>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                                <StatusIcon className="w-2.5 h-2.5" />
                                {cfg.label}
                              </span>
                            </div>

                            {/* Date + Packages */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-500">
                              <span>{format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                              {packages.length > 0 && (
                                <>
                                  <span className="text-zinc-700">·</span>
                                  <span className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-violet-400" />
                                    {packages.length} skills
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Coverage Bar */}
                            {coverage != null && session.status !== 'finished' && (
                              <div className="mt-2 max-w-xs">
                                <div className="flex justify-between text-[9px] text-zinc-600 mb-0.5">
                                  <span>Cobertura</span>
                                  <span>{Math.round(Number(coverage) * 100)}%</span>
                                </div>
                                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, Number(coverage) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Actions */}
                      <TemplateSessionActions session={session} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-16 px-6 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 text-center">
            <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-zinc-600" />
            </div>
            <h4 className="text-base font-bold text-white mb-1.5">Nenhuma sessão criada</h4>
            <p className="text-sm text-zinc-500 max-w-sm mb-5">
              Gere um link para compartilhar este briefing com seu cliente.
            </p>
            <GenerateLinkModal templateId={template.id} templateName={template.name} />
          </div>
        )}
      </div>
    </div>
  );
}

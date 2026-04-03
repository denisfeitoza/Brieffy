import { getSessionById, getInteractionsBySession } from '@/lib/services/briefingService';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, FileText, MessageSquare, Download, Activity, Brain, AlertTriangle, CheckCircle2, TrendingUp, BarChart3, Eye, Zap, Shield, Loader2, Code, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CopyButtons } from '@/components/dashboard/CopyButtons';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function simpleMarkdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^[\-\*] (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/^---$/gim, '<hr />')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br />');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');
  return '<p>' + html + '</p>';
}

function engagementColor(level: string) {
  switch (level) {
    case 'high': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Alto' };
    case 'medium': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Médio' };
    case 'low': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Baixo' };
    default: return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20', label: 'N/A' };
  }
}

function qualityGradient(score: number) {
  if (score >= 80) return 'from-emerald-500 to-cyan-500';
  if (score >= 60) return 'from-cyan-500 to-blue-500';
  if (score >= 40) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-pink-500';
}

function areaLabel(area: string) {
  const map: Record<string, string> = {
    discovery: 'Descoberta', identity: 'Identidade', audience: 'Público', visual: 'Visual',
    delivery: 'Entrega', strategy: 'Estratégia', market: 'Mercado', brand: 'Marca',
    execution: 'Execução', consulting: 'Consultoria',
  };
  return map[area] || area.charAt(0).toUpperCase() + area.slice(1);
}

async function SessionContent({ id }: { id: string }) {
  const [session, interactions] = await Promise.all([
    getSessionById(id),
    getInteractionsBySession(id),
  ]);

  const summaryData = (session.summary_data as Record<string, unknown>) || {};
  const qualityScore = session.session_quality_score as number | null;
  const engagementSummary = session.engagement_summary as { overall?: string; by_area?: Record<string, string> } | null;
  const dataCompleteness = session.data_completeness as { strong_fields?: string[]; weak_fields?: string[]; inferred_fields?: string[] } | null;
  const detectedSignals = session.detected_signals as Array<{ category: string; summary: string; relevance_score: number }> | null;
  const basalCoverage = session.basal_coverage as number | null;
  const selectedPackages = session.selected_packages as string[] | null;

  const hasInsights = qualityScore || engagementSummary || dataCompleteness || (detectedSignals && detectedSignals.length > 0);

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-zinc-950 border border-white/5 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center flex-wrap gap-3">
            Detalhes do Briefing
            <span className="text-xs font-mono bg-cyan-950/50 text-cyan-400 px-3 py-1 rounded-full border border-cyan-900/50 shadow-inner">
              {session.id.split('-')[0]}
            </span>
            {session.status === 'finished' && (
              <span className="text-xs bg-emerald-950/50 text-emerald-400 px-3 py-1 rounded-full border border-emerald-900/50 flex items-center gap-1.5 shadow-inner">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluído
              </span>
            )}
          </h2>
          <div className="flex items-center text-zinc-400 mt-3 text-sm flex-wrap gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-zinc-500" />
              {format(new Date(session.created_at), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            {interactions.length > 0 && (
              <span className="flex items-center gap-1.5 opacity-80">
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                {interactions.length} interações registradas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-zinc-900/80 p-1 border border-white/10 rounded-xl mb-6 shadow-md inline-flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-400 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-all">
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="document" className="data-[state=active]:bg-emerald-950/50 data-[state=active]:text-emerald-400 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-all">
            <FileText className="w-4 h-4" />
            Documento Final
          </TabsTrigger>
          <TabsTrigger value="transcript" className="data-[state=active]:bg-violet-950/50 data-[state=active]:text-violet-400 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-all">
            <MessageSquare className="w-4 h-4" />
            Transcrição
          </TabsTrigger>
          <TabsTrigger value="json" className="data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-400 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-all">
            <Code className="w-4 h-4" />
            JSON Raw
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VISÃO GERAL */}
        <TabsContent value="overview" className="space-y-6 focus:outline-none animate-in fade-in duration-500">
          {!hasInsights ? (
             <div className="text-center p-12 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
               <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
               <p className="text-zinc-400">Dados insuficientes para gerar insights analíticos para esta sessão.</p>
             </div>
          ) : (
             <div className="space-y-6">
                {/* Metricas Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Quality */}
                  {qualityScore !== null && (
                    <Card className="bg-gradient-to-br from-zinc-900/90 to-black/90 border-white/5 hover:border-white/10 transition-colors shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Score de Qualidade
                          </span>
                        </div>
                        <div className="flex items-end gap-2">
                          <span className={`text-4xl font-bold bg-gradient-to-r ${qualityGradient(qualityScore)} bg-clip-text text-transparent`}>
                            {qualityScore}
                          </span>
                          <span className="text-zinc-600 font-medium mb-1">/100</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${qualityGradient(qualityScore)}`} style={{ width: `${qualityScore}%` }} />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {/* Engagement */}
                  {engagementSummary?.overall && (
                    <Card className="bg-gradient-to-br from-zinc-900/90 to-black/90 border-white/5 hover:border-white/10 transition-colors shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Engajamento Geral
                          </span>
                        </div>
                        {(() => {
                          const ec = engagementColor(engagementSummary.overall);
                          return (
                            <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ${ec.bg} ${ec.border} border shadow-inner`}>
                              <div className={`w-2.5 h-2.5 rounded-full ${ec.text.replace('text-', 'bg-')} shadow-[0_0_8px] shadow-current`} />
                              <span className={`text-base font-bold ${ec.text}`}>{ec.label}</span>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                  {/* Basal Coverage */}
                  {basalCoverage !== null && (
                    <Card className="bg-gradient-to-br from-zinc-900/90 to-black/90 border-white/5 hover:border-white/10 transition-colors shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Cobertura Basal
                          </span>
                        </div>
                        <span className="text-4xl font-bold text-cyan-400">{Math.round(basalCoverage * 100)}%</span>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                          <div className="h-full rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" style={{ width: `${basalCoverage * 100}%` }} />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {/* Packages */}
                  {selectedPackages && selectedPackages.length > 0 && (
                    <Card className="bg-gradient-to-br from-zinc-900/90 to-black/90 border-white/5 hover:border-white/10 transition-colors shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Serviços Ativos
                          </span>
                        </div>
                        <span className="text-4xl font-bold text-violet-400">{selectedPackages.length}</span>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Second row: Engagement breakdown and Completudiness */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {engagementSummary?.by_area && (
                    <Card className="bg-zinc-950/80 border-white/5 shadow-xl">
                      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-base font-medium text-zinc-200 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" /> Detalhamento de Engajamento
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.entries(engagementSummary.by_area).map(([area, level]) => {
                            const ec = engagementColor(level);
                            return (
                              <div key={area} className={`flex flex-col gap-2 p-4 rounded-xl ${ec.bg} ${ec.border} border`}>
                                <span className="text-xs font-medium text-zinc-300">{areaLabel(area)}</span>
                                <div className="flex items-center gap-1.5 mt-auto">
                                  <div className={`w-1.5 h-1.5 rounded-full ${ec.text.replace('text-', 'bg-')}`} />
                                  <span className={`text-[11px] font-bold tracking-wide uppercase ${ec.text}`}>{ec.label}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {dataCompleteness && (
                    <Card className="bg-zinc-950/80 border-white/5 shadow-xl">
                      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-base font-medium text-zinc-200 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-cyan-400" /> Qualidade dos Dados Coletados
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {dataCompleteness.strong_fields && dataCompleteness.strong_fields.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Campos Sólidos</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {dataCompleteness.strong_fields.map((f, i) => (
                                <span key={i} className="text-[11px] font-medium bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/20">{f}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {dataCompleteness.weak_fields && dataCompleteness.weak_fields.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Atenção Necessária</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {dataCompleteness.weak_fields.map((f, i) => (
                                <span key={i} className="text-[11px] font-medium bg-amber-500/10 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/20">{f}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Signals row */}
                {detectedSignals && detectedSignals.length > 0 && (
                  <Card className="bg-zinc-950/80 border-white/5 shadow-xl">
                     <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-base font-medium text-zinc-200 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-violet-400" /> Sinais Detectados (Active Listening)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {detectedSignals.map((signal, i) => {
                            const categoryColors: Record<string, string> = {
                              implicit_pain: 'border-red-500/30 bg-red-500/5',
                              hidden_ambition: 'border-emerald-500/30 bg-emerald-500/5',
                              contradiction: 'border-amber-500/30 bg-amber-500/5',
                              competitive_signal: 'border-blue-500/30 bg-blue-500/5',
                              brand_maturity: 'border-violet-500/30 bg-violet-500/5',
                              emotional_trigger: 'border-pink-500/30 bg-pink-500/5',
                              market_gap: 'border-cyan-500/30 bg-cyan-500/5',
                            };
                            const textColors: Record<string, string> = {
                              implicit_pain: 'text-red-400', hidden_ambition: 'text-emerald-400',
                              contradiction: 'text-amber-400', competitive_signal: 'text-blue-400',
                              brand_maturity: 'text-violet-400', emotional_trigger: 'text-pink-400', gap: 'text-cyan-400'
                            };
                            const textColor = textColors[signal.category] || 'text-zinc-400';
                            
                            return (
                              <div key={i} className={`p-4 rounded-xl border ${categoryColors[signal.category] || 'border-zinc-500/30 bg-zinc-500/5'} flex flex-col`}>
                                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>
                                    {signal.category.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-zinc-400 font-medium">
                                    {(signal.relevance_score || 0) * 100}% Score
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed font-medium">{signal.summary}</p>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                  </Card>
                )}
             </div>
          )}
        </TabsContent>

        {/* TAB 2: DOCUMENTO FINAL */}
        <TabsContent value="document" className="focus:outline-none animate-in fade-in duration-500">
           {session.final_assets?.document ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <Card className="bg-zinc-950 border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent h-32 pointer-events-none" />
                    <CardContent className="p-8 md:p-12 relative z-10">
                      <div 
                        className="prose prose-invert max-w-[800px] mx-auto
                          prose-headings:font-bold prose-headings:tracking-tight
                          prose-h1:text-3xl prose-h1:text-white prose-h1:mb-8
                          prose-h2:text-2xl prose-h2:text-cyan-400 prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-4
                          prose-h3:text-xl prose-h3:text-zinc-200 prose-h3:mt-8
                          prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-base
                          prose-li:text-zinc-300 prose-li:marker:text-cyan-500
                          prose-strong:text-emerald-400 prose-strong:font-semibold
                          prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-500/5 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-blockquote:text-zinc-400 prose-blockquote:not-italic"
                        dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(session.final_assets.document) }}
                      />
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <div className="sticky top-6">
                    <Card className="bg-zinc-900 border-white/10">
                      <CardHeader className="p-4 border-b border-white/5">
                        <CardTitle className="text-sm font-medium">Ações do Documento</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <CopyButtons 
                          markdown={session.final_assets.document} 
                          html={simpleMarkdownToHtml(session.final_assets.document)} 
                        />
                        <a 
                          href={`data:text/markdown;charset=utf-8,${encodeURIComponent(session.final_assets.document)}`}
                          download={`briefing-${session.id.split('-')[0]}.md`}
                          className="block"
                        >
                          <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium border-0 shadow-lg shadow-cyan-900/50">
                            <Download className="w-4 h-4 mr-2" />
                            Arquivo Markdown (.md)
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
           ) : Object.keys(summaryData).length === 0 ? (
             <div className="flex flex-col items-center justify-center p-24 text-center bg-zinc-950 border border-white/5 rounded-2xl">
                <FileText className="w-16 h-16 text-zinc-700 mb-6" />
                <h3 className="text-xl font-bold text-zinc-300 mb-2">Sem Documento Final</h3>
                <p className="text-zinc-500 max-w-sm">Nenhum asset de documento foi gerado ainda para as repostas desta sessão.</p>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center p-24 text-center bg-zinc-950 border border-white/5 rounded-2xl">
                <AlertTriangle className="w-16 h-16 text-amber-500 mb-6 opacity-80" />
                <h3 className="text-xl font-bold text-zinc-300 mb-2">Documento Indisponível</h3>
                <p className="text-zinc-500 max-w-sm">A IA coletou propriedades, mas não compilou em um markdown legível.</p>
                <Button className="mt-6" variant="outline">
                  Consulte a aba JSON Raw
                </Button>
             </div>
           )}
        </TabsContent>

        {/* TAB 3: TRANSCRIÇÃO */}
        <TabsContent value="transcript" className="focus:outline-none animate-in fade-in duration-500">
           <div className="max-w-4xl mx-auto space-y-8 bg-zinc-950 p-6 md:p-10 rounded-2xl border border-white/5">
              {interactions.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">Nenhuma interação registrada.</div>
              ) : (
                interactions.map((interaction, idx) => {
                  const inputType = interaction.question_type || 'text';
                  const isDepthQ = interaction.is_depth_question;
                  const answerRaw = interaction.user_answer;
                  
                  return (
                    <div key={interaction.id} className="relative">
                      {/* Interaction connector line */}
                      {idx !== interactions.length - 1 && (
                        <div className="absolute left-8 top-16 bottom-[-32px] w-px bg-white/5" />
                      )}

                      {/* AI Bubble */}
                      <div className="flex gap-4 mb-6">
                        <div className={`mt-1 flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border shadow-xl z-10 ${isDepthQ ? 'bg-violet-950 border-violet-500/30' : 'bg-cyan-950 border-cyan-500/30'}`}>
                          {isDepthQ ? <Brain className="w-5 h-5 text-violet-400" /> : <MessageSquare className="w-5 h-5 text-cyan-400" />}
                        </div>
                        <div className="flex-1">
                          <div className={`inline-block px-5 py-3.5 rounded-2xl rounded-tl-sm border text-sm max-w-[90%] font-medium ${isDepthQ ? 'bg-violet-950/20 border-violet-500/20 text-violet-100' : 'bg-zinc-900 border-white/5 text-zinc-200'}`}>
                            {interaction.question_text || 'Mensagem do sistema'}
                          </div>
                        </div>
                      </div>

                      {/* User Bubble */}
                      <div className="flex gap-4 mb-4 flex-row-reverse">
                        <div className="mt-1 flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950 shadow-xl z-10">
                          <span className="text-emerald-400 text-xs font-bold font-mono">CLI</span>
                        </div>
                        <div className="flex-1 flex flex-col items-end">
                           <div className="inline-block px-5 py-3.5 rounded-2xl rounded-tr-sm border border-emerald-500/20 bg-emerald-950/20 max-w-[90%]">
                              {inputType === 'file_upload' && (
                                <div className="space-y-3 flex flex-wrap gap-2">
                                  {(Array.isArray(answerRaw) ? answerRaw : [answerRaw]).map((url: any, i: number) => {
                                    const strUrl = String(url);
                                    if (!strUrl) return null;
                                    return (
                                      <div key={i} className="flex flex-col gap-2 max-w-full">
                                        {strUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                          <img src={strUrl} alt={`Upload ${i}`} className="max-h-60 rounded-xl border border-white/10" />
                                        ) : (
                                          <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5 w-full">
                                            <FileText className="w-6 h-6 text-emerald-400 shrink-0" />
                                            <span className="text-xs font-medium text-emerald-200 break-all truncate">{strUrl.split('/').pop()}</span>
                                          </div>
                                        )}
                                        <a href={strUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                                          <Button variant="secondary" size="sm" className="w-full h-8 text-xs font-medium bg-emerald-900/50 hover:bg-emerald-800/80 text-emerald-300">BAIXAR</Button>
                                        </a>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              
                              {inputType === 'color_picker' && (
                                <div className="flex gap-2 flex-wrap justify-end">
                                  {Array.isArray(answerRaw) 
                                     ? answerRaw.map((c: string, i: number) => (
                                         <div key={i} className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                                           <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                                           <span className="text-xs font-mono text-emerald-200">{c}</span>
                                         </div>
                                       ))
                                     : <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                                         <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: String(answerRaw) }} />
                                         <span className="text-xs font-mono text-emerald-200">{String(answerRaw)}</span>
                                       </div>
                                  }
                                </div>
                             )}

                             {(inputType !== 'file_upload' && inputType !== 'color_picker') && (
                               <p className="text-sm text-emerald-100 whitespace-pre-wrap font-medium">
                                 {typeof answerRaw === 'object' ? JSON.stringify(answerRaw, null, 2) : String(answerRaw)}
                               </p>
                             )}
                           </div>
                           <span className="text-[10px] text-zinc-500 font-mono mt-1 mr-1">Input Type: {inputType}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
           </div>
        </TabsContent>

        {/* TAB 4: JSON RAW */}
        <TabsContent value="json" className="focus:outline-none animate-in fade-in duration-500">
           <Card className="bg-zinc-950 border-white/10">
             <CardHeader className="bg-black/50 border-b border-white/5 rounded-t-xl">
               <CardTitle className="text-sm font-mono text-amber-500 flex items-center gap-2">
                 <Code className="w-4 h-4" /> summary_data.json
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="overflow-x-auto p-6 max-h-[70vh] custom-scrollbar">
                   <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
                     {JSON.stringify(summaryData, null, 2)}
                   </pre>
                </div>
             </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

function SessionDetailsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-32 bg-zinc-900 border border-white/5 rounded-2xl" />
      <div className="flex gap-2">
        <div className="w-32 h-10 bg-zinc-900 rounded-xl" />
        <div className="w-32 h-10 bg-zinc-900 rounded-xl" />
        <div className="w-32 h-10 bg-zinc-900 rounded-xl" />
      </div>
      <div className="h-96 bg-zinc-900 border border-white/5 rounded-2xl" />
    </div>
  );
}

export default async function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-20">
      {/* Back navigation */}
      <Link href="/dashboard/templates" className="inline-block group mb-2">
        <div className="flex items-center text-sm font-medium text-zinc-400 group-hover:text-cyan-400 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para Meus Briefings
        </div>
      </Link>

      <Suspense fallback={<SessionDetailsSkeleton />}>
        <SessionContent id={id} />
      </Suspense>
    </div>
  );
}

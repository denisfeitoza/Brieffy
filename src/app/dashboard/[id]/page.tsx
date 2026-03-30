import { getSessionById, getInteractionsBySession } from '@/lib/services/briefingService';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, FileText, MessageSquare, Download, Activity, Brain, AlertTriangle, CheckCircle2, TrendingUp, BarChart3, Eye, Zap, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CopyButtons } from '@/components/dashboard/CopyButtons';
export const dynamic = 'force-dynamic';

// Simple Markdown → HTML converter (server component safe)
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

// Engagement label & color helpers
function engagementColor(level: string) {
  switch (level) {
    case 'high': return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Alto' };
    case 'medium': return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Médio' };
    case 'low': return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', label: 'Baixo' };
    default: return { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30', label: 'N/A' };
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
    discovery: 'Descoberta',
    identity: 'Identidade',
    audience: 'Público',
    visual: 'Visual',
    delivery: 'Entrega',
    strategy: 'Estratégia',
    market: 'Mercado',
    brand: 'Marca',
    execution: 'Execução',
    consulting: 'Consultoria',
  };
  return map[area] || area.charAt(0).toUpperCase() + area.slice(1);
}

export default async function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionById(id);
  const interactions = await getInteractionsBySession(id);

  const summaryData = (session.summary_data as Record<string, unknown>) || {};
  
  // Quality metrics
  const qualityScore = session.session_quality_score as number | null;
  const engagementSummary = session.engagement_summary as { overall?: string; by_area?: Record<string, string> } | null;
  const dataCompleteness = session.data_completeness as { strong_fields?: string[]; weak_fields?: string[]; inferred_fields?: string[] } | null;
  const detectedSignals = session.detected_signals as Array<{ category: string; summary: string; relevance_score: number }> | null;
  const basalCoverage = session.basal_coverage as number | null;
  const selectedPackages = session.selected_packages as string[] | null;

  const hasInsights = qualityScore || engagementSummary || dataCompleteness || (detectedSignals && detectedSignals.length > 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="w-fit text-zinc-400 hover:text-white -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Sessões
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Detalhes do Briefing
            <span className="text-xs font-mono bg-cyan-950/50 text-cyan-400 px-3 py-1 rounded-full border border-cyan-900/50">
              {session.id.split('-')[0]}
            </span>
            {session.status === 'finished' && (
              <span className="text-xs bg-emerald-950/50 text-emerald-400 px-3 py-1 rounded-full border border-emerald-900/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Concluído
              </span>
            )}
          </h2>
          <div className="flex items-center text-zinc-400 mt-2">
            <Clock className="w-4 h-4 mr-2" />
            Criado em {format(new Date(session.created_at), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}
            {interactions.length > 0 && (
              <span className="ml-4 flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {interactions.length} interações
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* INSIGHTS PANEL — Quality metrics & engagement breakdown */}
      {/* ============================================================ */}
      {hasInsights && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            Insights da Sessão
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quality Score Card */}
            {qualityScore !== null && (
              <Card className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border-white/10 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Score de Qualidade</span>
                    <BarChart3 className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex items-end gap-3">
                    <span className={`text-4xl font-black bg-gradient-to-r ${qualityGradient(qualityScore)} bg-clip-text text-transparent`}>
                      {qualityScore}
                    </span>
                    <span className="text-zinc-500 text-sm mb-1">/100</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${qualityGradient(qualityScore)} transition-all duration-1000`}
                      style={{ width: `${qualityScore}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-2">
                    {qualityScore >= 80 ? 'Dados excelentes para deliverables' : qualityScore >= 60 ? 'Boa base, alguns gaps menores' : qualityScore >= 40 ? 'Dados parciais — considerar follow-up' : 'Dados insuficientes para deliverables confiáveis'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Overall Engagement */}
            {engagementSummary?.overall && (
              <Card className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Engajamento Geral</span>
                    <Activity className="w-4 h-4 text-zinc-500" />
                  </div>
                  {(() => {
                    const ec = engagementColor(engagementSummary.overall);
                    return (
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${ec.bg} ${ec.border} border`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${ec.text.replace('text-', 'bg-')} animate-pulse`} />
                        <span className={`text-lg font-bold ${ec.text}`}>{ec.label}</span>
                      </div>
                    );
                  })()}
                  <p className="text-[11px] text-zinc-500 mt-3">
                    Nível de participação e profundidade das respostas do cliente ao longo do briefing
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Basal Coverage */}
            {basalCoverage !== null && (
              <Card className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cobertura Basal</span>
                    <Shield className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-cyan-400">{Math.round(basalCoverage * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                      style={{ width: `${basalCoverage * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-2">
                    Campos essenciais coletados vs total necessário
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Packages Count */}
            {selectedPackages && selectedPackages.length > 0 && (
              <Card className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pacotes Ativos</span>
                    <Zap className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="text-4xl font-black text-violet-400">{selectedPackages.length}</span>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedPackages.map((pkg, i) => (
                      <span key={i} className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20 truncate max-w-[140px]">
                        {pkg.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Engagement by Area */}
          {engagementSummary?.by_area && Object.keys(engagementSummary.by_area).length > 0 && (
            <Card className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Engajamento por Área
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Object.entries(engagementSummary.by_area).map(([area, level]) => {
                    const ec = engagementColor(level);
                    return (
                      <div key={area} className={`flex flex-col items-center gap-2 p-3 rounded-xl ${ec.bg} ${ec.border} border`}>
                        <span className="text-xs font-medium text-zinc-300">{areaLabel(area)}</span>
                        <div className={`w-2 h-2 rounded-full ${ec.text.replace('text-', 'bg-')}`} />
                        <span className={`text-xs font-bold ${ec.text}`}>{ec.label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Completeness + Detected Signals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Data Completeness */}
            {dataCompleteness && (
              <Card className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Completude dos Dados
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Como cada campo foi coletado e o que pode afetar a qualidade do resultado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-5">
                  {dataCompleteness.strong_fields && dataCompleteness.strong_fields.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Campos Sólidos</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dataCompleteness.strong_fields.map((f, i) => (
                          <span key={i} className="text-[11px] bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-md border border-emerald-500/20">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {dataCompleteness.weak_fields && dataCompleteness.weak_fields.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Campos Fracos</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dataCompleteness.weak_fields.map((f, i) => (
                          <span key={i} className="text-[11px] bg-amber-500/10 text-amber-300 px-2 py-1 rounded-md border border-amber-500/20">{f}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-amber-500/60 mt-1.5 italic">
                        ⚠ Estes campos tiveram respostas rasas ou incompletas — o resultado pode ser menos preciso nestas áreas
                      </p>
                    </div>
                  )}

                  {dataCompleteness.inferred_fields && dataCompleteness.inferred_fields.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Campos Inferidos (IA)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dataCompleteness.inferred_fields.map((f, i) => (
                          <span key={i} className="text-[11px] bg-violet-500/10 text-violet-300 px-2 py-1 rounded-md border border-violet-500/20">{f}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-violet-500/60 mt-1.5 italic">
                        🧠 Estes campos foram deduzidos pela IA com base nas entrelinhas — valide antes de usar em deliverables críticos
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Detected Signals */}
            {detectedSignals && detectedSignals.length > 0 && (
              <Card className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Sinais Detectados (Active Listening)
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Informações captadas nas entrelinhas durante a conversa
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-5">
                  <div className="space-y-3">
                    {detectedSignals.map((signal, i) => {
                      const categoryColors: Record<string, string> = {
                        implicit_pain: 'text-red-400 bg-red-500/10 border-red-500/20',
                        hidden_ambition: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                        contradiction: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                        competitive_signal: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                        brand_maturity: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                        emotional_trigger: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
                        market_gap: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                      };
                      const categoryLabels: Record<string, string> = {
                        implicit_pain: 'Dor Implícita',
                        hidden_ambition: 'Ambição Oculta',
                        contradiction: 'Contradição',
                        competitive_signal: 'Sinal Competitivo',
                        brand_maturity: 'Maturidade de Marca',
                        emotional_trigger: 'Gatilho Emocional',
                        market_gap: 'Gap de Mercado',
                      };
                      const colors = categoryColors[signal.category] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
                      
                      return (
                        <div key={i} className={`p-3 rounded-xl border ${colors.split(' ').slice(1).join(' ')}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.split(' ')[0]}`}>
                              {categoryLabels[signal.category] || signal.category}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              Relevância: {Math.round((signal.relevance_score || 0) * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300">{signal.summary}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Interactions Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            Histórico da Conversa
          </h3>
          
          <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
            {interactions.map((interaction) => {
              const inputType = interaction.question_type || 'text';
              const questionText = interaction.question_text || 'Pergunta do AI';
              const answerRaw = interaction.user_answer;
              const isDepthQ = interaction.is_depth_question;
              
              return (
                <div key={interaction.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${isDepthQ ? 'bg-violet-500 shadow-[0_0_10px_2px_rgba(139,92,246,0.5)]' : 'bg-cyan-500 shadow-[0_0_10px_2px_rgba(8,145,178,0.5)]'}`} />
                  
                  {/* AI Question */}
                  <div className="mb-4">
                    <span className={`text-xs font-semibold uppercase tracking-wider mb-1 inline-flex items-center gap-1 ${isDepthQ ? 'text-violet-500' : 'text-cyan-500'}`}>
                      {isDepthQ ? (
                        <><Brain className="w-3 h-3" /> Active Listening</>
                      ) : (
                        'Forms AI'
                      )}
                    </span>
                    <div className={`${isDepthQ ? 'bg-violet-500/5 border-violet-500/20' : 'bg-white/5 border-white/10'} border p-5 rounded-2xl rounded-tl-sm text-zinc-300`}>
                      <p className="font-medium text-white mb-2">{questionText}</p>
                    </div>
                  </div>

                  {/* User Answer */}
                  <div className="pl-8 sm:pl-16">
                    <div className="flex justify-end relative">
                       <span className="absolute -top-5 right-2 text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1 inline-block">Cliente ({inputType})</span>
                       <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl rounded-tr-sm text-emerald-100 w-fit min-w-[50%] max-w-full">
                          
                          {inputType === 'file_upload' && (
                             <div className="flex flex-col items-center gap-3">
                                {String(answerRaw).match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                  <img 
                                    src={String(answerRaw)} 
                                    alt="Upload" 
                                    className="max-h-64 rounded-xl border border-white/10 object-contain bg-black/50 p-2"
                                  />
                                ) : (
                                  <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/10 w-full">
                                    <FileText className="w-8 h-8 text-emerald-400" />
                                    <span className="text-sm line-clamp-1">{String(answerRaw).split('/').pop()}</span>
                                  </div>
                                )}
                                <a 
                                  href={String(answerRaw)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full mt-2"
                                >
                                  <Button variant="secondary" size="sm" className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-300">
                                    <Download className="w-4 h-4 mr-2" />
                                    Baixar Arquivo
                                  </Button>
                                </a>
                             </div>
                          )}

                          {inputType === 'color_picker' && (
                             <div className="flex gap-2 flex-wrap">
                               {Array.isArray(answerRaw) 
                                  ? answerRaw.map((c: string, i: number) => (
                                      <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-full border border-white/20 shadow-lg" style={{ backgroundColor: c }} />
                                        <span className="text-[10px] opacity-70">{c}</span>
                                      </div>
                                    ))
                                  : <div className="w-10 h-10 rounded-full border border-white/20 shadow-lg" style={{ backgroundColor: String(answerRaw) }} />
                               }
                             </div>
                          )}

                          {(inputType !== 'file_upload' && inputType !== 'color_picker') && (
                             <p className="whitespace-pre-wrap font-medium">
                               {typeof answerRaw === 'object' 
                                 ? JSON.stringify(answerRaw, null, 2) 
                                 : String(answerRaw)}
                             </p>
                          )}
                       </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Document & Insights */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border-white/10 sticky top-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <FileText className="w-5 h-5" />
                Documento do Briefing
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Documento gerado pela IA com base em toda a conversa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session.final_assets?.document ? (
                <div className="space-y-4">
                  <div 
                    className="prose prose-invert prose-sm max-w-none 
                      prose-headings:font-bold prose-headings:tracking-tight
                      prose-h1:text-xl prose-h1:text-white
                      prose-h2:text-lg prose-h2:text-cyan-400 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
                      prose-h3:text-base prose-h3:text-zinc-300
                      prose-p:text-zinc-300 prose-li:text-zinc-300
                      prose-strong:text-white
                      prose-blockquote:border-l-cyan-500 prose-blockquote:bg-cyan-500/5 prose-blockquote:rounded-r-lg prose-blockquote:px-4
                      bg-black/40 rounded-xl border border-white/5 p-6 max-h-[calc(100vh-200px)] overflow-auto custom-scrollbar"
                    dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(session.final_assets.document) }}
                  />
                  
                  <div className="flex flex-col gap-3 mt-4">
                    <CopyButtons 
                      markdown={session.final_assets.document} 
                      html={simpleMarkdownToHtml(session.final_assets.document)} 
                    />
                    
                    <a 
                      href={`data:text/markdown;charset=utf-8,${encodeURIComponent(session.final_assets.document)}`}
                      download={`briefing-${session.id.split('-')[0]}.md`}
                      className="block"
                    >
                      <Button variant="outline" className="w-full bg-cyan-950/30 border-cyan-900/50 text-cyan-400 hover:bg-cyan-950/50">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Documento (.md)
                      </Button>
                    </a>
                  </div>
                </div>
              ) : Object.keys(summaryData).length === 0 ? (
                <div className="text-center p-6 text-zinc-500 italic bg-white/5 rounded-xl border border-white/5">
                  Nenhum documento foi gerado para esta sessão.
                </div>
              ) : (
                <div className="bg-black/80 rounded-xl border border-white/5 p-4 overflow-hidden">
                  <pre className="text-xs text-emerald-400 font-mono overflow-auto custom-scrollbar max-h-[600px]">
                    <code>{JSON.stringify(summaryData, null, 2)}</code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

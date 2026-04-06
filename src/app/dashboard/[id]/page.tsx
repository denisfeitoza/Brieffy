import { getSessionById, getInteractionsBySession } from '@/lib/services/briefingService';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Clock, FileText, MessageSquare,
  Activity, Brain, CheckCircle2, BarChart3, Eye,
  Zap, Shield, Code, ChevronDown, MoreVertical, Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CopyButtons } from '@/components/dashboard/CopyButtons';
import { Suspense } from 'react';
import CollectedBriefingData from '@/components/dashboard/CollectedBriefingData';
import { humanizeFieldKey } from '@/lib/briefing/fieldLabels';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { GenerateDocumentAction } from '@/components/dashboard/GenerateDocumentAction';
import { SessionResetAction } from '@/components/dashboard/SessionResetAction';
import { PrintPdfButton } from '@/components/dashboard/PrintPdfButton';

export const dynamic = 'force-dynamic';

/* ── Helpers ─────────────────────────────────────────────────────── */

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
    case 'high': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: 'Alto' };
    case 'medium': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'Médio' };
    case 'low': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Baixo' };
    default: return { bg: 'bg-[var(--bg3)]', text: 'text-[var(--text2)]', border: 'border-transparent', label: 'N/A' };
  }
}

function areaLabel(area: string) {
  const map: Record<string, string> = {
    discovery: 'Descoberta', identity: 'Identidade', audience: 'Público', visual: 'Visual',
    delivery: 'Entrega', strategy: 'Estratégia', market: 'Mercado', brand: 'Marca',
    execution: 'Execução', consulting: 'Consultoria',
  };
  return map[area] || (area?.charAt(0).toUpperCase() + area?.slice(1)) || area;
}

/* ── Smart answer renderer for transcript ──────────────────────── */

function renderTranscriptAnswer(answerRaw: unknown, inputType: string) {
  if (answerRaw == null) return <span className="text-[var(--text3)] italic text-sm">Sem resposta</span>;

  if (inputType === 'file_upload') {
    return (
      <div className="flex flex-wrap gap-2">
        {(Array.isArray(answerRaw) ? answerRaw : [answerRaw]).map((url: unknown, i: number) => {
          const strUrl = String(url);
          return strUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
            <img key={i} src={strUrl} alt={`Upload ${i}`} className="max-h-40 rounded-xl border border-[var(--bd)]" />
          ) : (
            <a key={i} href={strUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[var(--bg)] px-3 py-2 rounded-lg border border-[var(--bd)] hover:bg-[var(--bg2)] transition-colors">
              <FileText className="w-4 h-4 text-[var(--orange)] shrink-0" />
              <span className="text-xs font-medium text-[var(--text)] truncate max-w-[180px]">{strUrl.split('/').pop()}</span>
            </a>
          );
        })}
      </div>
    );
  }

  if (inputType === 'color_picker') {
    const colors = Array.isArray(answerRaw) ? answerRaw : [answerRaw];
    return (
      <div className="flex gap-2 flex-wrap">
        {colors.map((c: unknown, i: number) => (
          <div key={i} className="flex items-center gap-1.5 bg-[var(--bg)] px-2.5 py-1 rounded-full border border-[var(--bd)]">
            <div className="w-3.5 h-3.5 rounded-full border border-[var(--bd-strong)] shrink-0" style={{ backgroundColor: String(c) }} />
            <span className="text-[11px] font-mono text-[var(--text2)]">{String(c)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (inputType === 'slider') {
    const val = typeof answerRaw === 'number' ? answerRaw : Number(answerRaw);
    if (!isNaN(val)) {
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-1.5 bg-[var(--bg3)] rounded-full overflow-hidden max-w-[160px]">
            <div className="h-full bg-[var(--orange)] rounded-full" style={{ width: `${Math.min(100, val)}%` }} />
          </div>
          <span className="text-sm font-bold text-[var(--text)] font-mono">{val}</span>
        </div>
      );
    }
  }

  if (inputType === 'card_selector') {
    const items = Array.isArray(answerRaw) ? answerRaw : [answerRaw];
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item: unknown, i: number) => {
          const label = typeof item === 'object' && item !== null
            ? (item as Record<string, unknown>).label || (item as Record<string, unknown>).value || JSON.stringify(item)
            : String(item);
          return (
            <span key={i} className="text-[11px] font-medium bg-[var(--bg2)] text-[var(--text)] px-2 py-0.5 rounded-md border border-[var(--bd)]">
              {String(label)}
            </span>
          );
        })}
      </div>
    );
  }

  if (inputType === 'single_choice' || inputType === 'multiple_choice') {
    const items = Array.isArray(answerRaw) ? answerRaw : [answerRaw];
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item: unknown, i: number) => (
          <span key={i} className="text-[11px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-200">
            {typeof item === 'object' && item !== null
              ? String((item as Record<string, unknown>).label || (item as Record<string, unknown>).value || JSON.stringify(item))
              : String(item)}
          </span>
        ))}
      </div>
    );
  }

  // Default text
  return (
    <p className="text-[13px] whitespace-pre-wrap leading-relaxed text-inherit">
      {typeof answerRaw === 'object' ? JSON.stringify(answerRaw, null, 2) : String(answerRaw)}
    </p>
  );
}

/* ── Main Content: Document Reader View ─────────────────────────── */

async function SessionContent({ id }: { id: string }) {
  const [session, interactions] = await Promise.all([
    getSessionById(id),
    getInteractionsBySession(id),
  ]);

  const companyInfo = (session.company_info as Record<string, unknown>) || null;
  const qualityScore = session.session_quality_score as number | null;
  const engagementSummary = session.engagement_summary as { overall?: string; by_area?: Record<string, string> } | null;
  const dataCompleteness = session.data_completeness as { strong_fields?: string[]; weak_fields?: string[]; inferred_fields?: string[] } | null;
  const detectedSignals = session.detected_signals as Array<Record<string, unknown>> | null;
  const basalCoverage = session.basal_coverage as number | null;
  const selectedPackages = session.selected_packages as string[] | null;
  const companyName = companyInfo?.company_name ? String(companyInfo.company_name) : null;
  const displayName = session.session_name || companyName || 'Briefing';

  return (
    <div className="space-y-6">
      {/* ── HEADER PRIMÁRIO ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)]">{displayName}</h1>
          <p className="text-sm text-[var(--text3)] mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {session.created_at ? format(new Date(session.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Data indisponível'}
            <span className="hidden sm:inline">• ID: {session.id.split('-')[0]}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 w-full md:w-auto">
          {session.final_assets?.document && (
            <div className="flex-1 md:flex-none">
              <CopyButtons
                markdown={session.final_assets.document}
                html={simpleMarkdownToHtml(session.final_assets.document)}
              />
            </div>
          )}

          {/* ── BOTOES DE PDF / IMPRIMIR ────────────────────────────────────── */}
          {session.final_assets?.document && (
            <div className="flex gap-2">
              <PrintPdfButton className="shrink-0 bg-[var(--bg)] border-[var(--bd-strong)] text-[var(--text)] hover:bg-[var(--bg2)] hidden sm:flex" />
            </div>
          )}

          {/* ── SHEET: MAIS OPÇÕES E METADADOS ──────────────────────── */}
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border shadow-sm h-9 w-9 shrink-0 bg-[var(--bg)] border-[var(--bd-strong)] hover:bg-[var(--bg2)]" title="Mais Opções">
              <MoreVertical className="w-4 h-4 text-[var(--text)]" />
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto !max-w-full bg-[var(--bg)] border-l border-[var(--bd)] p-0">
              <SheetHeader className="p-6 border-b border-[var(--bd)] sticky top-0 bg-[var(--bg)]/95 backdrop-blur-md z-10">
                <SheetTitle className="text-xl">Opções Avançadas</SheetTitle>
                <SheetDescription>
                  Dados técnicos da coleta, métricas e transcrição do briefing.
                </SheetDescription>
              </SheetHeader>

              <div className="p-6 space-y-8">
                {/* ── INSIGHTS (engagement, data quality, signals) ────────── */}
                {(engagementSummary?.by_area || dataCompleteness || (detectedSignals && detectedSignals.length > 0)) && (
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--text3)] uppercase tracking-wider flex items-center gap-2 px-1">
                      <Brain className="w-4 h-4 text-[var(--text2)]" />
                      Métricas da Sessão
                    </h3>

                    {qualityScore !== null && (
                       <div className="flex items-center gap-3 bg-[var(--bg2)] border border-[var(--bd)] rounded-xl px-4 py-3">
                         <BarChart3 className="w-5 h-5 text-[var(--orange)]" />
                         <div>
                           <p className="text-[11px] text-[var(--text3)] uppercase tracking-wider font-semibold">Quality Score (IA)</p>
                           <p className="text-lg font-bold text-[var(--text)]">{qualityScore}</p>
                         </div>
                       </div>
                    )}

                    {engagementSummary?.by_area && (
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(engagementSummary.by_area).map(([area, level]) => {
                          const ec = engagementColor(level);
                          return (
                            <div key={area} className={`flex flex-col gap-1 p-3 rounded-xl ${ec.bg} ${ec.border} border`}>
                              <span className="text-[10px] font-medium text-[var(--text3)]">{areaLabel(area)}</span>
                              <span className={`text-xs font-bold ${ec.text}`}>{ec.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {dataCompleteness && (
                      <Card className="bg-[var(--bg2)] border-[var(--bd)] shadow-none">
                        <CardContent className="p-4 space-y-3">
                          {dataCompleteness.strong_fields && dataCompleteness.strong_fields.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Campos Sólidos</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {dataCompleteness.strong_fields.map((f, i) => (
                                  <span key={i} className="text-[10px] font-medium bg-[var(--bg)] text-[var(--text)] px-2 py-0.5 rounded-md border border-[var(--bd)]">{humanizeFieldKey(f)}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {dataCompleteness.weak_fields && dataCompleteness.weak_fields.length > 0 && (
                            <div className="pt-2">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Eye className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Atenção Necessária</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {dataCompleteness.weak_fields.map((f, i) => (
                                  <span key={i} className="text-[10px] font-medium bg-[var(--bg)] text-[var(--text)] px-2 py-0.5 rounded-md border border-[var(--bd)]">{humanizeFieldKey(f)}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {detectedSignals && detectedSignals.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5" /> Sinais Detectados ({detectedSignals.length})
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {detectedSignals.map((signal: Record<string, unknown>, i: number) => {
                            const cat = signal.category ? String(signal.category) : null;
                            const summary = signal.summary ? String(signal.summary) : null;
                            const sourceAnswer = signal.source_answer ? String(signal.source_answer) : null;
                            const displayText = summary || sourceAnswer || '';
                            const stepIndex = typeof signal.step_index === 'number' ? signal.step_index : null;

                            if (!displayText) return null;

                            return (
                              <div key={i} className="p-3 rounded-xl border border-[var(--bd)] bg-[var(--bg)]">
                                <div className="flex items-center justify-between mb-1">
                                  {cat && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text2)]">
                                      {cat.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  {stepIndex !== null && (
                                    <span className="text-[9px] font-mono text-[var(--text3)]">Passo {stepIndex}</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[var(--text)] leading-relaxed">{displayText}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* ── DADOS COLETADOS (Brutos) ───────────────────────── */}
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-[var(--text3)] uppercase tracking-wider flex items-center gap-2 px-1 border-t border-[var(--bd)] pt-6">
                    <Activity className="w-4 h-4 text-[var(--text2)]" />
                    Variáveis Coletadas
                  </h3>
                  <div className="bg-[var(--bg)] border border-[var(--bd)] rounded-xl overflow-hidden p-1">
                    <CollectedBriefingData
                      companyInfo={companyInfo}
                      lang="pt"
                      sessionStatus={session.status}
                    />
                  </div>
                </section>

                {/* ── TRANSCRIÇÃO ─────────────────────────────────────────── */}
                {interactions.length > 0 && (
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--text3)] uppercase tracking-wider flex items-center justify-between px-1 border-t border-[var(--bd)] pt-6">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--text2)]" />
                        Histórico do Chat
                      </div>
                      <span className="text-[10px] bg-[var(--bg2)] px-2 py-0.5 rounded-full border border-[var(--bd)]">{interactions.length} msgs</span>
                    </h3>
                    <div className="p-4 bg-[var(--bg2)] border border-[var(--bd)] rounded-xl space-y-5">
                      {interactions.map((interaction, idx) => {
                        const inputType = interaction.question_type || 'text';
                        const isDepthQ = interaction.is_depth_question;
                        return (
                          <div key={interaction.id} className="relative">
                            {idx !== interactions.length - 1 && (
                              <div className="absolute left-4 top-12 bottom-[-20px] w-px bg-gradient-to-b from-[var(--bd-strong)] to-transparent" />
                            )}
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[9px] font-mono text-[var(--text3)]">{String(idx + 1).padStart(2, '0')}</span>
                              {isDepthQ && <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--orange)] bg-orange-50 px-1 py-0.5 rounded leading-none">Deep</span>}
                            </div>

                            {/* AI */}
                            <div className="flex gap-2.5 mb-2">
                              <div className={`mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center rounded-full border z-10 ${isDepthQ ? 'bg-orange-50 border-orange-200' : 'bg-[var(--bg)] border-[var(--bd-strong)]'}`}>
                                {isDepthQ ? <Brain className={`w-3.5 h-3.5 ${isDepthQ ? 'text-[var(--orange)]' : 'text-[var(--text)]'}`} /> : <MessageSquare className="w-3.5 h-3.5 text-[var(--text2)]" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`inline-block px-3.5 py-2.5 rounded-2xl rounded-tl-sm border text-[12px] max-w-full font-medium ${isDepthQ ? 'bg-[var(--bg)] border-orange-100 text-[var(--text)]' : 'bg-[var(--bg)] border-[var(--bd)] text-[var(--text)]'}`}>
                                  {interaction.question_text || 'Mensagem do sistema'}
                                </div>
                              </div>
                            </div>

                            {/* User */}
                            <div className="flex gap-2.5 flex-row-reverse">
                              <div className="mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--text)] z-10 border border-[var(--bd-strong)]">
                                <span className="text-[var(--bg)] text-[9px] font-bold font-mono">
                                  {companyName ? companyName.slice(0, 3).toUpperCase() : 'USR'}
                                </span>
                              </div>
                              <div className="flex-1 flex flex-col items-end min-w-0">
                                <div className="inline-block px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-[var(--bg2)] border border-[var(--bd)] text-[var(--text)] max-w-full">
                                  {renderTranscriptAnswer(interaction.user_answer, inputType)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* ── JSON RAW (collapsible) ──────────────────────────────── */}
                {companyInfo && Object.keys(companyInfo).length > 0 && (
                  <details className="group bg-[var(--bg)] border border-[var(--bd)] rounded-xl overflow-hidden mt-6">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--bg2)] transition-colors select-none">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-[var(--text3)]" />
                        <span className="text-sm font-medium text-[var(--text)]">JSON Raw</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[var(--text3)] group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="border-t border-[var(--bd)] overflow-x-auto p-4 bg-[var(--bg2)] max-h-[60vh]">
                      <pre className="text-[11px] font-mono text-[var(--text2)] leading-relaxed">
                        {JSON.stringify(companyInfo, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}

                {/* ── ZONA DE PERIGO ────────────────────────────────────── */}
                <SessionResetAction sessionId={session.id} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── PEQUENO RESUMO DA SESSÃO ───────────────────── */}
      {(qualityScore !== null || dataCompleteness || (detectedSignals && detectedSignals.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[var(--bg2)] border border-[var(--bd)] p-4 rounded-2xl mb-6 print:hidden">
          {qualityScore !== null && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg)] border border-[var(--bd-strong)] shadow-sm shrink-0">
                <BarChart3 className="w-4 h-4 text-[var(--orange)]" />
              </div>
              <div>
                <p className="text-[10px] text-[var(--text3)] uppercase tracking-wider font-bold">Quality Score</p>
                <p className="text-lg font-black text-[var(--text)] leading-none mt-0.5">{qualityScore}</p>
              </div>
            </div>
          )}
          
          {dataCompleteness && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 border border-emerald-100 shadow-sm shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-[var(--text3)] uppercase tracking-wider font-bold">Campos Sólidos</p>
                <p className="text-sm font-semibold text-[var(--text)] mt-0.5">
                  {dataCompleteness.strong_fields?.length || 0} confirmados
                </p>
              </div>
            </div>
          )}

          {detectedSignals && detectedSignals.length > 0 && (
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-50 border border-orange-100 shadow-sm shrink-0">
                <Brain className="w-4 h-4 text-[var(--orange)]" />
              </div>
              <div>
                <p className="text-[10px] text-[var(--text3)] uppercase tracking-wider font-bold">Sinais da IA</p>
                <p className="text-sm font-semibold text-[var(--text)] mt-0.5">
                  {detectedSignals.length} insights
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ÁREA DO DOCUMENTO PRINCIPAL (Folha A4) ──────────────── */}
      <div className="print:shadow-none print:border-0 print:m-0 print:p-0 bg-[var(--bg)] text-[var(--text)] border border-[var(--bd-strong)] shadow-sm rounded-2xl md:rounded-[2rem] overflow-hidden min-h-[60vh]">
        {session.final_assets?.document ? (
          <div className="p-6 md:p-12 lg:p-16 print:p-0 print:pt-4">
            <div
              className="prose max-w-3xl mx-auto
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mb-8 prose-h1:text-[var(--text)]
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-[var(--text)] prose-h2:flex prose-h2:items-center prose-h2:gap-2
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-[var(--text2)]
                prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-[var(--text)]
                prose-li:text-[15px] prose-li:text-[var(--text)] prose-li:my-1
                prose-strong:text-[var(--text)] prose-strong:font-bold
                prose-blockquote:border-l-4 prose-blockquote:border-[var(--orange)] prose-blockquote:bg-[var(--bg2)] prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-xl prose-blockquote:text-[var(--text2)] prose-blockquote:not-italic prose-blockquote:my-6
                prose-a:text-[var(--orange)] prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(session.final_assets.document) }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-[var(--text3)] p-6 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-[var(--orange)] opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Diagnóstico em Processamento</h3>
            <p className="max-w-md mx-auto mb-8 text-sm">
              {session.status === 'finished' 
                ? "Sua estratégia está sendo gerada pela nossa IA. Se o processo demorar muito, você pode forçar a geração abaixo."
                : "Este briefing ainda não foi finalizado. O diagnóstico ficará disponível assim que a sessão for concluída."}
            </p>
            
            {session.status === 'finished' && (
              <GenerateDocumentAction sessionId={session.id} />
            )}
            
            {session.status !== 'finished' && (
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--orange)] bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Aguardando finalização do briefing
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────── */

function SessionDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-[var(--bg2)] rounded-lg" />
          <div className="h-4 w-32 bg-[var(--bg2)] rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-[var(--bg2)] rounded-lg" />
          <div className="h-10 w-32 bg-[var(--bg2)] rounded-lg" />
          <div className="h-10 w-10 bg-[var(--bg2)] rounded-lg" />
        </div>
      </div>
      <div className="h-[70vh] bg-white border border-[var(--bd)] rounded-[2rem]" />
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default async function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-6 pb-20 animate-in fade-in duration-300">
      {/* Back navigation */}
      <div className="mb-6">
        <Link href="/dashboard/templates" className="inline-flex items-center text-[13px] font-medium text-[var(--text3)] hover:text-[var(--text)] transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
          Voltar para Briefings
        </Link>
      </div>

      <Suspense fallback={<SessionDetailsSkeleton />}>
        <SessionContent id={id} />
      </Suspense>
    </div>
  );
}

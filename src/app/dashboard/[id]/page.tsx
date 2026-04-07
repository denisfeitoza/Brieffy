import { getSessionById, getInteractionsBySession } from '@/lib/services/briefingService';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Clock, FileText, MessageSquare,
  Activity, Brain, CheckCircle2, BarChart3, Eye,
  Zap, Shield, Code, ChevronDown, Printer, Edit2, Loader2, Sparkles
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
import { EditBriefingModal } from '@/components/dashboard/EditBriefingModal';

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
    const rawVal = Array.isArray(answerRaw) ? answerRaw.join(' ') : String(answerRaw);
    
    // Extract all URLs
    const urlRegex = /(https?:\/\/[^\s,]+)/g;
    const urls = rawVal.match(urlRegex) || [];
    
    // Clean text by removing URLs and the "[Anexos via UI]:" tag
    const textOnly = rawVal.replace(urlRegex, '').replace(/\[Anexos via UI\]:?/g, '').replace(/,/g, '').trim();

    return (
      <div className="flex flex-col gap-3">
        {urls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {urls.map((strUrl: string, i: number) => {
              return strUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) ? (
                <img key={i} src={strUrl} alt={`Upload ${i}`} className="max-h-40 rounded-xl border border-[var(--bd)] object-cover" />
              ) : (
                <a key={i} href={strUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[var(--bg)] px-3 py-2 rounded-lg border border-[var(--bd)] hover:bg-[var(--bg2)] transition-colors">
                  <FileText className="w-4 h-4 text-[var(--orange)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--text)] truncate max-w-[180px]">{strUrl.split('/').pop()}</span>
                </a>
              );
            })}
          </div>
        )}
        {textOnly && (
           <p className="text-[13px] whitespace-pre-wrap leading-relaxed text-inherit">{textOnly}</p>
        )}
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
          {/* ── EDITAR BRIEFING ──────────────────────────────────────────────── */}
          <EditBriefingModal
            sessionId={session.id}
            initialName={session.session_name || ''}
            initialContextValue={session.initial_context || ''}
            initialPackages={session.selected_packages || []}
            initialPassphrase={session.edit_passphrase || ''}
            initialAccessPassword={session.access_password || ''}
            initialPurpose={session.briefing_purpose || ''}
            initialDepthSignals={session.depth_signals || []}
          >
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-[11px] uppercase tracking-wider font-bold transition-colors border shadow-sm h-8 px-3 shrink-0 bg-[var(--bg)] border-[var(--bd-strong)] hover:bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)] gap-1.5" title="Editar Informações do Briefing">
              <Edit2 className="w-3.5 h-3.5" />
              Editar
            </button>
          </EditBriefingModal>

          {/* ── SHEET: MAIS OPÇÕES E METADADOS ──────────────────────── */}
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-[11px] uppercase tracking-wider font-bold transition-colors border shadow-sm h-8 px-3 shrink-0 bg-[var(--bg)] border-[var(--bd-strong)] hover:bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)]" title="Relatório Detalhado">
              Relatório Detalhado
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto !max-w-full bg-[var(--bg)] border-l border-[var(--bd)] p-0">
              <SheetHeader className="p-6 border-b border-[var(--bd)] sticky top-0 bg-[var(--bg)] z-50">
                <SheetTitle className="text-xl">Relatório Detalhado</SheetTitle>
                <SheetDescription>
                  Dados técnicos da coleta, métricas e transcrição do briefing.
                </SheetDescription>
              </SheetHeader>

              <div className="relative z-0 isolate p-6 space-y-8">
                {/* ── INSIGHTS (engagement, data quality, signals) ────────── */}
                {(engagementSummary?.by_area || (detectedSignals && detectedSignals.length > 0)) && (
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

                            let questionLabel = stepIndex !== null ? `Passo ${stepIndex}` : null;
                            if (stepIndex !== null) {
                              const match = interactions.find((int, idx) => Number(int.step_order) === stepIndex || idx === stepIndex || idx + 1 === stepIndex);
                              if (match?.question_text) {
                                questionLabel = String(match.question_text);
                              }
                            }

                            if (!displayText) return null;

                            return (
                              <div key={i} className="p-3 rounded-xl border border-[var(--bd)] bg-[var(--bg)]">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  {cat && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text2)] shrink-0 mt-0.5">
                                      {cat.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  {questionLabel && (
                                    <span className="text-[10px] font-medium text-[var(--text3)] text-right line-clamp-2" title={questionLabel}>
                                      {questionLabel}
                                    </span>
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
                  <details className="group bg-[var(--bg)] border border-[var(--bd)] rounded-xl overflow-hidden mt-6">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--bg2)] transition-colors select-none">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--text3)]" />
                        <span className="text-sm font-medium text-[var(--text)]">Histórico do Chat</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium bg-[var(--bg2)] text-[var(--text3)] px-2 py-0.5 rounded-full border border-[var(--bd)]">{interactions.length} msgs</span>
                        <ChevronDown className="w-4 h-4 text-[var(--text3)] group-open:rotate-180 transition-transform" />
                      </div>
                    </summary>
                    <div className="relative isolate z-0 p-4 bg-[var(--bg2)] border-t border-[var(--bd)] space-y-5 max-h-[60vh] overflow-y-auto">
                      {interactions.map((interaction, idx) => {
                        const inputType = interaction.question_type || 'text';
                        const isDepthQ = interaction.is_depth_question;
                        return (
                          <div key={interaction.id} className="relative isolate z-0">
                            {idx !== interactions.length - 1 && (
                              <div className="absolute left-4 top-12 bottom-[-20px] z-0 w-px bg-gradient-to-b from-[var(--bd-strong)] to-transparent pointer-events-none" />
                            )}
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[9px] font-mono text-[var(--text3)]">{String(idx + 1).padStart(2, '0')}</span>
                              {isDepthQ && <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--orange)] bg-orange-50 px-1 py-0.5 rounded leading-none">Deep</span>}
                            </div>

                            {/* AI */}
                            <div className="relative z-[1] flex gap-2.5 mb-2">
                              <div className={`relative mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center rounded-full border ${isDepthQ ? 'bg-orange-50 border-orange-200' : 'bg-[var(--bg)] border-[var(--bd-strong)]'}`}>
                                {isDepthQ ? <Brain className={`w-3.5 h-3.5 ${isDepthQ ? 'text-[var(--orange)]' : 'text-[var(--text)]'}`} /> : <MessageSquare className="w-3.5 h-3.5 text-[var(--text2)]" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`inline-block px-3.5 py-2.5 rounded-2xl rounded-tl-sm border text-[12px] max-w-full font-medium ${isDepthQ ? 'bg-[var(--bg)] border-orange-100 text-[var(--text)]' : 'bg-[var(--bg)] border-[var(--bd)] text-[var(--text)]'}`}>
                                  {interaction.question_text || 'Mensagem do sistema'}
                                </div>
                              </div>
                            </div>

                            {/* User */}
                            <div className="relative z-[1] flex gap-2.5 flex-row-reverse">
                              <div className="relative mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--text)] border border-[var(--bd-strong)]">
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
                  </details>
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

      {/* ── TIMELINE DO STATUS ─────────────────────────── */}
      {(() => {
        const isFinished = session.status === 'finished';
        const hasResponded = interactions.length > 0;
        
        let s1 = 'complete', s2 = 'upcoming', s3 = 'upcoming';
        
        if (isFinished) {
          s1 = 'complete'; s2 = 'complete'; s3 = 'complete';
        } else if (hasResponded) {
          s1 = 'complete'; s2 = 'current'; s3 = 'upcoming';
        } else {
          s1 = 'current'; s2 = 'upcoming'; s3 = 'upcoming';
        }

        const steps = [
          { name: 'Briefing Aberto', status: s1, icon: FileText },
          { name: 'Respondendo', status: s2, icon: MessageSquare },
          { name: 'Concluído', status: s3, icon: CheckCircle2 },
        ];
        return (
          <div className="mb-10 pt-6 pb-8 print:hidden">
            <nav aria-label="Progress">
              <ol role="list" className="flex items-center w-full justify-between max-w-2xl mx-auto">
                {steps.map((step, stepIdx) => (
                  <li key={step.name} className="relative flex flex-col items-center flex-1">
                    {stepIdx !== steps.length - 1 && (
                      <div className={`absolute top-5 left-[50%] w-full h-[2px] ${step.status === 'complete' ? 'bg-[var(--orange)]' : 'bg-[var(--bd-strong)]'}`} aria-hidden="true" />
                    )}
                    
                    <div 
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ring-[6px] ring-[var(--bg)]
                      ${step.status === 'complete' ? 'bg-[var(--orange)] text-white' : 
                        step.status === 'current' ? 'border-2 border-[var(--orange)] bg-[var(--bg)] text-[var(--orange)]' : 
                        'border-2 border-[var(--bd-strong)] bg-[var(--bg)] text-[var(--text3)]'}`}>
                      <step.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="absolute top-14 whitespace-nowrap text-center">
                      <span className={`text-[11px] font-bold tracking-wider uppercase ${step.status === 'complete' || step.status === 'current' ? 'text-[var(--text)]' : 'text-[var(--text3)]'}`}>
                        {step.name}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        );
      })()}

      {/* ── PEQUENO RESUMO DA SESSÃO ───────────────────── */}
      {(qualityScore !== null || (detectedSignals && detectedSignals.length > 0)) && (
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
      <div className="a4-document-container print:shadow-none print:border-0 print:m-0 print:p-0 bg-[var(--bg)] text-[var(--text)] border border-[var(--bd-strong)] shadow-sm rounded-2xl md:rounded-[2rem] overflow-hidden min-h-[60vh]">
        {session.final_assets?.document ? (
          <div className="p-6 md:p-12 lg:p-16 print:p-0 print:pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--bd)]">
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <rect width="32" height="32" rx="9" fill="#ff6029" />
                  <circle cx="26" cy="6" r="2.5" fill="white" />
                  <text x="16" y="23.5" fontFamily="system-ui, -apple-system, sans-serif" fontSize="21" fontWeight="900" fill="white" textAnchor="middle">B</text>
                </svg>
                <span className="font-bold text-xl tracking-tight text-[var(--text)]">Brieffy</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <CopyButtons
                  markdown={session.final_assets.document}
                  html={simpleMarkdownToHtml(session.final_assets.document)}
                />
                <PrintPdfButton className="flex-1 md:flex-none" />
              </div>
            </div>
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
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {session.final_assets.document}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-[var(--text3)] p-6 text-center animate-in fade-in zoom-in duration-500">
            {session.status === 'finished' ? (
              <div className="relative mb-8 mt-4">
                <div className="absolute inset-0 bg-[var(--orange)] blur-3xl opacity-20 rounded-full animate-pulse z-0 scale-150"></div>
                <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-orange-100 to-orange-50 rounded-full flex items-center justify-center border-[3px] border-white shadow-xl overflow-hidden">
                  <div className="absolute inset-0 border-2 border-[var(--orange)] border-dashed rounded-full animate-[spin_8s_linear_infinite] opacity-30"></div>
                  <div className="absolute inset-2 border-2 border-[var(--orange)] border-dotted rounded-full animate-[spin_12s_linear_infinite_reverse] opacity-40"></div>
                  <Brain className="w-10 h-10 text-[var(--orange)] animate-pulse" strokeWidth={1.5} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--orange)]/10 to-transparent"></div>
                  <div className="absolute -top-2 -right-2 animate-bounce flex delay-100">
                    <Sparkles className="w-5 h-5 text-[var(--orange)] opacity-80" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 bg-[var(--bg2)] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--bd)] transition-all duration-300 hover:scale-105">
                <FileText className="w-10 h-10 text-[var(--text3)] opacity-60" />
              </div>
            )}
            
            <h3 className="text-2xl font-black text-[var(--text)] mb-3 tracking-tight">
              {session.status === 'finished' ? 'Gerando sua Estratégia...' : 'Diagnóstico em Processamento'}
            </h3>
            
            <p className="max-w-md mx-auto mb-8 text-[15px] leading-relaxed text-[var(--text2)]">
              {session.status === 'finished' 
                ? "Nossa inteligência artificial está analisando cada detalhe do seu briefing para construir um diagnóstico profundo e um plano de ação estratégico. Isso leva apenas alguns instantes."
                : "Este briefing ainda não foi finalizado. O diagnóstico ficará disponível assim que a sessão for concluída."}
            </p>
            
            {session.status === 'finished' && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--orange)] bg-orange-50/50 px-5 py-2.5 rounded-full border border-orange-100/50 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando dados
                  <span className="flex gap-1 ml-1">
                    <span className="w-1 h-1 bg-[var(--orange)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-[var(--orange)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-[var(--orange)] rounded-full animate-bounce"></span>
                  </span>
                </div>
                
                <div className="w-full max-w-[280px] pt-4 border-t border-[var(--bd)] mt-2">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--text3)] mb-3">Está demorando muito?</p>
                  <GenerateDocumentAction sessionId={session.id} />
                </div>
              </div>
            )}
            
            {session.status !== 'finished' && (
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text)] bg-[var(--bg2)] px-5 py-2.5 rounded-full border border-[var(--bd)] shadow-sm">
                <Clock className="w-4 h-4 animate-pulse text-[var(--orange)]" />
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

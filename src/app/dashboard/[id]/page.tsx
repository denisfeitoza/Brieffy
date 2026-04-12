import { getSessionById, getInteractionsBySession } from '@/lib/services/briefingService';
import Link from 'next/link';

import {
  ArrowLeft, Clock, FileText, MessageSquare,
  Activity, Brain, CheckCircle2, BarChart3,
  Code, ChevronDown, Edit2, Loader2, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Suspense } from 'react';
import { CopyHistoryButton } from '@/components/dashboard/CopyHistoryButton';

import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { GenerateDossierFallback } from '@/components/dashboard/GenerateDossierFallback';
import { SessionResetAction } from '@/components/dashboard/SessionResetAction';

import { EditBriefingModal } from '@/components/dashboard/EditBriefingModal';
import { TranslateDocumentAction } from '@/components/dashboard/TranslateDocumentAction';

export const dynamic = 'force-dynamic';

/* ── Helpers ─────────────────────────────────────────────────────── */

// DashboardDocumentEditor is a client component that wraps the Tiptap editor
import { DashboardDocumentEditor } from '@/components/dashboard/DashboardDocumentEditor';

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
            isLocked={session.status === 'finished' || !!session.final_assets?.document || !!session.final_document}
          >
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-[11px] uppercase tracking-wider font-bold transition-colors border shadow-sm h-8 px-3 shrink-0 bg-[var(--bg)] border-[var(--bd-strong)] hover:bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)] gap-1.5" title="Editar Informações do Briefing">
              <Edit2 className="w-3.5 h-3.5" />
              Editar
            </button>
          </EditBriefingModal>

          <TranslateDocumentAction 
            documentContent={session.final_assets?.document || ''}
            originalDocument={session.final_assets?.original_document}
            finalAssets={session.final_assets || {}}
            baseLanguage={session.chosen_language || 'pt'}
            onSaveAssets={async (updatedAssets) => {
              'use server';
              const { createServerSupabaseClient } = await import('@/lib/supabase/server');
              const supabase = await createServerSupabaseClient();
              await supabase.from('briefing_sessions').update({ final_assets: updatedAssets }).eq('id', session.id);
            }}
          />

          {/* ── SHEET: HISTÓRICO DE RESPOSTAS ──────────────────────── */}
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-[11px] uppercase tracking-wider font-bold transition-colors border shadow-sm h-8 px-3 shrink-0 bg-[var(--bg)] border-[var(--bd-strong)] hover:bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)]" title="Histórico">
              Histórico
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[540px] flex flex-col bg-[var(--bg)] border-l border-[var(--bd)] p-0 z-[100]">
              <SheetHeader className="p-6 pb-4 border-b border-[var(--bd)] shrink-0 bg-[var(--bg)] flex flex-row items-center justify-between">
                <div>
                  <SheetTitle className="text-xl">Histórico</SheetTitle>
                  <SheetDescription>
                    Transcrição completa das respostas.
                  </SheetDescription>
                </div>
                {interactions.length > 0 && <CopyHistoryButton historyText={interactions.map(i => `P: ${i.question_text || 'Sistema'}\nR: ${i.user_answer || 'Sem resposta'}`).join('\n\n')} />}
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[var(--bg)] isolate z-0">
                {interactions.length === 0 ? (
                  <p className="text-sm text-[var(--text3)] italic text-center py-10">Nenhum histórico disponível ainda.</p>
                ) : (
                  interactions.map((interaction, idx) => {
                    const inputType = interaction.question_type || 'text';
                    const isDepthQ = interaction.is_depth_question;
                    return (
                      <div key={interaction.id} className="relative isolate z-0">
                        {idx !== interactions.length - 1 && (
                          <div className="absolute left-4 top-12 bottom-[-20px] w-px bg-gradient-to-b from-[var(--bd-strong)] to-transparent pointer-events-none" />
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
                  })
                )}

                {/* ── ZONA DE PERIGO ────────────────────────────────────── */}
                <div className="pt-8 mt-12 border-t border-[var(--bd)]">
                  <SessionResetAction sessionId={session.id} />
                </div>
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



      {/* ── ÁREA DO DOCUMENTO PRINCIPAL (Folha A4) ──────────────── */}
      <div className="a4-document-container print:shadow-none print:border-0 print:m-0 print:p-0 bg-[var(--bg)] text-[var(--text)] border border-[var(--bd-strong)] shadow-sm rounded-2xl md:rounded-[2rem] overflow-clip min-h-[60vh]">
        {session.final_assets?.document ? (
          <div className="p-6 md:p-8 lg:p-10 print:p-0 print:pt-4">
            <DashboardDocumentEditor
              sessionId={session.id}
              documentContent={session.final_assets.document}
              finalAssets={session.final_assets as Record<string, unknown>}
            />
          </div>
        ) : session.status === 'finished' ? (
          <GenerateDossierFallback sessionId={session.id} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-[var(--text3)] p-6 text-center bg-[var(--bg2)] md:rounded-b-[2rem]">
            <FileText className="w-12 h-12 mb-4 opacity-30 text-[var(--text3)]" />
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Briefing em Andamento</h3>
            <p className="max-w-md mx-auto text-sm leading-relaxed text-[var(--text2)]">
              O documento final será gerado automaticamente aqui assim que o cliente concluir a etapa de perguntas e respostas.
            </p>
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

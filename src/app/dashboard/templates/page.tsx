import Link from 'next/link';
import { FileText, Target, Share2, AlertCircle, Lock } from 'lucide-react';
import { getTemplates } from '@/lib/services/briefingService';
import { GenerateLinkModal } from '@/components/dashboard/GenerateLinkModal';
import { TemplatesPageHeader, TemplatesEmptyState } from '@/components/dashboard/TemplatesI18n';
import { Suspense } from 'react';
import { DeleteSessionButton } from '@/components/dashboard/DeleteSessionButton';
import { getUserQuota } from '@/lib/services/briefingService';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

function LimitReachedButton() {
  return (
    <Dialog>
      <DialogTrigger className="flex items-center gap-2 px-3 h-10 text-xs font-medium rounded-full hover:bg-[var(--acbg)] text-[var(--actext)] hover:text-black transition-colors btn-pill">
        <Share2 className="w-4 h-4" />
        Gerar Link
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[var(--bg)] border-[var(--bd)] text-[var(--text)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            Limite Atingido
          </DialogTitle>
          <DialogDescription className="text-[var(--text2)] pt-2 leading-relaxed">
            Você atingiu o limite de respostas para o seu plano atual. Você pode apagar um briefing que ainda não teve respostas para liberar espaço, ou adquirir mais briefings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--bd)] mt-2">
          <Link href="/dashboard/packages" className="w-full">
            <Button className="w-full bg-[var(--orange)] text-black font-bold hover:opacity-90 rounded-full h-11">
              Comprar Mais Briefings
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Async data component — streamed independently ──────────────────
async function TemplatesList() {
  const [templates, quota] = await Promise.all([
    getTemplates(),
    getUserQuota()
  ]);

  if (!templates || templates.length === 0) {
    return <TemplatesEmptyState />;
  }

  // Quota banner logic
  const used = quota?.used_briefings || 0;
  const max = quota?.max_briefings || 0;
  const available = Math.max(0, max - used);
  const isNearLimit = available <= 1;
  const isLimitReached = used >= max && max > 0;

  return (
    <div className="flex flex-col gap-6 mb-8">
      {max > 0 && (
        <div className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border ${isLimitReached ? 'bg-red-500/10 border-red-500/20' : isNearLimit ? 'bg-[var(--orange)]/10 border-[var(--orange)]/20' : 'bg-[var(--acbg)] border-[var(--acbd)]'}`}>
          <div>
            <h4 className={`text-sm font-bold ${isLimitReached ? 'text-red-500' : isNearLimit ? 'text-[var(--orange)]' : 'text-[var(--actext)]'}`}>
              Briefings Disponíveis: {available} / {max}
            </h4>
            <p className="text-xs text-[var(--text2)] mt-0.5">
              {isLimitReached
                ? 'Você atingiu o limite. Adquira mais pacotes para continuar criando briefings.'
                : isNearLimit 
                  ? 'Você está perto do limite. Adquira mais pacotes para continuar criando briefings.' 
                  : 'Você tem briefings sobrando. Use-os para gerar novos documentos estratégicos!'}
            </p>
          </div>
          <Link href="/dashboard/packages" className="mt-3 sm:mt-0 shrink-0">
            <button className={`px-4 py-2 text-xs font-bold rounded-full transition-colors ${isLimitReached ? 'bg-red-500 text-white hover:bg-red-600' : isNearLimit ? 'bg-[var(--orange)] text-black hover:opacity-90' : 'bg-black text-[var(--orange)] hover:opacity-90'}`}>
              Comprar mais
            </button>
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {templates.map((template) => {
        const activeSession = template.briefing_sessions?.[0];
        const isFinished = activeSession?.status === 'finished';

        return (
          <div
            key={template.id}
            className="group relative flex flex-col rounded-2xl bg-[var(--bg)] border border-[var(--bd)] hover:border-[var(--bd-strong)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {isFinished && (
              <div 
                className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-[var(--orange)]/10 flex items-center justify-center border border-[var(--orange)]/20 backdrop-blur-sm" 
                title="Briefing Finalizado"
              >
                <Lock className="w-3.5 h-3.5 text-[var(--orange)]" />
              </div>
            )}
            
            <Link href={`/dashboard/templates/${template.id}`} className="flex flex-col flex-1 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--acbg)] flex items-center justify-center border border-[var(--acbd)] group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-[var(--actext)]" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-1.5 leading-tight group-hover:text-[var(--actext)] transition-colors">
                {template.name}
              </h3>
              {template.briefing_purpose && (
                <div className="flex items-start gap-1.5 mt-2">
                  <Target className="w-3 h-3 text-[var(--text3)] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text2)] line-clamp-2 leading-relaxed">
                    {template.briefing_purpose}
                  </p>
                </div>
              )}
            </Link>

            <div className="px-6 pb-6 pt-0">
              <div className="pt-4 border-t border-[var(--bd)] flex items-center justify-between">
                {isLimitReached && !activeSession ? (
                  <LimitReachedButton />
                ) : (
                  <GenerateLinkModal 
                    templateId={template.id} 
                    templateName={template.name} 
                    existingSession={activeSession ? {
                      id: activeSession.id,
                      edit_passphrase: activeSession.edit_passphrase
                    } : undefined}
                  />
                )}
                {activeSession && !isFinished && (
                  <DeleteSessionButton sessionId={activeSession.id} />
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

// ── Skeleton for the list while it loads ─────────────────────────
function TemplatesListSkeleton() {
  return (
    <div className="grid grid-cols-1 mb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-[var(--bg2)] border border-[var(--bd)] p-6 space-y-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-[var(--bg3)]" />
          <div className="h-5 w-3/4 bg-[var(--bg3)] rounded-lg" />
          <div className="h-3 w-full bg-[var(--bg3)] rounded" />
          <div className="h-3 w-2/3 bg-[var(--bg3)] rounded" />
          <div className="pt-4 border-t border-[var(--bd)]">
            <div className="h-8 w-24 bg-[var(--bg3)] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page shell renders instantly, TemplatesList streams in ────────
export default function TemplatesPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header — renders immediately with i18n */}
      <TemplatesPageHeader />

      {/* Data — streams in with skeleton fallback */}
      <Suspense fallback={<TemplatesListSkeleton />}>
        <TemplatesList />
      </Suspense>
    </div>
  );
}

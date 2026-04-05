import Link from 'next/link';
import { FileText, Target } from 'lucide-react';
import { getTemplates } from '@/lib/services/briefingService';
import { GenerateLinkModal } from '@/components/dashboard/GenerateLinkModal';
import { TemplatesPageHeader, TemplatesEmptyState } from '@/components/dashboard/TemplatesI18n';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

// ── Async data component — streamed independently ──────────────────
async function TemplatesList() {
  const templates = await getTemplates();

  if (!templates || templates.length === 0) {
    return <TemplatesEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 mb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {templates.map((template) => (
        <div
          key={template.id}
          className="group relative flex flex-col rounded-2xl bg-[var(--bg)] border border-[var(--bd)] hover:border-[var(--bd-strong)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
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
            {template.depth_signals && template.depth_signals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {template.depth_signals.slice(0, 3).map((signal: string) => (
                  <span key={signal} className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg2)] text-[var(--text2)] border border-[var(--bd)] font-medium">
                    {signal}
                  </span>
                ))}
                {template.depth_signals.length > 3 && (
                  <span className="text-[10px] text-[var(--text3)] self-center font-medium">+{template.depth_signals.length - 3}</span>
                )}
              </div>
            )}
          </Link>

          <div className="px-6 pb-6 pt-0">
            <div className="pt-4 border-t border-[var(--bd)] flex items-center justify-between">
              <GenerateLinkModal 
                templateId={template.id} 
                templateName={template.name} 
                existingSession={template.briefing_sessions?.[0] ? {
                  id: template.briefing_sessions[0].id,
                  edit_passphrase: template.briefing_sessions[0].edit_passphrase
                } : undefined}
              />
            </div>
          </div>
        </div>
      ))}
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

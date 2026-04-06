'use client';

import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  TrendingUp,
  Users,
  Palette,
  Megaphone,
  Sparkles,
  ExternalLink,
  Database,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  partitionCompanyInfo,
  type FormattedValue,
} from '@/lib/briefing/fieldLabels';

// ================================================================
// ICON MAP — Per group for visual identification
// ================================================================
const GROUP_ICONS: Record<string, React.ElementType> = {
  company: Building2,
  market: TrendingUp,
  audience: Users,
  identity: Palette,
  communication: Megaphone,
};

const GROUP_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  company: { accent: 'text-[var(--orange)]', bg: 'bg-[var(--orange)]/5', border: 'border-[var(--orange)]/20' },
  market: { accent: 'text-[var(--orange)]', bg: 'bg-[var(--orange)]/5', border: 'border-[var(--orange)]/20' },
  audience: { accent: 'text-[var(--orange)]', bg: 'bg-[var(--orange)]/5', border: 'border-[var(--orange)]/20' },
  identity: { accent: 'text-[var(--orange)]', bg: 'bg-[var(--orange)]/5', border: 'border-[var(--orange)]/20' },
  communication: { accent: 'text-[var(--orange)]', bg: 'bg-[var(--orange)]/5', border: 'border-[var(--orange)]/20' },
};

// ================================================================
// VALUE RENDERER — Smart render based on FormattedValue type
// ================================================================
function ValueRenderer({ value }: { value: FormattedValue }) {
  switch (value.type) {
    case 'empty':
      return (
        <span className="text-sm text-zinc-600 italic">Não informado</span>
      );

    case 'text':
      return (
        <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
          {value.value}
        </p>
      );

    case 'tags':
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.values.map((tag, i) => (
            <span
              key={i}
              className="text-xs font-medium bg-[var(--bg2)] text-[var(--text2)] px-2.5 py-1 rounded-md border border-[var(--bd-strong)] hover:bg-[var(--bg3)] transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      );

    case 'url':
      return (
        <a
          href={value.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--orange)] hover:text-[#e8552a] transition-colors underline underline-offset-4 decoration-[var(--orange)]/30 hover:decoration-[var(--orange)]/60"
        >
          {value.label}
          <ExternalLink className="w-3 h-3" />
        </a>
      );

    case 'url_list':
      return (
        <div className="flex flex-col gap-1.5">
          {value.urls.map((u, i) => (
            <a
              key={i}
              href={u.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-fit items-center gap-1.5 text-sm text-[var(--orange)] hover:text-[#e8552a] transition-colors underline underline-offset-4 decoration-[var(--orange)]/30 hover:decoration-[var(--orange)]/60"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{u.label}</span>
            </a>
          ))}
        </div>
      );

    case 'color':
      return (
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md border border-[var(--bd-strong)] shadow-inner"
            style={{ backgroundColor: value.hex }}
          />
          <span className="text-sm font-mono text-[var(--text)]">{value.hex}</span>
        </div>
      );

    case 'keyvalue':
      return (
        <div className="space-y-1.5">
          {value.entries.map((entry, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-[var(--text3)] font-medium shrink-0">
                {entry.key}:
              </span>
              <span className="text-[var(--text)]">{entry.value}</span>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ================================================================
// MINI PROGRESS — Inline completeness indicator
// ================================================================
function MiniProgress({
  filled,
  total,
  accentColor,
}: {
  filled: number;
  total: number;
  accentColor: string;
}) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const bgClass = accentColor.replace('text-', 'bg-');

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[var(--bg3)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${bgClass} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-[var(--text3)]">
        {filled}/{total}
      </span>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================
interface CollectedBriefingDataProps {
  companyInfo: Record<string, unknown> | null;
  lang?: string;
  sessionStatus?: string;
}

export default function CollectedBriefingData({
  companyInfo,
  lang = 'pt',
  sessionStatus,
}: CollectedBriefingDataProps) {
  const data = useMemo(
    () => partitionCompanyInfo(companyInfo, lang),
    [companyInfo, lang]
  );

  const isInProgress = sessionStatus === 'in_progress';

  // Total stats
  const totalFilled = data.groups.reduce((s, g) => s + g.filledCount, 0);
  const totalFields = data.groups.reduce((s, g) => s + g.totalCount, 0);
  const totalPct = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;

  // Default: open groups that have data
  const [openGroups] = useState<string[]>(() =>
    data.groups.filter((g) => g.filledCount > 0).map((g) => g.id)
  );

  // Empty state
  if (
    !companyInfo ||
    typeof companyInfo !== 'object' ||
    Object.keys(companyInfo).length === 0
  ) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-[var(--bg2)] border border-[var(--bd)] rounded-2xl">
        <Database className="w-14 h-14 text-[var(--text3)] opacity-50 mb-5" />
        <h3 className="text-lg font-bold text-[var(--text)] mb-2">
          Nenhum Dado Estruturado
        </h3>
        <p className="text-[var(--text2)] max-w-sm text-sm">
          {isInProgress
            ? 'O briefing está em andamento. Os dados aparecerão aqui conforme forem coletados.'
            : 'Nenhum dado estruturado foi persistido para esta sessão.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Coverage Header */}
      <Card className="bg-[var(--bg2)] border-[var(--bd)] shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text)]">
                  Cobertura dos Campos Basais
                </p>
                <p className="text-sm text-[var(--text3)]">
                  {totalFilled} de {totalFields} campos preenchidos
                  {data.extras.length > 0 &&
                    ` + ${data.extras.length} campo(s) adicional(is)`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-[var(--bg3)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--orange)] transition-all duration-700"
                  style={{ width: `${totalPct}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[var(--text)] font-mono">
                {totalPct}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Accordions */}
      <Accordion
        defaultValue={openGroups}
        className="space-y-3"
      >
        {data.groups.map((group) => {
          const Icon = GROUP_ICONS[group.id] || Sparkles;
          const colors = GROUP_COLORS[group.id] || {
            accent: 'text-zinc-400',
            bg: 'bg-zinc-500/5',
            border: 'border-zinc-500/20',
          };
          const hasSomeData = group.filledCount > 0;

          return (
            <AccordionItem
              key={group.id}
              value={group.id}
              className={`border rounded-xl overflow-hidden transition-colors ${
                hasSomeData
                  ? `bg-[var(--bg)] border-[var(--bd-strong)]`
                  : 'bg-[var(--bg2)] border-[var(--bd)]'
              }`}
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-[var(--bg2)] transition-colors [&[data-state=open]>svg]:text-[var(--text)]">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${colors.accent}`} />
                  </div>
                  <span className="text-sm font-bold text-[var(--text)]">
                    {group.label}
                  </span>
                  <MiniProgress
                    filled={group.filledCount}
                    total={group.totalCount}
                    accentColor={colors.accent}
                  />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="space-y-4 pt-2">
                  {group.fields.map((field) => (
                    <div
                      key={field.key}
                      className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4"
                    >
                      <div className="flex items-center gap-1.5 shrink-0 sm:w-48">
                        {field.value.type !== 'empty' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Circle className="w-3 h-3 text-[var(--text3)]" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            field.value.type !== 'empty'
                              ? 'text-[var(--text2)]'
                              : 'text-[var(--text3)]'
                          }`}
                        >
                          {field.label}
                        </span>
                      </div>
                      <div className="flex-1 pl-[18px] sm:pl-0">
                        <ValueRenderer value={field.value} />
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Extra Fields (AI-generated beyond basal) */}
      {data.extras.length > 0 && (
        <Card className="bg-[var(--bg2)] border-[var(--bd)] shadow-none">
          <CardHeader className="border-b border-[var(--bd)] bg-[var(--bg)] py-4 px-5">
            <CardTitle className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--orange)]" />
              Campos Adicionais (IA)
              <span className="text-xs font-mono text-[var(--text3)] bg-[var(--bg3)] px-2 py-0.5 rounded-full">
                {data.extras.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {data.extras.map((field) => (
                <div
                  key={field.key}
                  className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4"
                >
                  <span className="text-sm font-medium text-[var(--text2)] shrink-0 sm:w-48">
                    {field.label}
                  </span>
                  <div className="flex-1">
                    <ValueRenderer value={field.value} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

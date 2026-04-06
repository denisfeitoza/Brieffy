'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { format, subDays, isAfter } from 'date-fns';
import {
  Search, ExternalLink, Trash2, Copy, CheckCircle2, Clock,
  AlertCircle, FileText, Eye, CalendarDays, X, Download, Package,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { exportSessionsAsZip } from '@/lib/exportZip';
import { useDashboardLanguage } from '@/i18n/DashboardLanguageContext';

interface Session {
  id: string;
  session_name?: string;
  template_id?: string;
  template_name?: string;
  status: string;
  created_at: string;
  final_assets?: Record<string, unknown>;
  final_document?: string;
  basal_coverage?: number | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  finished: { label: 'Completed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  pending: { label: 'Pending', color: 'text-[var(--text3)] bg-[var(--bg2)] border-[var(--bd)]', icon: AlertCircle },
};

const FILTER_TABS = [
  { key: 'all', labelKey: 'dashboard.filterAll' },
  { key: 'finished', labelKey: 'dashboard.filterCompleted' },
  { key: 'in_progress', labelKey: 'dashboard.filterInProgress' },
  { key: 'pending', labelKey: 'dashboard.filterPending' },
];

const DATE_FILTERS = [
  { key: 'all', labelKey: 'dashboard.dateAll' },
  { key: '7', labelKey: 'dashboard.dateLast7' },
  { key: '30', labelKey: 'dashboard.dateLast30' },
  { key: '90', labelKey: 'dashboard.dateLast90' },
];

export function DashboardClient({ sessions }: { sessions: Session[] }) {
  const router = useRouter();
  const { language, t } = useDashboardLanguage();
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewSession, setPreviewSession] = useState<Session | null>(null);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (filter !== 'all' && s.status !== filter) return false;
      if (dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const cutoff = subDays(new Date(), days);
        if (!isAfter(new Date(s.created_at), cutoff)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (s.session_name || '').toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [sessions, filter, dateFilter, search]);

  const handleCopyLink = (sessionId: string) => {
    const link = `${window.location.origin}/b/${sessionId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this briefing? This action cannot be undone.')) return;
    setDeletingId(sessionId);
    try {
      const supabase = createClient();
      await supabase.from('briefing_interactions').delete().eq('session_id', sessionId);
      await supabase.from('briefing_sessions').delete().eq('id', sessionId);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getPreviewContent = (session: Session): string => {
    if (session.final_document) return session.final_document;
    const assets = session.final_assets as Record<string, unknown> | null;
    if (!assets) return '';
    if (typeof assets.document === 'string') return assets.document;
    return JSON.stringify(assets, null, 2);
  };

  // ── Export Handlers ─────────────────────────────────────────────────────────
  const toggleExportSelect = (id: string) => {
    setSelectedForExport(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportSelected = async () => {
    const toExport = sessions.filter(s => selectedForExport.has(s.id));
    if (toExport.length === 0) return;
    setIsExporting(true);
    try {
      await exportSessionsAsZip(toExport as Parameters<typeof exportSessionsAsZip>[0], language);
      setSelectedForExport(new Set());
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await exportSessionsAsZip(sessions as Parameters<typeof exportSessionsAsZip>[0], language);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <h3 className="text-xl font-semibold text-[var(--text)]">{t('dashboard.myBriefings')}</h3>
        <div className="flex items-center gap-2 flex-1 md:justify-end">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('dashboard.searchPlaceholder')}
              className="pl-9 bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-[var(--orange)] rounded-xl h-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export All */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            disabled={isExporting || sessions.length === 0}
            className="shrink-0 border-[var(--bd)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] rounded-xl h-10 px-3 gap-1.5"
            title="Export all briefings as ZIP"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-sm">{t('dashboard.exportAll')}</span>
          </Button>
        </div>
      </div>

      {/* Export Selection Bar */}
      {selectedForExport.size > 0 && (
        <div className="flex items-center justify-between bg-[var(--acbg)] border border-[var(--acbd)] rounded-2xl px-4 py-3">
          <span className="text-sm text-[var(--actext)] font-medium">
            {selectedForExport.size} {t('dashboard.briefingsSelected')}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedForExport(new Set())}
              className="text-[var(--text3)] hover:text-[var(--text)] text-sm rounded-lg"
            >
              {t('dashboard.clear')}
            </Button>
            <Button
              size="sm"
              onClick={handleExportSelected}
              disabled={isExporting}
              className="bg-[var(--orange)] hover:bg-[#e8552a] text-black font-semibold rounded-xl text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? t('dashboard.exporting') : t('dashboard.exportZip')}
            </Button>
          </div>
        </div>
      )}

      {/* Filter Tabs + Date Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTER_TABS.map(tab => (
            <Button
              key={tab.key}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-4 shrink-0 transition-all ${
                filter === tab.key
                  ? 'bg-[var(--acbg)] text-[var(--actext)] border border-[var(--acbd)]'
                  : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)] border border-transparent'
              }`}
            >
              {t(tab.labelKey)}
              {tab.key !== 'all' && (
                <span className="ml-1.5 text-sm opacity-70">
                  {sessions.filter(s => s.status === tab.key).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <CalendarDays className="w-3.5 h-3.5 text-[var(--text3)]" />
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {DATE_FILTERS.map(d => (
              <button
                key={d.key}
                onClick={() => setDateFilter(d.key)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  dateFilter === d.key
                    ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                    : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)]'
                }`}
              >
                {t(d.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length !== sessions.length && (
        <p className="text-sm text-[var(--text3)]">
          {t('dashboard.showing')} <span className="text-[var(--text)] font-medium">{filtered.length}</span> {t('dashboard.of')} {sessions.length} {t('dashboard.briefings')}
        </p>
      )}

      {/* Session Cards */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl">
          <div className="text-center py-12 text-[var(--text3)]">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-lg">{t('dashboard.noBriefings')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const statusInfo = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;
            const hasDocument = !!(session.final_assets as Record<string, unknown> | null)?.document || !!session.final_document;
            const isChecked = selectedForExport.has(session.id);

            return (
              <div
                key={session.id}
                className={`bg-[var(--bg)] border rounded-xl hover:border-[var(--bd-strong)] transition-all duration-200 group ${
                  isChecked ? 'border-[var(--acbd)] bg-[var(--acbg)]' : 'border-[var(--bd)]'
                }`}
              >
                <div className="py-4 px-4 md:px-6">
                  <div className="flex items-center gap-3 md:gap-6">
                    {/* Export Checkbox */}
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleExportSelect(session.id)}
                      className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-[var(--text)] truncate text-base">
                          {session.session_name || 'Untitled Briefing'}
                        </h4>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[var(--text3)]">
                        <span className="font-mono">{session.id.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>{format(new Date(session.created_at), 'MMM dd, yyyy')}</span>
                        {session.status === 'in_progress' && session.basal_coverage != null && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-14 h-1.5 bg-[var(--bg3)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--orange)] rounded-full transition-all"
                                  style={{ width: `${Math.min(100, Math.round(Number(session.basal_coverage) * 100))}%` }}
                                />
                              </div>
                              <span className="text-xs text-[var(--orange)] font-mono">
                                {Math.round(Number(session.basal_coverage) * 100)}%
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {hasDocument && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewSession(session)}
                          className="text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)] rounded-lg text-sm"
                          title="Quick preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Link href={`/dashboard/${session.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--actext)] hover:bg-[var(--acbg)] rounded-lg text-sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-1.5" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(session.id)}
                        className={`rounded-lg text-sm hidden sm:flex ${
                          copiedId === session.id
                            ? 'text-emerald-500 bg-emerald-50'
                            : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)]'
                        }`}
                      >
                        <Copy className="w-4 h-4 mr-1.5" />
                        {copiedId === session.id ? t('dashboard.copied') : t('dashboard.link')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                        className="text-[var(--text3)] hover:text-red-500 hover:bg-red-50 rounded-lg text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Preview Sheet */}
      <Sheet open={!!previewSession} onOpenChange={(open) => !open && setPreviewSession(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl bg-[var(--bg)] border-[var(--bd)] overflow-y-auto p-0"
        >
          {previewSession && (
            <>
              <SheetHeader className="p-6 pb-4 border-b border-[var(--bd)] sticky top-0 bg-[var(--bg)] z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <SheetTitle className="text-[var(--text)] font-semibold text-lg truncate">
                      {previewSession.session_name || t('dashboard.untitled')}
                    </SheetTitle>
                    <p className="text-sm text-[var(--text3)] mt-0.5">
                      {format(new Date(previewSession.created_at), 'MMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        setIsExporting(true);
                        try {
                          await exportSessionsAsZip([previewSession] as Parameters<typeof exportSessionsAsZip>[0], language);
                        } finally {
                          setIsExporting(false);
                        }
                      }}
                      disabled={isExporting}
                      className="border-[var(--bd)] text-[var(--text2)] hover:text-[var(--text)] rounded-xl text-sm gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      {t('dashboard.export')}
                    </Button>
                    <Link href={`/dashboard/${previewSession.id}`}>
                      <Button
                        size="sm"
                        className="bg-[var(--orange)] hover:bg-[#e8552a] text-black font-semibold rounded-xl text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('dashboard.openFull')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetHeader>

              <div className="p-6">
                {getPreviewContent(previewSession) ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-[var(--text2)] leading-relaxed font-sans bg-transparent p-0 border-0">
                      {getPreviewContent(previewSession)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-[var(--text3)] py-12">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>{t('dashboard.noContent')}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

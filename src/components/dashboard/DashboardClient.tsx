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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  finished: { label: 'Completed', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock },
  pending: { label: 'Pending', color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20', icon: AlertCircle },
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
        <h3 className="text-xl font-semibold text-zinc-100">{t('dashboard.myBriefings')}</h3>
        <div className="flex items-center gap-2 flex-1 md:justify-end">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('dashboard.searchPlaceholder')}
              className="pl-9 bg-zinc-900/50 border-white/10 focus-visible:ring-cyan-500 rounded-xl h-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
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
            className="shrink-0 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-xl h-10 px-3 gap-1.5"
            title="Export all briefings as ZIP"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">{t('dashboard.exportAll')}</span>
          </Button>
        </div>
      </div>

      {/* Export Selection Bar (appears when items selected) */}
      {selectedForExport.size > 0 && (
        <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-900/50 rounded-2xl px-4 py-3">
          <span className="text-sm text-cyan-300 font-medium">
            {selectedForExport.size} {t('dashboard.briefingsSelected')}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedForExport(new Set())}
              className="text-zinc-400 hover:text-zinc-200 text-xs rounded-lg"
            >
              {t('dashboard.clear')}
            </Button>
            <Button
              size="sm"
              onClick={handleExportSelected}
              disabled={isExporting}
              className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs gap-1.5"
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
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {t(tab.labelKey)}
              {tab.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {sessions.filter(s => s.status === tab.key).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {DATE_FILTERS.map(d => (
              <button
                key={d.key}
                onClick={() => setDateFilter(d.key)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  dateFilter === d.key
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                {t(d.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length !== sessions.length && (
        <p className="text-xs text-zinc-500">
          {t('dashboard.showing')} <span className="text-zinc-300 font-medium">{filtered.length}</span> {t('dashboard.of')} {sessions.length} {t('dashboard.briefings')}
        </p>
      )}

      {/* Session Cards */}
      {filtered.length === 0 ? (
        <Card className="bg-zinc-900/30 border-white/5">
          <CardContent className="text-center py-12 text-zinc-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-lg">{t('dashboard.noBriefings')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const statusInfo = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;
            const hasDocument = !!(session.final_assets as Record<string, unknown> | null)?.document || !!session.final_document;
            const isChecked = selectedForExport.has(session.id);

            return (
              <Card
                key={session.id}
                className={`bg-zinc-900/40 backdrop-blur-sm border-white/8 hover:border-white/15 transition-all duration-300 group ${
                  isChecked ? 'border-cyan-800/50 bg-cyan-950/10' : ''
                }`}
              >
                <CardContent className="py-4 px-4 md:px-6">
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
                        <h4 className="font-semibold text-zinc-100 truncate text-sm md:text-base">
                          {session.session_name || 'Untitled Briefing'}
                        </h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="font-mono">{session.id.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>{format(new Date(session.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {hasDocument && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewSession(session)}
                          className="text-zinc-400 hover:text-indigo-300 hover:bg-indigo-950/20 rounded-lg text-xs"
                          title="Quick preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Link href={`/dashboard/${session.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 rounded-lg text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(session.id)}
                        className={`rounded-lg text-xs hidden sm:flex ${
                          copiedId === session.id
                            ? 'text-emerald-400 bg-emerald-950/20'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        {copiedId === session.id ? t('dashboard.copied') : t('dashboard.link')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Preview Sheet */}
      <Sheet open={!!previewSession} onOpenChange={(open) => !open && setPreviewSession(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl bg-zinc-950 border-white/10 overflow-y-auto p-0"
        >
          {previewSession && (
            <>
              <SheetHeader className="p-6 pb-4 border-b border-white/8 sticky top-0 bg-zinc-950 z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <SheetTitle className="text-zinc-100 font-semibold text-base truncate">
                      {previewSession.session_name || t('dashboard.untitled')}
                    </SheetTitle>
                    <p className="text-xs text-zinc-500 mt-0.5">
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
                      className="border-white/10 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t('dashboard.export')}
                    </Button>
                    <Link href={`/dashboard/${previewSession.id}`}>
                      <Button
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        {t('dashboard.openFull')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetHeader>

              <div className="p-6">
                {getPreviewContent(previewSession) ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-sans bg-transparent p-0 border-0">
                      {getPreviewContent(previewSession)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-zinc-500 py-12">
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

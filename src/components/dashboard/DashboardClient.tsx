'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  Search, ExternalLink, Trash2, Copy, CheckCircle2, Clock,
  AlertCircle, FileText,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Session {
  id: string;
  session_name?: string;
  template_id?: string;
  status: string;
  created_at: string;
  final_assets?: Record<string, unknown>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  finished: { label: 'Completed', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock },
  pending: { label: 'Pending', color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20', icon: AlertCircle },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'finished', label: 'Completed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'pending', label: 'Pending' },
];

export function DashboardClient({ sessions }: { sessions: Session[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = sessions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (s.session_name || '').toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopyLink = (sessionId: string) => {
    const link = `${window.location.origin}/b/${sessionId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <h3 className="text-xl font-semibold text-zinc-100">Briefing Sessions</h3>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="pl-9 bg-zinc-900/50 border-white/10 focus-visible:ring-cyan-500 rounded-xl h-10"
          />
        </div>
      </div>

      {/* Filter Tabs */}
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
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                {sessions.filter(s => tab.key === 'all' ? true : s.status === tab.key).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Session Cards */}
      {filtered.length === 0 ? (
        <Card className="bg-zinc-900/30 border-white/5">
          <CardContent className="text-center py-12 text-zinc-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No briefings found</p>
            <p className="text-sm mt-1">Create your first briefing to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const statusInfo = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <Card
                key={session.id}
                className="bg-zinc-900/40 backdrop-blur-sm border-white/8 hover:border-white/15 transition-all duration-300 group"
              >
                <CardContent className="py-4 px-4 md:px-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/dashboard/${session.id}`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 rounded-lg text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(session.id)}
                        className={`rounded-lg text-xs ${
                          copiedId === session.id
                            ? 'text-emerald-400 bg-emerald-950/20'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        {copiedId === session.id ? 'Copied!' : 'Link'}
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
    </div>
  );
}

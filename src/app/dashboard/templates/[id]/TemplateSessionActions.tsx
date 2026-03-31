'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ExternalLink, Copy, Lock, Trash2, CheckCircle2, Eye,
  MoreVertical, FileText, Link2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SessionData {
  id: string;
  status: string;
  edit_passphrase?: string | null;
  edit_token?: string | null;
}

export function TemplateSessionActions({ session }: { session: SessionData }) {
  const router = useRouter();
  const [copied, setCopied] = useState<'link' | 'pass' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sessionLink = typeof window !== 'undefined'
    ? `${window.location.origin}/b/${session.id}`
    : `/b/${session.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(sessionLink);
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const copyPassphrase = () => {
    if (!session.edit_passphrase) return;
    navigator.clipboard.writeText(session.edit_passphrase);
    setCopied('pass');
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    const text = `🔗 Link do Briefing:\n${sessionLink}\n\n🔑 Senha: ${session.edit_passphrase || 'Sem senha'}`;
    navigator.clipboard.writeText(text);
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* View Details */}
      <Link href={`/dashboard/${session.id}`}>
        <Button
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs gap-1.5 h-8"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden sm:inline">
            {session.status === 'in_progress' ? 'Continuar' : 'Ver'}
          </span>
        </Button>
      </Link>

      {/* Doc link (if finished) */}
      {session.edit_token && session.status === 'finished' && (
        <Link href={`/doc/${session.edit_token}`} target="_blank">
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-zinc-300 hover:bg-white/5 rounded-xl text-xs gap-1.5 h-8"
          >
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">Doc</span>
          </Button>
        </Link>
      )}

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          }
        />
        <DropdownMenuContent
          align="end"
          className="bg-zinc-900 border-white/10 text-zinc-300 min-w-[180px]"
        >
          <DropdownMenuItem onClick={copyLink} className="gap-2 cursor-pointer">
            {copied === 'link' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
            {copied === 'link' ? 'Copiado!' : 'Copiar Link'}
          </DropdownMenuItem>

          {session.edit_passphrase && (
            <DropdownMenuItem onClick={copyPassphrase} className="gap-2 cursor-pointer">
              {copied === 'pass' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              {copied === 'pass' ? 'Copiada!' : 'Copiar Senha'}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={copyAll} className="gap-2 cursor-pointer">
            <Copy className="w-3.5 h-3.5" />
            Copiar Link + Senha
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/5" />

          <DropdownMenuItem
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Excluindo...' : 'Excluir Sessão'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

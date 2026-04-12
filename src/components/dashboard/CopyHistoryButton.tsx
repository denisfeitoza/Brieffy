'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';

interface CopyHistoryButtonProps {
  historyText: string;
}

export function CopyHistoryButton({ historyText }: CopyHistoryButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(historyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <Button 
      onClick={handleCopy}
      variant="outline"
      size="sm"
      className="text-xs font-bold tracking-wider uppercase h-8 px-4 bg-[var(--bg2)] border-[var(--bd)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] rounded-lg transition-colors"
    >
      {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
      {copied ? 'Copiado!' : 'Copiar Tudo'}
    </Button>
  );
}

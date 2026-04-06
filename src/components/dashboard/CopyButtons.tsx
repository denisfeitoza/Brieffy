'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonsProps {
  markdown: string;
  html: string;
}

export function CopyButtons({ markdown, html }: CopyButtonsProps) {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedMd(true);
      toast.success('Conteúdo copiado em texto simples (Markdown)!');
      setTimeout(() => setCopiedMd(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar formato markdown');
    }
  };

  const handleCopyRichText = async () => {
    try {
      if (typeof ClipboardItem !== 'undefined') {
        const plainText = markdown.replace(/[#*`_]/g, '');
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        
        const item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        });
        
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(markdown.replace(/[#*`_]/g, ''));
      }
      
      setCopiedRich(true);
      toast.success('Conteúdo copiado!');
      setTimeout(() => setCopiedRich(false), 2000);
    } catch (err) {
      try {
        await navigator.clipboard.writeText(markdown.replace(/[#*`_]/g, ''));
        setCopiedRich(true);
        toast.success('Conteúdo copiado como texto simples!');
        setTimeout(() => setCopiedRich(false), 2000);
      } catch (e) {
        toast.error('Erro ao copiar');
      }
    }
  };

  return (
    <>
      <Button 
        onClick={handleCopyRichText}
        variant="outline" 
        size="sm"
        className="flex-1 md:flex-none text-sm font-semibold bg-[var(--bg)] border-[var(--bd-strong)] text-[var(--text)] hover:bg-[var(--bg2)] h-10"
      >
        <Copy className="w-4 h-4 mr-2" />
        {copiedRich ? 'Copiado' : 'Copiar'}
      </Button>
      
      <Button 
        onClick={handleCopyMarkdown}
        variant="default"
        size="sm"
        className="flex-1 md:flex-none text-sm font-semibold bg-[var(--orange)] hover:bg-[#e8552a] text-black shadow-sm h-10"
      >
        <Bot className="w-4 h-4 mr-2" />
        {copiedMd ? 'Pronto para IA!' : 'Copiar para IA'}
      </Button>
    </>
  );
}

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
      toast.success('Formato Markdown copiado para uso em IAs!');
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
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <Button 
        onClick={handleCopyRichText}
        variant="outline" 
        size="lg"
        className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200"
      >
        <Copy className="w-5 h-5 mr-2 text-zinc-400" />
        {copiedRich ? 'Copiado!' : 'Copiar'}
      </Button>
      
      <Button 
        onClick={handleCopyMarkdown}
        variant="default"
        size="lg"
        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)]"
      >
        <Bot className="w-5 h-5 mr-2" />
        {copiedMd ? 'Copiado!' : 'Copiar para IA'}
      </Button>
    </div>
  );
}

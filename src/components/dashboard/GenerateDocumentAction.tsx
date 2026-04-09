"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function GenerateDocumentAction({ 
  sessionId, 
  isRegenerate = false,
  delayMs = 0
}: { 
  sessionId: string;
  isRegenerate?: boolean;
  delayMs?: number;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisible, setIsVisible] = useState(delayMs === 0);
  const router = useRouter();

  useEffect(() => {
    if (delayMs > 0) {
      const timer = setTimeout(() => setIsVisible(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [delayMs]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const toastId = toast.loading(isRegenerate ? 'Regerando diagnóstico...' : 'Gerando seu diagnóstico estratégico...');
    
    try {
      const res = await fetch(`/api/sessions/${sessionId}/generate-document`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao gerar documento');
      }

      toast.success('Diagnóstico gerado com sucesso!', { id: toastId });
      
      // Refresh the page to show the new document
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar diagnóstico. Tente novamente.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Button 
      variant={isRegenerate ? "outline" : "default"}
      className={`gap-2 h-11 px-6 rounded-full font-bold shadow-lg transition-all active:scale-95 ${
        isRegenerate 
          ? "border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)]/10 bg-transparent" 
          : "bg-[var(--brand)] hover:opacity-90 text-white"
      }`}
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {isRegenerate ? 'Regerando...' : 'Gerando...'}
        </>
      ) : (
        <>
          {isRegenerate ? <RefreshCw className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          {isRegenerate ? 'Regerar Diagnóstico' : 'Gerar Meu Diagnóstico Agora'}
        </>
      )}
    </Button>
  );
}

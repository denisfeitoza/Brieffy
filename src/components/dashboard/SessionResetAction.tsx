"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SessionResetAction({ sessionId }: { sessionId: string }) {
  const [isResetting, setIsResetting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/reset`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Falha ao resetar briefing');

      toast.success('Briefing resetado com sucesso!');
      
      // Update the page data instead of redirecting
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao resetar briefing. Tente novamente.');
    } finally {
      setIsResetting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="pt-6 border-t border-[var(--bd)] mt-6">
      <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2 px-1 mb-4">
        <AlertTriangle className="w-4 h-4" />
        Zona de Perigo
      </h3>
      
      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
        <p className="text-xs text-red-800 mb-4 leading-relaxed">
          Resetar o briefing irá apagar todo o histórico de mensagens e insights da IA. 
          As informações iniciais da empresa serão mantidas, mas você precisará recomeçar a conversa do zero.
        </p>
        
        <Button 
          variant="destructive" 
          className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-sm h-10"
          onClick={() => setIsOpen(true)}
          disabled={isResetting}
        >
          {isResetting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCcw className="w-4 h-4" />
          )}
          Resetar Briefing
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg)] border border-[var(--bd)] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h4 className="text-lg font-bold text-[var(--text)] mb-2">Tem certeza?</h4>
            <p className="text-sm text-[var(--text3)] mb-6">
              Esta ação não pode ser desfeita. Todo o progresso atual deste briefing será perdido.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent border-[var(--bd)]"
                onClick={() => setIsOpen(false)}
                disabled={isResetting}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, Resetar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

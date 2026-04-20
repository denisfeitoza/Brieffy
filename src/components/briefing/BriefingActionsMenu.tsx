"use client";

import { useState } from "react";
import { useBriefing } from "@/lib/BriefingContext";
import { 
  MoreVertical, 
  RefreshCcw, 
  LogOut, 
  Loader2, 
  AlertTriangle 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface BriefingActionsMenuProps {
  sessionId: string;
  isOwner: boolean;
  isOnboarding: boolean;
}

export function BriefingActionsMenu({ isOwner, isOnboarding }: Omit<BriefingActionsMenuProps, 'sessionId'>) {
  const { sessionId, resetBriefing } = useBriefing();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/dashboard/login';
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetBriefing();
      toast.success('Briefing resetado com sucesso!');
      setShowConfirmReset(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao resetar briefing. Tente novamente.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }), 
          "shrink-0 rounded-full w-9 h-9 text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] transition-colors border border-[var(--bd)] bg-[var(--bg)] shadow-sm"
        )}>
          <MoreVertical className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-[var(--bg)] border border-[var(--bd)] shadow-xl rounded-xl p-1.5 z-[100]">
          {isOwner && (
            <DropdownMenuItem 
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Resetar Briefing</span>
            </DropdownMenuItem>
          )}
          
          {isOnboarding && (
            <>
              {isOwner && <DropdownMenuSeparator className="bg-[var(--bd)] my-1" />}
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text)] focus:text-[var(--text)] focus:bg-[var(--bg2)] rounded-lg cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da conta</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Manual Dialog Portal (to avoid z-index/transform issues in the wizard) */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[var(--bg)] border border-[var(--bd)] rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h4 className="text-xl font-bold text-[var(--text)] mb-3">Reiniciar Briefing?</h4>
            <p className="text-sm text-[var(--text2)] mb-8 leading-relaxed">
              Isso apagará todo o diálogo atual com a IA. As informações da sua empresa serão preservadas, mas você começará a conversa do zero.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="destructive" 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-2xl shadow-md transition-all active:scale-[0.98]"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Resetando...
                  </>
                ) : (
                  'Sim, Resetar Tudo'
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] font-medium h-12 rounded-2xl transition-all"
                onClick={() => setShowConfirmReset(false)}
                disabled={isResetting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

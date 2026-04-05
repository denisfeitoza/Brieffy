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
  const { sessionId } = useBriefing();
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
      const res = await fetch(`/api/sessions/${sessionId}/reset`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Falha ao resetar briefing');

      toast.success('Briefing resetado com sucesso!');
      
      // Reload current page to start over
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao resetar briefing. Tente novamente.');
    } finally {
      setIsResetting(false);
      setShowConfirmReset(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }), 
          "shrink-0 rounded-full w-9 h-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200 bg-white shadow-sm"
        )}>
          <MoreVertical className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-xl rounded-xl p-1.5 z-[100]">
          {isOwner && (
            <DropdownMenuItem 
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg cursor-pointer transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Resetar Briefing</span>
            </DropdownMenuItem>
          )}
          
          {isOnboarding && (
            <>
              {isOwner && <DropdownMenuSeparator className="bg-gray-100 my-1" />}
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 focus:text-gray-900 focus:bg-gray-50 rounded-lg cursor-pointer transition-colors"
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
          <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h4 className="text-xl font-bold text-gray-900 mb-3">Reiniciar Briefing?</h4>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
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
                className="w-full text-gray-500 hover:text-gray-700 font-medium h-12 rounded-2xl transition-all"
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

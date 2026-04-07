"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDashboardLanguage } from '@/i18n/DashboardLanguageContext';

interface DeleteTemplateButtonProps {
  templateId: string;
  templateName: string;
  hasSession?: boolean;
}

export function DeleteTemplateButton({ templateId, templateName, hasSession }: DeleteTemplateButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { language } = useDashboardLanguage();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao deletar briefing');
      }

      toast.success(
        language === 'pt' ? 'Briefing apagado com sucesso!' : 
        language === 'es' ? '¡Briefing eliminado con éxito!' : 
        'Briefing deleted successfully!'
      );
      
      // Navigate to templates list and refresh to reflect deletion
      router.push('/dashboard/templates');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        language === 'pt' ? 'Erro ao apagar briefing. Tente novamente.' : 
        language === 'es' ? 'Error al eliminar el briefing.' : 
        'Error deleting briefing.'
      );
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        className="text-[var(--text3)] hover:text-red-500 hover:bg-red-50/10 flex-shrink-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        disabled={isDeleting}
        title={language === 'pt' ? 'Apagar Briefing' : language === 'es' ? 'Eliminar Briefing' : 'Delete Briefing'}
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div 
            className="bg-[var(--bg)] border border-[var(--bd)] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold text-[var(--text)] mb-2">
              {language === 'pt' ? 'Apagar Briefing?' : language === 'es' ? '¿Eliminar Briefing?' : 'Delete Briefing?'}
            </h4>
            <p className="text-sm text-[var(--text3)] mb-2">
              <span className="font-semibold text-[var(--text)]">{templateName}</span>
            </p>
            <p className="text-sm text-[var(--text3)] mb-6">
              {hasSession
                ? (language === 'pt' 
                    ? 'Esta ação irá apagar o briefing e todas as sessões vinculadas. Isso não pode ser desfeito.' 
                    : language === 'es' 
                    ? 'Esta acción eliminará el briefing y todas las sesiones vinculadas. No se puede deshacer.'
                    : 'This action will delete the briefing and all linked sessions. This cannot be undone.')
                : (language === 'pt' 
                    ? 'Esta ação não pode ser desfeita.' 
                    : language === 'es' 
                    ? 'Esta acción no se puede deshacer.'
                    : 'This action cannot be undone.')
              }
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent border-[var(--bd)] text-[var(--text)]"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
              >
                {language === 'pt' ? 'Cancelar' : language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'pt' ? 'Sim, Apagar' : language === 'es' ? 'Sí, Eliminar' : 'Yes, Delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

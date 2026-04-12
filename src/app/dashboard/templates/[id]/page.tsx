import { getTemplateById, getSessionsByTemplate } from '@/lib/services/briefingService';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Wand2 } from 'lucide-react';

import { DeleteTemplateButton } from '@/components/dashboard/DeleteTemplateButton';

export const dynamic = 'force-dynamic';

export default async function TemplateDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const sessions = await getSessionsByTemplate(id);

  // If there are sessions, bypass management and go directly to the most recent Briefing Details
  if (sessions && sessions.length > 0) {
    redirect(`/dashboard/${sessions[0].id}`);
  }

  // If there are no sessions, we need to show a fallback UI so they can generate one
  const template = await getTemplateById(id);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/templates">
          <Button variant="ghost" className="w-fit text-[var(--text3)] hover:text-[var(--text)] -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Meus Briefings
          </Button>
        </Link>
        
        <div className="w-full flex flex-col items-center justify-center py-24 px-6 border border-dashed border-[var(--bd-strong)] rounded-3xl bg-[var(--bg2)] text-center">
          <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center mb-6 border border-[var(--bd)]">
            <Sparkles className="w-8 h-8 text-[var(--text3)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text)] mb-2">{template.name}</h3>
          <p className="text-[var(--text3)] max-w-sm mb-8">
            Este rascunho de briefing está salvo. Continue a configuração para escolher a IA e gerar o link.
          </p>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/templates/new?templateId=${template.id}`}>
              <Button className="bg-[var(--actext)] text-black hover:bg-[var(--actext)]/90 flex items-center gap-2 rounded-full px-5">
                <Wand2 className="w-4 h-4" />
                Continuar Configuração
              </Button>
            </Link>
            <DeleteTemplateButton 
              templateId={template.id} 
              templateName={template.name} 
              hasSession={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

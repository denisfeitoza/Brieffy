import Link from 'next/link';
import { Sparkles, FileText, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTemplates } from '@/lib/services/briefingService';
import { GenerateLinkModal } from '@/components/dashboard/GenerateLinkModal';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            Meus Briefings
          </h2>
          <p className="text-zinc-400 mt-2 font-medium max-w-xl text-sm md:text-base">
            Configure motores de IA para conduzir briefings inteligentes com seus clientes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/templates/new">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl h-11 px-6 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Briefing
            </Button>
          </Link>
        </div>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 mb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div 
              key={template.id} 
              className="group relative flex flex-col p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-cyan-500/30 backdrop-blur-md overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-950/50 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
              </div>

              {/* Name */}
              <h3 className="text-lg font-bold text-white mb-1.5 leading-tight">
                {template.name}
              </h3>
              
              {/* Purpose Preview */}
              {template.briefing_purpose && (
                <div className="flex items-start gap-1.5 mt-2">
                  <Target className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {template.briefing_purpose}
                  </p>
                </div>
              )}
              
              {/* Depth Signals */}
              {template.depth_signals && template.depth_signals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {template.depth_signals.slice(0, 3).map((signal: string) => (
                    <span key={signal} className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/8 text-amber-400/70 border border-amber-500/15">
                      {signal}
                    </span>
                  ))}
                  {template.depth_signals.length > 3 && (
                    <span className="text-[10px] text-zinc-600 self-center">+{template.depth_signals.length - 3}</span>
                  )}
                </div>
              )}

              {/* Generate Link Action */}
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <GenerateLinkModal templateId={template.id} templateName={template.name} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center py-24 px-6 border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/50 text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum Briefing Criado</h3>
          <p className="text-zinc-500 max-w-sm mb-8">
            Você ainda não possui nenhum briefing configurado. Crie um para a IA conduzir o preenchimento com seus clientes.
          </p>
          <Link href="/dashboard/templates/new">
            <Button className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl h-11 px-6">
              <Plus className="w-4 h-4 mr-2" />
              Criar o Primeiro
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

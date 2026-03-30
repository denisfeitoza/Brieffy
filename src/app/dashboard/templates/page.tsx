import Link from 'next/link';
import { Sparkles, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTemplates } from '@/lib/services/briefingService';
import { GenerateLinkModal } from '@/components/dashboard/GenerateLinkModal';

// Disable caching so new templates appear immediately 
export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            Meus Briefings
          </h2>
          <p className="text-zinc-400 mt-2 font-medium max-w-xl">
            Crie roteiros e motores de extração personalizados para a IA conduzir os clientes.
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
              className="group relative flex flex-col p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-cyan-500/30 backdrop-blur-md overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-950/50 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                  {template.category}
                </div>
              </div>

              {/* Identifier */}
              <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                {template.name}
              </h3>
              
              <p className="text-sm text-zinc-400 line-clamp-2 mt-2">
                Objetivos: {template.objectives.length} 
                <br/>
                Campos Basais: {template.core_fields.length}
              </p>

              {/* Botão de Gerar Link do formulário interativo oculto */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
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
            Você ainda não possui nenhum briefing configurado. Crie um modelo base para a IA conduzir seus clientes.
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

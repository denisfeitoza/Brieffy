'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    objectives: '',
    core_fields: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Parse comma separated values into arrays
    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim() || 'Geral',
      objectives: formData.objectives.split(',').map(s => s.trim()).filter(Boolean),
      core_fields: formData.core_fields.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (!payload.name) {
      setError("O nome do briefing é obrigatório");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Falha ao salvar briefing');

      // Redirect back to templates page
      router.push('/dashboard/templates');
      router.refresh();
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao criar.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/dashboard/templates" className="inline-flex items-center text-sm font-medium text-cyan-500 hover:text-cyan-400 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para lista
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            Criar Novo Briefing
          </h2>
          <p className="text-zinc-400 mt-2 font-medium max-w-xl">
            Estruture o motor do agente de Briefing. Defina quais objetivos de expansão a IA terá.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-3xl p-6 lg:p-10 space-y-8 shadow-2xl">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
             <label className="text-sm font-semibold text-zinc-300">Nome do Formulário</label>
             <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Identidade Visual Mágica" 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 h-12 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-medium"
                required
             />
          </div>
          <div className="space-y-3">
             <label className="text-sm font-semibold text-zinc-300">Categoria Principal</label>
             <input 
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Ex: branding" 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 h-12 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-medium"
             />
          </div>
        </div>

        {/* AI Logical Guidance */}
        <div className="p-6 border border-cyan-500/10 bg-cyan-950/20 rounded-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Cérebro da IA (Extração)</h3>
          </div>

          <div className="space-y-3 relative z-10">
             <label className="text-sm font-semibold text-zinc-300">Objetivos Essenciais (Separados por vírgula)</label>
             <p className="text-xs text-zinc-500">O que a IA deve FORÇAR para extrair? (ex: &quot;definir publico alvo&quot;, &quot;definir tom de voz&quot;)</p>
             <textarea 
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                placeholder="Ex: extrair maturidade de trafego, identificar faturamento..." 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-medium resize-y min-h-[100px]"
             />
          </div>
          
          <div className="space-y-3 relative z-10">
             <label className="text-sm font-semibold text-zinc-300">Campos Basais Iniciais (Separados por vírgula)</label>
             <p className="text-xs text-zinc-500">Quais informações básicas do cliente devemos ter desde o começo? (ex: &quot;nome da empresa&quot;, &quot;o que faz&quot;)</p>
             <textarea 
                name="core_fields"
                value={formData.core_fields}
                onChange={handleChange}
                placeholder="Ex: nome, idade, faturamento mensal" 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-medium resize-y min-h-[100px]"
             />
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black font-bold h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isSubmitting ? 'Salvando Briefing...' : 'Salvar Motor Inteligente'}
          </Button>
        </div>

      </form>

    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Share2, CheckCircle2, Copy, Package, Brain, Palette, Cpu,
  Megaphone, Headphones, DollarSign, Users, TrendingUp, Truck,
  Lightbulb, Shield, Server, ShoppingCart, Video,
  ChevronDown, Wand2, Sparkles, Link2, Lock, Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, React.ElementType> = {
  Palette, Brain, Cpu, Megaphone, Headphones, DollarSign, Users,
  TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, Package,
};

// Department color map
const DEPT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  branding:   { bg: 'bg-violet-500/8',  border: 'border-violet-500/20', text: 'text-violet-400', glow: 'shadow-violet-500/10' },
  technology: { bg: 'bg-cyan-500/8',    border: 'border-cyan-500/20',   text: 'text-cyan-400',   glow: 'shadow-cyan-500/10' },
  marketing:  { bg: 'bg-orange-500/8',  border: 'border-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/10' },
  operations: { bg: 'bg-emerald-500/8', border: 'border-emerald-500/20',text: 'text-emerald-400',glow: 'shadow-emerald-500/10' },
  finance:    { bg: 'bg-yellow-500/8',  border: 'border-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/10' },
  people:     { bg: 'bg-pink-500/8',    border: 'border-pink-500/20',   text: 'text-pink-400',   glow: 'shadow-pink-500/10' },
  commercial: { bg: 'bg-blue-500/8',    border: 'border-blue-500/20',   text: 'text-blue-400',   glow: 'shadow-blue-500/10' },
  product:    { bg: 'bg-teal-500/8',    border: 'border-teal-500/20',   text: 'text-teal-400',   glow: 'shadow-teal-500/10' },
  legal:      { bg: 'bg-slate-500/8',   border: 'border-slate-500/20',  text: 'text-slate-400',  glow: 'shadow-slate-500/10' },
  digital:    { bg: 'bg-fuchsia-500/8', border: 'border-fuchsia-500/20',text: 'text-fuchsia-400',glow: 'shadow-fuchsia-500/10' },
  content:    { bg: 'bg-lime-500/8',    border: 'border-lime-500/20',   text: 'text-lime-400',   glow: 'shadow-lime-500/10' },
  general:    { bg: 'bg-zinc-500/8',    border: 'border-zinc-500/20',   text: 'text-zinc-400',   glow: 'shadow-zinc-500/10' },
};

const DEPT_LABELS: Record<string, string> = {
  branding: '🎨 Branding',
  technology: '⚙️ Tecnologia',
  marketing: '📊 Marketing',
  operations: '🔄 Operações',
  finance: '💰 Finanças',
  people: '👥 Pessoas',
  commercial: '📈 Comercial',
  product: '💡 Produto',
  legal: '🛡️ Jurídico',
  digital: '🛒 Digital',
  content: '🎬 Conteúdo',
  general: '📦 Geral',
};

interface CategoryPackage {
  slug: string;
  name: string;
  description: string;
  icon: string;
  max_questions: number | null;
  is_default_enabled: boolean;
  sort_order: number;
  department: string;
}

interface GenerateLinkModalProps {
  templateId: string;
  templateName: string;
}

export function GenerateLinkModal({ templateId, templateName }: GenerateLinkModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'create' | 'done'>('create');

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [initialContext, setInitialContext] = useState('');
  const [editPassphrase, setEditPassphrase] = useState('');
  const [showContext, setShowContext] = useState(false);

  // Package state
  const [packages, setPackages] = useState<CategoryPackage[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [aiSuggestedSlugs, setAiSuggestedSlugs] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Result state
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch packages on open
  useEffect(() => {
    if (open) {
      if (packages.length === 0) fetchPackages();
      if (!editPassphrase) generateCoolPassphrase();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const generateCoolPassphrase = () => {
    const words = [
      "azul", "sol", "luz", "mar", "rio", "som", "flor", "dia", "mel",
      "ceu", "lua", "cor", "fim", "paz", "voo", "voz", "bom", "eco",
      "neon", "zen", "nova", "fox", "leo", "max", "pro", "apex", "astro",
    ];
    const newPassphrase = Array.from({ length: 4 }, () =>
      words[Math.floor(Math.random() * words.length)]
    ).join("-");
    setEditPassphrase(newPassphrase);
  };

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await fetch('/api/briefing/packages');
      const data = await res.json();
      setPackages(data || []);
      // Pre-select default-enabled packages
      const defaults = (data || [])
        .filter((p: CategoryPackage) => p.is_default_enabled)
        .map((p: CategoryPackage) => p.slug);
      setSelectedSlugs(defaults);
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setStep('create');
        setSessionName('');
        setInitialContext('');
        setEditPassphrase('');
        setGeneratedLink('');
        setCopied(false);
        setShowContext(false);
        setAiSuggestedSlugs([]);
        setAiReasoning('');
        const defaults = packages
          .filter(p => p.is_default_enabled)
          .map(p => p.slug);
        setSelectedSlugs(defaults);
      }, 300);
    }
  };

  const togglePackage = (slug: string) => {
    setSelectedSlugs(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    );
  };

  const suggestPackages = useCallback(async () => {
    if (!initialContext.trim() || isSuggesting) return;
    setIsSuggesting(true);
    try {
      const res = await fetch('/api/briefing/suggest-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialContext: initialContext.trim() }),
      });
      const data = await res.json();
      if (data.suggested_slugs && data.suggested_slugs.length > 0) {
        setAiSuggestedSlugs(data.suggested_slugs);
        setAiReasoning(data.reasoning || '');
        // Merge AI suggestions with current selection (add, don't remove)
        setSelectedSlugs(prev => {
          const merged = new Set([...prev, ...data.suggested_slugs]);
          return [...merged];
        });
      }
    } catch (err) {
      console.error('Error suggesting packages:', err);
    } finally {
      setIsSuggesting(false);
    }
  }, [initialContext, isSuggesting]);

  const totalQuestions = selectedSlugs.reduce((sum, slug) => {
    const pkg = packages.find(p => p.slug === slug);
    if (!pkg || pkg.max_questions === null) return sum;
    return sum + (pkg.max_questions || 0);
  }, 0);

  const hasUnlimited = selectedSlugs.some(slug => {
    const pkg = packages.find(p => p.slug === slug);
    return pkg?.max_questions === null;
  });

  const generateSession = async () => {
    if (!sessionName.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('briefing_sessions')
        .insert([{
          template_id: templateId,
          session_name: sessionName.trim(),
          initial_context: initialContext.trim() || null,
          selected_packages: selectedSlugs,
          edit_passphrase: editPassphrase.trim() || null,
          status: 'pending',
          user_id: user?.id || null,
        }])
        .select('id')
        .single();

      if (error) throw error;

      const host = window.location.origin;
      const link = `${host}/b/${data.id}`;
      setGeneratedLink(link);
      setStep('done');
    } catch (err) {
      console.error('Erro ao gerar link:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = `🔗 Link do Briefing:
${generatedLink}

🔑 Palavra-chave: ${editPassphrase}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Group packages by department
  const groupedPackages = packages.reduce((acc, pkg) => {
    const dept = pkg.department || 'general';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(pkg);
    return acc;
  }, {} as Record<string, CategoryPackage[]>);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 px-3">
            <Share2 className="w-4 h-4 mr-2" />
            Gerar Link
          </Button>
        }
      />

      <DialogContent className={`bg-zinc-950/95 backdrop-blur-xl border-white/10 text-white transition-all duration-500 overflow-hidden ${
        step === 'create' ? 'sm:max-w-[780px]' : 'sm:max-w-[460px]'
      }`}>

        {/* ========== STEP 1: CREATE (Unified) ========== */}
        {step === 'create' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                Nova Sessão de Briefing
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Motor inteligente: <strong className="text-cyan-400">{templateName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[65vh] pr-1 -mr-1 space-y-5 py-2 custom-scrollbar">

              {/* ── Session Name ─────────────────────────────────── */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-xs font-bold text-zinc-400">1</span>
                  Nome da Sessão <span className="text-red-400 text-xs">*</span>
                </label>
                <Input
                  placeholder="Ex: Acme Corp — Rebrand 2026"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="bg-black/40 border-white/10 focus-visible:ring-cyan-500/40 h-12 text-base rounded-xl placeholder:text-zinc-600"
                />
              </div>

              {/* ── Context (Collapsible) ────────────────────────── */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors w-full"
                >
                  <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-xs font-bold text-zinc-400">2</span>
                  Contexto Prévio
                  <span className="text-zinc-600 text-xs font-normal">(opcional)</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 ml-auto transition-transform duration-300 ${showContext ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showContext && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        <Textarea
                          placeholder="O que você já sabe sobre essa empresa? A IA vai usar isso para adaptar as perguntas…"
                          value={initialContext}
                          onChange={(e) => setInitialContext(e.target.value)}
                          className="bg-black/40 border-white/10 min-h-[90px] focus-visible:ring-cyan-500/40 rounded-xl resize-y placeholder:text-zinc-600 text-sm"
                        />
                        {initialContext.trim() && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={suggestPackages}
                              disabled={isSuggesting}
                              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-xs gap-1.5 h-8 rounded-lg"
                            >
                              {isSuggesting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Wand2 className="w-3 h-3" />
                              )}
                              {isSuggesting ? 'Analisando...' : '✨ Deixar IA sugerir pacotes'}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── AI Reasoning Feedback ─────────────────────────── */}
              <AnimatePresence>
                {aiReasoning && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-200/90 italic leading-relaxed">{aiReasoning}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Package Selection ─────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-xs font-bold text-zinc-400">3</span>
                    Pacotes de IA
                  </label>
                  {selectedSlugs.length > 0 && (
                    <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-2">
                      <span className="text-cyan-400 font-semibold">{selectedSlugs.length}</span> selecionados
                      <span className="text-zinc-600">·</span>
                      ~<span className="text-zinc-300 font-semibold">{totalQuestions}</span>{hasUnlimited ? '+∞' : ''} perguntas
                    </span>
                  )}
                </div>

                {loadingPackages ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPackages).map(([dept, pkgs]) => (
                      <div key={dept}>
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-600 mb-2 px-0.5">
                          {DEPT_LABELS[dept] || dept}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {pkgs.map((pkg) => {
                            const isSelected = selectedSlugs.includes(pkg.slug);
                            const isAiSuggested = aiSuggestedSlugs.includes(pkg.slug);
                            const IconComp = ICON_MAP[pkg.icon] || Package;
                            const colors = DEPT_COLORS[dept] || DEPT_COLORS.general;

                            return (
                              <motion.button
                                key={pkg.slug}
                                onClick={() => togglePackage(pkg.slug)}
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                className={`
                                  relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                                  border group cursor-pointer outline-none
                                  ${isSelected
                                    ? `${colors.bg} ${colors.border} shadow-md ${colors.glow}`
                                    : 'border-zinc-800/40 bg-zinc-900/30 hover:border-zinc-700/60 hover:bg-zinc-900/50'
                                  }
                                `}
                              >
                                {/* Checkbox */}
                                <div className={`
                                  w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200
                                  ${isSelected
                                    ? 'border-cyan-400/80 bg-cyan-500/20'
                                    : 'border-zinc-700 bg-zinc-800/50 group-hover:border-zinc-600'
                                  }
                                `}>
                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                                </div>

                                {/* Icon */}
                                <div className={`
                                  w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                  ${isSelected ? 'bg-white/8' : 'bg-zinc-800/60'}
                                `}>
                                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? colors.text : 'text-zinc-500'}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                      {pkg.name}
                                    </span>
                                    {isAiSuggested && (
                                      <span className="shrink-0 text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                                        IA
                                      </span>
                                    )}
                                    {pkg.is_default_enabled && !isAiSuggested && (
                                      <span className="shrink-0 text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                                        ON
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 leading-snug">
                                    {pkg.description}
                                  </p>
                                </div>

                                {/* Question count */}
                                <span className="text-[9px] font-mono text-zinc-600 shrink-0">
                                  {pkg.max_questions === null ? '∞' : `≤${pkg.max_questions}`}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Passphrase ────────────────────────────────────── */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-xs font-bold text-zinc-400">4</span>
                    Senha do Documento
                  </label>
                  <button
                    type="button"
                    onClick={generateCoolPassphrase}
                    className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    Gerar outra
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                  <Input
                    value={editPassphrase}
                    onChange={(e) => setEditPassphrase(e.target.value)}
                    className="bg-black/40 border-white/10 focus-visible:ring-cyan-500/40 h-11 font-mono text-sm rounded-xl pl-10 placeholder:text-zinc-600"
                    placeholder="sol-mar-luz-paz"
                  />
                </div>
              </div>
            </div>

            {/* ── CTA ─────────────────────────────────────────────── */}
            <div className="pt-3 border-t border-white/5">
              <Button
                onClick={generateSession}
                disabled={loading || !sessionName.trim() || selectedSlugs.length === 0}
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_4px_20px_rgba(6,182,212,0.25)] hover:shadow-[0_4px_30px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-40 disabled:shadow-none gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Preparando IA...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Gerar Link ({selectedSlugs.length} pacotes)
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* ========== STEP 2: DONE ========== */}
        {step === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col items-center justify-center py-4 space-y-5">
              {/* Success Icon */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-cyan-400/20 blur-xl animate-pulse" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg text-white">Sessão Criada! ✨</h3>
                <p className="text-sm text-zinc-400 max-w-[280px]">
                  Envie o link e a senha para o cliente iniciar.
                </p>
              </div>

              {/* Link Field */}
              <div className="w-full flex items-center gap-2 p-2 bg-black/40 border border-white/10 rounded-xl">
                <Input
                  value={generatedLink}
                  readOnly
                  className="bg-transparent border-none focus-visible:ring-0 text-zinc-300 text-xs h-8 font-mono"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="secondary"
                  size="sm"
                  className={`rounded-lg shrink-0 gap-1.5 text-xs transition-all ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>

              {/* Passphrase Display */}
              <div className="w-full flex flex-col items-center p-4 bg-gradient-to-b from-zinc-900/50 to-zinc-950/50 border border-white/5 rounded-xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lock className="w-3 h-3 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-[0.15em] font-bold">
                    Palavra-Chave
                  </span>
                </div>
                <span className="text-xl font-mono font-bold text-cyan-400 tracking-wider">
                  {editPassphrase}
                </span>
                <p className="text-[10px] text-zinc-600 text-center mt-2 max-w-[250px] leading-relaxed">
                  O cliente usará esta senha para acessar e editar o documento final.
                </p>
              </div>

              {/* Close */}
              <Button
                variant="outline"
                className="w-full border-white/10 text-zinc-300 hover:bg-white/5 rounded-xl h-10"
                onClick={() => setOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

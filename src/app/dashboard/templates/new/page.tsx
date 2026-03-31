'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowLeft, ArrowRight, Loader2, Target, Plus, X,
  CheckCircle2, Copy, Lock, Wand2, Link2, Package, Share2,
  Brain, Palette, Cpu, Megaphone, Headphones, DollarSign,
  Users, TrendingUp, Truck, Lightbulb, Shield, Server,
  ShoppingCart, Video, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// ─── Icon + Color Maps ──────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Palette, Brain, Cpu, Megaphone, Headphones, DollarSign, Users,
  TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, Package,
};

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
  branding: '🎨 Branding', technology: '⚙️ Tecnologia', marketing: '📊 Marketing',
  operations: '🔄 Operações', finance: '💰 Finanças', people: '👥 Pessoas',
  commercial: '📈 Comercial', product: '💡 Produto', legal: '🛡️ Jurídico',
  digital: '🛒 Digital', content: '🎬 Conteúdo', general: '📦 Geral',
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

// ─── Passphrase Generator ───────────────────────────────────────
function generatePassphrase(): string {
  const words = [
    "aurora","cristal","nebula","prisma","zenith","cosmos","atlas",
    "vortex","pulsar","fenix","orion","tesla","helix","quasar",
    "nexus","titan","omega","zephyr","stratos","mythos","vertex",
    "photon","cypher","matrix","cipher","arctic","ember","storm",
    "cobalt","onyx","velvet","ivory","prism","spark","bloom",
    "drift","forge","haven","crest","summit","vapor","jade",
  ];
  return words[Math.floor(Math.random() * words.length)];
}

// ─── Step Indicator ─────────────────────────────────────────────
function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Descreva" },
    { n: 2, label: "Revise" },
    { n: 3, label: "Pronto!" },
  ];
  return (
    <div className="flex items-center gap-1 w-full max-w-xs mx-auto">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className={`
            flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-500 shrink-0
            ${current >= s.n
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/50'
            }
          `}>
            {current > s.n ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
          </div>
          <span className={`text-[10px] ml-1.5 font-medium hidden sm:block ${
            current >= s.n ? 'text-zinc-300' : 'text-zinc-600'
          }`}>{s.label}</span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 transition-colors duration-500 ${
              current > s.n ? 'bg-cyan-500/40' : 'bg-zinc-800'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function NewBriefingWizard() {
  const router = useRouter();
  
  // ── Wizard Step ─────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // ── Step 1: Describe ────────────
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [newSignal, setNewSignal] = useState('');
  const [depthSignals, setDepthSignals] = useState<string[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [initialContext, setInitialContext] = useState('');
  
  // ── Step 2: Packages ────────────
  const [packages, setPackages] = useState<CategoryPackage[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [aiSuggestedSlugs, setAiSuggestedSlugs] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState('');
  const [editPassphrase, setEditPassphrase] = useState(() => generatePassphrase());
  
  // ── Step 3: Done ────────────────
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  
  // ── Loading States ──────────────
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ── Fetch packages on mount ─────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/briefing/packages');
        const data = await res.json();
        setPackages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching packages:', err);
      }
    })();
  }, []);
  
  // ── Signal Management ───────────
  const addSignal = () => {
    const trimmed = newSignal.trim();
    if (trimmed && !depthSignals.includes(trimmed)) {
      setDepthSignals(prev => [...prev, trimmed]);
      setNewSignal('');
    }
  };
  
  const removeSignal = (signal: string) => {
    setDepthSignals(prev => prev.filter(s => s !== signal));
  };
  
  // ── Step 1 → 2 Transition ──────
  const handleContinueToPackages = async () => {
    if (!name.trim()) {
      setError('O nome do briefing é obrigatório.');
      return;
    }
    if (!purpose.trim()) {
      setError('O propósito é obrigatório. Descreva o que a IA precisa descobrir.');
      return;
    }
    setError(null);
    setIsTransitioning(true);
    
    try {
      // 1. Save template
      const templateRes = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: 'Geral',
          objectives: [],
          core_fields: [],
          briefing_purpose: purpose.trim(),
          depth_signals: depthSignals,
        }),
      });
      
      if (!templateRes.ok) {
        const errData = await templateRes.json();
        throw new Error(errData.error || 'Falha ao salvar briefing');
      }
      
      const templateData = await templateRes.json();
      const templateId = templateData.data?.id;
      
      if (!templateId) throw new Error('Template criado mas sem ID');
      
      // Store template ID for step 2
      setCreatedTemplateId(templateId);
      
      // 2. Ask AI to suggest packages
      const suggestRes = await fetch('/api/briefing/suggest-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefingPurpose: purpose.trim(),
          initialContext: initialContext.trim() || undefined,
          depthSignals: depthSignals.length > 0 ? depthSignals : undefined,
        }),
      });
      
      const suggestData = await suggestRes.json();
      
      // Pre-select: AI suggestions + defaults
      const defaultSlugs = packages
        .filter(p => p.is_default_enabled)
        .map(p => p.slug);
      const aiSlugs = suggestData.suggested_slugs || [];
      const merged = [...new Set([...defaultSlugs, ...aiSlugs])];
      
      setAiSuggestedSlugs(aiSlugs);
      setAiReasoning(suggestData.reasoning || '');
      setSelectedSlugs(merged);
      
      // Advance to step 2
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setIsTransitioning(false);
    }
  };
  
  // Store created template ID between steps
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);
  
  // ── Toggle Package ──────────────
  const togglePackage = (slug: string) => {
    setSelectedSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };
  
  // ── Generate Session + Link ─────
  const handleGenerateLink = async () => {
    if (!createdTemplateId || selectedSlugs.length === 0) return;
    setIsGenerating(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: dbError } = await supabase
        .from('briefing_sessions')
        .insert([{
          template_id: createdTemplateId,
          session_name: name.trim(),
          initial_context: initialContext.trim() || null,
          selected_packages: selectedSlugs,
          edit_passphrase: editPassphrase.trim() || undefined,
          status: 'pending',
          user_id: user?.id || null,
        }])
        .select('id')
        .single();
      
      if (dbError) throw dbError;
      
      const host = window.location.origin;
      setGeneratedLink(`${host}/b/${data.id}`);
      setStep(3);
    } catch (err) {
      console.error('Error generating session:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar link');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // ── Copy Link (only link) ───────
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [generatedLink]);
  
  // ── Share (link + passphrase) ───
  const [shared, setShared] = useState(false);
  const shareAll = useCallback(() => {
    const text = `🔗 Link do Briefing:\n${generatedLink}\n\n🔑 Senha: ${editPassphrase}`;
    navigator.clipboard.writeText(text);
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  }, [generatedLink, editPassphrase]);
  
  // ── Computed ────────────────────
  const groupedPackages = packages.reduce((acc, pkg) => {
    const dept = pkg.department || 'general';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(pkg);
    return acc;
  }, {} as Record<string, CategoryPackage[]>);
  
  const totalQuestions = selectedSlugs.reduce((sum, slug) => {
    const pkg = packages.find(p => p.slug === slug);
    return pkg?.max_questions ? sum + pkg.max_questions : sum;
  }, 0);
  
  const hasUnlimited = selectedSlugs.some(slug =>
    packages.find(p => p.slug === slug)?.max_questions === null
  );
  
  // ── Transition variants ─────────
  const pageVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/templates"
          className="inline-flex items-center text-sm font-medium text-cyan-500 hover:text-cyan-400 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
              Criar Briefing
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Configure o que a IA deve explorar e gere o link para seu cliente.
            </p>
          </div>
          <StepProgress current={step} />
        </div>
      </div>
      
      {/* ── Error Banner ──────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── Steps Container ───────────────────────────────── */}
      <AnimatePresence mode="wait">
        
        {/* ═══════════════ STEP 1: DESCRIBE ═══════════════ */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-5 sm:p-8 space-y-7">
              
              {/* ── Name ──────────────────────── */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-zinc-200">
                  Nome do Briefing <span className="text-red-400">*</span>
                </label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Rebrand Acme Corp 2026"
                  className="bg-black/40 border-white/10 focus-visible:ring-cyan-500/40 h-12 text-base rounded-xl placeholder:text-zinc-600"
                />
              </div>
              
              {/* ── Purpose ───────────────────── */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-zinc-200">
                      O que você precisa descobrir? <span className="text-red-400">*</span>
                    </label>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      A IA vai usar isso como bússola para guiar toda a conversa.
                    </p>
                  </div>
                </div>
                <Textarea
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Ex: Entender a identidade atual da marca, o público-alvo e os planos de crescimento para redesenhar o posicionamento visual."
                  className="bg-black/40 border-white/10 focus-visible:ring-indigo-500/30 rounded-xl resize-y min-h-[100px] placeholder:text-zinc-600 text-sm leading-relaxed"
                />
              </div>
              
              {/* ── Sensitive Points (Depth Signals) ── */}
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-zinc-200">
                      Pontos Sensíveis <span className="text-zinc-600 font-normal">(opcional)</span>
                    </label>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Temas que a IA deve explorar com cuidado e atenção extra.
                    </p>
                  </div>
                </div>
                
                {/* Tags */}
                {depthSignals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {depthSignals.map(signal => (
                      <span
                        key={signal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs font-medium"
                      >
                        {signal}
                        <button
                          type="button"
                          onClick={() => removeSignal(signal)}
                          className="text-amber-500/60 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Add input */}
                <div className="flex gap-2">
                  <Input
                    value={newSignal}
                    onChange={e => setNewSignal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSignal(); } }}
                    placeholder="Ex: resistência a preço, insatisfação com marca atual"
                    className="bg-black/40 border-white/10 focus-visible:ring-amber-500/30 h-10 rounded-xl text-sm placeholder:text-zinc-600"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSignal}
                    disabled={!newSignal.trim()}
                    className="h-10 px-3 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 rounded-xl shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* ── Context (Collapsible) ────── */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors w-full"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0">
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 ${showContext ? 'rotate-180' : ''}`} />
                  </div>
                  Contexto Prévio
                  <span className="text-zinc-600 text-xs font-normal">(opcional)</span>
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
                      <Textarea
                        value={initialContext}
                        onChange={e => setInitialContext(e.target.value)}
                        placeholder="O que você já sabe sobre esse cliente? A IA vai usar isso para adaptar as perguntas..."
                        className="bg-black/40 border-white/10 focus-visible:ring-cyan-500/30 rounded-xl resize-y min-h-[80px] placeholder:text-zinc-600 text-sm"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* ── Step 1 CTA ──────────────────── */}
            <Button
              onClick={handleContinueToPackages}
              disabled={isTransitioning || !name.trim() || !purpose.trim()}
              className="w-full h-13 text-base font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_4px_20px_rgba(6,182,212,0.2)] hover:shadow-[0_4px_30px_rgba(6,182,212,0.35)] transition-all duration-300 disabled:opacity-40 disabled:shadow-none gap-2"
            >
              {isTransitioning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  A IA está analisando...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </motion.div>
        )}
        
        {/* ═══════════════ STEP 2: REVIEW SKILLS ═══════════════ */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-5 sm:p-8 space-y-6">
              
              {/* Header */}
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Skills da IA
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  A IA selecionou as skills mais relevantes para o seu briefing. Toque para ajustar.
                </p>
              </div>
              
              {/* AI Reasoning */}
              <AnimatePresence>
                {aiReasoning && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/8 to-purple-500/8 border border-indigo-500/15"
                  >
                    <Wand2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-200/80 italic leading-relaxed">{aiReasoning}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Stats bar */}
              {selectedSlugs.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span><span className="text-cyan-400 font-semibold">{selectedSlugs.length}</span> skills ativas</span>
                </div>
              )}
              
              {/* Skills Grid — Clean Toggle Cards */}
              <div className="space-y-5">
                {Object.entries(groupedPackages).map(([dept, pkgs]) => (
                  <div key={dept}>
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-600 mb-2.5 px-0.5">
                      {DEPT_LABELS[dept] || dept}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pkgs.map(pkg => {
                        const isSelected = selectedSlugs.includes(pkg.slug);
                        const isAiSuggested = aiSuggestedSlugs.includes(pkg.slug);
                        const IconComp = ICON_MAP[pkg.icon] || Package;
                        const colors = DEPT_COLORS[dept] || DEPT_COLORS.general;
                        
                        return (
                          <motion.button
                            key={pkg.slug}
                            onClick={() => togglePackage(pkg.slug)}
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            className={`
                              relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200
                              border cursor-pointer outline-none
                              ${isSelected
                                ? `bg-white/[0.04] border-white/15 shadow-lg`
                                : 'border-zinc-800/30 bg-zinc-950/40 opacity-50 hover:opacity-75 hover:border-zinc-700/40'
                              }
                            `}
                          >
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                              isSelected ? `${colors.bg} ${colors.border} border` : 'bg-zinc-800/40'
                            }`}>
                              <IconComp className={`w-4 h-4 ${isSelected ? colors.text : 'text-zinc-600'}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                                  {pkg.name}
                                </span>
                                {isAiSuggested && isSelected && (
                                  <span className="shrink-0 text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">IA</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Toggle indicator */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/20'
                                : 'border-zinc-700'
                            }`}>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2.5 h-2.5 rounded-full bg-cyan-400"
                                />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* ── Passphrase ──────────────── */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    Senha do Documento
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassphrase(generatePassphrase())}
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
                    onChange={e => setEditPassphrase(e.target.value)}
                    className="bg-black/40 border-white/10 focus-visible:ring-cyan-500/40 h-11 font-mono text-sm rounded-xl pl-10 placeholder:text-zinc-600"
                    placeholder="ex: aurora"
                  />
                </div>
              </div>
            </div>
            
            {/* ── Step 2 CTAs ─────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-white/10 text-zinc-400 hover:bg-white/5 rounded-xl h-12 sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Voltar
              </Button>
              <Button
                onClick={handleGenerateLink}
                disabled={isGenerating || selectedSlugs.length === 0}
                className="flex-1 h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_4px_20px_rgba(6,182,212,0.2)] hover:shadow-[0_4px_30px_rgba(6,182,212,0.35)] transition-all duration-300 disabled:opacity-40 disabled:shadow-none gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Gerar Link ({selectedSlugs.length} skills)
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* ═══════════════ STEP 3: DONE ═══════════════ */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-10">
              <div className="flex flex-col items-center justify-center space-y-6">
                
                {/* Success Icon */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-cyan-400" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-cyan-400/15 blur-2xl animate-pulse" />
                </div>
                
                <div className="text-center space-y-1.5">
                  <h3 className="text-xl font-bold text-white">Briefing Criado! ✨</h3>
                  <p className="text-sm text-zinc-400 max-w-sm">
                    Envie o link e a palavra-chave para seu cliente iniciar o preenchimento com a IA.
                  </p>
                </div>
                
                {/* Link + Copy */}
                <div className="w-full max-w-md flex items-center gap-2 p-2 bg-black/40 border border-white/10 rounded-xl">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="bg-transparent border-none focus-visible:ring-0 text-zinc-300 text-xs h-8 font-mono"
                  />
                  <Button
                    onClick={copyLink}
                    variant="secondary"
                    size="sm"
                    className={`rounded-lg shrink-0 gap-1.5 text-xs transition-all ${
                      copied
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                    }`}
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar Link'}
                  </Button>
                </div>
                
                {/* Passphrase */}
                <div className="w-full max-w-md flex flex-col items-center p-5 bg-gradient-to-b from-zinc-900/50 to-zinc-950/50 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lock className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.15em] font-bold">Senha</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-cyan-400 tracking-wider">
                    {editPassphrase}
                  </span>
                </div>
                
                {/* Share button */}
                <Button
                  onClick={shareAll}
                  variant="outline"
                  className={`w-full max-w-md h-11 rounded-xl gap-2 transition-all ${
                    shared
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                      : 'border-white/10 text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {shared ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {shared ? 'Copiado!' : 'Compartilhar Link + Senha'}
                </Button>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/templates')}
                    className="flex-1 border-white/10 text-zinc-300 hover:bg-white/5 rounded-xl h-11"
                  >
                    Ver Meus Briefings
                  </Button>
                  <Button
                    onClick={() => {
                      setStep(1);
                      setName('');
                      setPurpose('');
                      setDepthSignals([]);
                      setInitialContext('');
                      setShowContext(false);
                      setSelectedSlugs([]);
                      setAiSuggestedSlugs([]);
                      setAiReasoning('');
                      setEditPassphrase(generatePassphrase());
                      setGeneratedLink('');
                      setCreatedTemplateId(null);
                      setError(null);
                    }}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl h-11 gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Outro
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

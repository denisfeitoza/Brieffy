'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowLeft, ArrowRight, Loader2, Target, Plus, X,
  CheckCircle2, Copy, Lock, Wand2, Link2, Package, Share2,
  Brain, Palette, Cpu, Megaphone, Headphones, DollarSign,
  Users, TrendingUp, Truck, Lightbulb, Shield, Server,
  ShoppingCart, Video, ChevronDown, ShieldCheck,
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
  branding:   { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  technology: { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  marketing:  { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  operations: { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  finance:    { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  people:     { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  commercial: { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  product:    { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  legal:      { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  digital:    { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  content:    { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
  general:    { bg: 'bg-brieffy-orange/10', border: 'border-brieffy-orange/20', text: 'text-brieffy-orange', glow: 'shadow-[0_0_20px_rgba(255,96,41,0.15)]' },
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
            flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-500 shrink-0
            ${current >= s.n
              ? 'bg-brieffy-orange text-black font-extrabold shadow-[0_0_12px_rgba(255,96,41,0.3)]'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }
          `}>
            {current > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : s.n}
          </div>
          <span className={`label-caps ml-1.5 hidden sm:block ${
            current >= s.n ? 'text-foreground' : 'text-zinc-500'
          }`}>{s.label}</span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-[1.5px] mx-2 transition-colors duration-500 ${
              current > s.n ? 'bg-brieffy-orange/40' : 'bg-zinc-200 dark:bg-zinc-800'
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
  const [showContext, setShowContext] = useState(true);
  const [showSignals, setShowSignals] = useState(false);
  const [initialContext, setInitialContext] = useState('');
  
  // ── Step 2: Packages ────────────
  const [packages, setPackages] = useState<CategoryPackage[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [aiSuggestedSlugs, setAiSuggestedSlugs] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState('');
  const [editPassphrase, setEditPassphrase] = useState(() => generatePassphrase());
  
  // ── Step 3: Done ────────────────
  const [generatedLink, setGeneratedLink] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [copied, setCopied] = useState(false);
  
  // ── Loading States ──────────────
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);
  
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
  const addSignal = (value: string = newSignal) => {
    const signals = value.split(',').map(s => s.trim()).filter(s => s !== '' && !depthSignals.includes(s));
    if (signals.length > 0) {
      setDepthSignals(prev => [...prev, ...signals]);
      setNewSignal('');
    }
  };

  const handleSignalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      addSignal(value);
    } else {
      setNewSignal(value);
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
      setSessionId(data.id);
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
    const parts = [`🔗 Link do Briefing:\n${generatedLink}`];
    if (editPassphrase) parts.push(`🔑 Senha: ${editPassphrase}`);
    const text = parts.join('\n\n');
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
          className="inline-flex items-center text-sm font-bold label-caps text-zinc-500 hover:text-brieffy-orange transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Criar <span className="text-brieffy-orange">Briefing</span>
            </h1>
            <p className="text-zinc-500 mt-1 text-sm font-medium">
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
            className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider"
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
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 sm:p-8 space-y-7">
              
              {/* ── Name ──────────────────────── */}
              <div className="space-y-2.5">
                <label className="label-caps-accent">
                  Nome do Briefing <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Rebrand Acme Corp 2026"
                  className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 focus-visible:ring-brieffy-orange/40 h-12 text-sm rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all font-medium"
                />
              </div>
              
              {/* ── Purpose ───────────────────── */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brieffy-orange/10 border border-brieffy-orange/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="w-4 h-4 text-brieffy-orange" />
                  </div>
                  <div>
                    <label className="label-caps">
                      O que você precisa descobrir? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                      A IA vai usar isso como bússola para guiar toda a conversa.
                    </p>
                  </div>
                </div>
                <Textarea
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Ex: Entender a identidade atual da marca, o público-alvo e os planos de crescimento para redesenhar o posicionamento visual."
                  className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 focus-visible:ring-brieffy-orange/30 rounded-xl resize-y min-h-[100px] placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm leading-relaxed transition-all font-medium"
                />
              </div>

              {/* ── Context (Fixed) ───────────── */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <label className="label-caps">
                      Contexto Prévio <span className="text-zinc-400 font-normal">(recomendado)</span>
                    </label>
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                      O que você já sabe sobre esse cliente? A IA adaptará as perguntas.
                    </p>
                  </div>
                </div>
                <Textarea
                  value={initialContext}
                  onChange={e => setInitialContext(e.target.value)}
                  placeholder="Ex: Já fizemos o logotipo dele em 2023, agora ele quer expandir para o digital..."
                  className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 focus-visible:ring-brieffy-orange/30 rounded-xl resize-y min-h-[100px] placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm font-medium transition-all"
                />
              </div>

              {/* ── Sensitive Points (Depth Signals) ── */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSignals(!showSignals)}
                  className="flex items-center gap-2 label-caps text-zinc-400 hover:text-foreground transition-colors w-full group"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 group-hover:border-zinc-300 dark:group-hover:border-zinc-600">
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${showSignals ? 'rotate-180' : ''}`} />
                  </div>
                  Pontos Sensíveis
                  <span className="text-zinc-400 dark:text-zinc-600 font-normal">(opcional)</span>
                </button>

                <AnimatePresence>
                  {showSignals && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden space-y-4 pt-2"
                    >
                      <div className="pl-9 space-y-1">
                        <p className="text-xs text-zinc-500 font-medium">
                          IA explorará com atenção. Digite e separe por vírgula para adicionar.
                        </p>
                        <p className="text-xs text-zinc-400 font-normal">
                          Ex: resistência a preço, insatisfação com marca atual, prazos curtos
                        </p>
                      </div>
                      
                      {/* Tags */}
                      {depthSignals.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-9">
                          {depthSignals.map(signal => (
                            <span
                              key={signal}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brieffy-orange/5 border border-brieffy-orange/20 text-brieffy-orange text-xs font-bold"
                            >
                              {signal}
                              <button
                                type="button"
                                onClick={() => removeSignal(signal)}
                                className="text-brieffy-orange/40 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="pl-9">
                        <Input
                          value={newSignal}
                          onChange={handleSignalChange}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSignal(); } }}
                          placeholder="Adicionar ponto sensível..."
                          className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 focus-visible:ring-brieffy-orange/30 h-11 rounded-xl text-sm font-medium transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* ── Step 1 CTA ──────────────────── */}
            <Button
              onClick={handleContinueToPackages}
              disabled={isTransitioning || !name.trim() || !purpose.trim()}
              className="w-full h-14 text-base font-bold rounded-full bg-brieffy-orange hover:bg-brieffy-orange/90 text-black shadow-[0_4px_20px_rgba(255,96,41,0.2)] transition-all duration-300 disabled:opacity-40 disabled:shadow-none gap-2 active:scale-[0.98]"
            >
              {isTransitioning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  ANALISANDO BRIEFING...
                </>
              ) : (
                <>
                  AVANÇAR PARA SKILLS
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
            className="space-y-6"
          >
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 sm:p-8 space-y-7">
              
              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brieffy-orange" />
                  Skills da IA
                </h2>
                <p className="text-sm font-medium text-zinc-500">
                  A IA selecionou as ferramentas ideais. Toque para personalizar.
                </p>
              </div>
              
              {/* AI Reasoning */}
              <AnimatePresence>
                {aiReasoning && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start gap-3 px-4 py-4 rounded-xl bg-brieffy-orange/[0.03] border border-brieffy-orange/10"
                  >
                    <Wand2 className="w-4 h-4 text-brieffy-orange flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed italic">
                      "{aiReasoning}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Stats & Filter Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="label-caps !text-xs text-zinc-400">Seleção:</span>
                  <span className="text-xs font-bold text-brieffy-orange bg-brieffy-orange/10 px-2 py-0.5 rounded-full border border-brieffy-orange/20">
                    {selectedSlugs.length} Ativas
                  </span>
                </div>
              </div>
              
              {/* Skills Grid */}
              <div className="space-y-6">
                {Object.entries(groupedPackages).map(([dept, pkgs]) => (
                  <div key={dept} className="space-y-3">
                    <p className="label-caps text-zinc-400 px-1">
                      {DEPT_LABELS[dept] || dept}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                            whileTap={{ scale: 0.98 }}
                            className={`
                              relative flex items-center gap-3.5 px-4 py-4 rounded-xl text-left transition-all duration-300
                              border outline-none group
                              ${isSelected
                                ? `bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 shadow-sm`
                                : 'bg-zinc-100/50 dark:bg-transparent border-zinc-100 dark:border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:border-zinc-200 dark:hover:border-white/10'
                              }
                            `}
                          >
                            {/* Icon container */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                              isSelected ? `${colors.bg} ${colors.border} border` : 'bg-zinc-200 dark:bg-zinc-800'
                            }`}>
                              <IconComp className={`w-4.5 h-4.5 ${isSelected ? colors.text : 'text-zinc-500'}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold tracking-tight transition-colors ${isSelected ? 'text-foreground' : 'text-zinc-500'}`}>
                                  {pkg.name}
                                </span>
                                {isAiSuggested && isSelected && (
                                  <span className="shrink-0 text-[10px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-brieffy-orange text-black">IA</span>
                                )}
                              </div>
                              <p className={`text-xs font-medium mt-0.5 truncate ${isSelected ? 'text-zinc-500' : 'text-zinc-600'}`}>
                                Explorar {pkg.name.toLowerCase()}
                              </p>
                            </div>
                            
                            {/* Custom Checkbox */}
                            <div className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-300 ${
                              isSelected
                                ? 'border-brieffy-orange bg-brieffy-orange'
                                : 'border-zinc-300 dark:border-zinc-700'
                            }`}>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  <CheckCircle2 className="w-4 h-4 text-black" />
                                </motion.div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* ── Password Security Section ────── */}
              <div className="pt-8 border-t border-zinc-100 dark:border-white/5 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-5 h-5 text-brieffy-orange" />
                    Segurança e Acesso
                  </h3>
                  <p className="text-sm font-medium text-zinc-500 mt-1">
                    Defina uma senha se desejar proteger o briefing. Deixe em branco para acesso direto.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Passphrase (The primary password field) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="label-caps-accent">
                        Senha do Documento
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditPassphrase(generatePassphrase())}
                        className="text-brieffy-orange hover:text-brieffy-orange/80 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <Wand2 className="w-4 h-4" />
                        Sortear Nova
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brieffy-orange transition-colors pointer-events-none" />
                      <Input
                        value={editPassphrase}
                        onChange={e => setEditPassphrase(e.target.value)}
                        className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 focus-visible:ring-brieffy-orange/40 h-13 font-mono text-base rounded-xl pl-12 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 transition-all font-bold tracking-widest"
                        placeholder="Vazio = Sem Senha"
                      />
                      {editPassphrase && (
                        <button
                          type="button"
                          onClick={() => setEditPassphrase('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ── Step 2 CTAs ─────────────────── */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="order-2 sm:order-1 h-14 border-zinc-200 dark:border-white/10 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full font-bold label-caps px-8"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleGenerateLink}
                disabled={isGenerating || selectedSlugs.length === 0}
                className="order-1 sm:order-2 flex-1 h-14 text-base font-bold rounded-full bg-brieffy-orange hover:bg-brieffy-orange/90 text-black shadow-[0_4px_20px_rgba(255,96,41,0.2)] transition-all duration-300 disabled:opacity-40 disabled:shadow-none gap-2 active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    CONSTRUINDO LINK...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    CONCLUIR E GERAR ({selectedSlugs.length} SKILLS)
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
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 sm:p-12">
              <div className="flex flex-col items-center justify-center space-y-8">
                
                {/* Success Icon */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-brieffy-orange/10 border border-brieffy-orange/30 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <CheckCircle2 className="w-12 h-12 text-brieffy-orange" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full bg-brieffy-orange/20 blur-3xl animate-pulse" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Briefing Criado! ✨</h3>
                  <p className="text-sm font-medium text-zinc-500 max-w-sm leading-relaxed mx-auto">
                    Agora é só compartilhar o link {editPassphrase ? 'e a senha' : ''} com seu cliente para começarem.
                  </p>
                </div>
                
                {/* Visual Group for Link & Password */}
                <div className="w-full max-w-lg space-y-3">
                  
                  {/* Link Card */}
                  <div className="group relative flex items-center justify-between gap-3 p-3 bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl transition-all hover:border-brieffy-orange/30">
                    <div className="flex items-center gap-3 pl-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <Link2 className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="label-caps !text-xs text-zinc-400 mb-0.5">Link do Briefing</p>
                        <p className="text-sm font-bold text-foreground truncate select-all">{generatedLink}</p>
                      </div>
                    </div>
                    <Button
                      onClick={copyLink}
                      className={`h-11 px-4 rounded-xl shrink-0 font-bold text-xs label-caps transition-all ${
                        copied
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                      }`}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                  
                  {/* Password Card (Only if defined) */}
                  {editPassphrase && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl">
                      <div className="flex items-center gap-3 pl-2 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-brieffy-orange/10 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4 text-brieffy-orange" />
                        </div>
                        <div>
                          <p className="label-caps !text-xs text-zinc-400 mb-0.5">Senha de Acesso</p>
                          <p className="text-sm font-black text-foreground tracking-widest uppercase">{editPassphrase}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Share Full Message */}
                <Button
                  onClick={shareAll}
                  className={`w-full max-w-lg h-15 rounded-full gap-3 font-bold text-base transition-all duration-300 ${
                    shared
                      ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                      : 'bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-white/10 text-foreground hover:border-brieffy-orange shadow-lg'
                  }`}
                >
                  {shared ? <CheckCircle2 className="w-5 h-5" /> : <Share2 className="w-5 h-5 text-brieffy-orange" />}
                  {shared ? 'MENSAGEM COPIADA!' : 'COPIAR MENSAGEM PARA CLIENTE'}
                </Button>
                
                {/* Footer Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/${sessionId}`)}
                    className="h-14 border-zinc-200 dark:border-white/10 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full font-bold label-caps"
                  >
                    Gerenciar Briefing
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
                    className="h-14 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 rounded-full font-bold label-caps flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Briefing
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

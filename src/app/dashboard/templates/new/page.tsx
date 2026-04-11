'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowLeft, ArrowRight, Loader2, Target, Plus, X, CheckCircle2, Copy, Lock, Wand2, Link2, Package, Share2, Brain, Palette, Cpu, Megaphone, Headphones, DollarSign, Users, TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, ChevronDown, ShieldCheck, RefreshCw, Square, Mic, MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useAudioRecorder } from "@/components/briefing/inputs/shared/useAudioRecorder";

// ─── Icon + Color Maps ──────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Palette, Brain, Cpu, Megaphone, Headphones, DollarSign, Users,
  TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, Package, MousePointerClick,
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
  branding: 'Branding', technology: 'Tecnologia', marketing: 'Marketing',
  operations: 'Operações', finance: 'Finanças', people: 'Pessoas',
  commercial: 'Comercial', product: 'Produto', legal: 'Jurídico',
  digital: 'Digital', content: 'Conteúdo', general: 'Geral',
};

const DEPT_ICON_MAP: Record<string, React.ElementType> = {
  branding: Palette,
  technology: Cpu,
  marketing: Megaphone,
  operations: RefreshCw,
  finance: DollarSign,
  people: Users,
  commercial: TrendingUp,
  product: Lightbulb,
  legal: Shield,
  digital: ShoppingCart,
  content: Video,
  general: Package,
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
              : 'bg-brieffy-surface text-brieffy-text3 border border-brieffy-border'
            }
          `}>
            {current > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : s.n}
          </div>
          <span className={`label-caps ml-1.5 hidden sm:block ${
            current >= s.n ? 'text-foreground' : 'text-brieffy-text3'
          }`}>{s.label}</span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-[1.5px] mx-2 transition-colors duration-500 ${
              current > s.n ? 'bg-brieffy-orange/40' : 'bg-brieffy-border'
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

  const {
    isRecording: isRecordingContext,
    isTranscribing: isTranscribingContext,
    startRecording: startRecordingContext,
    stopRecording: stopRecordingContext
  } = useAudioRecorder({
    voiceLanguage: 'pt',
    onTranscript: (t) => setInitialContext(prev => prev + (prev ? ' ' : '') + t),
  });

  const {
    isRecording: isRecordingPurpose,
    isTranscribing: isTranscribingPurpose,
    startRecording: startRecordingPurpose,
    stopRecording: stopRecordingPurpose
  } = useAudioRecorder({
    voiceLanguage: 'pt',
    onTranscript: (t) => setPurpose(prev => prev + (prev ? ' ' : '') + t),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 5MB para leitura.');
      return;
    }

    setIsReadingFile(true);
    try {
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
        const text = await file.text();
        setInitialContext(prev => prev + (prev ? '\n\n' : '') + `[Documento Extraído: ${file.name}]\n${text.substring(0, 5000)}`);
      } else {
        // Para Imagens, PDFs e Planilhas, sobe pro Supabase e aciona a AI vision
        const supabase = createClient();
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
        
        const { error } = await supabase.storage
          .from("briefing_assets")
          .upload(fileName, file, { upsert: false });
        
        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage
          .from("briefing_assets")
          .getPublicUrl(fileName);
          
        const res = await fetch('/api/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: publicUrlData.publicUrl, fileName: file.name, mimeType: file.type })
        });
        
        if (!res.ok) throw new Error("Falha no OCR");
        const analysis = await res.json();
        
        if (analysis.text) {
          setInitialContext(prev => prev + (prev ? '\n\n' : '') + `[Documento Extraído via IA (${file.name})]:\n${analysis.text}`);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao ler ou processar o arquivo.');
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
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
      // 1. Save template as Draft
      let templateId = createdTemplateId;
      if (!templateId) {
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
        templateId = templateData.data?.id;
        
        if (!templateId) throw new Error('Template criado mas sem ID');
        
        // Store template ID for step 2
        setCreatedTemplateId(templateId);
      }
      
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
  
  const handleGenerateLink = async () => {
    if (selectedSlugs.length === 0) return;
    setIsGenerating(true);
    setError(null);
    
    try {
      // 1. Ensure template is saved (should already be saved in step 1, but fallback just in case)
      let finalTemplateId = createdTemplateId;
      if (!finalTemplateId) {
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
        finalTemplateId = templateData.data?.id;
        
        if (!finalTemplateId) throw new Error('Template criado mas sem ID');
        
        setCreatedTemplateId(finalTemplateId);
      }

      const res = await fetch('/api/sessions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: finalTemplateId,
          sessionName: name.trim(),
          initialContext: initialContext.trim() || undefined,
          selectedPackages: selectedSlugs,
          editPassphrase: editPassphrase.trim() || undefined,
          briefingPurpose: purpose.trim(),
          depthSignals: depthSignals,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar link');
      }
      
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
    const parts = [`Link do Briefing:\n${generatedLink}`];
    if (editPassphrase) parts.push(`Senha: ${editPassphrase}`);
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
          className="inline-flex items-center text-sm font-bold label-caps text-brieffy-text3 hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Criar <span className="text-brieffy-orange">Briefing</span>
            </h1>
            <p className="text-brieffy-text2 mt-1 text-sm font-medium">
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
            <div className="bg-brieffy-surface border border-brieffy-border rounded-2xl p-5 sm:p-8 space-y-7">
              
              {/* ── Name ──────────────────────── */}
              <div className="space-y-2.5">
                <label className="label-caps-accent">
                  Nome do Briefing <span className="text-brieffy-orange">*</span>
                </label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Rebrand Acme Corp 2026"
                  className="bg-background border-[1.5px] border-brieffy-border focus-visible:border-brieffy-orange focus-visible:ring-0 h-12 text-sm rounded-xl placeholder:text-brieffy-text3 transition-all font-medium shadow-none"
                />
              </div>
              
              {/* ── Purpose ───────────────────── */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 justify-between">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brieffy-orange-light border border-brieffy-orange-border flex items-center justify-center shrink-0 mt-0.5">
                      <Target className="w-4 h-4 text-brieffy-orange" />
                    </div>
                    <div>
                      <label className="label-caps !text-foreground">
                        O que você precisa descobrir? <span className="text-brieffy-orange">*</span>
                      </label>
                      <p className="text-xs text-brieffy-text3 mt-0.5 font-medium">
                        A IA vai usar isso como bússola para guiar toda a conversa.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => isRecordingPurpose ? stopRecordingPurpose() : startRecordingPurpose()}
                      disabled={isTranscribingPurpose}
                      className={`h-8 px-3 rounded-lg border focus-visible:ring-0 ${isRecordingPurpose ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-background hover:bg-[var(--surface2)] text-brieffy-text3 border-brieffy-border'}`}
                    >
                      {isTranscribingPurpose ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isRecordingPurpose ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Ex: Entender a identidade atual da marca, o público-alvo e os planos de crescimento para redesenhar o posicionamento visual."
                  className={`bg-background border-[1.5px] border-brieffy-border focus-visible:border-brieffy-orange focus-visible:ring-0 rounded-xl resize-y min-h-[100px] placeholder:text-brieffy-text3 text-sm leading-relaxed transition-all font-medium shadow-none ${isRecordingPurpose ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20 animate-pulse' : ''}`}
                  disabled={isRecordingPurpose || isTranscribingPurpose}
                />
              </div>

              {/* ── Context (Fixed) ───────────── */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-background border border-brieffy-border flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-brieffy-text3" />
                  </div>
                  <div>
                    <label className="label-caps !text-foreground">
                      Contexto Prévio <span className="text-brieffy-text3 font-normal">(recomendado)</span>
                    </label>
                    <p className="text-xs text-brieffy-text3 mt-0.5 font-medium">
                      O que você já sabe sobre esse cliente? A IA adaptará as perguntas.
                    </p>
                  </div>
                </div>
                  <div className="relative">
                  <input
                    type="file"
                    accept=".txt,.md,.csv,.json,.pdf,.png,.jpg,.jpeg,.xlsx"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Textarea
                    value={initialContext}
                    onChange={e => setInitialContext(e.target.value)}
                    placeholder="Ex: Já fizemos o logotipo dele em 2023, agora ele quer expandir para o digital..."
                    className={`bg-background border-[1.5px] border-brieffy-border focus-visible:border-brieffy-orange focus-visible:ring-0 rounded-xl resize-y min-h-[100px] placeholder:text-brieffy-text3 text-sm font-medium transition-all shadow-none pl-3 pr-20 ${isRecordingContext ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20 animate-pulse' : ''}`}
                    disabled={isRecordingContext || isTranscribingContext || isReadingFile}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isReadingFile || isRecordingContext || isTranscribingContext}
                      title="Upload (.txt, .md, .csv)"
                      className="rounded-full h-8 w-8 text-brieffy-text3 hover:text-[var(--brand)] hover:bg-[var(--brand)]/10 transition-colors"
                    >
                      {isReadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => isRecordingContext ? stopRecordingContext() : startRecordingContext()}
                      disabled={isTranscribingContext || isReadingFile}
                      className={`rounded-full h-8 w-8 transition-colors ${
                        isRecordingContext 
                          ? 'bg-red-500 text-white hover:bg-red-600 hover:text-white animate-pulse' 
                          : 'text-brieffy-text3 hover:text-[var(--brand)] hover:bg-[var(--brand)]/10'
                      }`}
                    >
                      {isTranscribingContext ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--brand)]" />
                      ) : isRecordingContext ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Sensitive Points (Depth Signals) ── */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowSignals(!showSignals)}
                  className="flex items-center gap-2 label-caps text-brieffy-text3 hover:text-foreground transition-colors w-full group"
                >
                  <div className="w-8 h-8 rounded-lg bg-background border border-brieffy-border flex items-center justify-center shrink-0 group-hover:border-foreground transition-colors">
                    <ChevronDown className={`w-4 h-4 text-brieffy-text3 transition-transform duration-300 ${showSignals ? 'rotate-180' : ''}`} />
                  </div>
                  Pontos Sensíveis
                  <span className="text-brieffy-text3 font-normal">(opcional)</span>
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
                      <div className="pl-10 space-y-1">
                        <p className="text-xs text-brieffy-text2 font-medium">
                          IA explorará com atenção. Digite e separe por vírgula para adicionar.
                        </p>
                        <p className="text-xs text-brieffy-text3 font-normal">
                          Ex: resistência a preço, insatisfação com marca atual, prazos curtos
                        </p>
                      </div>
                      
                      {/* Tags */}
                      {depthSignals.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-10">
                          {depthSignals.map(signal => (
                            <span
                              key={signal}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brieffy-orange-light border border-brieffy-orange-border text-brieffy-orange text-[11px] font-bold"
                            >
                              {signal}
                              <button
                                type="button"
                                onClick={() => removeSignal(signal)}
                                className="text-brieffy-orange/60 hover:text-brieffy-orange transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="pl-10">
                        <Input
                          value={newSignal}
                          onChange={handleSignalChange}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSignal(); } }}
                          placeholder="Adicionar ponto sensível..."
                          className="bg-background border-[1.5px] border-brieffy-border focus-visible:border-brieffy-orange focus-visible:ring-0 h-11 rounded-xl text-sm font-medium transition-all shadow-none placeholder:text-brieffy-text3"
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
              className="w-full h-12 text-sm font-bold rounded-full bg-foreground text-background hover:opacity-90 transition-all duration-300 disabled:opacity-40 shadow-none gap-2"
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
            <div className="bg-brieffy-surface border border-brieffy-border rounded-2xl p-5 sm:p-8 space-y-7">
              
              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brieffy-orange" />
                  Skills da IA
                </h2>
                <p className="text-sm font-medium text-brieffy-text2">
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
                    className="flex items-start gap-3 px-4 py-4 rounded-xl bg-background border border-brieffy-border"
                  >
                    <Wand2 className="w-4 h-4 text-brieffy-text3 flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-brieffy-text2 font-medium leading-relaxed italic">
                      &quot;{aiReasoning}&quot;
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Stats & Filter Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-brieffy-border">
                <div className="flex items-center gap-2">
                  <span className="label-caps !text-[10px] text-brieffy-text3">Seleção:</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-brieffy-orange bg-brieffy-orange-light px-2 py-0.5 rounded-full border border-brieffy-orange-border">
                    {selectedSlugs.length} Ativas
                  </span>
                </div>
              </div>
              
              {/* Skills Grid */}
              <div className="space-y-6">
                {Object.entries(groupedPackages).map(([dept, pkgs]) => (
                  <div key={dept} className="space-y-3">
                    <div className="label-caps text-brieffy-text3 px-1 flex items-center gap-1.5">
                      {(() => {
                        const DeptIcon = DEPT_ICON_MAP[dept] || Package;
                        return <DeptIcon className="w-4 h-4" />;
                      })()}
                      {DEPT_LABELS[dept] || dept}
                    </div>
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
                              border outline-none group bg-background
                              ${isSelected
                                ? 'border-foreground shadow-sm'
                                : 'border-brieffy-border hover:border-brieffy-text3'
                              }
                            `}
                          >
                            {/* Icon container */}
                            <div className="w-10 h-10 rounded-xl bg-brieffy-surface flex items-center justify-center shrink-0">
                              <IconComp className={`w-4.5 h-4.5 ${isSelected ? 'text-brieffy-orange' : 'text-brieffy-text3'}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold tracking-tight transition-colors text-foreground">
                                  {pkg.name}
                                </span>
                                {isAiSuggested && isSelected && (
                                  <span className="shrink-0 text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-brieffy-orange text-black">IA</span>
                                )}
                              </div>
                              <p className="text-[11px] font-medium mt-0.5 truncate text-brieffy-text3">
                                Explorar {pkg.name.toLowerCase()}
                              </p>
                            </div>
                            
                            {/* Custom Checkbox */}
                            <div className={`w-6 h-6 rounded-full border-[1.5px] border-brieffy-border flex items-center justify-center shrink-0 transition-all duration-300 text-brieffy-text3 ${
                              isSelected
                                ? '!border-foreground !bg-foreground text-background'
                                : ''
                            }`}>
                              {isSelected ? (
                                <span className="text-[10px] font-bold">✓</span>
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
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
              <div className="mt-8 overflow-hidden rounded-2xl border-2 border-brieffy-border focus-within:border-brieffy-orange/50 transition-colors bg-background shadow-sm">
                {/* Header */}
                <div className="bg-brieffy-surface border-b border-brieffy-border p-5 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brieffy-orange/10 flex items-center justify-center shrink-0 border border-brieffy-orange/20">
                      <ShieldCheck className="w-6 h-6 text-brieffy-orange" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                        Segurança e Acesso
                      </h3>
                      <p className="text-[13px] font-medium text-brieffy-text2 mt-1">
                        Proteja este briefing gerando uma senha de acesso.
                      </p>
                    </div>
                  </div>
                  
                  {editPassphrase ? (
                    <div className="bg-brieffy-orange/10 border border-brieffy-orange/20 text-brieffy-orange text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none">
                      <Lock className="w-3.5 h-3.5" />
                      Protegido
                    </div>
                  ) : (
                    <div className="bg-brieffy-text3/10 border border-brieffy-text3/20 text-brieffy-text3 text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 select-none">
                      <Lock className="w-3.5 h-3.5" />
                      Aberto
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-2">
                      <label className="label-caps-accent flex items-center gap-2">
                        Senha do Documento
                        {!editPassphrase && <span className="text-xs font-normal text-brieffy-text3 normal-case tracking-normal">(Opcional)</span>}
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditPassphrase(generatePassphrase())}
                        className="text-brieffy-orange hover:text-brieffy-orange/80 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Sortear Nova
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors pointer-events-none ${editPassphrase ? 'text-brieffy-orange' : 'text-zinc-400 dark:text-zinc-500'}`} />
                      <Input
                        value={editPassphrase}
                        onChange={e => setEditPassphrase(e.target.value)}
                        className={`bg-brieffy-surface border-2 h-14 font-mono text-base sm:text-lg rounded-xl pl-12 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 transition-all font-bold tracking-widest shadow-none ${
                          editPassphrase 
                            ? 'border-brieffy-orange/40 focus-visible:border-brieffy-orange focus-visible:ring-0 text-foreground shadow-[0_0_15px_rgba(255,96,41,0.05)]' 
                            : 'border-brieffy-border focus-visible:border-brieffy-orange/50 focus-visible:ring-0 text-foreground'
                        }`}
                        placeholder="Acesso sem senha..."
                      />
                      {editPassphrase && (
                        <button
                          type="button"
                          onClick={() => setEditPassphrase('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Remover senha"
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
            <div className="bg-brieffy-surface border border-brieffy-border rounded-2xl p-6 sm:p-12">
              <div className="flex flex-col items-center justify-center space-y-8">
                
                {/* Success Icon */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-brieffy-orange/10 border border-brieffy-orange/30 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <CheckCircle2 className="w-12 h-12 text-brieffy-orange" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full bg-brieffy-orange/20 blur-3xl animate-pulse" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Briefing Criado!</h3>
                  <p className="text-sm font-medium text-brieffy-text2 max-w-sm leading-relaxed mx-auto">
                    Agora é só compartilhar o link {editPassphrase ? 'e a senha' : ''} com seu cliente para começarem.
                  </p>
                </div>
                
                {/* Visual Group for Link & Password */}
                <div className="w-full max-w-lg space-y-3">
                  
                  {/* Link Card */}
                  <div className="group relative flex items-center justify-between gap-3 p-3 bg-background border border-brieffy-border rounded-2xl transition-all hover:border-brieffy-orange/30">
                    <div className="flex items-center gap-3 pl-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brieffy-surface border border-brieffy-border flex items-center justify-center shrink-0">
                        <Link2 className="w-4 h-4 text-brieffy-text3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="label-caps !text-xs text-brieffy-text3 mb-0.5">Link do Briefing</p>
                        <p className="text-sm font-bold text-foreground truncate select-all">{generatedLink}</p>
                      </div>
                    </div>
                    <Button
                      onClick={copyLink}
                      className={`h-11 px-4 rounded-xl shrink-0 font-bold text-xs label-caps transition-all ${
                        copied
                          ? 'bg-green-500 text-white hover:bg-green-600 border border-green-600'
                          : 'bg-foreground text-background hover:opacity-90 shadow-none'
                      }`}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                  
                  {/* Password Card (Only if defined) */}
                  {editPassphrase && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-background border border-brieffy-border rounded-2xl">
                      <div className="flex items-center gap-3 pl-2 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-brieffy-orange/10 border border-brieffy-orange/20 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4 text-brieffy-orange" />
                        </div>
                        <div>
                          <p className="label-caps !text-xs text-brieffy-text3 mb-0.5">Senha de Acesso</p>
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
                      ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)] border-green-600'
                      : 'bg-background border-[1.5px] border-brieffy-border text-foreground hover:border-brieffy-orange/50 shadow-sm'
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
                    className="h-14 border-[1.5px] border-brieffy-border text-brieffy-text3 hover:text-foreground hover:bg-brieffy-surface rounded-full font-bold label-caps"
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
                    className="h-14 bg-foreground text-background hover:opacity-90 rounded-full font-bold label-caps flex items-center justify-center gap-2 shadow-none"
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

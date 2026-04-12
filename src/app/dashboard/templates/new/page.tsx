'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useDashboardLanguage } from '@/i18n/DashboardLanguageContext';

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
export default function NewBriefingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brieffy-orange" /></div>}>
      <NewBriefingWizardContent />
    </Suspense>
  );
}

function NewBriefingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTemplateId = searchParams.get('templateId');

  const { t } = useDashboardLanguage();
  
  // ── Wizard Step ─────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // ── Step 1: Describe ────────────
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [newSignal, setNewSignal] = useState('');
  const [depthSignals, setDepthSignals] = useState<string[]>([]);
  const [showSignals, setShowSignals] = useState(false);

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
  const [isSummarizing, setIsSummarizing] = useState(false);

  const processExtractedText = async (text: string, fileName: string, source: "Text" | "AI") => {
    if (text.length > 2000) {
      setIsSummarizing(true);
      try {
        const sumRes = await fetch('/api/briefing/summarize-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, fileName })
        });
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          if (sumData.summary) {
            setPurpose(prev => prev + (prev ? '\n\n' : '') + `[Resumo Executivo (${fileName})]:\n${sumData.summary}`);
            return;
          }
        }
      } catch (err) {
        console.error("Erro ao resumir", err);
      } finally {
        setIsSummarizing(false);
      }
    }
    // Fallback or if not too long
    setPurpose(prev => prev + (prev ? '\n\n' : '') + `[${source === "AI" ? "Documento Extraído via IA" : "Documento Anexado"}: ${fileName}]\n${text.substring(0, 5000)}`);
  };

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
        await processExtractedText(text, file.name, "Text");
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
          await processExtractedText(analysis.text, file.name, "AI");
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
  const [maxQuestions, setMaxQuestions] = useState<number>(25);
  const [manualMaxQuestions, setManualMaxQuestions] = useState<boolean>(false);

  useEffect(() => {
    if (manualMaxQuestions) return;
    const count = selectedSlugs.length;
    if (count <= 4) setMaxQuestions(25);
    else if (count <= 7) setMaxQuestions(30);
    else setMaxQuestions(40);
  }, [selectedSlugs, manualMaxQuestions]);
  
  // ── Step 3: Done ────────────────
  const [generatedLink, setGeneratedLink] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [copied, setCopied] = useState(false);
  
  // ── Loading States ──────────────
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);

  // ── Fetch draft if templateId is in URL ──
  useEffect(() => {
    if (searchTemplateId) {
      const fetchDraft = async () => {
        setIsTransitioning(true);
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('briefing_templates')
            .select('*')
            .eq('id', searchTemplateId)
            .single();

          if (error) throw error;
          if (data) {
            setCreatedTemplateId(searchTemplateId); // Set ONLY if valid
            if (data.name) setName(data.name);
            if (data.briefing_purpose) setPurpose(data.briefing_purpose);
            if (data.depth_signals && Array.isArray(data.depth_signals)) {
              setDepthSignals(data.depth_signals);
            }
          }
        } catch (err) {
          console.error("Erro ao carregar template:", err);
          setError("Erro ao carregar o briefing draft. Inicie um novo.");
        } finally {
          setIsTransitioning(false);
        }
      };
      fetchDraft();
    }
  }, [searchTemplateId]);

  
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
      setError(t('wizard.errorName'));
      return;
    }
    if (!purpose.trim()) {
      setError(t('wizard.errorChallenge'));
      return;
    }
    setError(null);
    setIsTransitioning(true);
    
    try {
      // 1. Save template as Draft
      let templateId = createdTemplateId;
      if (!templateId) {
        // Create new
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
        
        setCreatedTemplateId(templateId);
      } else {
        // Update existing draft
        const templateRes = await fetch(`/api/templates/${templateId}`, {
          method: 'PUT',
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
          throw new Error(errData.error || 'Falha ao atualizar briefing');
        }
      }
      
      // 2. Ask AI to suggest packages (Non-blocking fallback)
      let aiSlugs: string[] = [];
      let aiReasoningStr = '';
      
      try {
        const suggestRes = await fetch('/api/briefing/suggest-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            briefingPurpose: purpose.trim(),
            initialContext: undefined,
            depthSignals: depthSignals.length > 0 ? depthSignals : undefined,
          }),
        });
        
        if (suggestRes.ok) {
          const suggestData = await suggestRes.json();
          aiSlugs = suggestData.suggested_slugs || [];
          aiReasoningStr = suggestData.reasoning || '';
        } else {
          console.error("AI suggestion failed with status:", suggestRes.status);
        }
      } catch (aiErr) {
        console.error("AI Suggestion Service Error:", aiErr);
      }
      
      // Pre-select: AI suggestions + defaults
      const defaultSlugs = packages
        .filter(p => p.is_default_enabled)
        .map(p => p.slug);
      const merged = [...new Set([...defaultSlugs, ...aiSlugs])];
      
      setAiSuggestedSlugs(aiSlugs);
      setAiReasoning(aiReasoningStr);
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
          initialContext: undefined,
          selectedPackages: selectedSlugs,
          editPassphrase: editPassphrase.trim() || undefined,
          briefingPurpose: purpose.trim(),
          depthSignals: depthSignals,
          maxQuestions: maxQuestions,
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
          {t('wizard.back')}
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t('wizard.titlePrefix')}<span className="text-brieffy-orange">{t('wizard.titleOrange')}</span>
            </h1>
            <p className="text-brieffy-text2 mt-1 text-sm font-medium">
              {t('wizard.subtitle')}
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
                  {t('wizard.name')} <span className="text-brieffy-orange">*</span>
                </label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('wizard.namePlaceholder')}
                  className="bg-background border-[1.5px] border-brieffy-border focus-visible:border-brieffy-orange focus-visible:ring-0 h-12 text-sm rounded-xl placeholder:text-brieffy-text3 transition-all font-medium shadow-none"
                />
              </div>
              
              {/* ── Master Input: The Challenge ── */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 justify-between">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brieffy-orange-light border border-brieffy-orange-border flex items-center justify-center shrink-0 mt-0.5">
                      <Target className="w-4 h-4 text-brieffy-orange" />
                    </div>
                    <div>
                      <label className="label-caps !text-foreground">
                        {t('wizard.challenge')} <span className="text-brieffy-orange">*</span>
                      </label>
                      <p className="text-xs text-brieffy-text3 mt-0.5 font-medium">
                        {t('wizard.challengeDesc')}
                      </p>
                    </div>
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
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    placeholder={t('wizard.challengePlaceholder')}
                    maxLength={20000}
                    className={`bg-background border-[1.5px] border-brieffy-border focus-visible:border-brieffy-orange focus-visible:ring-0 rounded-xl resize-y min-h-[140px] placeholder:text-brieffy-text3 text-sm leading-relaxed transition-all font-medium shadow-none pb-12 ${isRecordingPurpose ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20 animate-pulse' : ''}`}
                    disabled={isRecordingPurpose || isTranscribingPurpose || isReadingFile || isSummarizing}
                  />
                  
                  {/* Embedded Input Controls */}
                  <div className="absolute right-2 bottom-2 left-2 flex items-center justify-between border-t border-brieffy-border/60 pt-2 px-1">
                    <p className="text-[10px] sm:text-xs text-brieffy-text3 font-medium flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      {t('wizard.aiProcess')}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isReadingFile || isSummarizing || isRecordingPurpose || isTranscribingPurpose}
                        title={t('wizard.attachTitle')}
                        className="h-8 px-2.5 rounded-lg text-brieffy-text3 hover:text-brieffy-orange hover:bg-brieffy-orange/10 transition-colors gap-1.5"
                      >
                        {(isReadingFile || isSummarizing) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                        <span className="hidden sm:inline text-xs font-semibold">{t('wizard.attach')}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => isRecordingPurpose ? stopRecordingPurpose() : startRecordingPurpose()}
                        disabled={isTranscribingPurpose || isReadingFile || isSummarizing}
                        className={`h-8 px-2.5 rounded-lg border transition-colors gap-1.5 ${
                          isRecordingPurpose 
                            ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 animate-pulse' 
                            : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border-transparent'
                        }`}
                      >
                        {isTranscribingPurpose ? (
                          <Loader2 className="w-4 h-4 animate-spin text-brieffy-orange" />
                        ) : isRecordingPurpose ? (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline text-xs font-semibold">{isRecordingPurpose ? t('wizard.recording') : t('wizard.speak')}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Settings Pills ── */}
              <div className="pt-2 border-t border-brieffy-border/50">
                <p className="text-xs font-bold text-brieffy-text3 mb-3 uppercase tracking-wider">{t('wizard.sessionSettings')}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  
                  {/* Sensitive Points Pill */}
                  <div className={`flex-1 flex flex-col p-3 rounded-xl border transition-all ${showSignals ? 'bg-brieffy-orange/5 border-brieffy-orange/30' : 'bg-background hover:bg-brieffy-surface border-brieffy-border'}`}>
                    <button
                      type="button"
                      onClick={() => setShowSignals(!showSignals)}
                      className="flex items-start gap-2.5 text-left w-full"
                    >
                      <div className="mt-0.5 shrink-0">
                        {showSignals ? <ShieldCheck className="w-4 h-4 text-brieffy-orange" /> : <Shield className="w-4 h-4 text-brieffy-text3" />}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-bold block mb-0.5 ${showSignals ? 'text-foreground' : 'text-brieffy-text2'}`}>{t('wizard.sensitivePoints')}</span>
                        <span className={`text-[11px] leading-tight block ${showSignals ? 'text-foreground/80' : 'text-brieffy-text2/80'}`}>{t('wizard.sensitivePointsDesc')}</span>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {showSignals && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          className="space-y-3 overflow-hidden"
                        >
                          <div className="pl-6">
                            <Input
                              value={newSignal}
                              onChange={handleSignalChange}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSignal(); } }}
                              placeholder={t('wizard.addSensitive')}
                              className="bg-background h-9 text-xs rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-brieffy-orange"
                            />
                            {depthSignals.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {depthSignals.map(signal => (
                                  <span key={signal} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-background border border-brieffy-border text-[10px] font-bold">
                                    {signal}
                                    <X className="w-3 h-3 hover:text-red-500 cursor-pointer" onClick={() => removeSignal(signal)} />
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
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
                  {t('wizard.analyzeProject')}
                </>
              ) : (
                <>
                  {t('wizard.generateSkills')}
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
                  {t('wizard.step2Title')}
                </h2>
                <p className="text-sm font-medium text-brieffy-text2">
                  {t('wizard.step2Subtitle')}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-brieffy-border">
                <div className="flex items-center gap-2">
                  <span className="label-caps !text-[10px] text-brieffy-text3">{t('wizard.selection')}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-brieffy-orange bg-brieffy-orange-light px-2 py-0.5 rounded-full border border-brieffy-orange-border">
                    {selectedSlugs.length} {t('wizard.active')}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-[11px] font-bold text-foreground">Limite de Perguntas:</span>
                  <div className="flex bg-brieffy-surface border border-brieffy-border rounded-xl overflow-hidden p-1">
                    {[10, 25, 30, 40].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setMaxQuestions(num);
                          setManualMaxQuestions(true);
                        }}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          maxQuestions === num
                            ? 'bg-foreground text-background shadow-sm'
                            : 'text-brieffy-text3 hover:text-foreground hover:bg-brieffy-border/50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
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
                {t('wizard.back')}
              </Button>
              <Button
                onClick={handleGenerateLink}
                disabled={isGenerating || selectedSlugs.length === 0}
                className="order-1 sm:order-2 flex-1 h-14 text-base font-bold rounded-full bg-brieffy-orange hover:bg-brieffy-orange/90 text-black shadow-[0_4px_20px_rgba(255,96,41,0.2)] transition-all duration-300 disabled:opacity-40 disabled:shadow-none gap-2 active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('wizard.generatingLink')}
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    {t('wizard.generateLinkBtn')} ({selectedSlugs.length})
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
                  <h3 className="text-2xl font-black text-foreground tracking-tight">{t('wizard.step3Title')}</h3>
                  <p className="text-sm font-medium text-brieffy-text2 max-w-sm leading-relaxed mx-auto">
                    {t('wizard.step3Subtitle')}
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
                        <p className="label-caps !text-xs text-brieffy-text3 mb-0.5">{t('wizard.linkBriefing')}</p>
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
                      {copied ? t('modal.copied') : t('wizard.copy')}
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
                          <p className="label-caps !text-xs text-brieffy-text3 mb-0.5">{t('modal.accessPasswordLabel')}</p>
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
                  {shared ? t('wizard.copiedMsg') : t('wizard.copyClientMsg')}
                </Button>
                
                {/* Footer Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/${sessionId}`)}
                    className="h-14 border-[1.5px] border-brieffy-border text-brieffy-text3 hover:text-foreground hover:bg-brieffy-surface rounded-full font-bold label-caps"
                  >
                    {t('wizard.manageBriefing')}
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
                    <Plus className="w-4 h-4 mr-1.5" />
                    {t('wizard.newBriefing')}
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

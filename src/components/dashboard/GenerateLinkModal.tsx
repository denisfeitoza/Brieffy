'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Share2, CheckCircle2, Copy, Package, Brain, Palette, Cpu,
  Megaphone, Headphones, DollarSign, Users, TrendingUp, Truck,
  Lightbulb, Shield, Server, ShoppingCart, Video,
  ChevronDown, Wand2, Sparkles, Link2, Lock, Loader2, ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useDashboardLanguage } from '@/i18n/DashboardLanguageContext';
import { PASSPHRASE_WORDS } from '@/i18n/dashboardTranslations';

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
  branding:   { bg: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-600', glow: 'shadow-sm' },
  technology: { bg: 'bg-cyan-50',    border: 'border-cyan-200',   text: 'text-cyan-600',   glow: 'shadow-sm' },
  marketing:  { bg: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-600', glow: 'shadow-sm' },
  operations: { bg: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-600',glow: 'shadow-sm' },
  finance:    { bg: 'bg-yellow-50',  border: 'border-yellow-200', text: 'text-yellow-600', glow: 'shadow-sm' },
  people:     { bg: 'bg-pink-50',    border: 'border-pink-200',   text: 'text-pink-600',   glow: 'shadow-sm' },
  commercial: { bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-600',   glow: 'shadow-sm' },
  product:    { bg: 'bg-teal-50',    border: 'border-teal-200',   text: 'text-teal-600',   glow: 'shadow-sm' },
  legal:      { bg: 'bg-slate-50',   border: 'border-slate-200',  text: 'text-slate-600',  glow: 'shadow-sm' },
  digital:    { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200',text: 'text-fuchsia-600',glow: 'shadow-sm' },
  content:    { bg: 'bg-lime-50',    border: 'border-lime-200',   text: 'text-lime-600',   glow: 'shadow-sm' },
  general:    { bg: 'bg-[var(--bg2)]', border: 'border-[var(--bd)]', text: 'text-[var(--text)]', glow: 'shadow-sm' },
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
  existingSession?: { id: string; edit_passphrase?: string | null };
}

export function GenerateLinkModal({ templateId, templateName, existingSession }: GenerateLinkModalProps) {
  const router = useRouter();
  const { t, language } = useDashboardLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'create' | 'done'>(existingSession ? 'done' : 'create');

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [initialContext, setInitialContext] = useState('');
  const [editPassphrase, setEditPassphrase] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [showAccessPassword, setShowAccessPassword] = useState(false);
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
  const [shared, setShared] = useState(false);

  const generateCoolPassphrase = useCallback(() => {
    const words = PASSPHRASE_WORDS[language] || PASSPHRASE_WORDS.en;
    const newPassphrase = Array.from({ length: 4 }, () =>
      words[Math.floor(Math.random() * words.length)]
    ).join('-');
    setEditPassphrase(newPassphrase);
  }, [language]);

  // Fetch packages on open
  useEffect(() => {
    if (open) {
      if (existingSession) {
        setStep('done');
        const host = window.location.origin;
        setGeneratedLink(`${host}/b/${existingSession.id}`);
        if (existingSession.edit_passphrase) setEditPassphrase(existingSession.edit_passphrase);
      } else {
        if (packages.length === 0) fetchPackages();
        if (!editPassphrase) generateCoolPassphrase();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingSession]);

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await fetch('/api/briefing/packages');
      const data = await res.json();
      setPackages(data || []);
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
      if (!existingSession && generatedLink) {
        router.refresh();
      }
      setTimeout(() => {
        if (existingSession) {
          setStep('done');
        } else {
          setStep('create');
          setSessionName('');
          setInitialContext('');
          setEditPassphrase('');
          setAccessPassword('');
          setShowAccessPassword(false);
          setGeneratedLink('');
          setCopied(false);
          setShared(false);
          setShowContext(false);
          setAiSuggestedSlugs([]);
          setAiReasoning('');
          const defaults = packages
            .filter(p => p.is_default_enabled)
            .map(p => p.slug);
          setSelectedSlugs(defaults);
        }
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

      // ── Quota validation ────────────────────────────────────
      if (user) {
        const { data: quota } = await supabase
          .from('briefing_quotas')
          .select('used_briefings, max_briefings, is_blocked')
          .eq('user_id', user.id)
          .single();

        if (quota?.is_blocked) {
          toast.error(language === 'pt' ? 'Sua conta está bloqueada. Contate o suporte.' : language === 'es' ? 'Tu cuenta está bloqueada. Contacta soporte.' : 'Your account is blocked. Contact support.');
          setLoading(false);
          return;
        }

        if (quota && quota.used_briefings >= quota.max_briefings) {
          toast.error(language === 'pt' ? `Você atingiu o limite de ${quota.max_briefings} briefings. Faça upgrade do seu plano.` : language === 'es' ? `Has alcanzado el límite de ${quota.max_briefings} briefings. Actualiza tu plan.` : `You've reached your limit of ${quota.max_briefings} briefings. Please upgrade your plan.`);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('briefing_sessions')
        .insert([{
          template_id: templateId,
          session_name: sessionName.trim(),
          initial_context: initialContext.trim() || null,
          selected_packages: selectedSlugs,
          edit_passphrase: editPassphrase.trim() || null,
          access_password: accessPassword.trim() || null,
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
      console.error('Error generating link:', err);
      toast.error(language === 'pt' ? 'Erro ao gerar link.' : language === 'es' ? 'Error al generar enlace.' : 'Error generating link.');
    } finally {
      setLoading(false);
    }
  };

  const copyLinkOnly = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    const navLang = (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en').toLowerCase();
    let msgLang = 'en';
    if (navLang.startsWith('pt')) msgLang = 'pt';
    else if (navLang.startsWith('es')) msgLang = 'es';

    let msg = '';
    if (msgLang === 'pt') {
      msg = `Acesse aqui:\n${generatedLink}`;
      if (accessPassword) msg += `\n\nSenha de acesso: ${accessPassword}`;
      if (editPassphrase) msg += `\n\nSenha do documento: ${editPassphrase}`;
    } else if (msgLang === 'es') {
      msg = `Accede aquí:\n${generatedLink}`;
      if (accessPassword) msg += `\n\nContraseña de acceso: ${accessPassword}`;
      if (editPassphrase) msg += `\n\nContraseña del documento: ${editPassphrase}`;
    } else {
      msg = `Access here:\n${generatedLink}`;
      if (accessPassword) msg += `\n\nAccess password: ${accessPassword}`;
      if (editPassphrase) msg += `\n\nDocument password: ${editPassphrase}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          text: msg,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(msg);
          setShared(true);
          toast.success(msgLang === 'pt' ? 'Mensagem copiada para a área de transferência!' : msgLang === 'es' ? '¡Mensaje copiado al portapapeles!' : 'Message copied to clipboard!');
          setTimeout(() => setShared(false), 2500);
        }
      }
    } else {
      navigator.clipboard.writeText(msg);
      setShared(true);
      toast.success(msgLang === 'pt' ? 'Mensagem copiada para a área de transferência!' : msgLang === 'es' ? '¡Mensaje copiado al portapapeles!' : 'Message copied to clipboard!');
      setTimeout(() => setShared(false), 2500);
    }
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
          <Button variant="ghost" className="text-[var(--actext)] hover:text-black hover:bg-[var(--acbg)] px-3">
            <Share2 className="w-4 h-4 mr-2" />
            {t('modal.generateLinkBtn')}
          </Button>
        }
      />

      <DialogContent className={`bg-[var(--bg)] border-[var(--bd)] text-[var(--text)] transition-all duration-500 overflow-hidden ${
        step === 'create' ? 'sm:max-w-[780px]' : 'sm:max-w-[460px]'
      }`}>

        {/* ========== STEP 1: CREATE (Unified) ========== */}
        {step === 'create' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[var(--text)]">
                <div className="w-8 h-8 rounded-xl bg-[var(--acbg)] border border-[var(--acbd)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[var(--actext)]" />
                </div>
                {t('modal.newBriefing')}
              </DialogTitle>
              <DialogDescription className="text-[var(--text3)]">
                {t('modal.intelligentEngine')}: <strong className="text-[var(--actext)]">{templateName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[65vh] pr-1 -mr-1 space-y-5 py-2 custom-scrollbar">

              {/* ── Session Name ─────────────────────────────────── */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text2)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-xs font-bold text-[var(--text)]">1</span>
                  {t('modal.briefingName')} <span className="text-red-500 text-xs">{t('modal.required')}</span>
                </label>
                <Input
                  placeholder={t('modal.briefingNamePlaceholder')}
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-[var(--orange)] h-12 text-base rounded-xl placeholder:text-[var(--text3)]"
                />
              </div>

              {/* ── Context (Collapsible) ────────────────────────── */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  className="flex items-center gap-2 text-sm font-semibold text-[var(--text2)] hover:text-[var(--text)] transition-colors w-full"
                >
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-xs font-bold text-[var(--text)]">2</span>
                  {t('modal.priorContext')}
                  <span className="text-[var(--text3)] text-xs font-normal">{t('modal.optional')}</span>
                  <ChevronDown className={`w-4 h-4 text-[var(--text3)] ml-auto transition-transform duration-300 ${showContext ? 'rotate-180' : ''}`} />
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
                          placeholder={t('modal.contextPlaceholder')}
                          value={initialContext}
                          onChange={(e) => setInitialContext(e.target.value)}
                          className="bg-[var(--bg)] border-[var(--bd)] min-h-[90px] focus-visible:ring-[var(--orange)] rounded-xl resize-y placeholder:text-[var(--text3)] text-sm"
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
                              className="text-[var(--orange)] hover:opacity-80 hover:bg-[var(--orange)]/10 text-xs gap-1.5 h-8 rounded-lg"
                            >
                              {isSuggesting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Wand2 className="w-3 h-3" />
                              )}
                              {isSuggesting ? t('modal.analyzing') : t('modal.aiSuggestPackages')}
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
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[var(--orange-light)] border border-[var(--orange-mid)]"
                  >
                    <Sparkles className="w-4 h-4 text-[var(--orange)] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-black italic leading-relaxed">{aiReasoning}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Package Selection ─────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[var(--text2)] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-xs font-bold text-[var(--text)]">3</span>
                    {t('modal.aiPackages')}
                  </label>
                  {selectedSlugs.length > 0 && (
                    <span className="text-[11px] text-[var(--text3)] font-mono flex items-center gap-2">
                      <span className="text-[var(--actext)] font-semibold">{selectedSlugs.length}</span> {t('modal.selected')}
                      <span className="text-[var(--text3)]">·</span>
                      ~<span className="text-[var(--text)] font-semibold">{totalQuestions}</span>{hasUnlimited ? '+∞' : ''} {t('modal.questions')}
                    </span>
                  )}
                </div>

                {loadingPackages ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 text-[var(--actext)] animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPackages).map(([dept, pkgs]) => (
                      <div key={dept}>
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--text3)] mb-2 px-0.5">
                          {t(`dept.${dept}`)}
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
                                    ? `bg-[var(--orange-light)] border-[var(--orange-mid)] shadow-sm text-[var(--orange)]`
                                    : 'border-[var(--bd)] bg-[var(--bg)] hover:bg-[var(--bg2)] hover:border-[var(--bd-strong)]'
                                  }
                                `}
                              >
                                <div className={`
                                  w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200
                                  ${isSelected
                                    ? 'border-[var(--orange)] bg-white'
                                    : 'border-[var(--bd-strong)] bg-[var(--bg2)]'
                                  }
                                `}>
                                  {isSelected && <CheckCircle2 className={`w-3 h-3 text-[var(--orange)]`} />}
                                </div>
                                <div className={`
                                  w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                  ${isSelected ? 'bg-white' : 'bg-[var(--bg3)]'}
                                `}>
                                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--orange)]' : 'text-[var(--text3)]'}`} />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[var(--text)]' : 'text-[var(--text2)]'}`}>
                                      {pkg.name}
                                    </span>
                                    {isAiSuggested && (
                                      <span className="shrink-0 text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-[var(--orange)]/10 text-[var(--orange)] border border-[var(--orange)]/20">
                                        IA
                                      </span>
                                    )}
                                    {pkg.is_default_enabled && !isAiSuggested && (
                                      <span className="shrink-0 text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-[var(--text2)] text-[var(--bg)] border border-[var(--text3)]">
                                        ON
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[var(--text3)] truncate mt-0.5 leading-snug">
                                    {pkg.description}
                                  </p>
                                </div>
                                <span className="text-[9px] font-mono text-[var(--text3)] shrink-0">
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

              {/* ── Access Password (optional, recommended) ─────── */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAccessPassword(!showAccessPassword)}
                  className="flex items-center gap-2 text-sm font-semibold text-[var(--text2)] hover:text-[var(--text)] transition-colors w-full"
                >
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-xs font-bold text-[var(--text)]">4</span>
                  {t('modal.accessPassword')}
                  <span className="text-amber-600 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                    {t('modal.recommended')}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[var(--text3)] ml-auto transition-transform duration-300 ${showAccessPassword ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAccessPassword && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        <p className="text-[11px] text-[var(--text3)] leading-relaxed">
                          {t('modal.accessPasswordDesc')}
                        </p>
                        <div className="relative">
                          <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)] pointer-events-none" />
                          <Input
                            value={accessPassword}
                            onChange={(e) => setAccessPassword(e.target.value)}
                            className="bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-amber-400 h-11 text-sm rounded-xl pl-10 placeholder:text-[var(--text3)]"
                            placeholder={t('modal.accessPasswordPlaceholder')}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Passphrase ────────────────────────────────────── */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[var(--text2)] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-xs font-bold text-[var(--text)]">5</span>
                    {t('modal.documentPassword')}
                  </label>
                  <button
                    type="button"
                    onClick={generateCoolPassphrase}
                    className="text-[var(--actext)] hover:underline text-xs flex items-center gap-1 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    {t('modal.generateAnother')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)] pointer-events-none" />
                  <Input
                    value={editPassphrase}
                    onChange={(e) => setEditPassphrase(e.target.value)}
                    className="bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-[var(--orange)] h-11 font-mono text-sm rounded-xl pl-10 placeholder:text-[var(--text3)]"
                    placeholder={t('modal.passphrasePlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* ── CTA ─────────────────────────────────────────────── */}
            <div className="pt-3 border-t border-[var(--bd)]">
              <Button
                onClick={generateSession}
                disabled={loading || !sessionName.trim() || selectedSlugs.length === 0}
                className="w-full h-12 text-base font-bold rounded-xl bg-[var(--orange)] hover:bg-[#e8552a] text-black transition-all duration-300 disabled:opacity-40 disabled:shadow-none gap-2 btn-pill"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('modal.preparingAI')}
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    {t('modal.generateLink')} ({selectedSlugs.length} {t('modal.packages')})
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
                <div className="w-16 h-16 rounded-full bg-[var(--acbg)] border border-[var(--acbd)] flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[var(--actext)]" />
                </div>
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-[var(--acbg)] animate-pulse" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg text-[var(--text)]">{t('modal.briefingCreated')}</h3>
                <p className="text-sm text-[var(--text3)] max-w-[280px]">
                  {t('modal.sendLinkAndPassword')}
                </p>
              </div>

              {/* Link Field */}
              <div className="w-full p-2 bg-[var(--bg2)] border border-[var(--bd)] rounded-xl">
                <Input
                  value={generatedLink}
                  readOnly
                  className="bg-transparent border-none focus-visible:ring-0 text-[var(--text)] text-xs h-8 font-mono w-full"
                />
              </div>

              <div className="w-full flex items-center gap-3">
                <Button
                  onClick={copyLinkOnly}
                  variant="outline"
                  className="flex-1 rounded-xl gap-2 font-semibold h-11 border-[var(--bd)] text-[var(--text)] hover:bg-[var(--bg2)]"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('modal.copied') : t('modal.copy')}
                </Button>
                <Button
                  onClick={handleShare}
                  variant="default"
                  className="flex-1 rounded-xl gap-2 font-semibold h-11 bg-[var(--orange)] hover:bg-[#e8552a] text-black"
                >
                  {shared ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Share2 className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{shared ? t('modal.copied') : (language === 'pt' ? 'Compartilhar' : language === 'es' ? 'Compartir' : 'Share')}</span>
                </Button>
              </div>

              {/* Access Password Display */}
              {accessPassword && (
                <div className="w-full flex flex-col items-center p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    <span className="text-[10px] text-amber-600/80 uppercase tracking-[0.15em] font-bold">
                      {t('modal.accessPasswordLabel')}
                    </span>
                  </div>
                  <span className="text-xl font-mono font-bold tracking-wider text-amber-600">
                    {accessPassword}
                  </span>
                  <p className="text-[10px] text-amber-700/70 text-center mt-2 max-w-[250px] leading-relaxed">
                    {t('modal.accessPasswordClientDesc')}
                  </p>
                </div>
              )}

              {/* Passphrase Display */}
              <div className="w-full flex flex-col items-center p-4 bg-[var(--bg2)] border border-[var(--bd)] rounded-xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lock className="w-3 h-3 text-[var(--text3)]" />
                  <span className="text-[10px] text-[var(--text3)] uppercase tracking-[0.15em] font-bold">
                    {t('modal.documentPasswordLabel')}
                  </span>
                </div>
                <span className={`text-xl font-mono font-bold tracking-wider ${editPassphrase ? 'text-[var(--text)]' : 'text-[var(--text3)] italic text-sm'}`}>
                  {editPassphrase || t('modal.notDefined')}
                </span>
                <p className="text-[10px] text-[var(--text3)] text-center mt-2 max-w-[250px] leading-relaxed">
                  {t('modal.documentPasswordDesc')}
                </p>
              </div>

              {/* Close */}
              <Button
                variant="outline"
                className="w-full border-[var(--bd)] text-[var(--text)] hover:bg-[var(--bg2)] rounded-xl h-10"
                onClick={() => setOpen(false)}
              >
                {t('modal.close')}
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

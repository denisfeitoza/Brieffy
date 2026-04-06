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
  children?: React.ReactElement;
}

export function GenerateLinkModal({ templateId, templateName, existingSession, children }: GenerateLinkModalProps) {
  const router = useRouter();
  const { t, language } = useDashboardLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'create' | 'done'>(existingSession ? 'done' : 'create');

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [initialContext, setInitialContext] = useState('');
  const [editPassphrase, setEditPassphrase] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
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
        setEditPassphrase(existingSession.edit_passphrase || '');
      } else {
        if (packages.length === 0) fetchPackages();
        // Do not auto-generate the passphrase so it remains genuinely optional
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
      const res = await fetch('/api/sessions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          sessionName: sessionName.trim(),
          initialContext: initialContext.trim(),
          selectedPackages: selectedSlugs,
          editPassphrase: editPassphrase.trim(),
          accessPassword: accessPassword.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || (language === 'pt' ? 'Erro ao gerar link.' : language === 'es' ? 'Error al generar enlace.' : 'Error generating link.'));
        setLoading(false);
        return;
      }

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

  const copyInviteMessage = async () => {
    const navLang = (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en').toLowerCase();
    let msgLang = 'en';
    if (navLang.startsWith('pt')) msgLang = 'pt';
    else if (navLang.startsWith('es')) msgLang = 'es';

    let msg = '';
    if (msgLang === 'pt') {
      msg = `Acesse aqui:\n${generatedLink}`;
      if (accessPassword) msg += `\n\n🔒 Senha de acesso: ${accessPassword}`;
      if (editPassphrase) msg += `\n\n🔑 Senha do documento final: ${editPassphrase}`;
    } else if (msgLang === 'es') {
      msg = `Accede aquí:\n${generatedLink}`;
      if (accessPassword) msg += `\n\n🔒 Contraseña de acceso: ${accessPassword}`;
      if (editPassphrase) msg += `\n\n🔑 Contraseña del documento final: ${editPassphrase}`;
    } else {
      msg = `Access here:\n${generatedLink}`;
      if (accessPassword) msg += `\n\n🔒 Access password: ${accessPassword}`;
      if (editPassphrase) msg += `\n\n🔑 Final document password: ${editPassphrase}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({ text: msg });
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
      {children ? (
        <DialogTrigger render={children} />
      ) : (
        <DialogTrigger
          render={
            <Button variant="ghost" className="text-[var(--actext)] hover:text-black hover:bg-[var(--acbg)] px-3 btn-pill">
              <Share2 className="w-4 h-4 mr-2" />
              {t('modal.generateLinkBtn')}
            </Button>
          }
        />
      )}

      <DialogContent 
        className={`bg-[var(--bg)] border-[var(--bd)] text-[var(--text)] transition-all duration-500 ${
          step === 'create' ? 'sm:max-w-[780px]' : 'sm:max-w-[460px]'
        }`}
        style={{ fontFamily: '"DM Sans", sans-serif' }}
      >

        {/* ========== STEP 1: CREATE (Unified) ========== */}
        {step === 'create' && (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[var(--text)] tracking-tight">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--acbg)] border border-[var(--acbd)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--actext)]" />
                </div>
                <span className="truncate">{t('modal.newBriefing')}</span>
              </DialogTitle>
              <DialogDescription className="text-[var(--text3)] text-xs sm:text-sm">
                {t('modal.intelligentEngine')}: <strong className="text-[var(--actext)] font-semibold inline-block max-w-full align-bottom truncate">{templateName}</strong>
              </DialogDescription>
            </DialogHeader>

            {/* Inner Content - Scrollable */}
            <div className="space-y-5 py-2 overflow-y-auto max-h-[55vh] sm:max-h-[60vh] pr-1 sm:pr-2">

              {/* ── Session Name ─────────────────────────────────── */}
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-[0.12em] uppercase text-[var(--text3)] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-xs font-bold text-[var(--text)]">1</span>
                  {t('modal.briefingName')} <span className="text-[var(--actext)] lowercase font-medium">({t('modal.required')})</span>
                </label>
                <Input
                  placeholder={t('modal.briefingNamePlaceholder')}
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-12 text-base rounded-full px-6 placeholder:text-[var(--text3)]"
                />
              </div>

              {/* ── Context (Collapsible) ────────────────────────── */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase text-[var(--text3)] hover:text-[var(--text)] transition-colors w-full"
                >
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-xs font-bold text-[var(--text)]">2</span>
                  {t('modal.priorContext')}
                  <span className="text-[var(--text3)] lowercase font-medium">({t('modal.optional')})</span>
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
                          className="bg-[var(--bg)] border-[var(--bd-strong)] min-h-[90px] focus-visible:ring-[var(--orange)] rounded-[32px] px-6 py-4 resize-y placeholder:text-[var(--text3)] text-sm"
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
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] sm:text-xs font-bold tracking-[0.12em] uppercase text-[var(--text3)] flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-[10px] sm:text-xs font-bold text-[var(--text)]">3</span>
                    <span className="truncate">{t('modal.aiPackages')}</span>
                  </label>
                  {selectedSlugs.length > 0 && (
                    <span className="text-[10px] sm:text-xs text-[var(--text3)] font-bold tracking-tight flex items-center gap-1 sm:gap-2 truncate">
                      <span className="text-[var(--actext)]">{selectedSlugs.length}</span> <span className="hidden sm:inline">{t('modal.selected').toUpperCase()}</span>
                      <span className="text-[var(--text3)] opacity-30">·</span>
                      ~<span className="text-[var(--text)]">{totalQuestions}</span>{hasUnlimited ? '+∞' : ''} <span className="hidden sm:inline">{t('modal.questions').toUpperCase()}</span>
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
                        <p className="text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase text-[var(--text3)] mb-2 px-0.5 truncate">
                          {t(`dept.${dept}`)}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {pkgs.map((pkg) => {
                            const isSelected = selectedSlugs.includes(pkg.slug);
                            const isAiSuggested = aiSuggestedSlugs.includes(pkg.slug);
                            const IconComp = ICON_MAP[pkg.icon] || Package;

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
                                    ? `bg-[var(--acbg)] border-[var(--acbd)] shadow-sm text-[var(--actext)]`
                                    : 'border-[var(--bd)] bg-[var(--bg)] hover:bg-[var(--bg2)] hover:border-[var(--bd-strong)]'
                                  }
                                `}
                              >
                                <div className={`
                                  w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200
                                  ${isSelected
                                    ? 'border-[var(--actext)] bg-white'
                                    : 'border-[var(--bd-strong)] bg-[var(--bg2)]'
                                  }
                                `}>
                                  {isSelected && <CheckCircle2 className={`w-3 h-3 text-[var(--actext)]`} />}
                                </div>
                                <div className={`
                                  w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                  ${isSelected ? 'bg-white' : 'bg-[var(--bg3)]'}
                                `}>
                                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--actext)]' : 'text-[var(--text3)]'}`} />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[var(--text)]' : 'text-[var(--text2)]'}`}>
                                      {pkg.name}
                                    </span>
                                    {isAiSuggested && (
                                      <span className="shrink-0 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-[var(--orange)]/10 text-[var(--orange)] border border-[var(--orange)]/20">
                                        IA
                                      </span>
                                    )}
                                    {pkg.is_default_enabled && !isAiSuggested && (
                                      <span className="shrink-0 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-[var(--text2)] text-[var(--bg)] border border-[var(--text3)]">
                                        ON
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[var(--text3)] truncate mt-0.5 leading-snug">
                                    {pkg.description}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono text-[var(--text3)] shrink-0">
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

              {/* ── Security & Passwords (Optional) ────────────────────────── */}
              <div className="space-y-4 pt-4 border-t border-[var(--bd)] mt-2">
                <label className="text-[10px] sm:text-xs font-bold tracking-[0.12em] uppercase text-[var(--text3)] flex items-center gap-2">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-[10px] sm:text-xs font-bold text-[var(--text)]">4</span>
                  Segurança & Senhas
                  <span className="text-[var(--text3)] lowercase font-medium ml-1">
                    ({t('modal.optional')})
                  </span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Access Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text3)] block truncate">
                      {t('modal.accessPasswordLabel')}
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)] pointer-events-none" />
                      <Input
                        value={accessPassword}
                        onChange={(e) => setAccessPassword(e.target.value)}
                        className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-11 text-sm rounded-full pl-10 pr-4 placeholder:text-[var(--text3)] transition-all"
                        placeholder="Ex: senha123"
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text3)] mt-1 px-1 leading-snug">
                      {t('modal.accessPasswordClientDesc')}
                    </p>
                  </div>

                  {/* Document Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text3)] block truncate">
                        {t('modal.documentPassword')}
                      </label>
                      <button
                        type="button"
                        onClick={generateCoolPassphrase}
                        className="text-[var(--actext)] hover:underline text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-1 transition-colors"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span className="hidden sm:inline">{t('modal.generateAnother')}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)] pointer-events-none" />
                      <Input
                        value={editPassphrase}
                        onChange={(e) => setEditPassphrase(e.target.value)}
                        className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-11 font-mono text-sm rounded-full pl-10 pr-4 placeholder:text-[var(--text3)] transition-all"
                        placeholder={t('modal.passphrasePlaceholder')}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text3)] mt-1 px-1 leading-snug">
                      {t('modal.documentPasswordDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CTA ─────────────────────────────────────────────── */}
            <div className="pt-4 border-t border-[var(--bd)] shrink-0 mt-auto">
              <Button
                onClick={generateSession}
                disabled={loading || !sessionName.trim() || selectedSlugs.length === 0}
                className="w-full h-12 text-sm font-bold rounded-full bg-[var(--orange)] hover:opacity-90 text-black transition-all duration-300 disabled:opacity-40 disabled:shadow-none gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('modal.preparingAI').toUpperCase()}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t('modal.generateLink').toUpperCase()} ({selectedSlugs.length} {t('modal.packages').toUpperCase()})
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
            <div className="flex flex-col items-center justify-center py-2 sm:py-6 space-y-4 sm:space-y-6">
              {/* Success Icon */}
              <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[var(--acbg)] border border-[var(--acbd)] flex items-center justify-center mb-1 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--actext)]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
                  {t('modal.readyToShare')}
                </h3>
                <p className="text-[var(--text3)] text-xs sm:text-sm max-w-[280px] leading-relaxed">
                  {t('modal.readyToShareSub')}
                </p>
              </div>

              <div className="w-full space-y-4 sm:space-y-6">
                {/* ── Direct Link ───────────────────────────────────── */}
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold tracking-[0.12em] uppercase text-[var(--text3)] flex items-center gap-2 px-1">
                    {t('modal.accessLink')}
                  </label>
                  <div className="flex items-center w-full gap-2 p-1.5 bg-[var(--bg2)] border border-[var(--bd)] rounded-full group transition-colors hover:border-[var(--bd-strong)] overflow-hidden">
                    <div className="pl-3 sm:pl-4 pr-1 sm:pr-2 text-xs sm:text-sm font-medium text-[var(--text2)] truncate flex-1 min-w-0">
                      <span className="hidden sm:inline">{generatedLink}</span>
                      <span className="inline sm:hidden">{generatedLink.split('/b/')[1] ? `b/${generatedLink.split('/b/')[1].slice(0,12)}...` : generatedLink}</span>
                    </div>
                    <Button
                      onClick={copyLinkOnly}
                      className="h-8 sm:h-9 px-3 sm:px-4 text-[10px] sm:text-xs font-bold rounded-full bg-black text-white hover:opacity-90 shrink-0 gap-1.5 sm:gap-2"
                    >
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">{t('modal.copyLink').toUpperCase()}</span>
                      <span className="inline sm:hidden">{t('modal.copy').toUpperCase()}</span>
                    </Button>
                  </div>
                </div>

                {/* ── Document Password ─────────────────────────────── */}
                {(editPassphrase || accessPassword) && (
                  <div className="flex flex-col gap-2">
                    {accessPassword && (
                      <div className="p-3 sm:p-4 bg-[var(--bg)] border border-[var(--bd)] rounded-2xl flex items-center justify-between gap-3 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] sm:text-xs font-bold tracking-[0.12em] uppercase text-[var(--text3)] block mb-0.5 sm:mb-1 truncate">
                            {t('modal.accessPasswordLabel')}
                          </label>
                          <code className="text-sm sm:text-lg font-bold text-[var(--text)] tracking-wider block truncate">
                            {accessPassword}
                          </code>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--bg2)] flex items-center justify-center text-[var(--text2)] shrink-0">
                          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>
                    )}
                    {editPassphrase && (
                      <div className="p-3 sm:p-4 bg-[var(--bg)] border border-[var(--bd)] rounded-2xl flex items-center justify-between gap-3 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] sm:text-xs font-bold tracking-[0.12em] uppercase text-[var(--text3)] block mb-0.5 sm:mb-1 truncate">
                            {t('modal.documentPassword')}
                          </label>
                          <code className="text-sm sm:text-lg font-bold text-[var(--text)] tracking-wider block truncate">
                            {editPassphrase}
                          </code>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--bg2)] flex items-center justify-center text-[var(--text2)] shrink-0">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Share CTA ─────────────────────────────────────── */}
                <div className="pt-1 sm:pt-2 w-full">
                  <Button
                    onClick={copyInviteMessage}
                    className="w-full h-11 sm:h-12 text-[10px] sm:text-sm font-bold rounded-full bg-[var(--orange)] hover:opacity-90 text-black transition-all gap-1.5 sm:gap-2 truncate"
                  >
                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">{t('modal.copyInviteMessage').toUpperCase()}</span>
                  </Button>
                  <p className="text-center text-[10px] sm:text-xs text-[var(--text3)] mt-2 sm:mt-3 font-medium px-2 truncate sm:whitespace-normal">
                    {t('modal.copyInviteMessageSub')}
                  </p>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-[var(--bd)]">
                <Button
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="w-full h-11 text-xs font-bold text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)] rounded-full uppercase tracking-wider"
                >
                  {t('modal.close')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

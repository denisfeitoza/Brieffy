'use client';

import {
  useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Share2, CheckCircle2, Copy, Package, Brain, Palette, Cpu, Megaphone, Headphones, DollarSign, Users, TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, ChevronDown, Wand2, Sparkles, Lock, Loader2, ShieldCheck, Target, X, RefreshCw
} from 'lucide-react';
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

// ── i18n helper for keys not yet in the dictionary ──────────────────
const LOCAL_T: Record<string, Record<string, string>> = {
  'modal.purpose': { pt: 'Propósito', en: 'Purpose', es: 'Propósito' },
  'modal.purposePlaceholder': {
    pt: 'Ex: Quero descobrir as maiores dores do meu cliente ideal...',
    en: 'E.g.: I want to discover my ideal client\'s biggest pain points...',
    es: 'Ej: Quiero descubrir los mayores dolores de mi cliente ideal...',
  },
  'modal.sensitivePoints': {
    pt: 'Pontos Sensíveis ou Limitadores',
    en: 'Sensitive Points or Limitations',
    es: 'Puntos Sensibles o Limitadores',
  },
  'modal.sensitivePointsPlaceholder': {
    pt: 'Ex: Evitar perguntas sobre faturamento...',
    en: 'E.g.: Avoid questions about revenue...',
    es: 'Ej: Evitar preguntas sobre facturación...',
  },
  'modal.securityPasswords': {
    pt: 'Segurança & Senhas',
    en: 'Security & Passwords',
    es: 'Seguridad y Contraseñas',
  },
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
  existingSession?: { id: string; edit_passphrase?: string | null; access_password?: string | null };
  children?: React.ReactElement;
}

export function GenerateLinkModal({ templateId, templateName, existingSession, children }: GenerateLinkModalProps) {
  const router = useRouter();
  const { t, language } = useDashboardLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'create' | 'done'>(existingSession ? 'done' : 'create');

  // Local translate helper
  const lt = (key: string) => LOCAL_T[key]?.[language] || LOCAL_T[key]?.['en'] || key;

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [initialContext, setInitialContext] = useState('');
  const [briefingPurpose, setBriefingPurpose] = useState('');
  const [depthSignals, setDepthSignals] = useState<string[]>([]);
  const [newSignal, setNewSignal] = useState('');
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
        setAccessPassword(existingSession.access_password || '');
      } else {
        if (packages.length === 0) fetchPackages();
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
          setBriefingPurpose('');
          setDepthSignals([]);
          setNewSignal('');
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

  const canSubmit = sessionName.trim() && briefingPurpose.trim() && selectedSlugs.length > 0 && !loading;

  const generateSession = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/sessions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          sessionName: sessionName.trim(),
          initialContext: initialContext.trim(),
          briefingPurpose: briefingPurpose.trim(),
          depthSignals,
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
    // Use dashboard language instead of navigator.language
    const msgLang = language;

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
        className="!max-w-none sm:!max-w-none w-[calc(100vw-1.5rem)] sm:w-[min(720px,calc(100vw-3rem))] bg-[var(--bg)] border-[var(--bd)] text-[var(--text)] p-0 gap-0 overflow-hidden"
        style={{ fontFamily: '"DM Sans", sans-serif' }}
      >
        {/* ========== STEP 1: CREATE ========== */}
        {step === 'create' && (
          <div className="flex flex-col max-h-[calc(100dvh-3rem)]">
            {/* Fixed header */}
            <DialogHeader className="shrink-0 px-5 pt-5 pb-3 sm:px-6 sm:pt-6 border-b border-[var(--bd)]">
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-[var(--text)] tracking-tight">
                <div className="w-8 h-8 rounded-xl bg-[var(--acbg)] border border-[var(--acbd)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[var(--actext)]" />
                </div>
                <span className="truncate">{t('modal.newBriefing')}</span>
              </DialogTitle>
              <DialogDescription className="text-[var(--text3)] text-xs">
                {t('modal.intelligentEngine')}: <strong className="text-[var(--actext)] font-semibold">{templateName}</strong>
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5 space-y-5">

              {/* ── 1. Session Name ────────────────── */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-[11px] font-bold text-[var(--text)]">1</span>
                  {t('modal.briefingName')} <span className="text-[var(--actext)]">*</span>
                </label>
                <Input
                  placeholder={t('modal.briefingNamePlaceholder')}
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-11 text-sm rounded-full px-4 placeholder:text-[var(--text3)]"
                />
              </div>

              {/* ── 2. Briefing Purpose ────────────── */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-[11px] font-bold text-[var(--text)]">2</span>
                  {lt('modal.purpose')} <span className="text-[var(--actext)]">*</span>
                </label>
                <Input
                  placeholder={lt('modal.purposePlaceholder')}
                  value={briefingPurpose}
                  onChange={(e) => setBriefingPurpose(e.target.value)}
                  className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-11 text-sm rounded-full px-4 placeholder:text-[var(--text3)]"
                />
              </div>

              {/* ── 3. Context (Collapsible) ──────── */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] hover:text-[var(--text)] transition-colors w-full"
                >
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-[11px] font-bold text-[var(--text)]">3</span>
                  {t('modal.priorContext')}
                  <span className="text-[var(--text3)] lowercase font-medium">{t('modal.optional')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--text3)] ml-auto transition-transform duration-300 ${showContext ? 'rotate-180' : ''}`} />
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
                      <div className="space-y-2 pt-1">
                        <Textarea
                          placeholder={t('modal.contextPlaceholder')}
                          value={initialContext}
                          onChange={(e) => setInitialContext(e.target.value)}
                          className="bg-[var(--bg)] border-[var(--bd-strong)] min-h-[80px] focus-visible:ring-[var(--orange)] rounded-2xl px-4 py-3 resize-y placeholder:text-[var(--text3)] text-sm"
                        />
                        {initialContext.trim() && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={suggestPackages}
                              disabled={isSuggesting}
                              className="text-[var(--orange)] hover:opacity-80 hover:bg-[var(--orange)]/10 text-xs gap-1.5 h-7 rounded-lg"
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

              {/* ── 4. Depth Signals ──────────────── */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-[11px] font-bold text-[var(--text)]">4</span>
                  {lt('modal.sensitivePoints')} <span className="text-[var(--text3)] lowercase font-medium">{t('modal.optional')}</span>
                </label>

                {depthSignals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {depthSignals.map(signal => (
                      <span 
                        key={signal}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg2)] border border-[var(--bd)] text-xs font-medium text-[var(--text)]"
                      >
                        {signal}
                        <button
                          type="button"
                          onClick={() => removeSignal(signal)}
                          className="w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text3)] pointer-events-none" />
                  <Input
                    value={newSignal}
                    onChange={handleSignalChange}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSignal(); } }}
                    placeholder={lt('modal.sensitivePointsPlaceholder')}
                    className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-10 rounded-xl text-sm pl-9 placeholder:text-[var(--text3)]"
                  />
                </div>
              </div>

              {/* ── AI Reasoning Feedback ─────────── */}
              <AnimatePresence>
                {aiReasoning && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--orange-light)] border border-[var(--orange-mid)]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--orange)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-black italic leading-relaxed">{aiReasoning}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── 5. Package Selection ──────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] flex items-center gap-1.5 shrink-0">
                    <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-[11px] font-bold text-[var(--text)]">5</span>
                    <span className="truncate">{t('modal.aiPackages')}</span>
                  </label>
                  {selectedSlugs.length > 0 && (
                    <span className="text-[10px] text-[var(--text3)] font-bold tracking-tight flex items-center gap-1 whitespace-nowrap">
                      <span className="text-[var(--actext)]">{selectedSlugs.length}</span> {t('modal.selected').toUpperCase()}
                      <span className="opacity-30">·</span>
                      ~<span className="text-[var(--text)]">{totalQuestions}</span>{hasUnlimited ? '+∞' : ''} {t('modal.questions').toUpperCase()}
                    </span>
                  )}
                </div>

                {loadingPackages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-[var(--actext)] animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(groupedPackages).map(([dept, pkgs]) => (
                      <div key={dept}>
                        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--text3)] mb-1.5 truncate flex items-center gap-1.5">
                          {(() => {
                            const DeptIcon = DEPT_ICON_MAP[dept] || Package;
                            return <DeptIcon className="w-3.5 h-3.5" />;
                          })()}
                          {t(`dept.${dept}`)}
                        </div>
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
                                  relative flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all duration-200
                                  border cursor-pointer outline-none min-w-0
                                  ${isSelected
                                    ? 'bg-[var(--acbg)] border-[var(--acbd)] shadow-sm text-[var(--actext)]'
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
                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-[var(--actext)]" />}
                                </div>
                                <div className={`
                                  w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                  ${isSelected ? 'bg-white' : 'bg-[var(--bg3)]'}
                                `}>
                                  <IconComp className={`w-3 h-3 ${isSelected ? 'text-[var(--actext)]' : 'text-[var(--text3)]'}`} />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[var(--text)]' : 'text-[var(--text2)]'}`}>
                                      {pkg.name}
                                    </span>
                                    {isAiSuggested && (
                                      <span className="shrink-0 text-[9px] font-bold tracking-wider uppercase px-1 py-px rounded-full bg-[var(--orange)]/10 text-[var(--orange)] border border-[var(--orange)]/20">
                                        IA
                                      </span>
                                    )}
                                    {pkg.is_default_enabled && !isAiSuggested && (
                                      <span className="shrink-0 text-[9px] font-bold tracking-wider uppercase px-1 py-px rounded-full bg-[var(--text2)] text-[var(--bg)] border border-[var(--text3)]">
                                        ON
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[var(--text3)] truncate leading-snug">
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

              {/* ── 6. Security & Passwords ──────── */}
              <div className="space-y-3 pt-3 border-t border-[var(--bd)]">
                <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-[11px] font-bold text-[var(--text)]">6</span>
                  {lt('modal.securityPasswords')}
                  <span className="text-[var(--text3)] lowercase font-medium">{t('modal.optional')}</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Access Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] block">
                      {t('modal.accessPasswordLabel')}
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text3)] pointer-events-none" />
                      <Input
                        value={accessPassword}
                        onChange={(e) => setAccessPassword(e.target.value)}
                        className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-10 text-sm rounded-full pl-9 pr-3 placeholder:text-[var(--text3)]"
                        placeholder="Ex: senha123"
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text3)] leading-snug">
                      {t('modal.accessPasswordClientDesc')}
                    </p>
                  </div>

                  {/* Document Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] block">
                        {t('modal.documentPassword')}
                      </label>
                      <button
                        type="button"
                        onClick={generateCoolPassphrase}
                        className="text-[var(--actext)] hover:underline text-[10px] font-bold tracking-wider flex items-center gap-1 transition-colors"
                      >
                        <Wand2 className="w-2.5 h-2.5" />
                        {t('modal.generateAnother')}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text3)] pointer-events-none" />
                      <Input
                        value={editPassphrase}
                        onChange={(e) => setEditPassphrase(e.target.value)}
                        className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-10 font-mono text-sm rounded-full pl-9 pr-3 placeholder:text-[var(--text3)]"
                        placeholder={t('modal.passphrasePlaceholder')}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text3)] leading-snug">
                      {t('modal.documentPasswordDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Fixed CTA ──────────────────────── */}
            <div className="shrink-0 px-5 py-3 sm:px-6 sm:py-4 border-t border-[var(--bd)] bg-[var(--bg)]">
              <Button
                onClick={generateSession}
                disabled={!canSubmit}
                className="w-full h-11 text-sm font-bold rounded-full bg-[var(--orange)] hover:opacity-90 text-black transition-all duration-300 disabled:opacity-40 disabled:shadow-none gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
          </div>
        )}

        {/* ========== STEP 2: DONE ========== */}
        {step === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 py-5 sm:px-6 sm:py-6 max-w-md mx-auto w-full"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Success Icon */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-[var(--acbg)] border border-[var(--acbd)] flex items-center justify-center mb-1 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-7 h-7 text-[var(--actext)]" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--text)]">
                  {t('modal.readyToShare')}
                </h3>
                <p className="text-[var(--text3)] text-xs max-w-[260px] leading-relaxed">
                  {t('modal.readyToShareSub')}
                </p>
              </div>

              <div className="w-full space-y-4">
                {/* ── Direct Link ──────────────────── */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--text3)] flex items-center gap-2 px-1">
                    {t('modal.accessLink')}
                  </label>
                  <div className="flex items-center w-full gap-2 p-1.5 bg-[var(--bg2)] border border-[var(--bd)] rounded-full overflow-hidden">
                    <div className="pl-3 pr-1 text-xs font-medium text-[var(--text2)] truncate flex-1 min-w-0">
                      {generatedLink}
                    </div>
                    <Button
                      onClick={copyLinkOnly}
                      className="h-8 px-3 text-[10px] font-bold rounded-full bg-black text-white hover:opacity-90 shrink-0 gap-1.5"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          {t('modal.copied').toUpperCase()}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          {t('modal.copy').toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* ── Passwords Display ────────────── */}
                {(editPassphrase || accessPassword) && (
                  <div className="flex flex-col gap-2">
                    {accessPassword && (
                      <div className="p-3 bg-[var(--bg)] border border-[var(--bd)] rounded-2xl flex items-center justify-between gap-3 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] block mb-0.5">
                            {t('modal.accessPasswordLabel')}
                          </label>
                          <code className="text-sm font-bold text-[var(--text)] tracking-wider block truncate">
                            {accessPassword}
                          </code>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[var(--bg2)] flex items-center justify-center text-[var(--text2)] shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                    {editPassphrase && (
                      <div className="p-3 bg-[var(--bg)] border border-[var(--bd)] rounded-2xl flex items-center justify-between gap-3 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)] block mb-0.5">
                            {t('modal.documentPassword')}
                          </label>
                          <code className="text-sm font-bold text-[var(--text)] tracking-wider block truncate">
                            {editPassphrase}
                          </code>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[var(--bg2)] flex items-center justify-center text-[var(--text2)] shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Share CTA ───────────────────── */}
                <div className="w-full pt-1">
                  <Button
                    onClick={copyInviteMessage}
                    className="w-full h-11 text-xs font-bold rounded-full bg-[var(--orange)] hover:opacity-90 text-black transition-all gap-1.5"
                  >
                    {shared ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t('modal.copied').toUpperCase()}</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t('modal.copyInviteMessage').toUpperCase()}</span>
                      </>
                    )}
                  </Button>
                  <p className="text-center text-[10px] text-[var(--text3)] mt-2 font-medium">
                    {t('modal.copyInviteMessageSub')}
                  </p>
                </div>
              </div>

              <div className="w-full pt-3 border-t border-[var(--bd)]">
                <Button
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="w-full h-10 text-xs font-bold text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)] rounded-full uppercase tracking-wider"
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

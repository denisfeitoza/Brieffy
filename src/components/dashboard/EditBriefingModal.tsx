'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Brain, Palette, Cpu,
  Megaphone, Headphones, DollarSign, Users, TrendingUp, Truck,
  Lightbulb, Shield, Server, ShoppingCart, Video,
  ChevronDown, Wand2, Sparkles, Loader2, CheckCircle2, Edit2, Lock, ShieldCheck, Target, X
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

const ICON_MAP: Record<string, React.ElementType> = {
  Palette, Brain, Cpu, Megaphone, Headphones, DollarSign, Users,
  TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, Package,
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
  'modal.editBriefing': {
    pt: 'Editar Briefing',
    en: 'Edit Briefing',
    es: 'Editar Briefing',
  },
  'modal.editDesc': {
    pt: 'Atualize as informações que a IA usará durante a sessão.',
    en: 'Update the information the AI will use during the session.',
    es: 'Actualiza la información que utilizará la IA durante la sesión.',
  },
  'modal.editBtn': {
    pt: 'Editar',
    en: 'Edit',
    es: 'Editar',
  },
  'modal.cancel': {
    pt: 'Cancelar',
    en: 'Cancel',
    es: 'Cancelar',
  },
  'modal.saving': {
    pt: 'Salvando...',
    en: 'Saving...',
    es: 'Guardando...',
  },
  'modal.saveChanges': {
    pt: 'Salvar Alterações',
    en: 'Save Changes',
    es: 'Guardar Cambios',
  },
  'modal.remove': {
    pt: 'Remover',
    en: 'Remove',
    es: 'Eliminar',
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

interface EditBriefingModalProps {
  sessionId: string;
  initialName: string;
  initialContextValue: string;
  initialPackages: string[];
  initialPassphrase?: string;
  initialAccessPassword?: string;
  initialPurpose?: string;
  initialDepthSignals?: string[];
  isLocked?: boolean;
  children?: React.ReactElement;
}

export function EditBriefingModal({ sessionId, initialName, initialContextValue, initialPackages, initialPassphrase, initialAccessPassword, initialPurpose, initialDepthSignals, isLocked, children }: EditBriefingModalProps) {
  const router = useRouter();
  const { t, language } = useDashboardLanguage();
  const [open, setOpen] = useState(false);

  // Local translate helper
  const lt = (key: string) => LOCAL_T[key]?.[language] || LOCAL_T[key]?.['en'] || key;

  // Form state
  const [sessionName, setSessionName] = useState(initialName || '');
  const [initialContext, setInitialContext] = useState(initialContextValue || '');
  const [briefingPurpose, setBriefingPurpose] = useState(initialPurpose || '');
  const [depthSignals, setDepthSignals] = useState<string[]>(initialDepthSignals || []);
  const [newSignal, setNewSignal] = useState('');
  const [editPassphrase, setEditPassphrase] = useState(initialPassphrase || '');
  const [accessPassword, setAccessPassword] = useState(initialAccessPassword || '');
  const [showContext, setShowContext] = useState(false);

  // Package state
  const [packages, setPackages] = useState<CategoryPackage[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialPackages || []);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [aiSuggestedSlugs, setAiSuggestedSlugs] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Result state
  const [saving, setSaving] = useState(false);

  const generateCoolPassphrase = useCallback(() => {
    const words = PASSPHRASE_WORDS[language] || PASSPHRASE_WORDS.en;
    const newPassphrase = Array.from({ length: 4 }, () =>
      words[Math.floor(Math.random() * words.length)]
    ).join('-');
    setEditPassphrase(newPassphrase);
  }, [language]);

  useEffect(() => {
    if (open) {
      if (packages.length === 0) fetchPackages();
      // Reset to original values on open to ensure it's fresh if discarded previously
      setSessionName(initialName || '');
      setInitialContext(initialContextValue || '');
      setBriefingPurpose(initialPurpose || '');
      setDepthSignals(initialDepthSignals || []);
      setNewSignal('');
      setEditPassphrase(initialPassphrase || '');
      setAccessPassword(initialAccessPassword || '');
      setSelectedSlugs(initialPackages || []);
      setAiSuggestedSlugs([]);
      setAiReasoning('');
      setShowContext(!!initialContextValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialName, initialContextValue, initialPackages, initialPassphrase, initialAccessPassword, initialPurpose, initialDepthSignals]);

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await fetch('/api/briefing/packages');
      const data = await res.json();
      setPackages(data || []);
      if (!initialPackages || initialPackages.length === 0) {
        const defaults = (data || [])
          .filter((p: CategoryPackage) => p.is_default_enabled)
          .map((p: CategoryPackage) => p.slug);
        setSelectedSlugs(defaults);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoadingPackages(false);
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
        body: JSON.stringify({
          initialContext: initialContext.trim(),
          chosenLanguage: language === 'pt' ? 'português' : language === 'es' ? 'español' : 'english',
        }),
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

  const canSave = sessionName.trim() && briefingPurpose.trim() && selectedSlugs.length > 0 && !saving;

  const saveChanges = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName: sessionName.trim(),
          initialContext: initialContext.trim(),
          briefingPurpose: briefingPurpose.trim(),
          depthSignals,
          selectedPackages: selectedSlugs,
          editPassphrase: editPassphrase.trim() || undefined,
          accessPassword: accessPassword.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || (language === 'pt' ? 'Erro ao salvar alterações.' : language === 'es' ? 'Error al guardar.' : 'Error saving changes.'));
        setSaving(false);
        return;
      }

      toast.success(language === 'pt' ? 'Alterações salvas com sucesso!' : language === 'es' ? '¡Cambios guardados con éxito!' : 'Changes saved successfully!');
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error('Error updating session:', err);
      toast.error(language === 'pt' ? 'Erro ao salvar alterações.' : language === 'es' ? 'Error al guardar.' : 'Error saving changes.');
    } finally {
      setSaving(false);
    }
  };

  const groupedPackages = packages.reduce((acc, pkg) => {
    const dept = pkg.department || 'general';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(pkg);
    return acc;
  }, {} as Record<string, CategoryPackage[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger render={children} />
      ) : (
        <DialogTrigger
          render={
            <Button variant="outline" className="h-8 px-3 gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text2)] border-[var(--bd-strong)] bg-[var(--bg)] hover:bg-[var(--bg2)] hover:text-[var(--text)]">
              <Edit2 className="w-3.5 h-3.5" />
              {lt('modal.editBtn')}
            </Button>
          }
        />
      )}

      <DialogContent
        className="!max-w-none sm:!max-w-none w-[calc(100vw-1.5rem)] sm:w-[min(720px,calc(100vw-3rem))] bg-[var(--bg)] border-[var(--bd)] text-[var(--text)] p-0 gap-0 overflow-hidden"
        style={{ fontFamily: '"DM Sans", sans-serif' }}
      >
        <div className="flex flex-col max-h-[calc(100dvh-3rem)]">
          {/* Fixed header */}
          <DialogHeader className="shrink-0 px-5 pt-5 pb-3 sm:px-6 sm:pt-6 border-b border-[var(--bd)]">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-[var(--text)] tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-[var(--acbg)] border border-[var(--acbd)] flex items-center justify-center shrink-0">
                <Edit2 className="w-4 h-4 text-[var(--actext)]" />
              </div>
              <span className="truncate">{lt('modal.editBriefing')}</span>
            </DialogTitle>
            <DialogDescription className="text-[var(--text3)] text-xs">
              {lt('modal.editDesc')}
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
                disabled={isLocked}
                className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-11 text-sm rounded-full px-4 placeholder:text-[var(--text3)] disabled:opacity-50"
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
                        disabled={isLocked}
                        className="bg-[var(--bg)] border-[var(--bd-strong)] min-h-[80px] focus-visible:ring-[var(--orange)] rounded-2xl px-4 py-3 resize-y placeholder:text-[var(--text3)] text-sm disabled:opacity-50"
                      />
                      {initialContext.trim() && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={suggestPackages}
                            disabled={isSuggesting || isLocked}
                            className="text-[var(--orange)] hover:opacity-80 hover:bg-[var(--orange)]/10 text-xs gap-1.5 h-7 rounded-lg disabled:opacity-50"
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
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => removeSignal(signal)}
                          className="w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text3)] pointer-events-none" />
                <Input
                  value={newSignal}
                  onChange={handleSignalChange}
                  disabled={isLocked}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSignal(); } }}
                  placeholder={lt('modal.sensitivePointsPlaceholder')}
                  className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-10 rounded-xl text-sm pl-9 placeholder:text-[var(--text3)] disabled:opacity-50"
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
                  className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--orange)]/10 border border-[var(--orange)]/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--orange)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text)] italic leading-relaxed">{aiReasoning}</p>
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
                      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--text3)] mb-1.5 truncate">
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
                              onClick={() => !isLocked && togglePackage(pkg.slug)}
                              type="button"
                              disabled={isLocked}
                              whileTap={isLocked ? {} : { scale: 0.98 }}
                              className={`
                                relative flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all duration-200
                                border outline-none min-w-0
                                ${isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                                ${isSelected
                                  ? 'bg-[var(--acbg)] border-[var(--acbd)] shadow-sm text-[var(--actext)]'
                                  : 'border-[var(--bd)] bg-[var(--bg)] hover:bg-[var(--bg2)] hover:border-[var(--bd-strong)]'
                                }
                              `}
                            >
                              <div className={`
                                w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200
                                ${isSelected
                                  ? 'border-[var(--actext)] bg-[var(--bg)]'
                                  : 'border-[var(--bd-strong)] bg-[var(--bg2)]'
                                }
                              `}>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-[var(--actext)]" />}
                              </div>
                              <div className={`
                                w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                ${isSelected ? 'bg-[var(--bg)]' : 'bg-[var(--bg3)]'}
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
                      disabled={isLocked}
                      className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-10 text-sm rounded-full pl-9 pr-3 placeholder:text-[var(--text3)] disabled:opacity-50"
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
                    <div className="flex items-center gap-2">
                      {editPassphrase && !isLocked && (
                        <button
                          type="button"
                          onClick={() => setEditPassphrase('')}
                          className="text-red-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          {lt('modal.remove')}
                        </button>
                      )}
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={generateCoolPassphrase}
                          className="text-[var(--actext)] hover:underline text-[10px] font-bold tracking-wider flex items-center gap-1 transition-colors"
                        >
                          <Wand2 className="w-2.5 h-2.5" />
                          {t('modal.generateAnother')}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text3)] pointer-events-none" />
                    <Input
                      value={editPassphrase}
                      onChange={(e) => setEditPassphrase(e.target.value)}
                      disabled={isLocked}
                      className="bg-[var(--bg)] border-[var(--bd-strong)] focus-visible:ring-[var(--orange)] h-10 font-mono text-sm rounded-full pl-9 pr-3 placeholder:text-[var(--text3)] disabled:opacity-50"
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
          <div className="shrink-0 px-5 py-3 sm:px-6 sm:py-4 border-t border-[var(--bd)] bg-[var(--bg)] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)] rounded-full h-10 px-4 text-xs font-bold"
            >
              {lt('modal.cancel')}
            </Button>
            <Button
              onClick={saveChanges}
              disabled={!canSave}
              className="h-10 px-6 font-bold rounded-full bg-[var(--orange)] hover:opacity-90 text-black transition-all disabled:opacity-40 gap-2 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {lt('modal.saving')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {lt('modal.saveChanges')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

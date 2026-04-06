'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Brain, Palette, Cpu,
  Megaphone, Headphones, DollarSign, Users, TrendingUp, Truck,
  Lightbulb, Shield, Server, ShoppingCart, Video,
  ChevronDown, Wand2, Sparkles, Loader2, CheckCircle2, Edit2, Lock, ShieldCheck
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
  children?: React.ReactElement;
}

export function EditBriefingModal({ sessionId, initialName, initialContextValue, initialPackages, initialPassphrase, initialAccessPassword, children }: EditBriefingModalProps) {
  const router = useRouter();
  const { t, language } = useDashboardLanguage();
  const [open, setOpen] = useState(false);

  // Form state
  const [sessionName, setSessionName] = useState(initialName || '');
  const [initialContext, setInitialContext] = useState(initialContextValue || '');
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
      setEditPassphrase(initialPassphrase || '');
      setAccessPassword(initialAccessPassword || '');
      setSelectedSlugs(initialPackages || []);
      setAiSuggestedSlugs([]);
      setAiReasoning('');
      setShowContext(!!initialContextValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialName, initialContextValue, initialPackages, initialPassphrase, initialAccessPassword]);

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

  const saveChanges = async () => {
    if (!sessionName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName: sessionName.trim(),
          initialContext: initialContext.trim(),
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
      router.refresh(); // Refresh the active page to reflect changes
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
              Editar
            </Button>
          }
        />
      )}

      <DialogContent 
        className="bg-[var(--bg)] border-[var(--bd)] text-[var(--text)] transition-all duration-500 sm:max-w-[780px]"
        style={{ fontFamily: '"DM Sans", sans-serif' }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[var(--text)] tracking-tight">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--acbg)] border border-[var(--acbd)] flex items-center justify-center shrink-0">
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--actext)]" />
            </div>
            <span className="truncate">Editar Briefing</span>
          </DialogTitle>
          <DialogDescription className="text-[var(--text3)] text-xs sm:text-sm">
            {language === 'pt' ? 'Atualize as informações que a IA usará durante a sessão.' : language === 'es' ? 'Actualiza la información que utilizará la IA durante la sesión.' : 'Update the information the AI will use during the session.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
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
                  <div className="space-y-2 pt-1 border-t border-transparent">
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
                          className="text-[var(--orange)] hover:opacity-80 hover:bg-[var(--orange)]/10 text-xs gap-1.5 h-8 rounded-lg mt-1"
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
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[var(--orange-light)] border border-[var(--orange-mid)] mt-1"
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
              <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
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

          {/* ── Security & Passwords ────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-[var(--bd)] mt-2">
            <label className="text-[10px] sm:text-xs font-bold tracking-[0.12em] uppercase text-[var(--text3)] flex items-center gap-2">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[var(--bg2)] flex items-center justify-center text-[10px] sm:text-xs font-bold text-[var(--text)]">4</span>
              Segurança & Senhas
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Access Password */}
              <div className="space-y-2">
                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text3)] block truncate">
                  {t('modal.accessPasswordLabel') || 'Senha de Acesso'}
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
                  {t('modal.accessPasswordClientDesc') || 'Exigida para acessar o briefing'}
                </p>
              </div>

              {/* Document Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text3)] block truncate">
                    {t('modal.documentPassword')}
                  </label>
                  <div className="flex items-center gap-3">
                    {editPassphrase && (
                      <button
                        type="button"
                        onClick={() => setEditPassphrase('')}
                        className="text-red-400 hover:text-red-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        {language === 'pt' ? 'Remover' : language === 'es' ? 'Eliminar' : 'Remove'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={generateCoolPassphrase}
                      className="text-[var(--actext)] hover:underline text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span className="hidden sm:inline">{t('modal.generateAnother')}</span>
                    </button>
                  </div>
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
                  {t('modal.documentPasswordDesc') || 'Define quem pode ver o doc final'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div className="pt-4 border-t border-[var(--bd)] flex justify-end gap-3 mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)]"
          >
            {language === 'pt' ? 'Cancelar' : language === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saving || !sessionName.trim() || selectedSlugs.length === 0}
            className="h-10 px-6 font-bold rounded-full bg-[var(--orange)] hover:opacity-90 text-black transition-all disabled:opacity-40 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'pt' ? 'Salvando...' : language === 'es' ? 'Guardando...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {language === 'pt' ? 'Salvar Alterações' : language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

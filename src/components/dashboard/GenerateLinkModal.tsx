'use client';

import { useState, useEffect } from 'react';
import { Share2, CheckCircle2, ChevronRight, Copy, Package, Brain, Palette, Cpu, Megaphone, Headphones, DollarSign, Users, TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, ChevronLeft, Wand2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, React.ElementType> = {
  Palette, Brain, Cpu, Megaphone, Headphones, DollarSign, Users,
  TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, Package,
};

// Department color map
const DEPT_COLORS: Record<string, string> = {
  branding: 'from-violet-500/20 to-purple-600/20 border-violet-500/30',
  technology: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30',
  marketing: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  operations: 'from-emerald-500/20 to-green-600/20 border-emerald-500/30',
  finance: 'from-yellow-500/20 to-amber-600/20 border-yellow-500/30',
  people: 'from-pink-500/20 to-rose-600/20 border-pink-500/30',
  commercial: 'from-blue-500/20 to-indigo-600/20 border-blue-500/30',
  product: 'from-teal-500/20 to-cyan-600/20 border-teal-500/30',
  legal: 'from-slate-500/20 to-gray-600/20 border-slate-500/30',
  digital: 'from-fuchsia-500/20 to-pink-600/20 border-fuchsia-500/30',
  content: 'from-lime-500/20 to-green-500/20 border-lime-500/30',
  general: 'from-neutral-500/20 to-zinc-600/20 border-neutral-500/30',
};

interface CategoryPackage {
  id: string;
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
  const [step, setStep] = useState<'info' | 'packages' | 'done'>('info');
  
  // Step 1: Info
  const [sessionName, setSessionName] = useState('');
  const [initialContext, setInitialContext] = useState('');
  const [editPassphrase, setEditPassphrase] = useState('');
  
  // Step 2: Package Selection
  const [packages, setPackages] = useState<CategoryPackage[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  
  // Step 3: Result
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch packages on mount
  useEffect(() => {
    if (open) {
      if (packages.length === 0) fetchPackages();
      if (!editPassphrase) generateCoolPassphrase();
    }
  }, [open, packages.length, editPassphrase]);

  const generateCoolPassphrase = () => {
    const words = ["azul", "sol", "luz", "mar", "rio", "som", "flor", "dia", "mel", "ceu", "lua", "cor", "fim", "paz", "voo", "voz", "ar", "bom", "cais", "eco", "neon", "zen", "nova", "fox", "leo", "max", "pro", "one", "top", "vip", "astro", "cyber", "nexus", "prime", "alpha", "omega", "apex"];
    const newPassphrase = Array.from({length: 4}, () => words[Math.floor(Math.random() * words.length)]).join("-");
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
        setStep('info');
        setSessionName('');
        setInitialContext('');
        setEditPassphrase('');
        setGeneratedLink('');
        setCopied(false);
        // Re-select defaults
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

  const totalQuestions = selectedSlugs.reduce((sum, slug) => {
    const pkg = packages.find(p => p.slug === slug);
    if (!pkg) return sum;
    if (pkg.max_questions === null) return sum; // unlimited doesn't count toward total
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
      // Get authenticated user for RLS compliance
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('briefing_sessions')
        .insert([{
          template_id: templateId,
          session_name: sessionName,
          initial_context: initialContext,
          selected_packages: selectedSlugs,
          edit_passphrase: editPassphrase.trim() || undefined,
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
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group packages by department
  const groupedPackages = packages.reduce((acc, pkg) => {
    const dept = pkg.department || 'general';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(pkg);
    return acc;
  }, {} as Record<string, CategoryPackage[]>);

  const deptLabels: Record<string, string> = {
    branding: '🎨 Branding',
    technology: '⚙️ Technology',
    marketing: '📊 Marketing',
    operations: '🔄 Operations',
    finance: '💰 Finance',
    people: '👥 People',
    commercial: '📈 Commercial',
    product: '💡 Product',
    legal: '🛡️ Legal',
    digital: '🛒 Digital',
    content: '🎬 Content',
    general: '📦 General',
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 px-3">
          <Share2 className="w-4 h-4 mr-2" />
          Gerar Link do Cliente
        </Button>
      } />

      <DialogContent className={`bg-zinc-950 border-white/10 text-white transition-all duration-300 ${
        step === 'packages' ? 'sm:max-w-[720px]' : 'sm:max-w-[425px]'
      }`}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 'info' && 'Parametrizar Sessão'}
            {step === 'packages' && '🧩 Selecionar Pacotes de IA'}
            {step === 'done' && 'Link Gerado'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {step === 'info' && (
              <>Criando link baseado no motor inteligente <strong className="text-cyan-400">{templateName}</strong>.</>
            )}
            {step === 'packages' && (
              <>Cada pacote é uma <strong className="text-cyan-400">skill de IA</strong> especializada que aprofunda em perguntas únicas do setor.</>
            )}
            {step === 'done' && 'Envie este link seguro para o seu cliente iniciar o briefing adaptativo.'}
          </DialogDescription>
        </DialogHeader>

        {/* ========== STEP 1: INFO ========== */}
        {step === 'info' && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sessionName" className="text-zinc-300">
                Nome da Sessão (Ex: Nome do Cliente/Projeto) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sessionName"
                placeholder="Ex: Empresa Acme Corp"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-cyan-500"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="initialContext" className="text-zinc-300">
                O que você já sabe sobre essa empresa? (Contexto Oculto)
              </Label>
              <Textarea
                id="initialContext"
                placeholder="Ex: A empresa é focada em B2B e já vendeu 100 mil no ano passado..."
                value={initialContext}
                onChange={(e) => setInitialContext(e.target.value)}
                className="bg-zinc-900 border-zinc-800 min-h-[100px] focus-visible:ring-cyan-500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editPassphrase" className="text-zinc-300 flex items-center justify-between">
                <span>Palavra-Chave de Acesso <span className="text-zinc-500 font-normal ml-1">(Senha do documento)</span></span>
                <button type="button" onClick={generateCoolPassphrase} className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center transition-colors">
                  <Wand2 className="w-3 h-3 mr-1" />
                  Sugerir outra
                </button>
              </Label>
              <Input
                id="editPassphrase"
                placeholder="Ex: sol-mar-luz-paz"
                value={editPassphrase}
                onChange={(e) => setEditPassphrase(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-cyan-500 font-mono text-sm"
              />
            </div>
          </div>
        )}

        {/* ========== STEP 2: PACKAGE SELECTION ========== */}
        {step === 'packages' && (
          <div className="py-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar space-y-5">
            {loadingPackages ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              Object.entries(groupedPackages).map(([dept, pkgs]) => (
                <div key={dept}>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2 px-1">
                    {deptLabels[dept] || dept}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pkgs.map((pkg) => {
                      const isSelected = selectedSlugs.includes(pkg.slug);
                      const IconComp = ICON_MAP[pkg.icon] || Package;
                      const colorClass = DEPT_COLORS[dept] || DEPT_COLORS.general;

                      return (
                        <button
                          key={pkg.id}
                          onClick={() => togglePackage(pkg.slug)}
                          className={`
                            relative flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200
                            border bg-gradient-to-br
                            ${isSelected
                              ? `${colorClass} shadow-lg`
                              : 'border-zinc-800/50 from-zinc-900/50 to-zinc-950/50 hover:border-zinc-700'
                            }
                          `}
                        >
                          {/* Selection Indicator */}
                          <div className={`
                            mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                            ${isSelected 
                              ? 'border-cyan-400 bg-cyan-500/20' 
                              : 'border-zinc-600 bg-zinc-800/50'
                            }
                          `}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>

                          {/* Icon */}
                          <div className={`
                            w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                            ${isSelected ? 'bg-white/10' : 'bg-zinc-800/80'}
                          `}>
                            <IconComp className={`w-4.5 h-4.5 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`} />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                {pkg.name}
                              </span>
                              {pkg.is_default_enabled && (
                                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {pkg.description}
                            </p>
                            <span className="text-[10px] font-mono text-zinc-600 mt-1 block">
                              {pkg.max_questions === null ? '∞ perguntas' : `≤${pkg.max_questions} perguntas`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Summary Bar */}
            {selectedSlugs.length > 0 && (
              <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800/50 pt-3 mt-4 -mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    <strong className="text-cyan-400">{selectedSlugs.length}</strong> pacotes selecionados
                  </span>
                  <span className="text-zinc-500">
                    ~<strong className="text-zinc-300">{totalQuestions}</strong> perguntas
                    {hasUnlimited && ' + ∞'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== STEP 3: DONE ========== */}
        {step === 'done' && (
          <div className="py-6 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-300">
             <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
               <CheckCircle2 className="w-8 h-8 text-cyan-400" />
             </div>
             <h3 className="font-bold text-lg text-white">Sessão Criada!</h3>
             <p className="text-sm text-center text-zinc-400 pb-2">
               Envie este link e a palavra-chave para o seu cliente iniciar o briefing.
             </p>

             <div className="w-full flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                <Input 
                  value={generatedLink} 
                  readOnly 
                  className="bg-transparent border-none focus-visible:ring-0 text-zinc-300 h-8"
                />
                <Button 
                  onClick={copyToClipboard} 
                  variant="secondary" 
                  size="sm"
                  className={copied ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
             </div>
             
             <div className="w-full flex flex-col items-center mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Palavra-Chave</span>
                <span className="text-xl font-mono text-cyan-400">{editPassphrase}</span>
                <p className="text-xs text-zinc-500 text-center mt-2 max-w-[280px]">
                  O cliente precisará desta palavra-chave para acessar e editar o documento final gerado após o briefing.
                </p>
             </div>
          </div>
        )}

        <DialogFooter>
          {step === 'info' && (
            <Button 
              type="submit" 
              onClick={() => setStep('packages')}
              disabled={!sessionName.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              Próximo: Selecionar Pacotes
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 'packages' && (
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                onClick={() => setStep('info')}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <Button 
                onClick={generateSession}
                disabled={loading || selectedSlugs.length === 0}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                {loading ? "Preparando IA..." : `Gerar Link (${selectedSlugs.length} pacotes)`}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 'done' && (
            <Button 
              variant="outline" 
              className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setOpen(false)}
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Pencil, Trash2, Save, X, GripVertical, Brain, Palette, Cpu, Megaphone, Headphones, DollarSign, Users, TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, Sparkles, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SKILL_TEMPLATES, type SkillTemplate } from '@/lib/skill-templates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';

const ICON_OPTIONS = [
  'Package', 'Brain', 'Palette', 'Cpu', 'Megaphone', 'Headphones', 
  'DollarSign', 'Users', 'TrendingUp', 'Truck', 'Lightbulb', 
  'Shield', 'Server', 'ShoppingCart', 'Video'
];

const ICON_MAP: Record<string, React.ElementType> = {
  Package, Brain, Palette, Cpu, Megaphone, Headphones, DollarSign, Users,
  TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video,
};

const DEPT_OPTIONS = [
  'branding', 'technology', 'marketing', 'operations', 'finance',
  'people', 'commercial', 'product', 'legal', 'digital', 'content', 'general'
];

interface CategoryPackage {
  slug: string;
  name: string;
  description: string;
  icon: string;
  system_prompt_fragment: string;
  max_questions: number | null;
  is_default_enabled: boolean;
  sort_order: number;
  department: string;
  skill_type?: 'official' | 'personal' | 'community';
  author_id?: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<CategoryPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<CategoryPackage>>({});
  const [saveWarnings, setSaveWarnings] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('official');

  const supabase = createClient();

  const verifyUserContext = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('briefing_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      const adminRole = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
      setIsAdmin(adminRole || !!profile?.is_admin);
    } catch (err) {
      console.error('Error verifying user context:', err);
    }
  }, [supabase]);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/briefing/packages');
      if (res.ok) {
        const data = await res.json();
        setPackages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    verifyUserContext();
    fetchPackages(); 
  }, [verifyUserContext, fetchPackages]);

  const officialSkills = packages.filter(p => !p.skill_type || p.skill_type === 'official');
  const personalSkills = packages.filter(p => p.skill_type === 'personal');

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      slug: '',
      name: '',
      description: '',
      icon: 'Brain',
      system_prompt_fragment: '',
      max_questions: 10,
      is_default_enabled: false,
      sort_order: packages.length,
      department: 'general',
      skill_type: isAdmin ? 'official' : 'personal'
    });
  };

  const startEdit = (pkg: CategoryPackage) => {
    setEditing(pkg.slug);
    setCreating(false);
    setForm({ ...pkg });
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setForm({});
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveWarnings([]);
    try {
      let res: Response;
      if (creating) {
        res = await fetch('/api/briefing/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Failed to create');
      } else if (editing) {
        res = await fetch('/api/briefing/packages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing, ...form }),
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        return;
      }

      const data = await res.json();
      if (data._warnings && data._warnings.length > 0) {
        setSaveWarnings(data._warnings);
        setTimeout(() => setSaveWarnings([]), 8000);
      }

      cancelEdit();
      fetchPackages();
      // Auto-switch to personal tab if the user created a personal skill
      if (form.skill_type === 'personal') setActiveTab('personal');
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar a Skill.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg: CategoryPackage) => {
    if (!confirm(`Tem certeza que deseja excluir a skill "${pkg.name}"?`)) return;
    try {
      await fetch(`/api/briefing/packages?id=${pkg.slug}`, { method: 'DELETE' });
      fetchPackages();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir skill.");
    }
  };

  const applySkillTemplate = (template: SkillTemplate) => {
    setForm({
      ...form,
      slug: template.suggested_slug,
      name: template.name,
      description: template.description,
      icon: template.icon,
      department: template.department,
      max_questions: template.max_questions,
      system_prompt_fragment: template.system_prompt_fragment,
    });
  };

  const renderForm = () => (
    <div className="space-y-4 p-6 bg-white border border-[var(--bd)] shadow-sm rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {creating ? <><Sparkles className="w-5 h-5 text-[var(--orange)]" /> Nova Skill de IA</> : <><Pencil className="w-5 h-5 text-gray-500" /> Editar Skill</>}
        </h3>
        {form.skill_type === 'personal' && (
          <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Skill Privada
          </span>
        )}
      </div>

      {creating && (
        <div className="space-y-2 pb-2">
          <Label className="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--orange)]" />
            Começar a partir de um Template Global
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SKILL_TEMPLATES.map((tpl) => {
              const TplIcon = ICON_MAP[tpl.icon] || Package;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applySkillTemplate(tpl)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-[var(--orange)]/40 hover:bg-[var(--orange)]/5 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-[var(--orange)]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <TplIcon className="w-4 h-4 text-gray-400 group-hover:text-[var(--orange)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 truncate">{tpl.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-500 text-xs uppercase tracking-wider">Identificador (Slug)</Label>
          <Input 
            value={form.slug || ''} 
            onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})}
            placeholder="ex: analise_mercado"
            className="bg-white border-gray-200 mt-1"
            disabled={!!editing && form.skill_type === 'official'}
          />
        </div>
        <div>
          <Label className="text-gray-500 text-xs uppercase tracking-wider">Nome da Skill</Label>
          <Input 
            value={form.name || ''} 
            onChange={e => setForm({...form, name: e.target.value})}
            placeholder="ex: Análise de Mercado"
            className="bg-white border-gray-200 mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-500 text-xs uppercase tracking-wider">Descrição Rápida</Label>
        <Input 
          value={form.description || ''} 
          onChange={e => setForm({...form, description: e.target.value})}
          placeholder="O que essa skill faz?"
          className="bg-white border-gray-200 mt-1"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-gray-500 text-xs uppercase tracking-wider">Ícone</Label>
          <select 
            value={form.icon || 'Brain'} 
            onChange={e => setForm({...form, icon: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-md text-gray-900 px-3 py-2 text-sm mt-1"
          >
            {ICON_OPTIONS.map(icon => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-gray-500 text-xs uppercase tracking-wider">Departamento</Label>
          <select 
            value={form.department || 'general'} 
            onChange={e => setForm({...form, department: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-md text-gray-900 px-3 py-2 text-sm mt-1"
          >
            {DEPT_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-gray-500 text-xs uppercase tracking-wider">Max Perguntas</Label>
          <Input 
            type="number"
            value={form.max_questions === null ? '' : (form.max_questions ?? 10)} 
            onChange={e => setForm({...form, max_questions: e.target.value === '' ? null : parseInt(e.target.value)})}
            placeholder="vazio = ilimitado"
            className="bg-white border-gray-200 mt-1"
          />
        </div>
        
        {isAdmin && form.skill_type === 'official' && (
          <div>
             <Label className="text-gray-500 text-xs uppercase tracking-wider text-red-500">Privilégio ADMIN</Label>
             <select 
               value={form.skill_type || 'official'}
               onChange={e => setForm({...form, skill_type: e.target.value as 'official' | 'personal'})}
               className="w-full bg-white border border-gray-200 rounded-md text-gray-900 px-3 py-2 text-sm mt-1 font-bold"
               disabled={!creating}
             >
               <option value="official">Global / Oficial</option>
               <option value="personal">Pessoal</option>
             </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch 
          checked={form.is_default_enabled ?? false}
          onCheckedChange={checked => setForm({...form, is_default_enabled: checked})}
          disabled={!isAdmin && form.skill_type !== 'personal'}
        />
        <Label className="text-gray-700 text-sm">
          Ativar por padrão em todas as sessões 
          {!isAdmin && " (Apenas admins podem forçar skills globais por padrão)"}
        </Label>
      </div>

      <div>
        <Label className="text-gray-500 text-xs uppercase tracking-wider">System Prompt (O Cérebro da Skill)</Label>
        <Textarea 
          value={form.system_prompt_fragment || ''} 
          onChange={e => setForm({...form, system_prompt_fragment: e.target.value})}
          placeholder="Comporte-se como um especialista em X. Você deve EXTRAIR as seguintes informações..."
          className="bg-white border-gray-200 mt-1 min-h-[250px] font-mono text-sm text-gray-800"
        />
        <span className="text-[10px] text-gray-500 mt-1 block">Este texto é injetado diretamente na IA quando o usuário escolhe usar esta skill. Seja imperativo.</span>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
        <Button variant="outline" className="border-gray-200 text-gray-600 hover:text-gray-900" onClick={cancelEdit}>
          <X className="w-4 h-4 mr-1" /> Cancelar
        </Button>
        <Button 
          className="bg-[var(--orange)] hover:bg-[#E65625] text-white"
          disabled={saving || !form.slug || !form.name || (form.system_prompt_fragment?.length ?? 0) < 10}
          onClick={handleSave}
        >
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar Skill'}
        </Button>
      </div>
    </div>
  );

  const renderSkillList = (list: CategoryPackage[], isEditable: boolean) => {
    if (list.length === 0) {
      return (
        <div className="py-16 text-center text-gray-500 bg-[var(--bg2)] border border-dashed border-[var(--bd)] rounded-2xl">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Nenhuma Skill encontrada.</p>
          {isEditable && <p className="text-xs text-gray-400 mt-1">Clique em &quot;Nova Skill&quot; para criar a sua.</p>}
        </div>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {list.map((pkg, index) => {
          const IconComp = ICON_MAP[pkg.icon] || Brain;
          const canEdit = isEditable && (isAdmin || pkg.skill_type === 'personal');
          
          return (
            <div
              key={pkg.slug || `pkg-${index}`}
              className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all ${
                editing === pkg.slug 
                  ? 'border-[var(--orange)] shadow-md bg-[var(--bg)]' 
                  : 'border-[var(--bd)] bg-[var(--bg2)] hover:border-gray-300 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                  <IconComp className="w-6 h-6 text-gray-600" />
                </div>
                {canEdit ? (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[var(--orange)] hover:bg-[var(--orange)]/10 h-8 w-8 p-0" onClick={() => startEdit(pkg)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0" onClick={() => handleDelete(pkg)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-8 flex items-center">
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded bg-gray-100 text-gray-500">Somente Leitura</span>
                  </div>
                )}
              </div>

              <div className="flex-1 mt-1">
                <h4 className="text-base font-bold text-gray-900 group-hover:text-[var(--orange)] transition-colors">{pkg.name}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 md:line-clamp-3">{pkg.description}</p>
              </div>

              <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--bd)]">
                <div className="flex gap-2">
                  <span className="text-[10px] text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md font-medium">
                    {pkg.department}
                  </span>
                  {pkg.is_default_enabled && (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-200">
                      Auto
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {pkg.max_questions === null ? '∞' : `≤${pkg.max_questions}`} Q
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg2)] p-6 rounded-3xl border border-[var(--bd)] shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--orange)] to-rose-500 shadow-md flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            Skills de IA
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            As Skills são personalidades da IA que direcionam o resultado do briefing para o seu negócio.
            Explore habilidades prontas ou crie as suas próprias.
          </p>
        </div>
        <Button 
          className="bg-[var(--orange)] hover:bg-[#E65625] text-white shadow-sm h-12 px-6 rounded-xl shrink-0"
          onClick={startCreate}
          disabled={creating}
        >
          <Plus className="w-5 h-5 mr-2" /> {isAdmin ? 'Nova Skill' : 'Criar Minha Skill'}
        </Button>
      </div>

      {/* Validation Warnings */}
      {saveWarnings.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50 shadow-sm space-y-1 animate-in fade-in duration-300">
          <p className="text-xs font-semibold text-amber-800">Skill salvo com observações:</p>
          {saveWarnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-600">• {w}</p>
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      {(creating || editing) && renderForm()}

      {/* Skills Tabs */}
      {!creating && !editing && (
        <Tabs defaultValue="official" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-100/60 border border-gray-200 p-1.5 rounded-2xl h-14 w-full max-w-md mx-auto grid grid-cols-3 mb-8">
            <TabsTrigger value="official" className="flex items-center gap-2 justify-center rounded-xl h-full text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--orange)] data-[state=active]:shadow-sm transition-all focus:outline-none">
              <Sparkles className="w-4 h-4" /> Oficiais
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-2 justify-center rounded-xl h-full text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--orange)] data-[state=active]:shadow-sm transition-all focus:outline-none">
              <Brain className="w-4 h-4" /> Minhas
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2 justify-center rounded-xl h-full text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--orange)] data-[state=active]:shadow-sm transition-all focus:outline-none">
              <Globe className="w-4 h-4" /> Comunidade
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[var(--orange)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <TabsContent value="official" className="animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none">
                  <div className="mb-6 flex justify-between items-end">
                    <div>
                      <h2 className="text-xl font-bold font-outfit text-gray-900">Skills Globais da Brieffy</h2>
                      <p className="text-sm text-gray-500 mt-1">Especializações criadas e curadas pelo time oficial.</p>
                    </div>
                  </div>
                  {renderSkillList(officialSkills, true)}
                </TabsContent>

                <TabsContent value="personal" className="animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none">
                  <div className="mb-6 flex justify-between items-end">
                    <div>
                      <h2 className="text-xl font-bold font-outfit text-gray-900">Suas Skills Privadas</h2>
                      <p className="text-sm text-gray-500 mt-1">Conhecimento sob medida criado por você para sua agência.</p>
                    </div>
                  </div>
                  {renderSkillList(personalSkills, true)}
                </TabsContent>

                <TabsContent value="community" className="animate-in fade-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none">
                  <div className="py-20 text-center bg-gradient-to-b from-white to-[var(--bg2)] border border-[var(--bd)] rounded-3xl opacity-80">
                    <Globe className="w-16 h-16 text-[var(--orange)]/40 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold font-outfit text-gray-900 mb-2">Comunidade Global Brieffy</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Em breve você poderá descobrir e usar Skills de IA criadas pelas mentes mais brilhantes do mercado.
                    </p>
                    <Button variant="outline" className="border-gray-200 pointer-events-none rounded-xl" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      )}
    </div>
  );
}

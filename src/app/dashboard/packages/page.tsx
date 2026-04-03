'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Pencil, Trash2, Save, X, GripVertical, Brain, Palette, Cpu, Megaphone, Headphones, DollarSign, Users, TrendingUp, Truck, Lightbulb, Shield, Server, ShoppingCart, Video, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SKILL_TEMPLATES, type SkillTemplate } from '@/lib/skill-templates';

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
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  system_prompt_fragment: string;
  max_questions: number | null;
  is_default_enabled: boolean;
  sort_order: number;
  department: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<CategoryPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [form, setForm] = useState<Partial<CategoryPackage>>({});

  const checkAdmin = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return false;
      }
      const { data: profile } = await supabase
        .from('briefing_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      const admin = !!profile?.is_admin;
      setIsAdmin(admin);
      return admin;
    } catch (err) {
      console.error('Error checking admin:', err);
      setIsAdmin(false);
      return false;
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const admin = await checkAdmin();
      if (!admin) return; // Stop loading if not admin

      const res = await fetch('/api/briefing/packages');
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [checkAdmin]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Shield className="w-16 h-16 text-red-500/50" />
        <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
        <p className="text-zinc-400">Você precisa ser administrador para acessar o gerenciamento de pacotes.</p>
      </div>
    );
  }

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      slug: '',
      name: '',
      description: '',
      icon: 'Package',
      system_prompt_fragment: '',
      max_questions: 10,
      is_default_enabled: false,
      sort_order: packages.length,
      department: 'general',
    });
  };

  const startEdit = (pkg: CategoryPackage) => {
    setEditing(pkg.id);
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
    try {
      if (creating) {
        const res = await fetch('/api/briefing/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Failed to create');
      } else if (editing) {
        const res = await fetch('/api/briefing/packages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing, ...form }),
        });
        if (!res.ok) throw new Error('Failed to update');
      }
      cancelEdit();
      fetchPackages();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) return;
    try {
      await fetch(`/api/briefing/packages?id=${id}`, { method: 'DELETE' });
      fetchPackages();
    } catch (err) {
      console.error(err);
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
    <div className="space-y-4 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      <h3 className="text-lg font-bold text-white">
        {creating ? '✨ Novo Pacote de IA' : '✏️ Editar Pacote'}
      </h3>

      {creating && (
        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Começar a partir de um Skill Template
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SKILL_TEMPLATES.map((tpl) => {
              const TplIcon = ICON_MAP[tpl.icon] || Package;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applySkillTemplate(tpl)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-cyan-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <TplIcon className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-300 group-hover:text-white">{tpl.name}</p>
                    <p className="text-[10px] text-zinc-600 leading-tight mt-0.5">{tpl.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-600">Selecione um template para pré-preencher os campos, ou comece do zero abaixo.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Slug (identificador)</Label>
          <Input 
            value={form.slug || ''} 
            onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})}
            placeholder="ex: visual_identity"
            className="bg-zinc-800 border-zinc-700 mt-1"
            disabled={!!editing}
          />
        </div>
        <div>
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Nome</Label>
          <Input 
            value={form.name || ''} 
            onChange={e => setForm({...form, name: e.target.value})}
            placeholder="ex: Visual Identity & Applications"
            className="bg-zinc-800 border-zinc-700 mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-zinc-400 text-xs uppercase tracking-wider">Descrição</Label>
        <Input 
          value={form.description || ''} 
          onChange={e => setForm({...form, description: e.target.value})}
          placeholder="Short description of what this package covers"
          className="bg-zinc-800 border-zinc-700 mt-1"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Ícone</Label>
          <select 
            value={form.icon || 'Package'} 
            onChange={e => setForm({...form, icon: e.target.value})}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md text-white px-3 py-2 text-sm mt-1"
          >
            {ICON_OPTIONS.map(icon => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Departamento</Label>
          <select 
            value={form.department || 'general'} 
            onChange={e => setForm({...form, department: e.target.value})}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md text-white px-3 py-2 text-sm mt-1"
          >
            {DEPT_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Max Perguntas</Label>
          <Input 
            type="number"
            value={form.max_questions === null ? '' : (form.max_questions ?? 10)} 
            onChange={e => setForm({...form, max_questions: e.target.value === '' ? null : parseInt(e.target.value)})}
            placeholder="vazio = ilimitado"
            className="bg-zinc-800 border-zinc-700 mt-1"
          />
          <span className="text-[10px] text-zinc-500">Vazio = ilimitado</span>
        </div>
        <div>
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Ordem</Label>
          <Input 
            type="number"
            value={form.sort_order ?? 0} 
            onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})}
            className="bg-zinc-800 border-zinc-700 mt-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch 
          checked={form.is_default_enabled ?? false}
          onCheckedChange={checked => setForm({...form, is_default_enabled: checked})}
        />
        <Label className="text-zinc-300 text-sm">Ativar por padrão em todas as sessões</Label>
      </div>

      <div>
        <Label className="text-zinc-400 text-xs uppercase tracking-wider">System Prompt Fragment (AI Skill)</Label>
        <Textarea 
          value={form.system_prompt_fragment || ''} 
          onChange={e => setForm({...form, system_prompt_fragment: e.target.value})}
          placeholder="The system prompt text injected into the LLM when this package is active..."
          className="bg-zinc-800 border-zinc-700 mt-1 min-h-[200px] font-mono text-xs"
        />
        <span className="text-[10px] text-zinc-500">Este texto é injetado diretamente no system prompt do LLM quando o pacote está ativo.</span>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={cancelEdit}>
          <X className="w-4 h-4 mr-1" /> Cancelar
        </Button>
        <Button 
          className="bg-cyan-600 hover:bg-cyan-500 text-white"
          disabled={saving || !form.slug || !form.name}
          onClick={handleSave}
        >
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-cyan-400" />
            </div>
            Pacotes de IA
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Gerencie os pacotes de skills especializados que se injetam no briefing. Cada pacote adiciona perguntas únicas.
          </p>
        </div>
        <Button 
          className="bg-cyan-600 hover:bg-cyan-500 text-white"
          onClick={startCreate}
          disabled={creating}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Pacote
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(creating || editing) && renderForm()}

      {/* Package List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {packages.map(pkg => {
            const IconComp = ICON_MAP[pkg.icon] || Package;
            return (
              <div
                key={pkg.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  editing === pkg.id 
                    ? 'border-cyan-500/30 bg-cyan-500/5' 
                    : 'border-zinc-800/50 bg-zinc-900/30 hover:border-zinc-700'
                }`}
              >
                <GripVertical className="w-4 h-4 text-zinc-600 shrink-0" />

                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                  <IconComp className="w-5 h-5 text-zinc-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{pkg.name}</span>
                    <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800/80 px-1.5 py-0.5 rounded">{pkg.slug}</span>
                    {pkg.is_default_enabled && (
                      <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">DEFAULT</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{pkg.description}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-zinc-600 font-mono mr-2">
                    {pkg.max_questions === null ? '∞' : `≤${pkg.max_questions}`} q
                  </span>
                  <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded mr-2">
                    {pkg.department}
                  </span>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-cyan-400 h-8 w-8 p-0" onClick={() => startEdit(pkg)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-red-400 h-8 w-8 p-0" onClick={() => handleDelete(pkg.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {packages.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              Nenhum pacote criado ainda. Clique em &quot;Novo Pacote&quot; para começar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardLanguage } from '@/i18n/DashboardLanguageContext';

const translations = {
  pt: {
    title: 'Meus Briefings',
    subtitle: 'Configure motores de IA para conduzir briefings inteligentes com seus clientes.',
    newBriefing: 'Novo Briefing',
    noneTitle: 'Nenhum Briefing Criado',
    noneDesc: 'Você ainda não possui nenhum briefing configurado. Crie um para a IA conduzir o preenchimento com seus clientes.',
    createFirst: 'Criar o Primeiro',
  },
  en: {
    title: 'My Briefings',
    subtitle: 'Set up AI engines to conduct intelligent briefings with your clients.',
    newBriefing: 'New Briefing',
    noneTitle: 'No Briefings Yet',
    noneDesc: 'You don\'t have any briefings set up yet. Create one to let AI conduct them with your clients.',
    createFirst: 'Create First',
  },
  es: {
    title: 'Mis Briefings',
    subtitle: 'Configura motores de IA para conducir briefings inteligentes con tus clientes.',
    newBriefing: 'Nuevo Briefing',
    noneTitle: 'Ningún Briefing Creado',
    noneDesc: 'Aún no tienes ningún briefing configurado. Crea uno para que la IA conduzca el proceso con tus clientes.',
    createFirst: 'Crear el Primero',
  },
};

export function TemplatesPageHeader() {
  const { language } = useDashboardLanguage();
  const t = translations[language];

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text)]">
          {t.title}
        </h2>
        <p className="text-[var(--text2)] mt-2 font-medium max-w-xl text-sm md:text-base">
          {t.subtitle}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/dashboard/templates/new">
          <Button className="bg-[var(--orange)] hover:bg-[#e8552a] text-black font-semibold rounded-xl h-11 px-6 transition-all hover:shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            {t.newBriefing}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function TemplatesEmptyState() {
  const { language } = useDashboardLanguage();
  const t = translations[language];

  return (
    <div className="w-full flex flex-col items-center justify-center py-24 px-6 border border-dashed border-[var(--bd-strong)] rounded-3xl bg-[var(--bg2)] text-center">
      <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--bd)]">
        <Sparkles className="w-8 h-8 text-[var(--orange)]" />
      </div>
      <h3 className="text-xl font-bold text-[var(--text)] mb-2">{t.noneTitle}</h3>
      <p className="text-[var(--text2)] max-w-sm mb-8">{t.noneDesc}</p>
      <Link href="/dashboard/templates/new">
        <Button className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] font-semibold rounded-xl h-11 px-6">
          <Plus className="w-4 h-4 mr-2" />
          {t.createFirst}
        </Button>
      </Link>
    </div>
  );
}

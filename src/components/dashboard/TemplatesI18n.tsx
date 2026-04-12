'use client';

import Link from 'next/link';
import { Sparkles, Plus, Share2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardLanguage } from '@/i18n/DashboardLanguageContext';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const translations: Record<string, Record<string, string>> = {
  pt: {
    title: 'Meus Briefings',
    subtitle: 'Configure motores de IA para conduzir briefings inteligentes com seus clientes.',
    newBriefing: 'Novo Briefing',
    noneTitle: 'Nenhum Briefing Criado',
    noneDesc: 'Você ainda não possui nenhum briefing configurado. Crie um para a IA conduzir o preenchimento com seus clientes.',
    createFirst: 'Criar o Primeiro',
    generateLink: 'Gerar Link',
    limitReached: 'Limite Atingido',
    limitReachedDesc: 'Você atingiu o limite de respostas para o seu plano atual. Você pode apagar um briefing que ainda não teve respostas para liberar espaço, ou adquirir mais briefings.',
    buyMore: 'Comprar Mais Briefings',
    buyMoreShort: 'Comprar mais',
    quotaUsed: 'Briefings Utilizados',
    quotaReached: 'Você atingiu o limite. Adquira mais pacotes para continuar criando briefings.',
    quotaNear: 'Você está perto do limite. Adquira mais pacotes para continuar criando briefings.',
    quotaOk: 'Você tem briefings sobrando. Use-os para gerar novos documentos estratégicos!',
  },
  en: {
    title: 'My Briefings',
    subtitle: 'Set up AI engines to conduct intelligent briefings with your clients.',
    newBriefing: 'New Briefing',
    noneTitle: 'No Briefings Yet',
    noneDesc: 'You don\'t have any briefings set up yet. Create one to let AI conduct them with your clients.',
    createFirst: 'Create First',
    generateLink: 'Generate Link',
    limitReached: 'Limit Reached',
    limitReachedDesc: 'You have reached the response limit for your current plan. You can delete a briefing with no responses to free up space, or purchase more briefings.',
    buyMore: 'Buy More Briefings',
    buyMoreShort: 'Buy more',
    quotaUsed: 'Briefings Used',
    quotaReached: 'You\'ve reached the limit. Purchase more packages to continue creating briefings.',
    quotaNear: 'You\'re near the limit. Purchase more packages to keep creating briefings.',
    quotaOk: 'You have briefings to spare. Use them to generate new strategic documents!',
  },
  es: {
    title: 'Mis Briefings',
    subtitle: 'Configura motores de IA para conducir briefings inteligentes con tus clientes.',
    newBriefing: 'Nuevo Briefing',
    noneTitle: 'Ningún Briefing Creado',
    noneDesc: 'Aún no tienes ningún briefing configurado. Crea uno para que la IA conduzca el proceso con tus clientes.',
    createFirst: 'Crear el Primero',
    generateLink: 'Generar Enlace',
    limitReached: 'Límite Alcanzado',
    limitReachedDesc: 'Has alcanzado el límite de respuestas de tu plan actual. Puedes eliminar un briefing sin respuestas para liberar espacio, o adquirir más briefings.',
    buyMore: 'Comprar Más Briefings',
    buyMoreShort: 'Comprar más',
    quotaUsed: 'Briefings Utilizados',
    quotaReached: 'Has alcanzado el límite. Adquiere más paquetes para continuar creando briefings.',
    quotaNear: 'Estás cerca del límite. Adquiere más paquetes para seguir creando briefings.',
    quotaOk: '¡Tienes briefings de sobra! Úsalos para generar nuevos documentos estratégicos.',
  },
};

function useT() {
  const { language } = useDashboardLanguage();
  return (key: string) => translations[language]?.[key] || translations['en']?.[key] || key;
}

export function TemplatesPageHeader() {
  const t = useT();

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 suppressHydrationWarning className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text)]">
          {t('title')}
        </h2>
        <p suppressHydrationWarning className="text-[var(--text2)] mt-2 font-medium max-w-xl text-sm md:text-base">
          {t('subtitle')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/dashboard/templates/new">
          <Button suppressHydrationWarning className="bg-[var(--orange)] hover:bg-[#e8552a] text-black font-semibold rounded-xl h-11 px-6 transition-all hover:shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            {t('newBriefing')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function TemplatesEmptyState() {
  const t = useT();

  return (
    <div className="w-full flex flex-col items-center justify-center py-24 px-6 border border-dashed border-[var(--bd-strong)] rounded-3xl bg-[var(--bg2)] text-center">
      <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--bd)]">
        <Sparkles className="w-8 h-8 text-[var(--orange)]" />
      </div>
      <h3 suppressHydrationWarning className="text-xl font-bold text-[var(--text)] mb-2">{t('noneTitle')}</h3>
      <p suppressHydrationWarning className="text-[var(--text2)] max-w-sm mb-8">{t('noneDesc')}</p>
      <Link href="/dashboard/templates/new">
        <Button suppressHydrationWarning className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] font-semibold rounded-xl h-11 px-6">
          <Plus className="w-4 h-4 mr-2" />
          {t('createFirst')}
        </Button>
      </Link>
    </div>
  );
}

export function LimitReachedButton() {
  const t = useT();

  return (
    <Dialog>
      <DialogTrigger suppressHydrationWarning className="flex items-center gap-2 px-3 h-10 text-xs font-medium rounded-full hover:bg-[var(--acbg)] text-[var(--actext)] hover:text-black transition-colors btn-pill">
        <Share2 className="w-4 h-4" />
        {t('generateLink')}
      </DialogTrigger>
      <DialogContent className="!max-w-none sm:!max-w-none w-[calc(100vw-1.5rem)] sm:w-[min(440px,calc(100vw-3rem))] bg-[var(--bg)] border-[var(--bd)] text-[var(--text)] p-0 gap-0 overflow-hidden">
        <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-4">
          <DialogHeader>
            <DialogTitle suppressHydrationWarning className="flex items-center gap-2 text-lg font-bold">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              {t('limitReached')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning className="text-[var(--text2)] pt-2 leading-relaxed text-sm">
              {t('limitReachedDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-3 border-t border-[var(--bd)]">
            <Link href="/dashboard/packages" className="w-full block">
              <Button suppressHydrationWarning className="w-full bg-[var(--orange)] text-black font-bold hover:opacity-90 rounded-full h-11">
                {t('buyMore')}
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuotaBanner({ used, max }: { used: number; max: number }) {
  const t = useT();

  const remaining = Math.max(0, max - used);
  const isNearLimit = remaining <= 1;
  const isLimitReached = used >= max && max > 0;

  if (max <= 0) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border ${isLimitReached ? 'bg-red-500/10 border-red-500/20' : isNearLimit ? 'bg-[var(--orange)]/10 border-[var(--orange)]/20' : 'bg-[var(--acbg)] border-[var(--acbd)]'}`}>
      <div>
        <h4 suppressHydrationWarning className={`text-sm font-bold ${isLimitReached ? 'text-red-500' : isNearLimit ? 'text-[var(--orange)]' : 'text-[var(--actext)]'}`}>
          {t('quotaUsed')}: {used} / {max}
        </h4>
        <p suppressHydrationWarning className="text-xs text-[var(--text2)] mt-0.5">
          {isLimitReached
            ? t('quotaReached')
            : isNearLimit
              ? t('quotaNear')
              : t('quotaOk')}
        </p>
      </div>
      <Link href="/dashboard/packages" className="mt-3 sm:mt-0 shrink-0">
        <Button 
          suppressHydrationWarning
          size="sm"
          className={`rounded-xl font-semibold shadow-sm transition-transform hover:scale-105 h-9 px-4 ${
            isLimitReached 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : isNearLimit 
                ? 'bg-[var(--orange)] text-black hover:bg-[#e8552a]' 
                : 'bg-[var(--text)] text-[var(--bg)] hover:opacity-90'
          }`}
        >
          {t('buyMoreShort')}
        </Button>
      </Link>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, FileText, User, Package, Globe, Home, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { DashboardLanguageProvider, useDashboardLanguage } from '@/i18n/DashboardLanguageContext';
import type { DashboardLanguage } from '@/i18n/dashboardTranslations';

// Language flag map for switcher
const LANG_FLAGS: Record<DashboardLanguage, string> = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' };
const LANG_ORDER: DashboardLanguage[] = ['pt', 'en', 'es'];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useDashboardLanguage();
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [branding, setBranding] = useState<{
    company_name: string; logo_url: string; brand_color: string; brand_accent: string; tagline: string;
  }>({ company_name: 'brieffy', logo_url: '', brand_color: '#ff6029', brand_accent: '#000000', tagline: 'simplify your requirements' });
  const [isOnboarded, setIsOnboarded] = useState(true);

  const isLoginPage = pathname === '/dashboard/login';
  const isRegisterPage = pathname === '/dashboard/register';
  const isOnboardingPage = pathname.startsWith('/dashboard/onboarding');

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('briefing_profiles')
          .select('display_name, company_name, logo_url, brand_color, brand_accent, tagline, is_admin, is_onboarded')
          .eq('id', user.id)
          .single();
        setUserName(profile?.display_name || user.email?.split('@')[0] || 'User');
        if (profile) {
          setIsAdmin(profile.is_admin || false);
          setIsOnboarded(profile.is_onboarded ?? false);
          setBranding({
            company_name: profile.company_name || 'brieffy',
            logo_url: profile.logo_url || '',
            brand_color: profile.brand_color || '#ff6029',
            brand_accent: profile.brand_accent || '#000000',
            tagline: profile.tagline || 'simplify your requirements',
          });

          // BUG-13 FIX: Prevent infinite onboarding redirect loop
          if (!profile.is_onboarded && !pathname.startsWith('/dashboard/onboarding')) {
            try {
              const justOnboarded = localStorage.getItem('brieffy_just_onboarded');
              if (justOnboarded) {
                const elapsed = Date.now() - parseInt(justOnboarded);
                if (elapsed < 30000) {
                  localStorage.removeItem('brieffy_just_onboarded');
                  setIsOnboarded(true);
                  return;
                }
                localStorage.removeItem('brieffy_just_onboarded');
              }
            } catch {}

            const { data: recheck } = await supabase
              .from('briefing_profiles')
              .select('is_onboarded')
              .eq('id', user.id)
              .single();
            
            if (recheck?.is_onboarded) {
              setIsOnboarded(true);
              return;
            }

            router.push('/dashboard/onboarding');
          }
        }
      }
    }
    if (!isLoginPage && !isRegisterPage) loadUser();
  }, [isLoginPage, isRegisterPage, pathname, router]);

  if (isLoginPage || isRegisterPage || isOnboardingPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/dashboard/login');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard/templates', icon: FileText, labelKey: 'nav.briefings', mobileLabel: 'Briefs', match: (p: string) => p === '/dashboard' || p.startsWith('/dashboard/templates') || !!p.match(/^\/dashboard\/[0-9a-f]/) },
    { href: '/dashboard/packages', icon: Package, labelKey: 'nav.aiPackages', mobileLabel: 'Skills', match: (p: string) => p.startsWith('/dashboard/packages') },
    { href: '/dashboard/profile', icon: User, labelKey: 'nav.myAccount', mobileLabel: 'Perfil', match: (p: string) => p.startsWith('/dashboard/profile') },
  ];

  const cycleLang = () => {
    const idx = LANG_ORDER.indexOf(language);
    const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    setLanguage(next);
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans flex flex-col md:flex-row">
      {/* ============ DESKTOP SIDEBAR ============ */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-[var(--bg)] border-r border-[var(--bd)] flex-col justify-between">
        <div className="p-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 mb-10 group">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.company_name}
                className="w-10 h-10 rounded-xl object-contain bg-[var(--bg2)] border border-[var(--bd)] p-0.5 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border border-[var(--bd)] bg-[var(--bg2)] text-[var(--text)] group-hover:scale-105 transition-transform"
              >
                {branding.company_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
                {branding.company_name}
                <span className="text-[var(--orange)]">.</span>
              </h1>
              {branding.tagline ? (
                <p className="text-[10px] text-[var(--text3)] uppercase tracking-widest font-medium truncate max-w-[150px]">{branding.tagline}</p>
              ) : (
                <p className="text-[10px] text-[var(--text3)] uppercase tracking-widest font-medium">{t('nav.aiPlatform')}</p>
              )}
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1.5 flex flex-col">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={isOnboarded ? item.href : '#'}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'w-full justify-start rounded-xl transition-all text-sm font-medium',
                  (!isOnboarded && !pathname.startsWith('/dashboard/onboarding')) && 'pointer-events-none opacity-50',
                  item.match(pathname) 
                    ? 'bg-[var(--acbg)] text-[var(--actext)] border border-[var(--acbd)]' 
                    : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)]'
                )}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Info + Language + Logout */}
        <div className="p-6 border-t border-[var(--bd)] space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[var(--orange)] flex items-center justify-center text-xs font-bold text-black">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)] truncate">{userName}</p>
            </div>
            {/* Language Switcher */}
            <button
              onClick={cycleLang}
              title={`Language: ${language.toUpperCase()}`}
              className="w-8 h-8 rounded-lg bg-[var(--bg2)] border border-[var(--bd)] flex items-center justify-center text-sm hover:bg-[var(--bg3)] transition-colors cursor-pointer"
            >
              {LANG_FLAGS[language]}
            </button>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start rounded-xl text-[var(--text3)] hover:text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-3" />
            {t('nav.signOut')}
          </Button>
        </div>
      </aside>

      {/* ============ MOBILE TOP BAR ============ */}
      <div className="md:hidden bg-[var(--bg)] border-b border-[var(--bd)] px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          {branding.logo_url ? (
            <img src={branding.logo_url} alt={branding.company_name} className="w-6 h-6 rounded-lg object-contain" />
          ) : (
            <span className="font-bold text-lg text-[var(--text)]">
              {branding.company_name}<span className="text-[var(--orange)]">.</span>
            </span>
          )}
          {branding.logo_url && (
            <span className="font-bold text-lg text-[var(--text)]">{branding.company_name}</span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={cycleLang}
            className="w-8 h-8 rounded-lg bg-[var(--bg2)] border border-[var(--bd)] flex items-center justify-center text-sm"
          >
            {LANG_FLAGS[language]}
          </button>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-[var(--bg2)] border border-[var(--bd)] flex items-center justify-center text-sm text-[var(--text3)] hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 overflow-x-clip p-4 md:p-10 pb-24 md:pb-10">
        {children}
      </main>

      {/* ============ MOBILE BOTTOM TAB BAR ============ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg)] border-t border-[var(--bd)] flex justify-around items-center px-2 py-1.5 safe-area-pb">
        {navItems.map(item => {
          const isActive = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={isOnboarded ? item.href : '#'}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px] ${
                isActive 
                  ? 'text-[var(--text)]' 
                  : 'text-[var(--text3)]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold tracking-wide uppercase">{item.mobileLabel}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[var(--orange)] mt-0.5" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Safe area spacing for iOS bottom */}
      <style jsx global>{`
        .safe-area-pb {
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLanguageProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardLanguageProvider>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, FileText, User, Sparkles, Menu, X, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [branding, setBranding] = useState<{
    company_name: string; logo_url: string; brand_color: string; brand_accent: string; tagline: string;
  }>({ company_name: 'Smart Briefing', logo_url: '', brand_color: '#06b6d4', brand_accent: '#8b5cf6', tagline: '' });
  const [isOnboarded, setIsOnboarded] = useState(true);

  const isLoginPage = pathname === '/dashboard/login';
  const isRegisterPage = pathname === '/dashboard/register';

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
            company_name: profile.company_name || 'Smart Briefing',
            logo_url: profile.logo_url || '',
            brand_color: profile.brand_color || '#06b6d4',
            brand_accent: profile.brand_accent || '#8b5cf6',
            tagline: profile.tagline || '',
          });

          // Redirect to onboarding if not onboarded
          if (profile.is_onboarded === false && !pathname.startsWith('/dashboard/onboarding')) {
            router.push('/dashboard/onboarding');
          }
        }
      }
    }
    if (!isLoginPage && !isRegisterPage) loadUser();
  }, [isLoginPage, isRegisterPage]);

  if (isLoginPage || isRegisterPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/dashboard/login');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', match: (p: string) => p === '/dashboard' || p.match(/^\/dashboard\/[0-9a-f]/) },
    { href: '/dashboard/templates', icon: FileText, label: 'Briefings', match: (p: string) => p.startsWith('/dashboard/templates') },
    ...(isAdmin ? [{ href: '/dashboard/packages', icon: Package, label: 'AI Packages', match: (p: string) => p.startsWith('/dashboard/packages') }] : []),
    { href: '/dashboard/profile', icon: User, label: 'My Account', match: (p: string) => p.startsWith('/dashboard/profile') },
  ];

  return (
    <div suppressHydrationWarning className="min-h-screen bg-black text-white selection:bg-cyan-500/30 font-sans flex flex-col md:flex-row">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex relative z-10 w-64 flex-shrink-0 bg-black/40 backdrop-blur-2xl border-r border-white/10 flex-col justify-between">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3 mb-10 group">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.company_name}
                className="w-10 h-10 rounded-xl object-contain bg-white/5 border border-white/10 p-0.5 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border border-white/10 group-hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(135deg, ${branding.brand_color}30, ${branding.brand_accent}20)`, color: branding.brand_color }}
              >
                {branding.company_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {branding.company_name}
              </h1>
              {branding.tagline ? (
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium truncate max-w-[150px]">{branding.tagline}</p>
              ) : (
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">AI Platform</p>
              )}
            </div>
          </Link>

          <nav className="space-y-2 flex flex-col">
            {navItems.map(item => (
              <Link key={item.href} href={isOnboarded ? item.href : '#'}>
                <Button
                  variant="ghost"
                  disabled={!isOnboarded && !pathname.startsWith('/dashboard/onboarding')}
                  className={`w-full justify-start rounded-xl transition-all ${
                    item.match(pathname) 
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        {/* User info + Logout */}
        <div className="p-6 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{userName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden relative z-10 bg-black/60 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          {branding.logo_url ? (
            <img src={branding.logo_url} alt={branding.company_name} className="w-6 h-6 rounded-lg object-contain" />
          ) : (
            <Sparkles className="w-5 h-5 text-cyan-400" />
          )}
          <span className="font-bold text-lg">{branding.company_name}</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-xl">Menu</span>
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="space-y-3 flex-1">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-xl text-lg py-6 ${
                    item.match(pathname)
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                      : 'text-zinc-300'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
          <Button
            variant="ghost"
            onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
            className="w-full justify-start rounded-xl text-red-400 hover:bg-red-500/10 py-6 text-lg"
          >
            <LogOut className="w-5 h-5 mr-4" />
            Sign Out
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-x-hidden p-4 md:p-10">
        {children}
      </main>
    </div>
  );
}

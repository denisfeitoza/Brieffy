'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Users, Settings, Shield, Sparkles, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/dashboard/login');
        return;
      }
      const { data: profile } = await supabase
        .from('briefing_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (!profile?.is_admin) {
        router.push('/dashboard');
        return;
      }
      setIsAdmin(true);
    }
    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/dashboard/login');
    router.refresh();
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/settings', icon: Settings, label: 'Global AI Config' },
  ];

  return (
    <div suppressHydrationWarning className="min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans flex flex-col md:flex-row">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[150px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex relative z-10 w-64 flex-shrink-0 bg-black/40 backdrop-blur-2xl border-r border-purple-500/10 flex-col justify-between">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-3 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Super Admin</p>
            </div>
          </Link>

          <nav className="space-y-2">
            {navItems.map(item => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start rounded-xl transition-all ${
                      isActive
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-4 border-t border-white/10">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/5">
                <Sparkles className="w-4 h-4 mr-3" />
                User Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-6 border-t border-white/10">
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
      <div className="md:hidden relative z-10 bg-black/60 backdrop-blur-xl border-b border-purple-500/10 px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-lg">Admin</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-xl">Admin Menu</span>
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="space-y-3 flex-1">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl text-lg py-6 text-zinc-300">
                  <item.icon className="w-5 h-5 mr-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start rounded-xl text-lg py-6 text-cyan-400">
                <Sparkles className="w-5 h-5 mr-4" />
                User Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      )}

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-x-hidden p-4 md:p-10">
        {children}
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Users, Settings, Shield, Sparkles, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  // Refs for the mobile overlay so we can run a focus trap and restore focus
  // to the toggle button when it closes (a11y requirement for modal dialogs).
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    // Remember the trigger so we can restore focus after closing.
    lastFocusedRef.current = (document.activeElement as HTMLElement) ?? null;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const focusables = () =>
      Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('hidden'));

    // Move focus into the overlay so screen readers announce it as a dialog.
    const initial = focusables()[0];
    initial?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileMenu();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      lastFocusedRef.current?.focus?.();
    };
  }, [mobileMenuOpen, closeMobileMenu]);

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
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--orange)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/settings', icon: Settings, label: 'Global AI Config' },
  ];

  return (
    <div suppressHydrationWarning className="dark min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans flex flex-col md:flex-row">
      {/* ============ DESKTOP SIDEBAR ============ */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-[var(--bg)] border-r border-[var(--bd)] flex-col justify-between">
        <div className="p-6">
          {/* Admin Logo */}
          <Link href="/admin" className="flex items-center gap-3 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg2)] border border-[var(--bd)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-[var(--text)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
                Admin<span className="text-[var(--orange)]">.</span>
              </h1>
              <p className="text-[10px] text-[var(--text3)] uppercase tracking-widest font-medium">Super Admin</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="space-y-1.5">
            {navItems.map(item => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start rounded-xl transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-[var(--acbg)] text-[var(--actext)] border border-[var(--acbd)]'
                        : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)]'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Link to user dashboard */}
          <div className="mt-8 pt-4 border-t border-[var(--bd)]">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start rounded-xl text-[var(--text2)] hover:text-[var(--actext)] hover:bg-[var(--acbg)]">
                <Sparkles className="w-4 h-4 mr-3" />
                User Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Logout */}
        <div className="p-6 border-t border-[var(--bd)]">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start rounded-xl text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)]"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* ============ MOBILE HEADER ============ */}
      <div className="md:hidden bg-[var(--bg)] border-b border-[var(--bd)] px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--text)]" />
          <span className="font-bold text-lg text-[var(--text)]">Admin<span className="text-[var(--orange)]">.</span></span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="text-[var(--text)]"
          aria-expanded={mobileMenuOpen}
          aria-controls="admin-mobile-menu"
          aria-label={mobileMenuOpen ? 'Close admin menu' : 'Open admin menu'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* ============ MOBILE MENU OVERLAY ============ */}
      {mobileMenuOpen && (
        <div
          ref={overlayRef}
          id="admin-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-mobile-menu-title"
          className="md:hidden fixed inset-0 z-50 bg-[var(--bg)] flex flex-col p-6 animate-in fade-in duration-200"
        >
          <div className="flex justify-between items-center mb-8">
            <span id="admin-mobile-menu-title" className="font-bold text-xl text-[var(--text)]">Admin Menu</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileMenu}
              className="text-[var(--text)]"
              aria-label="Close admin menu"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="space-y-3 flex-1">
            {navItems.map(item => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={closeMobileMenu}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start rounded-xl text-lg py-6 ${
                      isActive
                        ? 'bg-[var(--acbg)] text-[var(--actext)] border border-[var(--acbd)]'
                        : 'text-[var(--text2)]'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Link href="/dashboard" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start rounded-xl text-lg py-6 text-[var(--actext)]">
                <Sparkles className="w-5 h-5 mr-4" />
                User Dashboard
              </Button>
            </Link>
          </nav>
          <Button
            variant="ghost"
            onClick={() => { handleLogout(); closeMobileMenu(); }}
            className="w-full justify-start rounded-xl text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)] py-6 text-lg"
          >
            <LogOut className="w-5 h-5 mr-4" />
            Sign Out
          </Button>
        </div>
      )}

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 overflow-x-hidden p-4 md:p-10">
        {children}
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user is admin → redirect to admin panel
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('briefing_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-4 selection:bg-[var(--orange)] selection:text-black">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff6029]/[0.03] rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[var(--bg)] border border-[var(--bd)] p-8 rounded-[2rem] shadow-xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[var(--orange)]/10 border border-[var(--orange)]/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-[var(--orange)]" />
            </div>
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-[var(--text)]">Smart Briefing</h1>
            <p className="text-[var(--text2)] text-sm">Entre para gerenciar seus briefings</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--text2)] font-semibold">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-[var(--bg2)] border-[var(--bd)] focus-visible:ring-[var(--orange)] focus-visible:border-[var(--orange)] rounded-xl h-12 text-[var(--text)] placeholder:text-[var(--text3)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--text2)] font-semibold">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[var(--bg2)] border-[var(--bd)] focus-visible:ring-[var(--orange)] focus-visible:border-[var(--orange)] rounded-xl h-12 text-[var(--text)] placeholder:text-[var(--text3)]"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-700 text-sm p-3 bg-red-50 rounded-lg border border-red-200"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--text)] hover:opacity-90 text-[var(--bg)] font-bold rounded-xl h-14 btn-pill transition-all duration-300 shadow-md"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-[var(--bd)] pt-6">
            <p className="text-[var(--text3)] text-sm font-medium">
              Não tem uma conta?{' '}
              <Link 
                href="/dashboard/register" 
                className="text-[var(--orange)] hover:underline font-bold transition-colors"
              >
                Criar uma agora
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

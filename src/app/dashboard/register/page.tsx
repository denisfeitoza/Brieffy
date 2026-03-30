'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, UserPlus, ShieldCheck, Eye, EyeOff, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  // Simple Free Captcha
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (parseInt(captchaAnswer) !== num1 + num2) {
      setError('Resposta do desafio de segurança incorreta.');
      // Generate standard new ones if wrong
      setNum1(Math.floor(Math.random() * 10) + 1);
      setNum2(Math.floor(Math.random() * 10) + 1);
      setCaptchaAnswer('');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            company_name: companyName,
          },
        },
      });

      if (authError) throw authError;

      if (!data.session) {
        // This happens if "Confirm Email" is active in Supabase Auth config
        setSuccessMsg(
          'Conta criada com sucesso! Por favor, verifique sua caixa de entrada para confirmar o e-mail antes de fazer login.'
        );
        return;
      }

      // Sign up successful formatting without email requirement, redirect directly
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-black text-white flex items-center justify-center p-4 selection:bg-cyan-500/30">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          {successMsg ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <MailCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold mb-4 tracking-tight">Tudo Certo!</h1>
              <p className="text-emerald-400/90 mb-8 leading-relaxed text-lg">
                {successMsg}
              </p>

              <div className="mt-8 border-t border-white/5 pt-6 text-left">
                <button
                  type="button"
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mx-auto mb-4 w-full"
                >
                  {showCredentials ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showCredentials ? 'Ocultar credenciais' : 'Rever credenciais escolhidas'}
                </button>

                {showCredentials && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-4"
                  >
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">E-mail</p>
                      <p className="font-medium text-zinc-200 break-all">{email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Senha</p>
                      <p className="font-mono text-zinc-200 break-all">{password}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <Link href="/dashboard/login" className="block mt-6">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-6 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]">
                  Ir para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-7 h-7 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2 tracking-tight">Criar Conta</h1>
                <p className="text-zinc-400 text-sm">Comece a criar briefings inteligentes para seus clientes</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-zinc-300">
                Seu Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="João Silva"
                className="bg-black/50 border-white/10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-zinc-300">
                Nome da Empresa
              </Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Sua Empresa (opcional)"
                className="bg-black/50 border-white/10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                E-mail <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-black/50 border-white/10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">
                Senha <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Pelo menos 6 caracteres"
                className="bg-black/50 border-white/10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl h-12"
              />
            </div>

            {/* Free Math Captcha */}
            {num1 > 0 && num2 > 0 && (
              <div className="space-y-2 p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                <Label htmlFor="captcha" className="text-zinc-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Verificação de Segurança
                </Label>
                <div className="flex gap-4 items-center">
                  <span className="text-lg font-mono text-emerald-400 bg-black/50 px-4 py-2 rounded-lg border border-emerald-900/50 select-none">
                    {num1} + {num2} = ?
                  </span>
                  <Input
                    id="captcha"
                    type="number"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Resultado"
                    className="flex-1 bg-black/50 border-white/10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl h-12"
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-sm p-3 bg-red-950/50 rounded-lg border border-red-900/50"
              >
                {error}
              </motion.div>
            )}



            <Button
              type="submit"
              disabled={loading || !!successMsg}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-6 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  Criar Conta
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

              <div className="mt-6 text-center">
                <p className="text-zinc-500 text-sm">
                  Já tem uma conta?{' '}
                  <Link 
                    href="/dashboard/login" 
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Entrar
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

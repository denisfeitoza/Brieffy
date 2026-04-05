'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, User, Building2, Lock, BarChart3, Sparkles, Palette, Upload, ImageIcon, Globe, Type, CheckCircle2, X, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useDashboardLanguage } from '@/i18n/DashboardLanguageContext';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useDashboardLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [companySummary, setCompanySummary] = useState('');
  const [plan, setPlan] = useState('free');
  const [usedBriefings, setUsedBriefings] = useState(0);
  const [maxBriefings, setMaxBriefings] = useState(10);

  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Branding state
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#ff6029');
  const [brandAccent, setBrandAccent] = useState('#111111');
  const [tagline, setTagline] = useState('');
  const [website, setWebsite] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Auto-save state
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  // Auto-save effect
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    if (!displayName && !companyName) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('briefing_profiles').update({
          display_name: displayName,
          company_name: companyName,
          company_summary: companySummary,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 3000);
      } catch {
        // Silent fail 
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [displayName, companyName, companySummary]);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('briefing_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || '');
        setCompanyName(profile.company_name || '');
        setCompanySummary(profile.company_summary || '');
        setPlan(profile.plan || 'free');
        setLogoUrl(profile.logo_url || '');
        setBrandColor(profile.brand_color || '#ff6029'); // Default to orange
        setBrandAccent(profile.brand_accent || '#111111');
        setTagline(profile.tagline || '');
        setWebsite(profile.website || '');
      }

      const { data: quota } = await supabase
        .from('briefing_quotas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (quota) {
        setUsedBriefings(quota.used_briefings || 0);
        setMaxBriefings(quota.max_briefings || 3);
      }

      setLoading(false);
      setTimeout(() => { isInitialLoadRef.current = false; }, 100);
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('briefing_profiles')
        .update({
          display_name: displayName,
          company_name: companyName,
          company_summary: companySummary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      router.refresh();
      toast.success('Perfil salvo com sucesso');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError(t('profile.passwordMinError'));
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess(t('profile.passwordSuccess'));
      setNewPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoUpload = useCallback(async (file: File) => {
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('profile.logoTypeError'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.logoSizeError'));
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch('/api/profile/upload-logo', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setLogoUrl(data.url + '?t=' + Date.now()); 
      }
    } catch (err) {
      console.error('Logo upload failed:', err);
    } finally {
      setUploadingLogo(false);
    }
  }, [t]);

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    setBrandingSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: logoUrl,
          brand_color: brandColor,
          brand_accent: brandAccent,
          tagline,
          website,
          company_name: companyName,
        }),
      });
      if (res.ok) {
        setBrandingSaved(true);
        setTimeout(() => setBrandingSaved(false), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error('Error saving branding:', err);
    } finally {
      setSavingBranding(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleLogoUpload(file);
  }, [handleLogoUpload]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--orange)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in duration-700">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text)]">
          {t('profile.title')}
        </h2>
        <p className="text-[var(--text2)] mt-1 font-medium">{t('profile.subtitle')}</p>
      </div>

      {/* Plan & Quota */}
      <Card className="bg-amber-50 border-amber-200 shadow-sm">
        <CardContent className="py-5 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-900 capitalize">{plan} {t('profile.plan')}</p>
              <p className="text-xs text-amber-700/80 font-medium">{t('profile.yourSubscription')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800 font-semibold">{usedBriefings}/{maxBriefings} {t('profile.briefingsUsed')}</span>
            </div>
            <div className="w-32 h-2 bg-amber-200/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min((usedBriefings / maxBriefings) * 100, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card className="bg-[var(--bg)] border-[var(--bd)] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text)] text-lg">
            <User className="w-5 h-5 text-[var(--orange)]" />
            {t('profile.profileInfo')}
          </CardTitle>
          <CardDescription className="text-[var(--text3)]">
            {t('profile.updateDetails')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[var(--text2)] font-semibold">{t('profile.email')}</Label>
            <Input value={email} disabled className="bg-[var(--bg2)] border-[var(--bd)] text-[var(--text3)]" />
            <p className="text-[11px] text-[var(--text3)]">{t('profile.emailCannotChange')}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--text2)] font-semibold">{t('profile.displayName')}</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-[var(--orange)] focus-visible:border-[var(--orange)]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--text2)] font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {t('profile.companyName')}
            </Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t('profile.companyPlaceholder')}
              className="bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-[var(--orange)] focus-visible:border-[var(--orange)]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--text2)] font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {t('profile.operationalSummary')}
            </Label>
            <Textarea
              value={companySummary}
              onChange={(e) => setCompanySummary(e.target.value)}
              placeholder={t('profile.summaryPlaceholder')}
              className="bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-[var(--orange)] focus-visible:border-[var(--orange)] min-h-[150px] text-sm"
            />
            <p className="text-[11px] text-[var(--text3)] mt-1">
              {t('profile.summaryHelp')}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className={`text-xs text-emerald-600 font-medium flex items-center gap-1.5 transition-opacity duration-500 ${autoSaved ? 'opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('profile.autoSaved')}
            </span>
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] btn-pill font-semibold px-6 ml-auto">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('profile.saveProfile')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Branding & Customization */}
      <Card className="bg-[var(--bg)] border-[var(--bd)] shadow-sm overflow-hidden">
        <CardHeader className="relative border-b border-[var(--bd)] bg-[var(--bg2)] pb-4">
          <CardTitle className="flex items-center gap-2 text-[var(--text)] relative z-10 text-lg">
            <Palette className="w-5 h-5 text-[var(--orange)]" />
            {t('profile.brandingTitle')}
          </CardTitle>
          <CardDescription className="text-[var(--text3)] relative z-10 mt-1">
            {t('profile.brandingDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label className="text-[var(--text2)] font-semibold flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              {t('profile.companyLogo')}
            </Label>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Logo Preview */}
              <div className="shrink-0">
                {logoUrl ? (
                  <div className="relative group">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-24 h-24 rounded-2xl object-cover bg-white border border-[var(--bd)] shadow-sm p-1"
                    />
                    <button
                      onClick={() => setLogoUrl('')}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-100 border border-red-200 text-red-600 rounded-full flex items-center justify-center transition-all hover:bg-red-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold border border-[var(--bd)] shadow-sm bg-[var(--bg2)]"
                    style={{ color: brandColor }}
                  >
                    {(companyName || 'AI').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Drop Zone */}
              <div
                className={`flex-1 w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[var(--orange)] bg-[#ff6029]/5'
                    : 'border-[var(--bd-strong)] hover:border-[var(--orange)] hover:bg-[var(--bg2)]'
                }`}
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
                {uploadingLogo ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--orange)]" />
                    <p className="text-sm text-[var(--text2)] font-medium">{t('profile.uploading')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="w-6 h-6 text-[var(--text3)] mb-1" />
                    <p className="text-sm text-[var(--text2)] font-semibold">{t('profile.dragDrop')}</p>
                    <p className="text-xs text-[var(--text3)]">{t('profile.fileFormats')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[var(--text2)] text-sm font-semibold">{t('profile.primaryColor')}</Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border border-[var(--bd-strong)] cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none shadow-sm"
                  />
                </div>
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="bg-[var(--bg)] border-[var(--bd)] font-mono text-sm uppercase focus-visible:ring-[var(--orange)]"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--text2)] text-sm font-semibold">{t('profile.accentColor')}</Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={brandAccent}
                    onChange={(e) => setBrandAccent(e.target.value)}
                    className="w-12 h-12 rounded-xl border border-[var(--bd-strong)] cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none shadow-sm"
                  />
                </div>
                <Input
                  value={brandAccent}
                  onChange={(e) => setBrandAccent(e.target.value)}
                  className="bg-[var(--bg)] border-[var(--bd)] font-mono text-sm uppercase focus-visible:ring-[var(--orange)]"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Tagline & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[var(--text2)] flex items-center gap-1.5 text-sm font-semibold">
                <Type className="w-3.5 h-3.5" />
                {t('profile.tagline')}
              </Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder={t('profile.taglinePlaceholder')}
                className="bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-[var(--orange)]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--text2)] flex items-center gap-1.5 text-sm font-semibold">
                <Globe className="w-3.5 h-3.5" />
                {t('profile.website')}
              </Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={t('profile.websitePlaceholder')}
                type="url"
                className="bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-[var(--orange)]"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="text-[var(--text2)] text-sm font-semibold">{t('profile.livePreview')}</Label>
            <div className="rounded-2xl border border-[var(--bd)] bg-white overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-[var(--bd)] bg-[var(--bg2)]">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Preview" className="w-10 h-10 rounded-xl object-contain bg-white border border-[var(--bd)] p-0.5" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border border-[var(--bd)]"
                      style={{ background: brandColor, color: 'white' }}
                    >
                      {(companyName || 'AI').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-black text-sm">{companyName || 'Your Company'}</p>
                    {tagline && <p className="text-[10px] text-gray-500 font-medium">{tagline}</p>}
                  </div>
                </div>
                <div className="text-xs font-bold text-[var(--orange)] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">1</div>
              </div>
              <div className="p-6 space-y-3 bg-white">
                <div className="h-4 rounded-full w-3/4" style={{ background: brandColor, opacity: 0.2 }} />
                <div className="h-3 rounded-full bg-gray-100 w-full" />
                <div className="h-3 rounded-full bg-gray-100 w-5/6" />
              </div>
            </div>
          </div>

          {/* Save */}
          <Button onClick={handleSaveBranding} disabled={savingBranding} className="w-full sm:w-auto font-semibold btn-pill px-6" style={{ background: brandColor, color: 'white' }}>
            {savingBranding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : brandingSaved ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {brandingSaved ? t('profile.saved') : t('profile.saveBranding')}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-[var(--bg)] border-[var(--bd)] shadow-sm">
        <CardHeader className="border-b border-[var(--bd)] bg-[var(--bg2)] pb-4">
          <CardTitle className="flex items-center gap-2 text-[var(--text)] text-lg">
            <Lock className="w-5 h-5 text-[var(--text2)]" />
            {t('profile.changePassword')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-2">
            <Label className="text-[var(--text2)] font-semibold">{t('profile.newPassword')}</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('profile.passwordPlaceholder')}
              className="bg-[var(--bg)] border-[var(--bd)] focus-visible:ring-[var(--orange)] max-w-sm"
            />
          </div>

          {passwordError && (
            <p className="text-red-700 text-sm bg-red-50 p-2 rounded-lg border border-red-200 max-w-sm font-medium">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-emerald-700 text-sm bg-emerald-50 p-2 rounded-lg border border-emerald-200 max-w-sm font-medium">{passwordSuccess}</p>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword.trim()}
            variant="outline"
            className="border-[var(--bd-strong)] text-[var(--text)] hover:bg-[var(--bg2)] font-semibold min-w-[200px]"
          >
            {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
            {t('profile.updatePassword')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

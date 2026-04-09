'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Ban, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateUserAdminRecord } from '../actions';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserData {
  id: string;
  display_name: string;
  company_name: string;
  plan: string;
  created_at: string;
}

interface QuotaData {
  max_briefings: number;
  used_briefings: number;
  is_blocked: boolean;
  blocked_reason: string;
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [sessions, setSessions] = useState<{ id: string; session_name: string; status: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maxBriefings, setMaxBriefings] = useState(10);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();

      const { data: profile } = await supabase
        .from('briefing_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: quotaData } = await supabase
        .from('briefing_quotas')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { count: sessionCount } = await supabase
        .from('briefing_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('template_id', 'is', null);

      const { data: sessionsData } = await supabase
        .from('briefing_sessions')
        .select('id, session_name, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (profile) setUser(profile);
      if (quotaData) {
        setQuota({ ...quotaData, used_briefings: sessionCount || 0 });
        setMaxBriefings(quotaData.max_briefings);
        setIsBlocked(quotaData.is_blocked);
        setBlockedReason(quotaData.blocked_reason || '');
      }
      if (sessionsData) setSessions(sessionsData);
      if (profile) setPlan(profile.plan || 'free');

      setLoading(false);
    }
    loadUser();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserAdminRecord(userId, {
        maxBriefings,
        isBlocked,
        blockedReason,
        plan
      });

      router.refresh();
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--orange)]" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-[var(--text3)] text-center py-20">User not found.</p>;
  }

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-700">
      <div>
        <Link href="/admin">
          <Button variant="ghost" className="text-[var(--text2)] hover:text-[var(--text)] -ml-4 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)]">
          {user.display_name}
        </h2>
        <p className="text-[var(--text2)] text-sm mt-1">{user.company_name || 'No company'} • Joined {new Date(user.created_at).toLocaleDateString()}</p>
      </div>

      {/* Quota Management */}
      <Card className="bg-[var(--bg2)] border-[var(--bd)]">
        <CardHeader>
          <CardTitle className="text-[var(--orange)]">Quota & Plan Management</CardTitle>
          <CardDescription className="text-[var(--text2)]">
            Control how many briefings this user can create.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[var(--text2)]">Max Briefings</Label>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={maxBriefings === -1}
                    onCheckedChange={(c) => setMaxBriefings(c ? -1 : 10)}
                  />
                  <Label className="text-xs text-[var(--orange)] flex items-center gap-1 cursor-pointer" onClick={() => setMaxBriefings(maxBriefings === -1 ? 10 : -1)}>
                    <Sparkles className="w-3 h-3" /> God Mode (Unlimited)
                  </Label>
                </div>
              </div>
              <Input
                type={maxBriefings === -1 ? "text" : "number"}
                value={maxBriefings === -1 ? "Unlimited" : maxBriefings}
                disabled={maxBriefings === -1}
                onChange={(e) => setMaxBriefings(parseInt(e.target.value) || 0)}
                className={`bg-black/50 border-[var(--bd)] focus-visible:ring-purple-500 ${maxBriefings === -1 ? 'text-[var(--orange)] font-semibold' : ''}`}
              />
              <p className="text-xs text-[var(--text3)]">Currently used: {quota?.used_briefings || 0}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--text2)]">Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v || 'free')}>
                <SelectTrigger className="bg-black/50 border-[var(--bd)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg)] border-[var(--bd)]">
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl border border-red-900/30 bg-red-950/20">
            <div className="flex items-center gap-3">
              <Button
                variant={isBlocked ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setIsBlocked(!isBlocked)}
                className={!isBlocked ? 'border-red-900/50 text-red-400 hover:bg-red-950/50' : ''}
              >
                {isBlocked ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                {isBlocked ? 'User is BLOCKED' : 'Block User'}
              </Button>
            </div>
            {isBlocked && (
              <div className="space-y-2">
                <Label className="text-red-300 text-sm">Block Reason</Label>
                <Input
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                  placeholder="Reason for blocking..."
                  className="bg-black/50 border-red-900/30 focus-visible:ring-red-500"
                />
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-[var(--orange)] hover:bg-[#e8552a]">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* User's Briefings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[var(--orange)]" />
          User&apos;s Briefings ({sessions.length})
        </h3>
        {sessions.length === 0 ? (
          <Card className="bg-[var(--bg)] border-[var(--bd)]">
            <CardContent className="text-center py-8 text-[var(--text3)]">
              No briefings created by this user.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <Card key={s.id} className="bg-[var(--bg2)] border-[var(--bd)]">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{s.session_name || 'Untitled'}</p>
                    <p className="text-xs text-[var(--text3)]">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    s.status === 'finished' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                    s.status === 'in_progress' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                    'text-[var(--text2)] bg-[var(--bg2)] border-[var(--bd)]'
                  }`}>
                    {s.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

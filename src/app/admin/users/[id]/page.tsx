'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Ban, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
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

      const { data: sessionsData } = await supabase
        .from('briefing_sessions')
        .select('id, session_name, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (profile) setUser(profile);
      if (quotaData) {
        setQuota(quotaData);
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
      const supabase = createClient();
      
      await supabase
        .from('briefing_quotas')
        .update({
          max_briefings: maxBriefings,
          is_blocked: isBlocked,
          blocked_reason: isBlocked ? blockedReason : '',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      await supabase
        .from('briefing_profiles')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('id', userId);

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
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-zinc-500 text-center py-20">User not found.</p>;
  }

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-700">
      <div>
        <Link href="/admin">
          <Button variant="ghost" className="text-zinc-400 hover:text-white -ml-4 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          {user.display_name}
        </h2>
        <p className="text-zinc-400 text-sm mt-1">{user.company_name || 'No company'} • Joined {new Date(user.created_at).toLocaleDateString()}</p>
      </div>

      {/* Quota Management */}
      <Card className="bg-zinc-900/50 border-purple-500/10">
        <CardHeader>
          <CardTitle className="text-purple-300">Quota & Plan Management</CardTitle>
          <CardDescription className="text-zinc-400">
            Control how many briefings this user can create.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-zinc-300">Max Briefings</Label>
              <Input
                type="number"
                value={maxBriefings}
                onChange={(e) => setMaxBriefings(parseInt(e.target.value) || 0)}
                className="bg-black/50 border-white/10 focus-visible:ring-purple-500"
              />
              <p className="text-xs text-zinc-500">Currently used: {quota?.used_briefings || 0}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v || 'free')}>
                <SelectTrigger className="bg-black/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
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

          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-500">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* User's Briefings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          User&apos;s Briefings ({sessions.length})
        </h3>
        {sessions.length === 0 ? (
          <Card className="bg-zinc-900/30 border-white/5">
            <CardContent className="text-center py-8 text-zinc-500">
              No briefings created by this user.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <Card key={s.id} className="bg-zinc-900/40 border-white/8">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{s.session_name || 'Untitled'}</p>
                    <p className="text-xs text-zinc-500">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    s.status === 'finished' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                    s.status === 'in_progress' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                    'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
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

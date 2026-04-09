'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface AdminUsersTableProps {
  users: {
    id: string;
    display_name?: string;
    company_name?: string;
    is_admin?: boolean;
    plan?: string;
    sessionCount: number;
    finishedCount: number;
    quota: { max_briefings: number; used_briefings: number; is_blocked: boolean };
  }[];
  blockedCount: number;
}

const PAGE_SIZE = 8;

export function AdminUsersTable({ users, blockedCount }: AdminUsersTableProps) {
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(0);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.company_name || '').toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-[var(--text)] flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--orange)]" />
          Registered Users
          {blockedCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium text-[var(--actext)] bg-[var(--acbg)] border border-[var(--acbd)]">
              {blockedCount} blocked
            </span>
          )}
        </h3>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)]" />
          <Input
            value={userSearch}
            onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
            placeholder="Search name or company..."
            className="pl-9 bg-[var(--bg2)] border-[var(--bd)] focus-visible:ring-purple-500 rounded-xl h-9 text-sm"
          />
        </div>
      </div>

      {pagedUsers.length === 0 ? (
        <Card className="bg-[var(--bg)] border-[var(--bd)]">
          <CardContent className="text-center py-10 text-[var(--text3)]">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No users match your search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pagedUsers.map(user => (
            <Card key={user.id} className="bg-[var(--bg2)] border-[var(--bd)] hover:focus-visible:border-[var(--orange)] border-[var(--orange)]/30 transition-all">
              <CardContent className="py-3 px-3 sm:px-4 md:px-6">
                <div className="flex flex-col gap-3">
                  {/* Identity Row */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--acbg)] border border-[var(--acbd)] flex items-center justify-center text-xs sm:text-sm font-bold text-[var(--orange)] shrink-0">
                      {(user.display_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-[var(--text)] truncate">{user.display_name || 'Unnamed'}</p>
                      <p className="text-[11px] sm:text-xs text-[var(--text3)] truncate">{user.company_name || 'No company'}</p>
                    </div>
                    {/* Plan + Blocked */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border ${
                        user.plan === 'enterprise' ? 'text-[var(--bg)] bg-[var(--text)] border-[var(--text)]' :
                        user.plan === 'pro' ? 'text-[var(--orange)] bg-[var(--acbg)] border-[var(--acbd)]' :
                        'text-[var(--text2)] bg-[var(--bg3)] border-[var(--bd)]'
                      }`}>
                        {user.plan || 'free'}
                      </span>
                      {user.quota.is_blocked && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-[var(--actext)] bg-[var(--acbg)] border border-[var(--acbd)]">
                          Blocked
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Stats + Manage Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-[var(--text2)]">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-[var(--text)]">{user.sessionCount}</span>
                        <span className="hidden sm:inline">Briefings</span>
                        <span className="sm:hidden">Total</span>
                      </div>
                      <div className="w-px h-3 bg-[var(--bd)]" />
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-[var(--text)]">{user.finishedCount}</span>
                        <span className="hidden sm:inline">Completed</span>
                        <span className="sm:hidden">Done</span>
                      </div>
                      <div className="w-px h-3 bg-[var(--bd)]" />
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-[var(--orange)]">
                          {user.quota.max_briefings === -1 
                            ? `${user.quota.used_briefings}/∞` 
                            : `${user.quota.used_briefings}/${user.quota.max_briefings}`}
                        </span>
                        <span>Quota</span>
                      </div>
                    </div>
                    <Link 
                      href={`/admin/users/${user.id}`}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' }) + " text-[var(--orange)] hover:text-[#000] hover:bg-[var(--orange)] rounded-lg text-xs px-2 sm:px-3 text-center"}
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Manage</span>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[var(--text3)]">
            {filteredUsers.length} users · Page {userPage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserPage(p => Math.max(0, p - 1))}
              disabled={userPage === 0}
              className="border-[var(--bd)] text-[var(--text2)] hover:bg-[var(--bg3)] rounded-xl h-8 px-3"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={userPage === totalPages - 1}
              className="border-[var(--bd)] text-[var(--text2)] hover:bg-[var(--bg3)] rounded-xl h-8 px-3"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

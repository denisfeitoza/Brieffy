import { getAllUsersAdmin, getAdminExtendedStats } from '@/lib/services/briefingService';
import { AdminUsersTable } from '../components/AdminUsersTable';
import { Users, Shield } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const [users, extendedStats] = await Promise.all([
    getAllUsersAdmin(),
    getAdminExtendedStats(),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
            <Users className="w-7 h-7 text-[var(--orange)]" />
            Users Management
          </h2>
          <p className="text-[var(--text2)] mt-1 text-sm">View and manage all registered users in the platform.</p>
        </div>
      </div>

      {/* Users Table Component */}
      <div className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-4 md:p-6">
        <AdminUsersTable users={users} blockedCount={extendedStats.blockedCount} />
      </div>
    </div>
  );
}

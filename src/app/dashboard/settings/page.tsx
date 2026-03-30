import { redirect } from 'next/navigation';

// AI settings are now admin-only - redirect user to profile
export default function SettingsPage() {
  redirect('/dashboard/profile');
}

import type { Metadata } from 'next';
import AdminStudioSafe from '@/components/admin-studio-safe';

export const metadata: Metadata = { title: 'Roster — Admin', robots: { index: false, follow: false } };

export default function AdminRosterPage() {
  return <AdminStudioSafe />;
}

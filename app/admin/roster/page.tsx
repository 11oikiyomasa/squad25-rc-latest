import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin-auth';
import AdminStudio from '@/components/admin-studio';

export const metadata: Metadata = { title: 'Roster — Admin', robots: { index: false, follow: false } };

export default async function AdminRosterPage() {
  await requireAdmin();
  return <AdminStudio />;
}

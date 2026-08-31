import type { Metadata } from 'next';
import AdminStudio from '@/components/admin-studio';

export const metadata: Metadata = { title: 'Roster — Admin', robots: { index: false, follow: false } };

export default function AdminRosterPage() {
  return <AdminStudio />;
}

import type { Metadata } from 'next';
import AdminStudio from '@/components/admin-studio';

export const metadata: Metadata = {
  title: 'Admin Overview — SQUAD.25',
  robots: { index: false, follow: false },
};

export default function AdminOverviewPage() {
  return <AdminStudio />;
}

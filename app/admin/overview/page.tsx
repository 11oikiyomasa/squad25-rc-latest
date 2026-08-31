import type { Metadata } from 'next';
import AdminStudioSafe from '@/components/admin-studio-safe';

export const metadata: Metadata = {
  title: 'Admin Overview — SQUAD.25',
  robots: { index: false, follow: false },
};

export default function AdminOverviewPage() {
  return <AdminStudioSafe />;
}

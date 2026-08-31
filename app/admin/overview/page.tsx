import type { Metadata } from 'next';
import AdminStudioV2 from '@/components/admin-studio-v2';

export const metadata: Metadata = {
  title: 'Admin Overview — SQUAD.25',
  robots: { index: false, follow: false },
};

export default function AdminOverviewPage() {
  return <AdminStudioV2 initialTab="overview" />;
}

import type { Metadata } from 'next';
import AdminStudioV2 from '@/components/admin-studio-v2';

export const metadata: Metadata = { title: 'Roster — Admin', robots: { index: false, follow: false } };

export default function AdminRosterPage() {
  return <AdminStudioV2 initialTab="members" />;
}

import type { Metadata } from 'next';
import AdminStudio from '@/components/admin-studio';

export const metadata: Metadata = { title: 'Media — Admin', robots: { index: false, follow: false } };

export default function AdminMediaPage() {
  return <AdminStudio />;
}

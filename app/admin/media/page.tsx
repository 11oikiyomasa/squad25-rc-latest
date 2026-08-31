import type { Metadata } from 'next';
import AdminMediaStudio from '@/components/admin-media-studio';

export const metadata: Metadata = { title: 'Media — Admin', robots: { index: false, follow: false } };

export default function AdminMediaPage() {
  return <AdminMediaStudio />;
}

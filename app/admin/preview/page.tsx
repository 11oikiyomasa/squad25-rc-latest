import { requireAdmin } from '@/lib/admin-auth';
import AdminPreview from '@/components/admin-preview';

export const metadata = {
  title: 'Draft Preview — SQUAD.25',
  robots: { index: false, follow: false },
};

export default async function AdminPreviewPage() {
  await requireAdmin();
  return <AdminPreview />;
}

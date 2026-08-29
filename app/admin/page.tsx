import AdminStudio from '@/components/admin-studio';
import { requireAdmin } from '@/lib/admin-auth';

export const metadata = {
  title: 'Content Studio — SQUAD.25',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdmin();
  return <AdminStudio />;
}

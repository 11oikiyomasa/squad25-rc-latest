import { redirect } from 'next/navigation';

export default function LegacyAdminPreviewPage() {
  redirect('/admin/overview');
}

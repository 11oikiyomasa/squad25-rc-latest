import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Legacy Scrim Control — SQUAD.25',
  robots: { index: false, follow: false },
};

export default function LegacyAdminScrimsPage() {
  redirect('/admin/matches');
}

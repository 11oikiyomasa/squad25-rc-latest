import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin-auth';
import ScrimControl from '@/components/scrim-control';

export const metadata: Metadata = { title: 'Matches — Admin', robots: { index: false, follow: false } };

export default async function AdminMatchesPage() {
  await requireAdmin();
  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12"><ScrimControl /></section>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import ScrimControl from '@/components/scrim-control';

export const metadata: Metadata = {
  title: 'Scrim Control — SQUAD.25',
  robots: { index: false, follow: false },
};

export default async function ScrimAdminPage() {
  await requireAdmin();
  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c0d0f]/90 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <div><div className="text-[9px] uppercase tracking-[.2em] text-white/25">SQUAD.25 / Admin</div><div className="mt-1 text-sm font-black tracking-[.18em]">SCRIM CONTROL</div></div>
          <Link href="/admin" className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/50 hover:border-white/25 hover:text-white">Back to Studio</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12"><ScrimControl /></section>
    </main>
  );
}

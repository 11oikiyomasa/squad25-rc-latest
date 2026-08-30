import type { Metadata } from 'next';
import ScrimsContent from '@/components/scrims-content';
import PublicNav from '@/components/public-nav';
import { getPublicScrims } from '@/lib/scrims';

export const metadata: Metadata = {
  title: 'Matches — SQUAD.25',
  description: 'Public matches, upcoming practice rooms, and verified results for SQUAD.25.',
  alternates: { canonical: '/matches' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Matches — SQUAD.25',
    description: 'Upcoming practice rooms and verified results for SQUAD.25.',
    type: 'website',
    url: '/matches',
  },
};

export default async function MatchesPage() {
  const scrims = await getPublicScrims();
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <PublicNav active="match" />
      <ScrimsContent scrims={scrims} />
      <footer className="border-t border-white/8">
        <div className="ui-container flex flex-col gap-4 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <span>SQUAD.25 / MATCHES</span><span>2026</span>
        </div>
      </footer>
    </main>
  );
}

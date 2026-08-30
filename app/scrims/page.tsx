import type { Metadata } from 'next';
import ScrimsContent from '@/components/scrims-content';
import PublicNav from '@/components/public-nav';
import { getPublicScrims } from '@/lib/scrims';

export const metadata: Metadata = {
  title: 'Match Center — SQUAD.25',
  description: 'Public match center for SQUAD.25: upcoming practice rooms and verified results.',
  alternates: { canonical: '/scrims' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Match Center — SQUAD.25',
    description: 'Upcoming practice rooms and verified results for SQUAD.25.',
    type: 'website',
    url: '/scrims',
  },
};

export default async function ScrimsPage() {
  const scrims = await getPublicScrims();
  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <PublicNav active="match" />

      <section className="border-b border-white/8 bg-[#101216]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="text-[10px] uppercase tracking-[.25em] text-[#ff6b38]">06 — Match Center</div>
              <h1 className="mt-3 max-w-4xl font-display text-7xl uppercase leading-[.78] sm:text-9xl">ON<br/><span className="text-[#ff6b38]">THE<br/>CLOCK.</span></h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/45">The public scoreboard for the squad. Upcoming practice rooms and completed results only; internal prep stays private.</p>
            </div>
            <div className="border-l border-white/10 pl-5 lg:max-w-xs"><div className="font-mono text-[9px] uppercase tracking-[.2em] text-white/25">Public data</div><div className="mt-3 text-sm leading-6 text-white/55">Every number here comes from a published scrim record. No placeholder opponents. No invented results.</div></div>
          </div>
        </div>
      </section>

      <ScrimsContent scrims={scrims} />

      <footer className="border-t border-white/8"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>SQUAD.25 / MATCH CENTER</span><span>2026</span></div></footer>
    </main>
  );
}

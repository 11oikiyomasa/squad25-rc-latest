import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicScrims } from '@/lib/scrims';
import ScrimsContent from '@/components/scrims-content';

export const metadata: Metadata = {
  title: 'Scrims — SQUAD.25',
  description: 'Public scrim schedule and recent results for SQUAD.25.',
  alternates: { canonical: '/scrims' },
  robots: { index: true, follow: true },
};

export default async function ScrimsPage() {
  const scrims = await getPublicScrims();
  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c0d0f]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center bg-[#d7ff43] text-sm font-black text-black">S/</span><span className="text-sm font-black tracking-[.22em]">SQUAD.25</span></Link>
          <div className="flex items-center gap-2"><Link href="/roster" className="border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[.18em] text-white/50 hover:border-white/25 hover:text-white">Roster</Link><Link href="/recruitment" className="border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[.18em] text-white/50 hover:border-white/25 hover:text-white">Recruit</Link></div>
        </div>
      </header>

      <section className="border-b border-white/8 bg-[#101216]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="text-[10px] uppercase tracking-[.25em] text-[#ff6b38]">06 — Scrims</div>
              <h1 className="mt-3 max-w-4xl font-display text-7xl uppercase leading-[.78] sm:text-9xl">PLAY<br/><span className="text-[#ff6b38]">THE<br/>NEXT.</span></h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/45">Official public schedule for practice matches. Results appear here after the session is complete.</p>
            </div>
            <div className="border-l border-white/10 pl-5 lg:max-w-xs"><div className="font-mono text-[9px] uppercase tracking-[.2em] text-white/25">Competitive room</div><div className="mt-3 text-sm leading-6 text-white/55">Opponent intel, private notes, and internal prep stay inside the admin control room.</div></div>
          </div>
        </div>
      </section>

      <ScrimsContent scrims={scrims} />

      <footer className="border-t border-white/8"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>SQUAD.25 / SCRIMS</span><span>2026</span></div></footer>
    </main>
  );
}

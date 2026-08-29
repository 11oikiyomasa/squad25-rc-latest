import type { Metadata } from 'next';
import Link from 'next/link';
import { getSquadContent } from '@/lib/content';
import HomeContent from '@/components/home-content';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { profile, members } = await getSquadContent();
  return {
    title: `${profile.name} — MLBB Squad Archive`,
    description: `${profile.tagline} Public roster, player profiles, montage cuts, and squad archive.`,
    openGraph: {
      title: `${profile.name} — MLBB Squad Archive`,
      description: `${profile.tagline} Public roster, player profiles, montage cuts, and squad archive.`,
      type: 'website',
      images: members[0]?.photo ? [{ url: members[0].photo, alt: `${profile.name} roster` }] : [],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function Home() {
  const content = await getSquadContent();
  return (
    <>
      <HomeContent content={content} />
      <section className="border-t border-white/8 bg-[#101216]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24">
          <div>
            <div className="text-[10px] uppercase tracking-[.25em] text-[#ff6b38]">05 — Recruitment</div>
            <h2 className="mt-3 max-w-4xl font-display text-6xl uppercase leading-[.82] sm:text-8xl">Open a seat.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45">Punya role yang cocok, mindset yang benar, dan bukti bisa main? Kirim player file lo. Tim akan review sebelum trial.</p>
          </div>
          <Link href="/recruitment" className="inline-flex items-center justify-center gap-3 bg-[#d7ff43] px-5 py-3 text-xs font-black uppercase tracking-[.18em] text-black hover:bg-[#e7ff83]">Apply as a player <span aria-hidden>↗</span></Link>
        </div>
      </section>
    </>
  );
}

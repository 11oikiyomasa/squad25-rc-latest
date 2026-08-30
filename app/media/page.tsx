import type { Metadata } from 'next';
import { getSquadContent } from '@/lib/content';
import { GalleryGrid } from '@/components/gallery-grid';
import PublicNav from '@/components/public-nav';

export const metadata: Metadata = {
  title: 'Media — SQUAD.25',
  description: 'Public gallery and media archive for SQUAD.25.',
  alternates: { canonical: '/media' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Media — SQUAD.25',
    description: 'Public gallery and media archive for SQUAD.25.',
    type: 'website',
    url: '/media',
  },
};

export default async function MediaPage() {
  const { gallery } = await getSquadContent();
  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <PublicNav active="media" />
      <section className="border-b border-white/8 bg-[#101216]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="text-[10px] uppercase tracking-[.25em] text-[#ff6b38]">05 — Media Archive</div>
          <h1 className="mt-3 max-w-4xl font-display text-7xl uppercase leading-[.78] sm:text-9xl">THE<br/><span className="text-[#ff6b38]">ARCHIVE.</span></h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/45">Published squad photography and selected visual records. Private production assets stay out of the public archive.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        {gallery.length ? <GalleryGrid items={gallery} /> : <div className="border border-white/10 bg-[#101216] p-8 text-sm text-white/45">No public media has been published yet.</div>}
      </section>
      <footer className="border-t border-white/8"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>SQUAD.25 / MEDIA</span><span>2026</span></div></footer>
    </main>
  );
}

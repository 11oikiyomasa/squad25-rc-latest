import type { Metadata } from 'next';
import { getSquadContent } from '@/lib/content';
import { GalleryGrid } from '@/components/gallery-grid';
import PublicNav from '@/components/public-nav';
import { AppShell, EmptyState, PageHeader, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Media — SQUAD.25',
  description: 'Public gallery and media archive for SQUAD.25.',
  alternates: { canonical: '/media' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Media — SQUAD.25',
    description: 'Public gallery and visual records for SQUAD.25.',
    type: 'website',
    url: '/media',
  },
};

export default async function MediaPage() {
  const { gallery } = await getSquadContent();
  return (
    <AppShell>
      <PublicNav active="media" />
      <PageHeader
        eyebrow="05 — Media Archive"
        title="THE"
        accent="ARCHIVE."
        description="Published squad photography and selected visual records. Private production assets stay out of the public archive."
        aside={<><div className="ui-eyebrow">Public media</div><div className="mt-3">Only published archive items appear here. No placeholder imagery.</div></>}
      />
      <Section className="ui-container py-10 sm:py-12 lg:py-16">
        {gallery.length ? <GalleryGrid items={gallery} /> : <EmptyState title="Archive is quiet." description="No public media has been published yet." />}
      </Section>
      <footer className="border-t border-white/8">
        <div className="ui-container flex flex-col gap-4 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <span>SQUAD.25 / MEDIA</span><span>2026</span>
        </div>
      </footer>
    </AppShell>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PublicNav from '@/components/public-nav';
import { Button, Card } from '@/components/ui';
import { getPublicScrims } from '@/lib/scrims';

export const dynamic = 'force-dynamic';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) + ' WIB';
}

function resultLabel(forScore: number | null, againstScore: number | null) {
  if (forScore === null || againstScore === null) return 'SCORE PENDING';
  if (forScore === againstScore) return 'DRAW';
  return forScore > againstScore ? 'WIN' : 'LOSS';
}

export async function generateMetadata({ params }: { params: Promise<{ match_id: string }> }): Promise<Metadata> {
  const { match_id } = await params;
  const scrim = (await getPublicScrims()).find((item) => item.id === match_id);
  if (!scrim) return { title: 'Match not found — SQUAD.25', robots: { index: false, follow: false } };
  return {
    title: `SQUAD.25 vs ${scrim.opponent_name} — ${scrim.status}`,
    description: `${scrim.event_name} / ${scrim.format} / ${scrim.status}.`,
    alternates: { canonical: `/matches/${scrim.id}` },
    openGraph: { title: `SQUAD.25 vs ${scrim.opponent_name}`, description: `${scrim.event_name} / ${scrim.format} / ${scrim.status}.`, type: 'article', url: `/matches/${scrim.id}` },
  };
}

export default async function MatchDetailPage({ params }: { params: Promise<{ match_id: string }> }) {
  const { match_id } = await params;
  const scrims = await getPublicScrims();
  const scrim = scrims.find((item) => item.id === match_id);
  if (!scrim) return notFound();
  const result = resultLabel(scrim.result_for, scrim.result_against);

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--paper)] text-[var(--ink)]">
      <PublicNav active="match" />
      <section className="ui-container pt-5 sm:pt-7">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[9px] font-mono uppercase tracking-[.16em] text-white/30">
          <Link href="/" className="hover:text-white">Home</Link><span aria-hidden="true">/</span><Link href="/matches" className="hover:text-white">Matches</Link><span aria-hidden="true">/</span><span className="text-white/55">{scrim.opponent_name}</span>
        </nav>
      </section>
      <section className="ui-container py-8 sm:py-10 lg:py-14">
        <Card className="overflow-hidden">
          <div className="border-b border-white/8 p-6 sm:p-8 lg:p-10"><div className="flex flex-wrap gap-2"><span className="ui-button ui-button-ghost ui-button-sm">{scrim.status}</span><span className="ui-button ui-button-ghost ui-button-sm">{scrim.format}</span><span className="ui-button ui-button-ghost ui-button-sm">{scrim.event_name}</span></div><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">SQUAD.25</div><div className="mt-2 font-display text-5xl uppercase sm:text-7xl">SQUAD.25</div></div><div className="text-center"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{result}</div><div className="mt-2 font-display text-7xl uppercase sm:text-9xl"><span>{scrim.result_for ?? '—'}</span><span className="px-4 text-white/15">:</span><span>{scrim.result_against ?? '—'}</span></div></div><div className="lg:text-right"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">Opponent</div><div className="mt-2 font-display text-5xl uppercase sm:text-7xl">{scrim.opponent_name}</div></div></div></div>
          <div className="grid gap-3 p-6 sm:grid-cols-3 sm:p-8"><Info label="When" value={formatDateTime(scrim.scheduled_at)} /><Info label="Format" value={scrim.format} /><Info label="Event" value={scrim.event_name} /></div>
          {scrim.public_note && <div className="border-t border-white/8 px-6 py-6 sm:px-8"><div className="ui-eyebrow">Public note</div><p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-white/55">{scrim.public_note}</p></div>}
          <div className="flex flex-wrap gap-3 border-t border-white/8 p-6 sm:p-8"><Button href="/matches" variant="secondary">Back to matches</Button>{scrim.recap_url && <a href={scrim.recap_url} target="_blank" rel="noreferrer" className="ui-button ui-button-ghost">Open recap ↗</a>}{scrim.media_url && <a href={scrim.media_url} target="_blank" rel="noreferrer" className="ui-button ui-button-ghost">Open media ↗</a>}{(scrim.recap_url || scrim.media_url) ? null : <span className="self-center text-[10px] uppercase tracking-[.16em] text-white/25">No recap or media published.</span>}</div>
        </Card>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="border border-white/8 bg-[var(--panel-deep)] p-4"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{label}</div><div className="mt-2 text-sm font-semibold">{value}</div></div>; }

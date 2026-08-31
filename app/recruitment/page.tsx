import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNav from '@/components/public-nav';
import { AppShell, Button, Card, Section } from '@/components/ui';
import { getEligibleRecruitmentOpenings } from '@/lib/recruitment/public-state';

type RecruitmentJob = Awaited<ReturnType<typeof getEligibleRecruitmentOpenings>>[number];

export const metadata: Metadata = {
  title: 'Player Recruitment',
  description: 'Open positions and trial applications for the No Flaws MLBB squad.',
  alternates: { canonical: '/recruitment' },
  robots: { index: true, follow: true },
};

export const dynamic = 'force-dynamic';

export default async function RecruitmentPage() {
  const jobs: RecruitmentJob[] = await getEligibleRecruitmentOpenings();

  return <AppShell><PublicNav active="recruit" /><Section className="ui-container py-14 sm:py-16 lg:py-20">
    <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
      <div><div className="ui-eyebrow text-[var(--acid)]">05 — Recruitment</div><h1 className="mt-4 font-display text-7xl uppercase leading-[.78] sm:text-9xl">JOIN<br/><span className="text-[var(--acid)]">THE<br/>SQUAD.</span></h1><p className="mt-7 max-w-md text-sm leading-7 text-white/45">Pilih posisi yang aktif, baca kriterianya, lalu kirim player file lengkap. Tidak ada posisi aktif berarti tidak ada form palsu.</p><div className="mt-8 grid gap-2"><Button href="/roster" variant="secondary">Review the roster ↗</Button><Button href="/matches" variant="ghost">See match activity ↗</Button></div></div>
      <div className="space-y-3">{jobs.length ? jobs.map((job) => <Card key={job.id} className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="ui-eyebrow text-[var(--acid)]">Open position</div><h2 className="mt-2 font-display text-4xl uppercase">{job.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">{job.description}</p></div><Link href={`/recruitment/${job.slug}`} className="ui-button ui-button-primary ui-button-sm">View requirements ↗</Link></div></Card>) : <Card className="p-7"><div className="ui-eyebrow">Recruitment queue</div><h2 className="mt-3 font-display text-5xl uppercase">No open positions.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/40">Recruitment is currently closed. Check back when a position is published.</p><Link href="/recruitment/closed" className="mt-6 inline-flex ui-button ui-button-secondary">View recruitment status</Link></Card>}</div>
    </div>
  </Section></AppShell>;
}

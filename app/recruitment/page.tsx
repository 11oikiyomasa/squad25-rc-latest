import type { Metadata } from 'next';
import Link from 'next/link';
import RecruitmentForm from '@/components/recruitment-form';
import PublicNav from '@/components/public-nav';
import { AppShell, Button, Card, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Player Recruitment',
  description: 'Apply to trial for the No Flaws MLBB squad.',
  alternates: { canonical: '/recruitment' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Player Recruitment | No Flaws',
    description: 'Apply to trial for the No Flaws MLBB squad.',
    url: 'https://squad25-rc-latest.vercel.app/recruitment',
    type: 'website',
  },
};

export default function RecruitmentPage() {
  return (
    <AppShell>
      <PublicNav active="recruit" />
      <Section className="ui-container py-14 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <div className="ui-eyebrow text-[var(--acid)]">05 — Recruitment</div>
            <h1 className="mt-4 font-display text-7xl uppercase leading-[.78] sm:text-9xl">JOIN<br/><span className="text-[var(--acid)]">THE<br/>SQUAD.</span></h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-white/45">Roster penuh bukan berarti kursi tertutup. Kami cari pemain yang bisa main, belajar, communicate, dan survive scrim—bukan sekadar punya rank tinggi.</p>
            <div className="mt-8 space-y-3 border-t border-white/8 pt-5 font-mono text-[10px] uppercase tracking-[.16em] text-white/30">
              <div className="flex justify-between gap-4"><span>Roles</span><span className="text-white/50">EXP / JUNGLE / MID / GOLD / ROAM / FLEX</span></div>
              <div className="flex justify-between gap-4"><span>Process</span><span className="text-white/50">Review → Contact → Trial</span></div>
              <div className="flex justify-between gap-4"><span>Contact</span><span className="text-white/50">We use the contact you submit</span></div>
            </div>
            <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button href="/roster" variant="secondary">Review the roster ↗</Button>
              <Button href="/matches" variant="ghost">See match activity ↗</Button>
            </div>
          </div>
          <Card className="p-5 sm:p-8">
            <div className="mb-7 border-b border-white/8 pb-5">
              <div className="ui-eyebrow">Trial application</div>
              <h2 className="mt-2 text-2xl font-semibold">Show us your player file.</h2>
              <p className="mt-2 text-sm leading-6 text-white/35">Isi yang benar-benar relevan. Kami lebih peduli detail daripada paragraf kosong.</p>
            </div>
            <RecruitmentForm />
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import RecruitmentForm from '@/components/recruitment-form';

export const metadata: Metadata = {
  title: 'Player Recruitment',
  description: 'Apply to trial for the No Flaws MLBB squad.',
  alternates: { canonical: '/recruitment' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Player Recruitment | No Flaws',
    description: 'Apply to trial for the No Flaws MLBB squad.',
    url: '/recruitment',
    type: 'website',
  },
};

export default function RecruitmentPage() {
  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c0d0f]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 lg:px-8">
          <Link href="/" className="text-sm font-black tracking-[.22em]">NO FLAWS</Link>
          <Link href="/" className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.18em] text-white/50 hover:border-white/25 hover:text-white">Back to squad</Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <div className="text-[10px] uppercase tracking-[.25em] text-[#d7ff43]">05 — Recruitment</div>
            <h1 className="mt-4 font-display text-7xl uppercase leading-[.78] sm:text-9xl">JOIN<br/><span className="text-[#d7ff43]">THE<br/>SQUAD.</span></h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-white/45">Roster penuh bukan berarti kursi tertutup. Kami cari pemain yang bisa main, belajar, communicate, dan survive scrim—bukan sekadar punya rank tinggi.</p>
            <div className="mt-8 space-y-3 border-t border-white/8 pt-5 text-[10px] uppercase tracking-[.16em] text-white/30">
              <div className="flex justify-between gap-4"><span>Roles</span><span className="text-white/50">EXP / JUNGLE / MID / GOLD / ROAM / FLEX</span></div>
              <div className="flex justify-between gap-4"><span>Process</span><span className="text-white/50">Review → Contact → Trial</span></div>
              <div className="flex justify-between gap-4"><span>Contact</span><span className="text-white/50">We use the contact you submit</span></div>
            </div>
          </div>

          <div className="border border-white/10 bg-[#101216] p-5 sm:p-8">
            <div className="mb-7 border-b border-white/8 pb-5">
              <div className="text-[10px] uppercase tracking-[.22em] text-[#ff6b38]">Trial application</div>
              <h2 className="mt-2 text-2xl font-semibold">Show us your player file.</h2>
              <p className="mt-2 text-sm leading-6 text-white/35">Isi yang benar-benar relevan. Kami lebih peduli detail daripada paragraf kosong.</p>
            </div>
            <RecruitmentForm />
          </div>
        </div>
      </section>
    </main>
  );
}

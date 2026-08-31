import type { Metadata } from 'next';
import Link from 'next/link';
import AdminStudio from '@/components/admin-studio';
import { requireAdmin } from '@/lib/admin-auth';

export const metadata: Metadata = {
  title: 'Admin Overview — SQUAD.25',
  robots: { index: false, follow: false },
};

const sections = [
  ['/admin/overview', 'Overview'],
  ['/admin/roster', 'Roster'],
  ['/admin/matches', 'Matches'],
  ['/admin/media', 'Media'],
  ['/admin/recruitment', 'Recruitment'],
] as const;

export default async function AdminOverviewPage() {
  await requireAdmin();
  return (
    <>
      <AdminStudio />
      <nav aria-label="Admin navigation" className="fixed bottom-5 left-5 right-5 z-50 mx-auto flex max-w-5xl gap-1 overflow-x-auto border border-white/10 bg-[#101216]/95 p-1 shadow-xl backdrop-blur-md">
        {sections.map(([href, label]) => <Link key={href} href={href} aria-current={href === '/admin/overview' ? 'page' : undefined} className={`shrink-0 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] ${href === '/admin/overview' ? 'bg-[#d7ff43] text-black' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}>{label}</Link>)}
      </nav>
    </>
  );
}

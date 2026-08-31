import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { logout } from '@/app/login/actions';

const sections = [
  ['/admin/overview', 'Overview'],
  ['/admin/roster', 'Roster'],
  ['/admin/matches', 'Matches'],
  ['/admin/media', 'Media'],
  ['/admin/recruitment', 'Recruitment'],
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <>
      <header className="sticky top-0 z-[60] border-b border-white/8 bg-[#0c0d0f]/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-5 lg:px-8">
          <Link href="/admin/overview" className="shrink-0 text-sm font-black tracking-[.2em]">SQUAD.25 <span className="text-[#d7ff43]">/ ADMIN</span></Link>
          <nav aria-label="Admin navigation" className="min-w-0 flex-1 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1 px-1 py-1">
              {sections.map(([href, label]) => (
                <Link key={href} href={href} className="shrink-0 border border-transparent px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-white/45 hover:border-white/10 hover:bg-white/[.03] hover:text-white">{label}</Link>
              ))}
            </div>
          </nav>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Link href="/" className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/45 hover:border-white/25 hover:text-white">Public ↗</Link>
            <form action={logout}>
              <button type="submit" className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/45 hover:border-white/25 hover:text-white">Logout</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}

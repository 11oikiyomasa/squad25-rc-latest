import Link from 'next/link';

type Active = 'home' | 'roster' | 'match' | 'media' | 'recruit' | 'member';

export default function PublicNav({ active }: { active?: Active }) {
  const links = [
    { href: '/', label: 'Home', key: 'home' as const },
    { href: '/roster', label: 'Roster', key: 'roster' as const },
    { href: '/matches', label: 'Matches', key: 'match' as const },
    { href: '/media', label: 'Media', key: 'media' as const },
    { href: '/recruitment', label: 'Recruitment', key: 'recruit' as const },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c0d0f]/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="SQUAD.25 home">
          <span className="grid h-9 w-9 place-items-center bg-[#d7ff43] text-sm font-black text-black">S/</span>
          <span className="text-sm font-black tracking-[.22em]">SQUAD.25</span>
        </Link>
        <nav aria-label="Public navigation" className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const isActive = active === link.key;
            return (
              <Link key={link.key} href={link.href} aria-current={isActive ? 'page' : undefined} className={`shrink-0 border px-3 py-2 text-[10px] font-semibold uppercase tracking-[.16em] transition ${isActive ? 'border-[#d7ff43]/35 bg-[#d7ff43]/[.06] text-[#d7ff43]' : 'border-transparent text-white/45 hover:border-white/10 hover:text-white'}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

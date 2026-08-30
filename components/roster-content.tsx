'use client';

import { useMemo, useState } from 'react';
import type { Member, Role } from '@/data/squad';
import type { ContentSnapshot } from '@/lib/content';
import { ArrowUpRight, Search } from '@/components/icons';
import { MemberModal } from '@/components/member-modal';
import MemberCard from '@/components/member-card';
import PublicNav from '@/components/public-nav';
import { Button } from '@/components/ui';

const filters: (Role | 'ALL')[] = ['ALL', 'EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM'];
type SortMode = 'order' | 'name' | 'role' | 'status';

export default function RosterContent({ content }: { content: ContentSnapshot }) {
  const { profile: squadProfile, members } = content;
  const [filter, setFilter] = useState<Role | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('order');
  const [selected, setSelected] = useState<{ member: Member; montageIndex?: number } | null>(null);

  const visible = useMemo(() => {
    const filtered = members.filter((member) => {
      const matchesRole = filter === 'ALL' || member.role === filter;
      const haystack = `${member.nickname} ${member.name} ${member.hero} ${member.role} ${member.status}`.toLowerCase();
      return matchesRole && haystack.includes(query.trim().toLowerCase());
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.nickname.localeCompare(b.nickname);
      if (sort === 'role') return `${a.role}-${a.nickname}`.localeCompare(`${b.role}-${b.nickname}`);
      if (sort === 'status') return `${a.status}-${a.nickname}`.localeCompare(`${b.status}-${b.nickname}`);
      return Number(a.number) - Number(b.number);
    });
  }, [filter, members, query, sort]);

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--paper)] text-[var(--ink)]">
      <PublicNav active="roster" />
      <section className="border-b border-white/8 bg-[var(--panel)]"><div className="ui-container py-14 sm:py-16 lg:py-24"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="ui-eyebrow text-[var(--acid)]">01 — Full roster</div><h1 className="mt-3 max-w-4xl font-display text-7xl uppercase leading-[.78] sm:text-9xl">25<br/><span className="text-[var(--acid)]">faces.</span></h1><p className="mt-6 max-w-xl text-sm leading-7 text-white/45">Search the directory, filter by role, sort the squad, then open a player file. Every card has a modal and a direct profile path.</p></div><div className="ui-page-header-aside"><div className="ui-eyebrow text-white/25">Directory state</div><div className="mt-3">{members.filter((m) => m.status !== 'BENCH').length} active/captain · {members.filter((m) => m.status === 'BENCH').length} bench · {members.length} total</div></div></div></div></section>

      <section className="ui-container py-10 sm:py-12 lg:py-14">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-[var(--page-gutter)] overflow-x-auto px-[var(--page-gutter)] pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0"><div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">{filters.map((item) => <Button key={item} type="button" size="sm" variant={filter === item ? 'primary' : 'ghost'} onClick={() => setFilter(item)} className="ui-filter-button">{item}</Button>)}</div></div>
            <label className="flex w-full min-w-0 max-w-sm items-center gap-2" aria-label="Search roster"><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search player, hero, role" className="ui-field w-full" /></label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[.16em] text-white/25"><span>{visible.length} shown</span><span className="mx-2">/</span><span>{members.length} total</span></div>
            <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.16em] text-white/35">Sort<select value={sort} onChange={(e)=>setSort(e.target.value as SortMode)} className="ui-field min-w-40"><option value="order">Squad order</option><option value="name">Nickname</option><option value="role">Role</option><option value="status">Status</option></select></label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visible.map((member, index) => <MemberCard key={member.id} member={member} index={index} onOpen={() => setSelected({ member })} />)}</div>
        {visible.length === 0 && <div className="ui-empty mt-3"><div><div className="ui-eyebrow">No public data</div><h2 className="ui-empty-title mt-2">No player matches.</h2><p className="ui-empty-description">Try another player name, hero, role, or status.</p></div></div>}
      </section>

      <section className="border-y border-white/8 bg-[var(--panel)]"><div className="ui-container flex flex-col gap-5 py-14 sm:flex-row sm:items-end sm:justify-between lg:py-20"><div><div className="ui-eyebrow">Recruitment</div><h2 className="mt-3 font-display text-5xl uppercase leading-none sm:text-7xl">Think you belong?</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/40">Kirim player file dan kasih tim alasan untuk ngajak lo trial.</p></div><Button href="/recruitment">Apply as a player <ArrowUpRight size={15}/></Button></div></section>
      <footer className="border-t border-white/8"><div className="ui-container flex flex-col gap-4 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between"><span>{squadProfile.name} / FULL ROSTER</span><span>{squadProfile.season}</span></div></footer>
      <MemberModal member={selected?.member ?? null} initialMontageIndex={selected?.montageIndex ?? 0} onClose={() => setSelected(null)} />
    </main>
  );
}

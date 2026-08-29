'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Member, Role } from '@/data/squad';
import type { ContentSnapshot } from '@/lib/content';
import { ArrowUpRight, Search } from '@/components/icons';
import { MemberModal } from '@/components/member-modal';
import { normalizeYoutubeId } from '@/data/squad';

const filters: (Role | 'ALL')[] = ['ALL', 'EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM'];

function publicCuts(member: Member) {
  return member.montages.filter((montage) => Boolean(normalizeYoutubeId(montage.youtubeId))).length;
}

export default function RosterContent({ content }: { content: ContentSnapshot }) {
  const { profile: squadProfile, members } = content;
  const [filter, setFilter] = useState<Role | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ member: Member; montageIndex?: number } | null>(null);
  const visible = useMemo(() => members.filter((member) => {
    const matchesRole = filter === 'ALL' || member.role === filter;
    const haystack = `${member.nickname} ${member.name} ${member.hero} ${member.role}`.toLowerCase();
    return matchesRole && haystack.includes(query.trim().toLowerCase());
  }), [filter, members, query]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0d0f] text-[#f4f0e7]">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c0d0f]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center bg-[#d7ff43] text-sm font-black text-black">S/</div><span className="text-sm font-black tracking-[.22em]">{squadProfile.name}</span></Link>
          <div className="flex items-center gap-3"><span className="hidden font-mono text-[9px] uppercase tracking-[.2em] text-white/25 sm:inline">Roster / {members.length}</span><Link href="/recruitment" className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-white/60 hover:border-white/25 hover:text-white">Recruit <ArrowUpRight size={13}/></Link></div>
        </div>
      </header>

      <section className="border-b border-white/8 bg-[#101216]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><div className="text-[10px] uppercase tracking-[.25em] text-[#d7ff43]">01 — Full roster</div><h1 className="mt-3 max-w-4xl font-display text-7xl uppercase leading-[.78] sm:text-9xl">25<br/><span className="text-[#d7ff43]">faces.</span></h1><p className="mt-6 max-w-xl text-sm leading-7 text-white/45">The full player directory. Filter by role, search a name, then open a player for the deeper profile and tape.</p></div>
            <div className="border-l border-white/10 pl-5 lg:max-w-xs"><div className="font-mono text-[9px] uppercase tracking-[.2em] text-white/25">Navigation</div><div className="mt-3 text-sm leading-6 text-white/55">Home keeps the spotlight tight. This page keeps the archive complete.</div></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`shrink-0 border px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[.16em] transition ${filter === item ? 'border-[#d7ff43] bg-[#d7ff43] text-black' : 'border-white/10 text-white/45 hover:text-white'}`}>{item}</button>)}</div>
          </div>
          <label className="flex w-full min-w-0 items-center gap-2 border border-white/10 px-3 py-3 text-white/35 lg:max-w-sm" aria-label="Search roster"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search player, hero, role" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25" /></label>
        </div>

        <div className="mb-5 mt-5 flex items-center justify-between text-[10px] uppercase tracking-[.16em] text-white/25"><span>{visible.length} player{visible.length === 1 ? '' : 's'} shown</span><span>25 total</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((member, index) => <RosterCard key={member.id} member={member} index={index} onOpen={(item) => setSelected({ member: item })} />)}
        </div>
        {visible.length === 0 && <div className="border border-white/10 p-10 text-sm text-white/45">No player matches that search.</div>}
      </section>

      <section className="border-y border-white/8 bg-[#101216]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-14 sm:flex-row sm:items-end sm:justify-between lg:px-8 lg:py-20"><div><div className="text-[10px] uppercase tracking-[.25em] text-[#ff6b38]">Recruitment</div><h2 className="mt-3 font-display text-5xl uppercase leading-none sm:text-7xl">Think you belong?</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/40">Kirim player file dan kasih tim alasan untuk ngajak lo trial.</p></div><Link href="/recruitment" className="inline-flex items-center justify-center gap-3 bg-[#d7ff43] px-5 py-3 text-xs font-black uppercase tracking-[.18em] text-black hover:bg-[#e7ff83]">Apply as a player <ArrowUpRight size={15}/></Link></div>
      </section>

      <footer className="border-t border-white/8"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>{squadProfile.name} / FULL ROSTER</span><span>{squadProfile.season}</span></div></footer>
      <MemberModal member={selected?.member ?? null} initialMontageIndex={selected?.montageIndex ?? 0} onClose={() => setSelected(null)} />
    </main>
  );
}

function RosterCard({ member, index, onOpen }: { member: Member; index: number; onOpen: (member: Member) => void }) {
  const cuts = publicCuts(member);
  return (
    <button type="button" onClick={() => onOpen(member)} aria-label={`Open ${member.nickname} profile`} className="group relative aspect-[16/9] min-h-0 overflow-hidden border border-white/10 bg-[#101216] text-left">
      <Image src={member.photo} alt={`${member.nickname} profile`} fill sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw" className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]" priority={index < 3} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(145deg, ${member.accent}18, transparent 38%)` }} />
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4"><span className="font-mono text-[9px] tracking-[.18em] text-white/50">{member.number} / 25</span><span className="font-mono text-[9px] uppercase tracking-[.16em] text-white/60">{member.status}</span></div>
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/50">{member.role} / {member.hero}</div><div className="mt-2 font-display text-5xl uppercase leading-none sm:text-6xl" style={{ color: member.accent }}>{member.nickname}</div><div className="mt-2 truncate text-xs text-white/55">{member.name}</div><div className="mt-5 flex items-center justify-between border-t border-white/12 pt-3 font-mono text-[9px] uppercase tracking-[.17em] text-white/40"><span>{cuts > 0 ? `${cuts} public cuts` : 'No public cuts'}</span><span>Open profile ↗</span></div></div>
    </button>
  );
}

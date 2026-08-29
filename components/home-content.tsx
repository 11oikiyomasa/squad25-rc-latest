'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { Role, Member } from '@/data/squad';
import type { ContentSnapshot } from '@/lib/content';
import { ArrowUpRight, Play, Search } from '@/components/icons';
import { MemberModal } from '@/components/member-modal';
import { GalleryGrid } from '@/components/gallery-grid';
import { normalizeYoutubeId } from '@/data/squad';

function youtubeThumbnail(value: string) {
  const id = normalizeYoutubeId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

const filters: (Role | 'ALL')[] = ['ALL','EXP','JUNGLE','MID','GOLD','ROAM'];

export default function HomeContent({ content }: { content: ContentSnapshot }) {
  const { profile: squadProfile, members, achievements, gallery } = content;
  const [filter, setFilter] = useState<Role | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ member: Member; montageIndex?: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const openMember = (member: Member, montageIndex = 0) => setSelected({ member, montageIndex });
  const visible = useMemo(() => members.filter(m => (filter==='ALL'||m.role===filter) && `${m.nickname} ${m.name}`.toLowerCase().includes(query.toLowerCase())), [filter,query,members]);
  const featuredMontage: Member = members[3] ?? members[0]!;
  const featuredCut = featuredMontage.montages.find((m) => Boolean(normalizeYoutubeId(m.youtubeId)));
  const featuredCutCount = featuredMontage.montages.filter((m) => Boolean(normalizeYoutubeId(m.youtubeId))).length;
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0d0f]">
      <div className="noise" />
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c0d0f]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center bg-[#d7ff43] text-sm font-black text-black">S/</div><div className="text-sm font-black tracking-[.22em]">{squadProfile.name}</div></a>
          <nav className="hidden gap-7 text-[11px] uppercase tracking-[.2em] text-white/45 sm:flex"><a href="#roster" className="hover:text-white">Roster</a><a href="#gallery" className="hover:text-white">Archive</a><a href="#tape" className="hover:text-white">The Tape</a><a href="#history" className="hover:text-white">History</a></nav><button type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(v => !v)} className="border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-white/60 sm:hidden">{menuOpen ? "Close" : "Menu"}</button>
          <a href="#gallery" className="hidden items-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] hover:border-white/25 md:flex">Archive <ArrowUpRight size={14}/></a><a href="#roster" className="flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] hover:border-white/25">Meet the squad <ArrowUpRight size={14}/></a>
        </div>
        {menuOpen && <div id="mobile-menu" className="border-t border-white/8 bg-[#0c0d0f] px-5 py-4 sm:hidden">
          <nav className="grid gap-1">
            {[['Roster','#roster'],['The Tape','#tape'],['History','#history'],['Archive','#gallery']].map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border border-white/8 px-4 py-3 text-[10px] font-semibold uppercase tracking-[.2em] text-white/55 hover:border-white/20 hover:text-white"><span>{label}</span><ArrowUpRight size={13}/></a>)}
          </nav>
        </div>}
      </header>

      <section id="top" className="hero-slab grid-bg relative overflow-hidden border-b border-white/8">
        <div className="mx-auto grid min-h-[690px] max-w-7xl items-end gap-10 px-5 pb-14 pt-20 lg:grid-cols-[1.35fr_.65fr] lg:px-8 lg:pb-20">
          <div className="reveal">
            <div className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.28em] text-white/42"><span className="h-px w-9 bg-[#d7ff43]"/> Public roster / {squadProfile.season}</div>
            <h1 className="font-display max-w-5xl break-words text-[clamp(5.1rem,13vw,12.5rem)] uppercase leading-[.72] text-white">{squadProfile.name.trim().split(/\s+/).map((part, index, parts) => <span key={`${part}-${index}`} className={index === parts.length - 1 ? 'text-[#d7ff43]' : ''}>{part}{index < parts.length - 1 ? ' ' : ''}</span>)}</h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/55 sm:text-lg">{squadProfile.tagline} An evolving archive of who we are when the match gets messy.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#roster" className="inline-flex items-center gap-3 bg-[#d7ff43] px-5 py-3 text-xs font-black uppercase tracking-[.18em] text-black hover:bg-[#e7ff83]">View roster <ArrowUpRight size={15}/></a><a href="#tape" className="inline-flex items-center gap-3 border border-white/12 px-5 py-3 text-xs font-black uppercase tracking-[.18em] text-white/80 hover:border-white/25">Explore the tape <Play size={14}/></a></div>
          </div>
          <div className="reveal lg:justify-self-end" style={{animationDelay:'120ms'}}>
            <div className="border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/8 pb-4 font-mono text-[10px] uppercase tracking-[.22em] text-white/35"><span>Squad index</span><span>01 / 03</span></div>
              <div className="grid grid-cols-2 gap-px bg-white/8">
                <div className="bg-[#0e1013] p-5"><div className="font-display text-5xl">{members.length}</div><div className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/35">Players</div></div>
                <div className="bg-[#0e1013] p-5"><div className="font-display text-5xl">{new Set(members.map((m) => m.role)).size.toString().padStart(2, '0')}</div><div className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/35">Roles</div></div>
              </div>
              <div className="mt-5 text-xs leading-6 text-white/45">Built to keep the roster useful: fast to scan, deeper when you open a player, zero noise until you ask for it.</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/8 overflow-hidden"><div className="marquee flex w-max gap-10 whitespace-nowrap py-4 text-[10px] uppercase tracking-[.25em] text-white/35"><span>KEEP COMMS CLEAN</span><span>•</span><span>MAKE THE FIRST PLAY</span><span>•</span><span>NO FREE SPACE</span><span>•</span><span>KEEP COMMS CLEAN</span><span>•</span><span>MAKE THE FIRST PLAY</span><span>•</span><span>NO FREE SPACE</span></div></div>
      </section>

      <section id="roster" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-8 border-b border-white/8 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="text-[10px] uppercase tracking-[.25em] text-[#d7ff43]">01 — Roster</div><h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">25 faces.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-white/45">Tap a player for the full profile and their montage cuts.</p></div>
          <div className="w-full max-w-xl"><div className="flex flex-wrap items-center gap-2">{filters.map(f=><button type="button" key={f} onClick={()=>setFilter(f)} className={`border px-3 py-2 text-[10px] font-semibold uppercase tracking-[.16em] transition ${filter===f?'border-[#d7ff43] bg-[#d7ff43] text-black':'border-white/10 text-white/45 hover:text-white'}`}>{f}</button>)}<label className="ml-auto flex min-w-[210px] flex-1 items-center gap-2 border border-white/10 px-3 py-2 text-white/35" aria-label="Search roster"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search player" aria-label="Search player" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25"/></label></div></div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m,i)=><MemberCard key={m.id} member={m} index={i} onOpen={openMember}/>) }
        </div>
        {visible.length===0 && <div className="border border-white/10 p-10 text-sm text-white/45">No player matches that search.</div>}
      </section>

      <section id="tape" className="border-y border-white/8 bg-[#101216]">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[.7fr_1.3fr]">
          <div className="grid-bg border-b border-white/8 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-12"><div className="text-[10px] uppercase tracking-[.25em] text-[#ff6b38]">02 — The tape</div><h2 className="mt-3 font-display text-7xl uppercase leading-[.8] sm:text-9xl">WATCH<br/>THE<br/><span className="text-[#ff6b38]">CUT.</span></h2><p className="mt-8 max-w-xs text-sm leading-6 text-white/45">Featured player archive. No autoplay carousel. You choose when the highlight starts.</p><button type="button" onClick={()=>openMember(featuredMontage)} className="mt-8 inline-flex items-center gap-3 border border-white/12 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] hover:border-white/25">Open player <ArrowUpRight size={14}/></button></div>
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="relative overflow-hidden border border-white/10 bg-black">
              <Image src={youtubeThumbnail(featuredCut?.youtubeId ?? '') || featuredMontage.photo} alt={`${featuredMontage.nickname} featured`} fill sizes="(max-width: 1023px) 100vw, 70vw" className="object-cover opacity-55" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/5"/><div className="absolute left-5 top-5 text-[10px] uppercase tracking-[.2em] text-white/50">Featured / {featuredMontage.role}</div>
              {featuredCut ? <button type="button" onClick={()=>openMember(featuredMontage, featuredMontage.montages.indexOf(featuredCut))} aria-label={`Play ${featuredCut.title}`} className="absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-[#d7ff43] text-black shadow-[0_0_0_12px_rgba(215,255,67,.08)] transition hover:scale-105"><Play size={21}/></span></button> : <div className="absolute inset-0 grid place-items-center"><span className="border border-white/15 bg-black/50 px-4 py-2 text-[10px] font-black uppercase tracking-[.2em] text-white/60 backdrop-blur-sm">No public cut yet</span></div>}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7"><div className="font-display text-5xl uppercase sm:text-7xl" style={{color:featuredMontage.accent}}>{featuredMontage.nickname}</div><div className="mt-2 flex gap-2 text-[10px] uppercase tracking-[.18em] text-white/50"><span>{featuredMontage.hero}</span><span>•</span><span>{featuredCutCount} public cuts</span></div></div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{featuredCutCount > 0 ? featuredMontage.montages.filter((m) => normalizeYoutubeId(m.youtubeId)).slice(0, 2).map((m, idx)=><button type="button" key={m.title} onClick={()=>openMember(featuredMontage, featuredMontage.montages.indexOf(m))} className="border border-white/8 p-4 text-left hover:border-white/18"><div className="flex items-center gap-3"><div className="relative h-12 w-20 shrink-0 overflow-hidden border border-white/10 bg-black"><Image src={youtubeThumbnail(m.youtubeId)} alt="" fill sizes="80px" className="object-cover" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="text-[10px] uppercase tracking-[.18em] text-white/30">0{idx+1}</span><span className="text-[10px] text-white/25">{m.duration}</span></div><div className="mt-2 truncate text-sm font-semibold">{m.title}</div><div className="mt-1 text-xs text-white/35">{m.hero}</div></div></div></button>) : <div className="border border-white/8 bg-white/[.02] p-4 text-sm leading-6 text-white/35 sm:col-span-2">No public cuts are published yet. Add a valid YouTube video in Content Studio to enable playback here.</div>}</div>
          </div>
        </div>
      </section>

      <section id="history" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><div className="text-[10px] uppercase tracking-[.25em] text-white/35">03 — History</div><h2 className="mt-3 font-display text-7xl uppercase leading-[.82] sm:text-9xl">KEEP<br/><span className="text-[#d7ff43]">RECEIPTS.</span></h2></div>
          <div className="space-y-4">{achievements.map((a,i)=><div key={a.title} className="grid gap-3 border-t border-white/8 py-5 sm:grid-cols-[90px_1fr_180px] sm:items-center"><div className="font-display text-3xl text-white/35">{a.year}</div><div><div className="text-lg font-semibold">{a.title}</div><div className="mt-1 text-xs text-white/35">{a.note}</div></div><div className="text-[10px] uppercase tracking-[.18em] text-white/25 sm:text-right">Result / archived</div></div>)}</div>
        </div>
      </section>

      <section id="gallery" className="border-y border-white/8 bg-[#0f1114]">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="flex flex-col gap-5 border-b border-white/8 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[.25em] text-white/35">04 — Archive</div>
              <h2 className="mt-3 font-display text-6xl uppercase leading-[.85] sm:text-8xl">OUTSIDE<br/><span className="text-[#ff6b38]">THE MATCH.</span></h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/40">The bits between games matter too. Keep the squad memories in one place, without turning the homepage into a photo dump.</p>
          </div>
          <GalleryGrid items={gallery} />
        </div>
      </section>

      <footer className="border-t border-white/8"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>{squadProfile.name} / PRIVATE ROSTER, PUBLIC ARCHIVE</span><span>{squadProfile.season}</span></div></footer>
      <MemberModal member={selected?.member ?? null} initialMontageIndex={selected?.montageIndex ?? 0} onClose={()=>setSelected(null)} />
    </main>
  );
}

function MemberCard({ member, index, onOpen }: { member: Member; index: number; onOpen: (m: Member, montageIndex?: number) => void }) {
  const playableCount = member.montages.filter((montage) => Boolean(normalizeYoutubeId(montage.youtubeId))).length;
  return (
    <button
      type="button"
      aria-label={`Open ${member.nickname} profile`}
      onClick={() => onOpen(member)}
      className="member-card group relative min-h-[360px] overflow-hidden border border-white/10 bg-[#101216] text-left sm:min-h-[430px]"
    >
      <Image
        src={member.photo}
        alt={`${member.nickname} profile`}
        fill
        sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
        className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
        priority={index < 3}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(145deg, ${member.accent}18, transparent 38%)` }} />
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <span className="font-mono text-[9px] tracking-[.18em] text-white/50">{member.number} / 25</span>
        <span className="font-mono text-[9px] uppercase tracking-[.16em] text-white/60">{member.status}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/50">{member.role} / {member.hero}</div>
            <div className="mt-2 font-display truncate text-5xl uppercase leading-none sm:text-6xl" style={{ color: member.accent }}>{member.nickname}</div>
            <div className="mt-2 truncate text-xs text-white/55">{member.name}</div>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/30 text-white/70 backdrop-blur-sm transition group-hover:border-white/40 group-hover:text-white">↗</span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/12 pt-3 font-mono text-[9px] uppercase tracking-[.17em] text-white/40">
          <span>{playableCount > 0 ? `${playableCount} public cuts` : 'No public cuts'}</span><span>Open profile</span>
        </div>
      </div>
    </button>
  );
}

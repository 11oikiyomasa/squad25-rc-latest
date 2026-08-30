'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Member } from '@/data/squad';
import type { ContentSnapshot } from '@/lib/content';
import { ArrowUpRight, Play } from '@/components/icons';
import { GalleryGrid } from '@/components/gallery-grid';
import MemberCard from '@/components/member-card';
import { MemberModal } from '@/components/member-modal';
import { normalizeYoutubeId } from '@/data/squad';
import { selectFeaturedMember } from '@/lib/featured';
import { Button } from '@/components/ui';

function youtubeThumbnail(value: string) {
  const id = normalizeYoutubeId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

function publicCuts(member: Member) {
  return member.montages.filter((montage) => Boolean(normalizeYoutubeId(montage.youtubeId))).length;
}

export default function HomeLanding({ content }: { content: ContentSnapshot }) {
  const { profile, members, achievements, gallery } = content;
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<{ member: Member; montageIndex?: number } | null>(null);
  const featured = useMemo(() => members.slice(0, 6), [members]);
  const featuredMontage = useMemo(() => selectFeaturedMember(members), [members]);
  const featuredCut = featuredMontage?.montages.find((montage) => Boolean(normalizeYoutubeId(montage.youtubeId)));
  const featuredCutCount = featuredMontage ? publicCuts(featuredMontage) : 0;

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--paper)] text-[var(--ink)]">
      <div className="noise" />

      <header className="sticky top-0 z-40 border-b border-white/8 bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] backdrop-blur-md">
        <div className="ui-container flex h-16 items-center justify-between gap-4">
          <Link href="#top" className="flex shrink-0 items-center gap-3" aria-label="SQUAD.25 home">
            <span className="grid h-9 w-9 place-items-center bg-[var(--acid)] text-sm font-black text-black">S/</span>
            <span className="text-sm font-black tracking-[.22em]">{profile.name}</span>
          </Link>

          <nav aria-label="Homepage sections" className="hidden items-center gap-7 text-[11px] uppercase tracking-[.2em] text-white/45 lg:flex">
            <Link href="/roster" className="transition-colors hover:text-white">Roster</Link>
            <Link href="/matches" className="transition-colors hover:text-white">Matches</Link>
            <Link href="/media" className="transition-colors hover:text-white">Media</Link>
            <Link href="#tape" className="transition-colors hover:text-white">The Tape</Link>
            <Link href="#history" className="transition-colors hover:text-white">History</Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button href="/recruitment" variant="ghost" size="sm">Recruit</Button>
            <Button href="/roster" variant="secondary" size="sm">Full roster <ArrowUpRight size={14}/></Button>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="md:hidden"
            aria-expanded={menuOpen}
            aria-controls="home-mobile-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? 'Close ×' : 'Menu'}
          </Button>
        </div>

        {menuOpen && (
          <div id="home-mobile-menu" className="border-t border-white/8 bg-[var(--paper)] px-[var(--page-gutter)] pb-5 pt-4 md:hidden">
            <nav aria-label="Mobile navigation" className="grid gap-2">
              <Link href="/roster" onClick={() => setMenuOpen(false)} className="flex min-h-14 items-center justify-between border border-white/12 bg-[var(--panel)] px-4 text-[11px] font-black uppercase tracking-[.18em] text-white/85 hover:border-white/25 hover:text-white"><span>Roster</span><span className="text-white/30">01</span></Link>
              <Link href="/matches" onClick={() => setMenuOpen(false)} className="flex min-h-14 items-center justify-between border border-white/12 bg-[var(--panel)] px-4 text-[11px] font-black uppercase tracking-[.18em] text-white/85 hover:border-white/25 hover:text-white"><span>Matches</span><span className="text-[var(--acid)]">02</span></Link>
              <Link href="/media" onClick={() => setMenuOpen(false)} className="flex min-h-14 items-center justify-between border border-white/12 bg-[var(--panel)] px-4 text-[11px] font-black uppercase tracking-[.18em] text-white/85 hover:border-white/25 hover:text-white"><span>Media</span><span className="text-white/30">03</span></Link>
              <Link href="/recruitment" onClick={() => setMenuOpen(false)} className="border border-white/8 px-4 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/55 hover:border-white/20 hover:text-white">Recruit ↗</Link>
              <Link href="#tape" onClick={() => setMenuOpen(false)} className="border border-white/8 px-4 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/55 hover:border-white/20 hover:text-white">The tape ↗</Link>
              <Link href="#history" onClick={() => setMenuOpen(false)} className="border border-white/8 px-4 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/55 hover:border-white/20 hover:text-white">History ↗</Link>
              <Link href="#gallery" onClick={() => setMenuOpen(false)} className="border border-white/8 px-4 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/55 hover:border-white/20 hover:text-white">Archive ↗</Link>
            </nav>
          </div>
        )}
      </header>

      <section id="top" className="hero-slab grid-bg relative overflow-hidden border-b border-white/8">
        <div className="ui-container grid min-h-[680px] items-end gap-10 pb-14 pt-20 lg:grid-cols-[1.35fr_.65fr] lg:pb-20">
          <div className="reveal">
            <div className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.28em] text-white/42"><span className="h-px w-9 bg-[var(--acid)]"/> Public squad / {profile.season}</div>
            <h1 className="max-w-5xl break-words font-display text-[clamp(5.2rem,13vw,12.5rem)] uppercase leading-[.72] text-white">{profile.name.trim().split(/\s+/).map((part, index, parts) => <span key={`${part}-${index}`} className={index === parts.length - 1 ? 'text-[var(--acid)]' : ''}>{part}{index < parts.length - 1 ? ' ' : ''}</span>)}</h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/55 sm:text-lg">{profile.tagline} An evolving public archive of the squad, its players, and the moments worth keeping.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button href="/roster">View full roster <ArrowUpRight size={15}/></Button><Button href="/recruitment" variant="secondary">Join the squad <ArrowUpRight size={15}/></Button></div>
          </div>
          <div className="reveal lg:justify-self-end" style={{ animationDelay: '120ms' }}>
            <div className="border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/8 pb-4 font-mono text-[10px] uppercase tracking-[.22em] text-white/35"><span>Squad index</span><span>01 / 03</span></div>
              <div className="grid grid-cols-2 gap-px bg-white/8">
                <div className="bg-[var(--panel-deep)] p-5"><div className="font-display text-5xl">{members.length}</div><div className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/35">Players</div></div>
                <div className="bg-[var(--panel-deep)] p-5"><div className="font-display text-5xl">{new Set(members.map((member) => member.role)).size.toString().padStart(2, '0')}</div><div className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/35">Roles</div></div>
              </div>
              <div className="mt-5 text-xs leading-6 text-white/45">The homepage shows six players on purpose. The complete directory lives one click away.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="featured-roster" className="ui-container py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col gap-6 border-b border-white/8 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="ui-eyebrow text-[var(--acid)]">01 — Featured roster</div><h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">6 in frame.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/45">A tight first look, not the whole database. Open the roster for all 25.</p></div>
          <Button href="/roster" variant="secondary" size="sm">View all 25 <ArrowUpRight size={14}/></Button>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{featured.map((member, index) => <MemberCard key={member.id} member={member} index={index} onOpen={() => setSelected({ member })} />)}</div>
      </section>

      <section id="tape" className="border-y border-white/8 bg-[var(--panel)]">
        <div className="ui-container grid lg:grid-cols-[.7fr_1.3fr]">
          <div className="grid-bg border-b border-white/8 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
            <div className="ui-eyebrow">02 — The tape</div>
            <h2 className="mt-3 font-display text-7xl uppercase leading-[.8] sm:text-9xl">WATCH<br/>THE<br/><span className="text-[var(--ember)]">CUT.</span></h2>
            <p className="mt-8 max-w-xs text-sm leading-6 text-white/45">One featured player, one deliberate click. No autoplay carousel.</p>
            {featuredMontage && <Button type="button" variant="secondary" size="sm" className="mt-8 w-fit" onClick={() => setSelected({ member: featuredMontage })}>Open player <ArrowUpRight size={14}/></Button>}
          </div>
          <div className="p-6 sm:p-8 lg:p-12">
            {featuredMontage ? (
              <div className="relative overflow-hidden border border-white/10 bg-[var(--panel-black)]">
                <Image src={youtubeThumbnail(featuredCut?.youtubeId ?? '') || featuredMontage.photo} alt={`${featuredMontage.nickname} featured`} fill sizes="(max-width: 1023px) 100vw, 70vw" className="object-cover opacity-55" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/5" />
                <div className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[.2em] text-white/50">Featured / {featuredMontage.role}</div>
                {featuredCut ? <button type="button" onClick={() => setSelected({ member: featuredMontage, montageIndex: featuredMontage.montages.indexOf(featuredCut) })} aria-label={`Play ${featuredCut.title}`} className="absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--acid)] text-black shadow-[0_0_0_12px_rgba(215,255,67,.08)] transition-transform duration-200 hover:scale-105"><Play size={21}/></span></button> : <div className="absolute inset-0 grid place-items-center"><span className="border border-white/15 bg-black/50 px-4 py-2 text-[10px] font-black uppercase tracking-[.2em] text-white/60 backdrop-blur-sm">No public cut yet</span></div>}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7"><div className="truncate font-display text-5xl uppercase sm:text-7xl" style={{ color: featuredMontage.accent }}>{featuredMontage.nickname}</div><div className="mt-2 flex gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/50"><span>{featuredMontage.hero}</span><span>•</span><span>{featuredCutCount} public cuts</span></div></div>
              </div>
            ) : <div className="grid min-h-64 place-items-center border border-white/10 text-sm text-white/35">No featured player available.</div>}
          </div>
        </div>
      </section>

      <section id="history" className="ui-container py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><div className="ui-eyebrow text-white/35">03 — History</div><h2 className="mt-3 font-display text-7xl uppercase leading-[.82] sm:text-9xl">KEEP<br/><span className="text-[var(--acid)]">RECEIPTS.</span></h2></div>
          <div className="space-y-4">
            {achievements.length ? achievements.map((achievement) => <div key={achievement.title} className="grid gap-3 border-t border-white/8 py-5 sm:grid-cols-[90px_1fr_180px] sm:items-center"><div className="font-display text-3xl text-white/35">{achievement.year}</div><div><div className="text-lg font-semibold">{achievement.title}</div><div className="mt-1 text-xs text-white/35">{achievement.note}</div></div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-white/25 sm:text-right">Result / archived</div></div>) : <div className="ui-empty"><div><div className="ui-eyebrow">No public data</div><h3 className="ui-empty-title mt-2">History is open.</h3><p className="ui-empty-description">No achievements have been published yet.</p></div></div>}
          </div>
        </div>
      </section>

      <section id="gallery" className="border-y border-white/8 bg-[var(--panel-deep)]">
        <div className="ui-container py-16 sm:py-20 lg:py-24">
          <div className="flex flex-col gap-5 border-b border-white/8 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="ui-eyebrow text-white/35">04 — Archive</div><h2 className="mt-3 font-display text-6xl uppercase leading-[.85] sm:text-8xl">OUTSIDE<br/><span className="text-[var(--ember)]">THE MATCH.</span></h2></div>
            <p className="max-w-md text-sm leading-6 text-white/40">The squad archive belongs here. The roster belongs on its own page.</p>
          </div>
          {gallery.length ? <GalleryGrid items={gallery} /> : <div className="mt-8"><div className="ui-empty"><div><div className="ui-eyebrow">No public data</div><h3 className="ui-empty-title mt-2">Archive is quiet.</h3><p className="ui-empty-description">No public media has been published yet.</p></div></div></div>}
        </div>
      </section>

      <section className="border-y border-white/8 bg-[var(--panel)]">
        <div className="ui-container flex max-w-7xl flex-col gap-5 py-14 sm:flex-row sm:items-end sm:justify-between lg:py-20">
          <div><div className="ui-eyebrow">05 — Recruitment</div><h2 className="mt-3 font-display text-5xl uppercase leading-none sm:text-7xl">Open a seat.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/40">Punya role yang cocok, mindset yang benar, dan bukti bisa main? Kirim player file lo.</p></div>
          <Button href="/recruitment">Apply as a player <ArrowUpRight size={15}/></Button>
        </div>
      </section>

      <footer className="border-t border-white/8"><div className="ui-container flex flex-col gap-5 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between"><span>{profile.name} / PUBLIC ARCHIVE</span><span>{profile.season}</span></div></footer>
      <MemberModal member={selected?.member ?? null} initialMontageIndex={selected?.montageIndex ?? 0} onClose={() => setSelected(null)} />
    </main>
  );
}

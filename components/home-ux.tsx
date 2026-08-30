'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Member } from '@/data/squad';
import type { ContentSnapshot } from '@/lib/content';
import type { Scrim } from '@/lib/scrims';
import { ArrowUpRight } from '@/components/icons';
import { GalleryGrid } from '@/components/gallery-grid';
import MemberCard from '@/components/member-card';
import { MemberModal } from '@/components/member-modal';
import MatchCenter from '@/components/match-center';
import { Button } from '@/components/ui';

export default function HomeUX({ content, scrims }: { content: ContentSnapshot; scrims: Scrim[] }) {
  const { profile, members, gallery } = content;
  const [selected, setSelected] = useState<Member | null>(null);
  const active = members.filter((m) => m.status !== 'BENCH').length;
  const bench = members.filter((m) => m.status === 'BENCH').length;
  const captain = members.find((m) => m.status === 'CAPTAIN');
  const social = [
    ['Instagram', profile.instagram], ['TikTok', profile.tiktok], ['YouTube', profile.youtube],
  ].filter(([, url]) => Boolean(url && url !== '#'));

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] backdrop-blur-md"><div className="ui-container flex min-h-16 items-center justify-between gap-4"><Link href="#identity" className="flex shrink-0 items-center gap-3" aria-label={`${profile.name} home`}><span className="grid h-9 w-9 place-items-center bg-[var(--acid)] text-sm font-black text-black">S/</span><span className="text-sm font-black tracking-[.22em]">{profile.name}</span></Link><nav aria-label="Homepage sections" className="hidden items-center gap-6 text-[10px] uppercase tracking-[.18em] text-white/45 lg:flex"><Link href="#state">State</Link><Link href="#roster">Roster</Link><Link href="#matches">Matches</Link><Link href="#media">Media</Link><Link href="#recruitment">Recruitment</Link></nav><div className="flex items-center gap-2"><Button href="/roster" variant="secondary" size="sm">Full roster <ArrowUpRight size={14}/></Button></div></div></header>

      <section id="identity" className="hero-slab grid-bg border-b border-white/8"><div className="ui-container grid min-h-[650px] items-end gap-10 pb-14 pt-24 lg:grid-cols-[1.25fr_.75fr] lg:pb-20"><div><div className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.28em] text-white/42"><span className="h-px w-9 bg-[var(--acid)]"/> {profile.season} / Public squad</div><h1 className="max-w-5xl break-words font-display text-[clamp(5rem,13vw,12.5rem)] uppercase leading-[.72] text-white">{profile.name.split(/\s+/).map((part, i, all)=><span key={`${part}-${i}`} className={i===all.length-1?'text-[var(--acid)]':''}>{part}{i<all.length-1?' ':''}</span>)}</h1><p className="mt-8 max-w-xl text-base leading-7 text-white/55 sm:text-lg">{profile.tagline} A public squad archive built around the people, matches, and records that matter.</p><div className="mt-8 flex flex-wrap gap-3"><Button href="#roster">Meet the squad <ArrowUpRight size={15}/></Button><Button href="/recruitment" variant="secondary">Join the squad <ArrowUpRight size={15}/></Button></div></div><div className="border border-white/10 bg-black/20 p-5 backdrop-blur-sm"><div className="ui-eyebrow">Squad identity</div><div className="mt-5 font-display text-5xl uppercase">{profile.name}</div><div className="mt-2 text-sm text-white/40">Season {profile.season}</div></div></div></section>

      <section id="state" className="border-b border-white/8 bg-[var(--panel)]"><div className="ui-container py-14 sm:py-16 lg:py-20"><div className="flex flex-col gap-5 border-b border-white/8 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><div className="ui-eyebrow text-[var(--acid)]">01 — Current squad state</div><h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">Who’s in.</h2></div><p className="max-w-md text-sm leading-6 text-white/40">A quick operational snapshot before the directory: active players, bench depth, and captain.</p></div><div className="mt-8 grid gap-px border border-white/8 bg-white/8 sm:grid-cols-3"><div className="bg-[var(--panel-deep)] p-6"><div className="font-display text-6xl">{active}</div><div className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/30">Active / captain</div></div><div className="bg-[var(--panel-deep)] p-6"><div className="font-display text-6xl">{bench}</div><div className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/30">Bench</div></div><div className="bg-[var(--panel-deep)] p-6"><div className="font-display text-6xl">{captain?.nickname ?? '—'}</div><div className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/30">Captain</div></div></div></div></section>

      <section id="roster" className="ui-container py-16 sm:py-20 lg:py-24"><div className="flex flex-col gap-5 border-b border-white/8 pb-8 sm:flex-row sm:items-end sm:justify-between"><div><div className="ui-eyebrow">02 — Roster</div><h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">The people.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/40">Six faces establish the squad. The full directory, search, filters, sorting, and player files live on the roster page.</p></div><Button href="/roster" variant="secondary" size="sm">View all {members.length} <ArrowUpRight size={14}/></Button></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{members.slice(0,6).map((member,index)=><MemberCard key={member.id} member={member} index={index} onOpen={()=>setSelected(member)}/>)}</div></section>

      <section id="matches"><MatchCenter scrims={scrims}/></section>

      <section id="media" className="border-y border-white/8 bg-[var(--panel-deep)]"><div className="ui-container py-16 sm:py-20 lg:py-24"><div className="flex flex-col gap-5 border-b border-white/8 pb-8 sm:flex-row sm:items-end sm:justify-between"><div><div className="ui-eyebrow">04 — Media</div><h2 className="mt-3 font-display text-6xl uppercase leading-[.85] sm:text-8xl">Outside<br/><span className="text-[var(--ember)]">the match.</span></h2></div><Button href="/media" variant="secondary" size="sm">Open archive <ArrowUpRight size={14}/></Button></div>{gallery.length ? <GalleryGrid items={gallery.slice(0,6)}/> : <div className="ui-empty mt-8"><div><div className="ui-eyebrow">No public data</div><p className="ui-empty-description mt-2">No public media has been published yet.</p></div></div>}</div></section>

      <section id="recruitment" className="border-b border-white/8 bg-[var(--panel)]"><div className="ui-container py-16 sm:py-20 lg:py-24"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="ui-eyebrow text-[var(--acid)]">05 — Recruitment</div><h2 className="mt-3 max-w-4xl font-display text-6xl uppercase leading-[.82] sm:text-8xl">Think you<br/><span className="text-[var(--acid)]">belong?</span></h2><p className="mt-5 max-w-xl text-sm leading-6 text-white/40">Role, experience, availability, and communication matter. Send the player file and make the case for a trial.</p></div><Button href="/recruitment">Apply for a trial <ArrowUpRight size={15}/></Button></div></div></section>

      <footer className="border-t border-white/8"><div className="ui-container flex flex-col gap-7 py-10 sm:flex-row sm:items-end sm:justify-between"><div><div className="font-display text-4xl uppercase">{profile.name}</div><div className="mt-2 text-xs text-white/30">{profile.tagline} / {profile.season}</div></div><div id="social" className="flex flex-wrap gap-4 text-[10px] uppercase tracking-[.18em] text-white/35">{social.length ? social.map(([label,url])=><a key={label} href={url} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">{label} ↗</a>) : <span>Social links will appear when published.</span>}</div></div></footer>
      <MemberModal member={selected} onClose={()=>setSelected(null)} />
    </main>
  );
}

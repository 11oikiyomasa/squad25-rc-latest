'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Play } from '@/components/icons';
import { normalizeYoutubeId, squadProfile, type Member } from '@/data/squad';

const STORAGE_KEY = 'squad25-content-v1';

type DraftState = { profile: typeof squadProfile; members: Member[] };

function readDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftState>;
    if (!Array.isArray(parsed.members) || !parsed.profile) return null;
    return parsed as DraftState;
  } catch {
    return null;
  }
}

function thumb(id: string) { return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; }

export default function AdminPreview() {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    const next = readDraft();
    setDraft(next);
    const id = new URLSearchParams(window.location.search).get('member');
    if (next) setMember(next.members.find((item) => item.id === id) ?? next.members[0] ?? null);
  }, []);

  if (!draft || !member) {
    return <main className="grid min-h-screen place-items-center bg-[#0c0d0f] px-5 text-center text-[#f4f0e7]"><div><div className="font-display text-5xl uppercase">No draft loaded.</div><p className="mt-3 text-sm text-white/40">Make an edit in Studio first, then open Preview.</p><Link href="/admin" className="mt-6 inline-flex border border-white/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-[.18em]">Back to Studio</Link></div></main>;
  }

  const currentIndex = draft.members.findIndex((item) => item.id === member.id);
  const previous = draft.members[(currentIndex - 1 + draft.members.length) % draft.members.length];
  const next = draft.members[(currentIndex + 1) % draft.members.length];
  const playable = member.montages.filter((item) => normalizeYoutubeId(item.youtubeId));

  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <div className="border-b border-[#ff6b38]/20 bg-[#ff6b38]/[.06] px-5 py-3 text-center font-mono text-[9px] uppercase tracking-[.18em] text-[#ffb29b]">DRAFT PREVIEW / CHANGES ARE NOT LIVE UNTIL PUBLISH</div>
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0c0d0f]/90 backdrop-blur-md"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-white/50 hover:text-white"><ArrowLeft size={15}/> Back to Studio</Link><div className="font-mono text-[9px] uppercase tracking-[.2em] text-white/30">{draft.profile.name} / Draft</div></div></header>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative min-h-[520px] overflow-hidden border border-white/10 bg-[#14171b] lg:min-h-[720px]"><Image src={member.photo} alt={`${member.nickname} profile`} fill sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" priority/><div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-6 sm:p-8"><div className="mb-3 font-mono text-[10px] uppercase tracking-[.22em] text-white/45">Player / {member.number}</div><h1 className="font-display text-7xl uppercase leading-[.8] sm:text-9xl" style={{color: member.accent}}>{member.nickname}</h1><div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/55"><span>{member.role}</span><span>•</span><span>{member.hero}</span><span>•</span><span>{member.status}</span></div></div></div>
          <div className="border border-white/10 bg-[#101216] p-6 sm:p-8 lg:p-10"><div className="flex items-end justify-between gap-5 border-b border-white/8 pb-6"><div><div className="font-mono text-[10px] uppercase tracking-[.22em] text-white/35">{member.name}</div><h2 className="mt-2 text-3xl font-semibold">The player file</h2></div><div className="text-right"><div className="font-display text-4xl" style={{color: member.accent}}>{member.montages.length}</div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/30">cuts archived</div></div></div><p className="mt-7 max-w-2xl text-sm leading-7 text-white/60">{member.bio}</p>
            <div className="mt-9 border-t border-white/8 pt-7"><div className="flex items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-[.22em] text-[#ff6b38]">The tape</div><h3 className="mt-1 text-lg font-semibold">{playable.length} playable cuts</h3></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">Draft data</div></div><div className="mt-4 space-y-3">{member.montages.map((montage, index) => { const id = normalizeYoutubeId(montage.youtubeId); return id ? <button key={`${montage.title}-${index}`} type="button" onClick={() => setMember({...member, montages: [montage, ...member.montages.filter((m) => m !== montage)]})} className="group grid w-full gap-4 border border-white/8 bg-white/[.02] p-4 text-left sm:grid-cols-[170px_1fr_auto] sm:items-center"><div className="relative aspect-video overflow-hidden bg-black"><Image src={thumb(id)} alt="" fill sizes="170px" className="object-cover transition group-hover:scale-105"/><span className="absolute inset-0 grid place-items-center"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#d7ff43] text-black"><Play size={13}/></span></span></div><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">0{index + 1} / {montage.hero}</div><div className="mt-1 text-sm font-semibold">{montage.title}</div><div className="mt-1 text-xs text-white/35">{montage.description}</div></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{montage.duration}</div></button> : <div key={`${montage.title}-${index}`} className="grid gap-4 border border-white/6 p-4 opacity-70 sm:grid-cols-[56px_1fr_auto] sm:items-center"><div className="grid h-12 w-12 place-items-center rounded-full border border-white/8 text-white/30"><Play size={15}/></div><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/20">0{index + 1} / {montage.hero}</div><div className="mt-1 text-sm font-semibold">{montage.title}</div><div className="mt-1 text-xs text-white/25">This player’s archive is still being assembled.</div></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/20">{montage.duration}</div></div>; })}</div></div>
            <div className="mt-9 grid gap-2 sm:grid-cols-2"><Link href={`/admin/preview?member=${previous.id}`} className="border border-white/8 p-4"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">← Previous player</div><div className="mt-2 font-display text-2xl uppercase" style={{color: previous.accent}}>{previous.nickname}</div></Link><Link href={`/admin/preview?member=${next.id}`} className="border border-white/8 p-4 text-right"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">Next player →</div><div className="mt-2 font-display text-2xl uppercase" style={{color: next.accent}}>{next.nickname}</div></Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}

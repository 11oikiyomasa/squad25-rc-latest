'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { GalleryItem, Member } from '@/data/squad';
import { ArrowUpRight, X } from '@/components/icons';
import { Button, EmptyState } from '@/components/ui';
import { GalleryGrid } from '@/components/gallery-grid';

export type MediaVideo = {
  id: string;
  memberId: string;
  memberNickname: string;
  memberRole: Member['role'];
  title: string;
  hero: string;
  duration: string;
  description: string;
  publishedAt?: string;
  youtubeId: string;
  status: 'AVAILABLE' | 'REMOVED' | 'UNKNOWN';
  thumbnail: string;
};

type Props = { videos: MediaVideo[]; gallery: GalleryItem[] };

function dateValue(value?: string) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function videoSort(a: MediaVideo, b: MediaVideo) {
  const byDate = dateValue(b.publishedAt) - dateValue(a.publishedAt);
  return byDate || a.title.localeCompare(b.title);
}

export default function MediaCenter({ videos, gallery }: Props) {
  const available = useMemo(() => videos.filter((video) => video.status === 'AVAILABLE').sort(videoSort), [videos]);
  const problems = useMemo(() => videos.filter((video) => video.status !== 'AVAILABLE').sort(videoSort), [videos]);
  const featured = available[0] ?? null;
  const latest = available.slice(0, 4);
  const tape = useMemo(() => {
    const byMember = new Map<string, MediaVideo>();
    for (const video of available) {
      if (!byMember.has(video.memberId)) byMember.set(video.memberId, video);
    }
    return [...byMember.values()].sort((a, b) => a.memberNickname.localeCompare(b.memberNickname));
  }, [available]);

  const [selected, setSelected] = useState<MediaVideo | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKey); };
  }, [selected]);

  return (
    <>
      <section className="border-y border-white/8 bg-[var(--panel)]">
        <div className="ui-container py-12 sm:py-16 lg:py-20">
          <div className="flex flex-col gap-5 border-b border-white/8 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="ui-eyebrow text-[var(--acid)]">01 — Latest</div><h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">Fresh cuts.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/40">The newest verified public videos surface first. A clip is not shown as playable until YouTube confirms it exists.</p></div>
            <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{available.length} playable / {videos.length} referenced</div>
          </div>
          {latest.length ? <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{latest.map((video) => <VideoCard key={video.id} video={video} onOpen={() => setSelected(video)} />)}</div> : <EmptyState className="mt-8" title="No public cuts yet." description="The tape is ready, but no published YouTube video is currently available." />}
        </div>
      </section>

      <section className="ui-container py-14 sm:py-18 lg:py-24">
        <div className="grid gap-7 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div><div className="ui-eyebrow">02 — Featured</div><h2 className="mt-3 font-display text-6xl uppercase leading-[.82] sm:text-8xl">One cut<br/><span className="text-[var(--acid)]">to start.</span></h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/40">Featured media is selected from the newest verified public cut. No placeholder video is promoted.</p></div>
          {featured ? <article className="border border-white/10 bg-[var(--panel)] p-5 sm:p-7"><div className="relative aspect-video overflow-hidden border border-white/8 bg-black"><img src={featured.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent"/><button type="button" onClick={() => setSelected(featured)} className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 border border-white/12 bg-black/45 px-4 py-3 text-left backdrop-blur-sm hover:border-white/25"><span><span className="block font-mono text-[9px] uppercase tracking-[.18em] text-white/45">{featured.memberNickname} / {featured.memberRole}</span><span className="mt-1 block text-sm font-semibold uppercase">{featured.title}</span></span><span className="font-mono text-[9px] uppercase tracking-[.16em] text-[var(--acid)]">Play ↗</span></button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="text-xs text-white/40">{featured.hero} · {featured.duration}</div><YouTubeLink id={featured.youtubeId}/></div></article> : <EmptyState title="Featured tape is quiet." description="A featured cut will appear automatically when a verified public video is published."/>}
        </div>
      </section>

      <section className="border-y border-white/8 bg-[var(--panel-deep)]">
        <div className="ui-container py-14 sm:py-18 lg:py-24">
          <div className="flex flex-col gap-5 border-b border-white/8 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><div className="ui-eyebrow">03 — Player tape</div><h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">By player.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/40">One latest verified cut per player. Open a card for the embedded player, or jump directly to YouTube.</p></div><Button href="/roster" variant="secondary" size="sm">Browse roster <ArrowUpRight size={14}/></Button></div>
          {tape.length ? <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tape.map((video) => <PlayerTapeCard key={video.memberId} video={video} onOpen={() => setSelected(video)} />)}</div> : <EmptyState className="mt-8" title="Player tape is empty." description="Player profiles are ready for media, but no public YouTube cuts are available yet."/>}
        </div>
      </section>

      {problems.length > 0 && <section className="border-b border-white/8 bg-[var(--panel-black)]"><div className="ui-container py-10 sm:py-12"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="ui-eyebrow text-[var(--ember)]">Video health</div><h2 className="mt-2 text-xl font-semibold">Some referenced videos are unavailable.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/35">Removed videos and temporary verification failures stay out of playable surfaces. Editors can replace the URL without breaking the rest of the archive.</p></div><span className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{problems.length} hidden</span></div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{problems.slice(0, 6).map((video) => <div key={video.id} className="border border-white/8 p-4"><div className="flex items-start justify-between gap-4"><div><div className="font-mono text-[9px] uppercase tracking-[.16em] text-white/25">{video.memberNickname} / {video.memberRole}</div><div className="mt-2 text-sm font-semibold">{video.title}</div></div><span className="font-mono text-[8px] uppercase tracking-[.16em] text-[var(--ember)]">{video.status === 'REMOVED' ? 'Removed' : 'Unverified'}</span></div><div className="mt-3"><YouTubeLink id={video.youtubeId} label="Check on YouTube"/></div></div>)}</div></div></section>}

      <section className="ui-container py-14 sm:py-18 lg:py-24">
        <div className="flex flex-col gap-5 border-b border-white/8 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><div className="ui-eyebrow">04 — Archive</div><h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">The visual record.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/40">Photography and public visual records stay separate from playable tape, so one broken video never breaks the archive.</p></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{gallery.length} archive items</div></div>{gallery.length ? <GalleryGrid items={gallery}/> : <EmptyState className="mt-8" title="Archive is quiet." description="No public gallery items have been published yet."/>}
      </section>

      {selected && <VideoModal video={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function VideoCard({ video, onOpen }: { video: MediaVideo; onOpen: () => void }) {
  return <article className="group border border-white/8 bg-[var(--panel)] p-3"><button type="button" onClick={onOpen} className="block w-full text-left"><div className="relative aspect-video overflow-hidden bg-black"><img src={video.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}/><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"/><span className="absolute left-3 top-3 border border-white/15 bg-black/45 px-2 py-1 font-mono text-[8px] uppercase tracking-[.16em] text-white/60">{video.duration}</span><span className="absolute right-3 top-3 bg-[var(--acid)] px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[.16em] text-black">Play</span></div><div className="px-1 pb-1 pt-4"><div className="font-mono text-[9px] uppercase tracking-[.16em] text-white/30">{video.memberNickname} / {video.memberRole}</div><h3 className="mt-2 line-clamp-2 text-sm font-semibold uppercase">{video.title}</h3></div></button><div className="mt-3 border-t border-white/8 px-1 pt-3"><YouTubeLink id={video.youtubeId}/></div></article>;
}

function PlayerTapeCard({ video, onOpen }: { video: MediaVideo; onOpen: () => void }) {
  return <article className="grid grid-cols-[112px_1fr] gap-4 border border-white/8 bg-[var(--panel)] p-3 sm:grid-cols-[150px_1fr]"><button type="button" onClick={onOpen} className="relative aspect-video overflow-hidden bg-black"><img src={video.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}/><span className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 font-mono text-[8px] uppercase tracking-[.16em]">Play</span></button><div className="min-w-0 py-1"><div className="font-mono text-[9px] uppercase tracking-[.16em] text-white/30">{video.memberNickname}</div><div className="mt-1 truncate text-sm font-semibold uppercase">{video.title}</div><div className="mt-2 text-xs text-white/35">{video.hero} · {video.duration}</div><div className="mt-3"><YouTubeLink id={video.youtubeId}/></div></div></article>;
}

function YouTubeLink({ id, label = 'Open on YouTube' }: { id: string; label?: string }) {
  return <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-white/45 hover:text-white">{label} ↗</a>;
}

function VideoModal({ video, onClose }: { video: MediaVideo; onClose: () => void }) {
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={video.title} onMouseDown={onClose}><div className="w-full max-w-5xl overflow-hidden border border-white/10 bg-[var(--panel)]" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between gap-4 border-b border-white/8 px-4 py-3 sm:px-5"><div className="min-w-0"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/30">{video.memberNickname} / {video.memberRole}</div><div className="mt-1 truncate text-sm font-semibold uppercase">{video.title}</div></div><button type="button" onClick={onClose} aria-label="Close video" className="grid h-9 w-9 shrink-0 place-items-center border border-white/10 text-white/60 hover:text-white"><X size={16}/></button></div><div className="aspect-video bg-black"><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?rel=0`} title={`${video.title} — ${video.memberNickname}`} loading="lazy" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><div className="flex flex-col gap-3 border-t border-white/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="text-xs text-white/35">{video.description || 'Public squad tape.'}</div><YouTubeLink id={video.youtubeId}/></div></div></div>;
}

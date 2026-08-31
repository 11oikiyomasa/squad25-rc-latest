'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import type { GalleryItem, Member } from '@/data/squad';
import { ArrowUpRight } from '@/components/icons';
import { Button, EmptyState } from '@/components/ui';
import { GalleryGrid } from '@/components/gallery-grid';
import YouTubeFacade from '@/components/youtube-facade';

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

function YouTubeLink({ id, title }: { id: string; title: string }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-10 items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      aria-label={`Open "${title}" on YouTube`}
    >
      Open on YouTube ↗
    </a>
  );
}

function VideoCard({ video }: { video: MediaVideo }) {
  return (
    <article className="border border-[var(--border)] bg-[var(--surface)] p-3">
      <YouTubeFacade videoId={video.youtubeId} title={video.title} thumbnail={video.thumbnail} />
      <div className="px-1 pb-1 pt-4">
        <div className="font-mono text-[9px] uppercase tracking-[.16em] text-[var(--text-muted)]">
          {video.memberNickname} / {video.memberRole}
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold uppercase">{video.title}</h3>
        <div className="mt-2 text-xs text-[var(--text-muted)]">{video.hero} · {video.duration}</div>
      </div>
      <div className="mt-3 border-t border-[var(--border)] px-1 pt-3">
        <YouTubeLink id={video.youtubeId} title={video.title} />
      </div>
    </article>
  );
}

function PlayerTapeCard({ video }: { video: MediaVideo }) {
  return (
    <article className="border border-[var(--border)] bg-[var(--surface)] p-3">
      <YouTubeFacade videoId={video.youtubeId} title={video.title} thumbnail={video.thumbnail} />
      <div className="min-w-0 py-3">
        <div className="font-mono text-[9px] uppercase tracking-[.16em] text-[var(--text-muted)]">{video.memberNickname}</div>
        <div className="mt-1 truncate text-sm font-semibold uppercase">{video.title}</div>
        <div className="mt-2 text-xs text-[var(--text-muted)]">{video.hero} · {video.duration}</div>
        <div className="mt-3">
          <YouTubeLink id={video.youtubeId} title={video.title} />
        </div>
      </div>
    </article>
  );
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

  return (
    <>
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="ui-container py-12 sm:py-16 lg:py-20">
          <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="ui-eyebrow">01 — Latest</div>
              <h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">Fresh cuts.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-muted)]">The newest verified public videos surface first. A clip is not shown as playable until YouTube confirms it exists.</p>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]">{available.length} playable / {videos.length} referenced</div>
          </div>
          {latest.length ? <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{latest.map((video) => <VideoCard key={video.id} video={video} />)}</div> : <EmptyState className="mt-8" title="No public cuts yet." description="The tape is ready, but no published YouTube video is currently available." />}
        </div>
      </section>

      <section className="ui-container py-14 sm:py-18 lg:py-24">
        <div className="grid gap-7 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <div className="ui-eyebrow">02 — Featured</div>
            <h2 className="mt-3 font-display text-6xl uppercase leading-[.82] sm:text-8xl">One cut<br/><span className="text-[var(--brand)]">to start.</span></h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-muted)]">Featured media is selected from the newest verified public cut. No placeholder video is promoted.</p>
          </div>
          {featured ? <article className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7"><YouTubeFacade videoId={featured.youtubeId} title={featured.title} thumbnail={featured.thumbnail} /><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="text-xs text-[var(--text-muted)]">{featured.hero} · {featured.duration}</div><YouTubeLink id={featured.youtubeId} title={featured.title}/></div></article> : <EmptyState title="Featured tape is quiet." description="A featured cut will appear automatically when a verified public video is published."/>}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--elevated)]">
        <div className="ui-container py-14 sm:py-18 lg:py-24">
          <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="ui-eyebrow">03 — Player tape</div>
              <h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">By player.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-muted)]">One latest verified cut per player. Activate the facade to load the embedded player, or jump directly to YouTube.</p>
            </div>
            <Button href="/roster" variant="secondary" size="sm">Browse roster <ArrowUpRight size={14}/></Button>
          </div>
          {tape.length ? <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tape.map((video) => <PlayerTapeCard key={video.memberId} video={video} />)}</div> : <EmptyState className="mt-8" title="Player tape is empty." description="Player profiles are ready for media, but no public YouTube cuts are available yet."/>}
        </div>
      </section>

      {problems.length > 0 && <section className="border-b border-[var(--border)] bg-[var(--background)]"><div className="ui-container py-10 sm:py-12"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="ui-eyebrow">Video health</div><h2 className="mt-2 text-xl font-semibold">Some referenced videos are unavailable.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Removed videos and temporary verification failures stay out of playable surfaces.</p></div><span className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]">{problems.length} hidden</span></div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{problems.slice(0, 6).map((video) => <div key={video.id} className="border border-[var(--border)] p-4"><div className="flex items-start justify-between gap-4"><div><div className="font-mono text-[9px] uppercase tracking-[.16em] text-[var(--text-muted)]">{video.memberNickname} / {video.memberRole}</div><div className="mt-2 text-sm font-semibold">{video.title}</div></div><span className="font-mono text-[8px] uppercase tracking-[.16em] text-[var(--warning)]">{video.status === 'REMOVED' ? 'Removed' : 'Unverified'}</span></div><div className="mt-3"><YouTubeLink id={video.youtubeId} title={video.title}/></div></div>)}</div></div></section>}

      <section className="ui-container py-14 sm:py-18 lg:py-24">
        <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between"><div><div className="ui-eyebrow">04 — Archive</div><h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">The visual record.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-muted)]">Photography and public visual records stay separate from playable tape, so one broken video never breaks the archive.</p></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]">{gallery.length} archive items</div></div>{gallery.length ? <GalleryGrid items={gallery}/> : <EmptyState className="mt-8" title="Archive is quiet." description="No public gallery items have been published yet."/>}
      </section>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Scrim } from '@/lib/scrims';

const WIB = 'Asia/Jakarta';
const COUNTDOWN_WINDOW_MS = 72 * 60 * 60 * 1000;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: WIB }).format(new Date(value));
}

function formatTime(value: string) {
  return `${new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: WIB }).format(new Date(value))} WIB`;
}

function formatDateTime(value: string) {
  return `${formatDate(value)} / ${formatTime(value)}`;
}

function resultLabel(scrim: Scrim) {
  if (scrim.result_for === null || scrim.result_against === null) return null;
  if (scrim.result_for === scrim.result_against) return 'DRAW';
  return scrim.result_for > scrim.result_against ? 'WIN' : 'LOSS';
}

function Score({ scrim }: { scrim: Scrim }) {
  if (scrim.result_for === null || scrim.result_against === null) {
    return <span aria-label="Score pending">— : —</span>;
  }
  return <span aria-label={`${scrim.result_for} to ${scrim.result_against}`}>{scrim.result_for} : {scrim.result_against}</span>;
}

function Countdown({ target }: { target: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, new Date(target).getTime() - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (remaining === null) return <span>T−--:--:--</span>;
  if (remaining === 0) return <span>STARTING NOW</span>;

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return <span aria-live="polite">T−{days > 0 ? `${days}d ` : ''}{hh}:{mm}:{ss}</span>;
}

function StatePill({ children, live = false }: { children: React.ReactNode; live?: boolean }) {
  return <span className="inline-flex items-center gap-2 border border-white/10 bg-black/10 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[.17em] text-white/55">{live && <span className="h-1.5 w-1.5 rounded-full bg-[var(--acid)] shadow-[0_0_12px_var(--acid)]" aria-hidden="true" />}{children}</span>;
}

function StateEmpty({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="border border-dashed border-white/10 bg-black/10 p-6 sm:p-8"><div className="ui-eyebrow">{eyebrow}</div><h3 className="mt-2 font-display text-3xl uppercase leading-none text-white/60">{title}</h3><p className="mt-3 max-w-xl text-sm leading-6 text-white/35">{description}</p></div>;
}

function ExternalLinks({ scrim }: { scrim: Scrim }) {
  if (!scrim.recap_url && !scrim.media_url) return null;
  return <div className="mt-5 flex flex-wrap gap-2 border-t border-white/8 pt-4">{scrim.recap_url && <a href={scrim.recap_url} target="_blank" rel="noreferrer" className="ui-button ui-button-ghost ui-button-sm">Recap ↗</a>}{scrim.media_url && <a href={scrim.media_url} target="_blank" rel="noreferrer" className="ui-button ui-button-ghost ui-button-sm">Media ↗</a>}</div>;
}

export default function MatchCenter({ scrims }: { scrims: Scrim[] }) {
  const live = scrims.filter((scrim) => scrim.status === 'LIVE').sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const scheduled = scrims.filter((scrim) => scrim.status === 'SCHEDULED').sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const completed = scrims.filter((scrim) => scrim.status === 'COMPLETED').sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  const cancelled = scrims.filter((scrim) => scrim.status === 'CANCELLED').sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  const scoredCompleted = completed.filter((scrim) => scrim.result_for !== null && scrim.result_against !== null);
  const wins = scoredCompleted.filter((scrim) => resultLabel(scrim) === 'WIN').length;
  const losses = scoredCompleted.filter((scrim) => resultLabel(scrim) === 'LOSS').length;
  const next = scheduled[0] ?? null;
  const nextDelta = next ? new Date(next.scheduled_at).getTime() - Date.now() : null;
  const countdownUseful = nextDelta !== null && nextDelta > 0 && nextDelta <= COUNTDOWN_WINDOW_MS;
  const staleScheduled = nextDelta !== null && nextDelta <= 0;

  return (
    <section className="border-y border-white/8 bg-[var(--panel)]">
      <div className="ui-container py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col gap-6 border-b border-white/8 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="ui-eyebrow">Match Center / Lifecycle</div>
            <h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">On the clock.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">Every public room moves through a deliberate state: <span className="text-white/65">Scheduled → Live → Completed</span>, with <span className="text-white/65">Cancelled</span> as the alternate exit.</p>
          </div>
          <Link href="/matches" className="ui-button ui-button-secondary">Open match center ↗</Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="border border-white/8 bg-[var(--panel-deep)] p-5"><div className="font-display text-5xl">{scheduled.length.toString().padStart(2, '0')}</div><div className="mt-2 font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Scheduled</div></div>
          <div className="border border-white/8 bg-[var(--panel-deep)] p-5"><div className="font-display text-5xl">{live.length.toString().padStart(2, '0')}</div><div className="mt-2 font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Live</div></div>
          <div className="border border-white/8 bg-[var(--panel-deep)] p-5"><div className="font-display text-5xl">{scoredCompleted.length.toString().padStart(2, '0')}</div><div className="mt-2 font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Completed</div></div>
          <div className="border border-white/8 bg-[var(--panel-deep)] p-5"><div className="font-display text-5xl">{wins}-{losses}</div><div className="mt-2 font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Record</div></div>
        </div>

        <section className="mt-10" aria-labelledby="live-matches-title">
          <div className="mb-4 flex items-end justify-between gap-4"><div><div className="ui-eyebrow text-[var(--acid)]">01 — Live</div><h3 id="live-matches-title" className="mt-1 font-display text-4xl uppercase">Right now.</h3></div>{live.length > 0 && <StatePill live>LIVE</StatePill>}</div>
          {live.length === 0 ? <StateEmpty eyebrow="No live room" title="Nothing is live." description="When a published match enters LIVE, its opponent and current series score appear here." /> : <div className="grid gap-3 lg:grid-cols-2">{live.map((scrim) => <article key={scrim.id} className="border border-[color-mix(in_srgb,var(--acid)_20%,transparent)] bg-[color-mix(in_srgb,var(--acid)_4%,transparent)] p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><StatePill live>LIVE</StatePill><StatePill>{scrim.format}</StatePill><StatePill>{scrim.event_name}</StatePill></div><span className="font-mono text-[9px] uppercase tracking-[.16em] text-white/30">Started {formatTime(scrim.scheduled_at)}</span></div><div className="mt-7 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Opponent</div><div className="mt-2 font-display text-4xl uppercase sm:text-6xl">{scrim.opponent_name}</div><p className="mt-3 max-w-xl text-sm leading-6 text-white/40">{scrim.public_note || 'Live match in progress.'}</p></div><div className="min-w-40 border border-white/10 bg-black/20 p-5 text-center"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--acid)]">Series score</div><div className="mt-2 font-display text-5xl text-[var(--acid)]"><Score scrim={scrim}/></div></div></div><ExternalLinks scrim={scrim}/></article>)}</div>}
        </section>

        <section className="mt-10" aria-labelledby="scheduled-matches-title">
          <div className="mb-4 flex items-end justify-between gap-4"><div><div className="ui-eyebrow">02 — Scheduled</div><h3 id="scheduled-matches-title" className="mt-1 font-display text-4xl uppercase">Next rooms.</h3></div>{next && countdownUseful && <StatePill><Countdown target={next.scheduled_at}/></StatePill>}</div>
          {scheduled.length === 0 ? <StateEmpty eyebrow="Schedule empty" title="No upcoming room." description="Nothing public is scheduled right now. The next room will appear here as soon as the control room publishes one." /> : <div className="space-y-3">{scheduled.slice(0, 6).map((scrim, index) => <article key={scrim.id} className="border border-white/8 bg-[var(--panel-deep)] p-5 sm:p-6"><div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex flex-wrap gap-2"><StatePill>SCHEDULED</StatePill><StatePill>{scrim.format}</StatePill><StatePill>{scrim.event_name}</StatePill></div><div className="mt-4 font-mono text-[10px] uppercase tracking-[.18em] text-white/35">{formatDateTime(scrim.scheduled_at)}</div><div className="mt-2 font-display text-3xl uppercase sm:text-4xl">SQUAD.25 <span className="text-white/20">vs</span> <span className="text-[var(--acid)]">{scrim.opponent_name}</span></div><p className="mt-2 max-w-2xl text-sm leading-6 text-white/35">{scrim.event_name}{scrim.public_note ? ` / ${scrim.public_note}` : ''}</p></div><div className="flex flex-col gap-2 lg:min-w-44 lg:text-right">{index === 0 && countdownUseful && <div className="font-mono text-xs font-black uppercase tracking-[.14em] text-[var(--acid)]"><Countdown target={scrim.scheduled_at}/></div>}{index === 0 && staleScheduled && <div className="font-mono text-[9px] font-black uppercase tracking-[.16em] text-[#ffb197]">Time passed / status pending</div>}<div className="font-mono text-[9px] uppercase tracking-[.16em] text-white/25">Scheduled kickoff</div></div></div></article>)}</div>}
        </section>

        <section className="mt-10" aria-labelledby="completed-matches-title">
          <div className="mb-4 flex items-end justify-between gap-4"><div><div className="ui-eyebrow">03 — Completed</div><h3 id="completed-matches-title" className="mt-1 font-display text-4xl uppercase">Receipts.</h3></div><div className="font-mono text-[9px] uppercase tracking-[.16em] text-white/25">{completed.length} public result{completed.length === 1 ? '' : 's'}</div></div>
          {completed.length === 0 ? <StateEmpty eyebrow="No completed result" title="No receipts yet." description="Completed matches will appear here with the final score and any published recap or media." /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{completed.slice(0, 6).map((scrim) => { const result = resultLabel(scrim); return <article key={scrim.id} className="border border-white/8 bg-[var(--panel-deep)] p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><StatePill>COMPLETED</StatePill><StatePill>{scrim.format}</StatePill></div><div className="mt-4 font-mono text-[9px] uppercase tracking-[.16em] text-white/25">{formatDateTime(scrim.scheduled_at)}</div><div className="mt-2 text-[10px] uppercase tracking-[.16em] text-white/30">{scrim.event_name}</div><div className="mt-2 font-display text-3xl uppercase">{scrim.opponent_name}</div></div><div className={`font-mono text-[9px] font-black uppercase tracking-[.16em] ${result === 'WIN' ? 'text-[var(--acid)]' : result === 'LOSS' ? 'text-[var(--ember)]' : 'text-white/45'}`}>{result ?? 'NO SCORE'}</div></div><div className="mt-5 font-display text-5xl"><Score scrim={scrim}/></div>{scrim.public_note && <p className="mt-3 text-xs leading-5 text-white/35">{scrim.public_note}</p>}<ExternalLinks scrim={scrim}/></article>; })}</div>}
        </section>

        <section className="mt-10" aria-labelledby="cancelled-matches-title">
          <div className="mb-4 flex items-end justify-between gap-4"><div><div className="ui-eyebrow">04 — Cancelled</div><h3 id="cancelled-matches-title" className="mt-1 font-display text-4xl uppercase">Closed rooms.</h3></div><div className="font-mono text-[9px] uppercase tracking-[.16em] text-white/25">Alternate lifecycle exit</div></div>
          {cancelled.length === 0 ? <StateEmpty eyebrow="No cancellations" title="No cancelled rooms." description="If a scheduled or live room is cancelled, it remains visible here when public so the schedule never looks mysteriously broken." /> : <div className="grid gap-3 sm:grid-cols-2">{cancelled.slice(0, 4).map((scrim) => <article key={scrim.id} className="border border-white/8 bg-[var(--panel-deep)] p-5 opacity-75"><div className="flex flex-wrap gap-2"><StatePill>CANCELLED</StatePill><StatePill>{scrim.format}</StatePill><StatePill>{scrim.event_name}</StatePill></div><div className="mt-4 font-mono text-[9px] uppercase tracking-[.16em] text-white/25">{formatDateTime(scrim.scheduled_at)}</div><div className="mt-2 font-display text-3xl uppercase text-white/60">vs {scrim.opponent_name}</div>{scrim.public_note && <p className="mt-3 text-xs leading-5 text-white/30">{scrim.public_note}</p>}</article>)}</div>}
        </section>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import type { Scrim } from '@/lib/scrims';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

function outcome(scrim: Scrim) {
  if (scrim.result_for === null || scrim.result_against === null) return null;
  if (scrim.result_for === scrim.result_against) return 'DRAW';
  return scrim.result_for > scrim.result_against ? 'WIN' : 'LOSS';
}

export default function MatchCenter({ scrims }: { scrims: Scrim[] }) {
  const upcoming = scrims.filter((scrim) => scrim.status === 'LIVE' || scrim.status === 'SCHEDULED').sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const next = upcoming[0] ?? null;
  const results = scrims.filter((scrim) => scrim.status === 'COMPLETED' && scrim.result_for !== null && scrim.result_against !== null).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  const wins = results.filter((scrim) => outcome(scrim) === 'WIN').length;
  const losses = results.filter((scrim) => outcome(scrim) === 'LOSS').length;

  return (
    <section className="border-y border-white/8 bg-[#101216]">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-6 border-b border-white/8 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[.25em] text-[#ff6b38]">Match Center</div>
            <h2 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">On the clock.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">Published scrims, upcoming rooms, and receipts from the latest public block.</p>
          </div>
          <Link href="/scrims" className="inline-flex items-center justify-center border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white/65 hover:border-white/25 hover:text-white">Open match center ↗</Link>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
          <div className="border border-white/10 bg-black p-5 sm:p-7">
            {next ? (
              <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em] text-white/35"><span>{next.status === 'LIVE' ? 'LIVE NOW' : 'NEXT SCRIM'}</span><span>•</span><span>{formatDate(next.scheduled_at)} / {formatTime(next.scheduled_at)} WIB</span><span>•</span><span>{next.format}</span></div>
                  <div className="mt-5 font-display text-5xl uppercase leading-none sm:text-7xl">SQUAD.25 <span className="text-white/20">vs</span> <span className="text-[#d7ff43]">{next.opponent_name}</span></div>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/40">{next.public_note || 'Public match details will appear here when the room is locked.'}</p>
                </div>
                <div className="border border-[#d7ff43]/20 bg-[#d7ff43]/[.05] px-4 py-3 text-center"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-[#d7ff43]">{next.status === 'LIVE' ? 'LIVE' : 'LOCKED'}</div><div className="mt-1 font-display text-4xl text-[#d7ff43]">{formatTime(next.scheduled_at)}</div></div>
              </div>
            ) : (
              <div className="flex min-h-52 items-center justify-between gap-5"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">No next match</div><div className="mt-3 font-display text-4xl uppercase">Schedule is open.</div><p className="mt-3 max-w-xl text-sm leading-6 text-white/40">No public scrim has been locked. The match center will update when one is published.</p></div></div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/8">
            <div className="bg-[#0e1013] p-5 sm:p-6"><div className="font-display text-5xl">{results.length.toString().padStart(2, '0')}</div><div className="mt-2 font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Results</div></div>
            <div className="bg-[#0e1013] p-5 sm:p-6"><div className="font-display text-5xl">{wins}-{losses}</div><div className="mt-2 font-mono text-[9px] uppercase tracking-[.18em] text-white/30">W / L</div></div>
            <div className="col-span-2 bg-[#0e1013] p-5 sm:p-6"><div className="flex items-end justify-between gap-4"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/30">Public rooms</div><div className="mt-2 text-sm text-white/55">{upcoming.length} upcoming · {results.length} completed</div></div><div className="font-display text-4xl text-white/20">{scrims.length.toString().padStart(2, '0')}</div></div></div>
          </div>
        </div>

        {results.length > 0 && <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{results.slice(0, 3).map((scrim) => { const result = outcome(scrim); return <article key={scrim.id} className="border border-white/8 bg-[#0e1013] p-5"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{formatDate(scrim.scheduled_at)} / {scrim.format}</div><div className="mt-3 font-display text-2xl uppercase">{scrim.opponent_name}</div></div><div className={`font-mono text-[9px] font-black uppercase tracking-[.16em] ${result === 'WIN' ? 'text-[#d7ff43]' : result === 'LOSS' ? 'text-[#ff6b38]' : 'text-white/45'}`}>{result}</div></div><div className="mt-5 font-display text-4xl">{scrim.result_for} — {scrim.result_against}</div></article>; })}</div>}
      </div>
    </section>
  );
}

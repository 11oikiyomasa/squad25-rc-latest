'use client';

import type { Scrim } from '@/lib/scrims';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

function resultText(scrim: Scrim) {
  if (scrim.status !== 'COMPLETED' || scrim.result_for === null || scrim.result_against === null) return null;
  return `${scrim.result_for} — ${scrim.result_against}`;
}

export default function ScrimsContent({ scrims }: { scrims: Scrim[] }) {
  const upcoming = scrims.filter((scrim) => scrim.status === 'SCHEDULED' || scrim.status === 'LIVE');
  const results = scrims.filter((scrim) => scrim.status === 'COMPLETED').sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <div className="flex items-end justify-between gap-5 border-b border-white/8 pb-6"><div><div className="text-[10px] uppercase tracking-[.25em] text-white/30">Schedule</div><h2 className="mt-2 font-display text-5xl uppercase leading-none sm:text-7xl">Next rooms.</h2></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{upcoming.length} upcoming</div></div>

      {upcoming.length > 0 ? (
        <div className="mt-6 space-y-3">
          {upcoming.map((scrim) => (
            <article key={scrim.id} className="border border-white/10 bg-[#101216] p-5 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[170px_1fr_auto] lg:items-center">
                <div className="border-b border-white/8 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"><div className="font-mono text-[10px] uppercase tracking-[.2em] text-[#ff6b38]">{scrim.status === 'LIVE' ? 'Live now' : formatDate(scrim.scheduled_at)}</div><div className="mt-2 font-display text-4xl leading-none">{formatTime(scrim.scheduled_at)}</div><div className="mt-2 text-[9px] uppercase tracking-[.15em] text-white/25">WIB / {scrim.format}</div></div>
                <div><div className="text-[9px] uppercase tracking-[.2em] text-white/25">Practice opponent</div><div className="mt-2 font-display text-4xl uppercase leading-none sm:text-5xl">SQUAD.25 <span className="text-white/20">vs</span> <span className="text-[#d7ff43]">{scrim.opponent_name}</span></div><p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">{scrim.public_note || 'Private practice room. Check back for the result.'}</p></div>
                <div className="text-left lg:text-right"><div className="inline-flex border border-[#d7ff43]/20 bg-[#d7ff43]/[.05] px-3 py-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#d7ff43]">{scrim.status}</div></div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-white/10 p-8"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">No public scrims scheduled</div><p className="mt-3 max-w-xl text-sm leading-6 text-white/40">The next practice room has not been published yet. Check back when the schedule is locked.</p></div>
      )}

      <div className="mt-16 border-b border-white/8 pb-6"><div className="text-[10px] uppercase tracking-[.25em] text-[#d7ff43]">Results</div><h2 className="mt-2 font-display text-5xl uppercase leading-none sm:text-7xl">Receipts.</h2></div>
      {results.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {results.map((scrim) => (
            <article key={scrim.id} className="border border-white/8 bg-[#101216] p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-[9px] uppercase tracking-[.18em] text-white/25">{formatDate(scrim.scheduled_at)} / {scrim.format}</div><div className="mt-3 font-display text-3xl uppercase">{scrim.opponent_name}</div></div><div className="font-display text-4xl" style={{ color: (scrim.result_for ?? 0) >= (scrim.result_against ?? 0) ? '#d7ff43' : '#ff6b38' }}>{resultText(scrim)}</div></div>{scrim.public_note && <p className="mt-4 border-t border-white/8 pt-4 text-xs leading-6 text-white/35">{scrim.public_note}</p>}</article>
          ))}
        </div>
      ) : <div className="mt-6 border border-white/8 p-8 text-sm text-white/35">No completed public scrims yet.</div>}
    </section>
  );
}

import Link from 'next/link';
import MatchCenter from '@/components/match-center';
import type { Scrim } from '@/lib/scrims';

export default function ScrimsContent({ scrims }: { scrims: Scrim[] }) {
  return (
    <>
      <MatchCenter scrims={scrims} />
      <section className="border-t border-white/8 bg-[var(--paper)]">
        <div className="ui-container py-8 sm:py-10">
          <div className="ui-eyebrow">Match files</div>
          {scrims.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {scrims.map((scrim) => (
                <Link key={scrim.id} href={`/matches/${scrim.id}`} className="border border-white/8 bg-[var(--panel-deep)] p-4 transition-colors hover:border-white/18 hover:bg-white/[.03]">
                  <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/30">{scrim.status} / {scrim.format}</div>
                  <div className="mt-2 font-display text-2xl uppercase">vs {scrim.opponent_name}</div>
                  <div className="mt-2 text-[10px] uppercase tracking-[.16em] text-white/25">Open match details ↗</div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-white/35">No public match files are available yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

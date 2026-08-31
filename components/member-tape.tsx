'use client';

import { normalizeYoutubeId, type Montage } from '@/data/squad';
import { Play } from '@/components/icons';
import YouTubeFacade from '@/components/youtube-facade';

export function MemberTape({ montages }: { montages: Montage[] }) {
  const playableCount = montages.filter((montage) => Boolean(normalizeYoutubeId(montage.youtubeId))).length;

  return (
    <div className="space-y-3">
      {montages.map((montage, index) => {
        const youtubeId = normalizeYoutubeId(montage.youtubeId);
        return youtubeId ? (
          <article key={`${montage.title}-${index}`} className="overflow-hidden border border-white/8 bg-white/[.02]">
            <YouTubeFacade videoId={youtubeId} title={montage.title} />
            <div className="grid gap-1 border-t border-white/8 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="text-sm font-semibold">{montage.title}</div>
                <div className="mt-1 text-xs leading-5 text-white/50">{montage.description}</div>
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/45">{montage.hero} · {montage.duration}</div>
            </div>
          </article>
        ) : (
          <div key={`${montage.title}-${index}`} className="grid gap-4 border border-white/6 bg-white/[.01] p-4 sm:grid-cols-[56px_1fr_auto] sm:items-center">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 text-white/45" aria-hidden="true"><Play size={15} /></div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/35">0{index + 1} / {montage.hero}</div>
              <div className="mt-1 text-sm font-semibold">{montage.title}</div>
              <div className="mt-1 text-xs leading-5 text-white/40">This player’s archive is still being assembled.</div>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/35">{montage.duration}</div>
          </div>
        );
      })}
      {playableCount === 0 && <div className="border-t border-white/8 pt-4 font-mono text-[9px] uppercase tracking-[.18em] text-white/35">No playable cuts yet.</div>}
    </div>
  );
}

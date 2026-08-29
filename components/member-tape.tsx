'use client';

import Image from 'next/image';
import { useState } from 'react';
import { normalizeYoutubeId, type Montage } from '@/data/squad';
import { Play } from '@/components/icons';

function thumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function MemberTape({ montages }: { montages: Montage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const playable = montages
    .map((montage, index) => ({ montage, index, id: normalizeYoutubeId(montage.youtubeId) }))
    .filter((item) => Boolean(item.id));

  return (
    <div className="space-y-3">
      {montages.map((montage, index) => {
        const youtubeId = normalizeYoutubeId(montage.youtubeId);
        const isPlaying = activeIndex === index && Boolean(youtubeId);
        return youtubeId ? (
          <article key={`${montage.title}-${index}`} className="overflow-hidden border border-white/8 bg-white/[.02]">
            {isPlaying ? (
              <div className="aspect-video w-full bg-black">
                <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${youtubeId}?rel=0&autoplay=1`} title={montage.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              </div>
            ) : (
              <button type="button" onClick={() => setActiveIndex(index)} className="group relative block aspect-video w-full overflow-hidden bg-black text-left sm:aspect-[2.25/1]">
                <Image src={thumb(youtubeId)} alt="" fill sizes="(max-width: 639px) 100vw, 900px" className="object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-85" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30" />
                <div className="absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#d7ff43] text-black shadow-[0_0_0_14px_rgba(215,255,67,.08)] transition group-hover:scale-105"><Play size={18}/></span></div>
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/55">0{index + 1} / {montage.hero} / {montage.duration}</div><div className="mt-1 text-sm font-semibold text-white">{montage.title}</div></div>
              </button>
            )}
            <div className="grid gap-1 border-t border-white/8 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="text-sm font-semibold">{montage.title}</div><div className="mt-1 text-xs leading-5 text-white/35">{montage.description}</div></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/30">{montage.hero} · {montage.duration}</div></div>
          </article>
        ) : (
          <div key={`${montage.title}-${index}`} className="grid gap-4 border border-white/6 bg-white/[.01] p-4 opacity-70 sm:grid-cols-[56px_1fr_auto] sm:items-center">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-white/8 text-white/30"><Play size={15}/></div>
            <div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/20">0{index + 1} / {montage.hero}</div><div className="mt-1 text-sm font-semibold">{montage.title}</div><div className="mt-1 text-xs leading-5 text-white/25">This player’s archive is still being assembled.</div></div>
            <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/20">{montage.duration}</div>
          </div>
        );
      })}
      {playable.length === 0 && <div className="border-t border-white/8 pt-4 font-mono text-[9px] uppercase tracking-[.18em] text-white/25">No playable cuts yet.</div>}
    </div>
  );
}

'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { GalleryItem } from '@/data/squad';
import { X } from '@/components/icons';

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setActive(null); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [active]);

  return (
    <>
      <div className="mt-8 grid auto-rows-[190px] gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[150px]">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item)}
            aria-label={`Open ${item.title}`}
            className={`group relative overflow-hidden border border-white/8 bg-[#14171b] text-left ${index === 0 ? 'sm:row-span-2 lg:col-span-5 lg:row-span-4' : index === 1 ? 'lg:col-span-4 lg:row-span-3' : index === 2 ? 'lg:col-span-3 lg:row-span-3' : index === 3 ? 'lg:col-span-4 lg:row-span-2' : index === 4 ? 'lg:col-span-3 lg:row-span-2' : 'lg:col-span-5 lg:row-span-3'}`}
          >
            <Image src={item.image} alt={item.title} fill loading="lazy" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 40vw" className="object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/40">{item.meta}</div>
              <div className="mt-1 text-sm font-semibold uppercase tracking-[.06em]">{item.title}</div>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={active.title} onMouseDown={() => setActive(null)}>
          <div className="relative w-full max-w-6xl" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setActive(null)} aria-label="Close image" className="absolute right-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white/70 hover:text-white"><X size={18}/></button>
            <div className="relative aspect-[16/10] overflow-hidden border border-white/10 bg-[#101216]">
              <Image src={active.image} alt={active.title} fill sizes="(max-width: 1023px) 100vw, 1100px" className="object-contain" priority />
            </div>
            <div className="flex items-center justify-between gap-4 border border-t-0 border-white/10 bg-[#101216] px-4 py-3 sm:px-5"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/30">{active.meta}</div><div className="mt-1 text-sm font-semibold">{active.title}</div></div><span className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">Esc to close</span></div>
          </div>
        </div>
      )}
    </>
  );
}

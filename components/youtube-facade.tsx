'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { Play } from '@/components/icons';

export type YouTubeFacadeProps = {
  videoId: string;
  title: string;
  thumbnail?: string;
};

function getThumbnail(videoId: string, thumbnail?: string) {
  return thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export default function YouTubeFacade({ videoId, title, thumbnail }: YouTubeFacadeProps) {
  const [active, setActive] = useState(false);
  const frameId = useId();
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!active) return;
    frameRef.current?.focus();
  }, [active]);

  if (active) {
    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          ref={frameRef}
          id={frameId}
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`}
          title={title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const accessibleName = `Play "${title}"`;

  return (
    <button
      type="button"
      className="group relative block aspect-video w-full overflow-hidden bg-black text-left focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-3"
      aria-label={accessibleName}
      onClick={() => setActive(true)}
    >
      <Image
        src={getThumbnail(videoId, thumbnail)}
        alt=""
        fill
        sizes="(max-width: 639px) 100vw, 900px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30" />
      <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--brand)] text-black shadow-[0_0_0_14px_rgba(215,255,67,.08)] transition-transform duration-200 group-hover:scale-105">
          <Play size={18} />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4 font-semibold text-white sm:p-5">{title}</span>
    </button>
  );
}

'use client';

import Image from 'next/image';
import type { Member } from '@/data/squad';
import { normalizeYoutubeId } from '@/data/squad';

export default function MemberCard({
  member,
  index = 0,
  onOpen,
  className = '',
}: {
  member: Member;
  index?: number;
  onOpen: () => void;
  className?: string;
}) {
  const cuts = member.montages.filter((montage) => Boolean(normalizeYoutubeId(montage.youtubeId))).length;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${member.nickname} profile`}
      className={`member-card group relative min-h-0 overflow-hidden border border-white/10 bg-[var(--panel)] text-left ${className}`.trim()}
    >
      <Image
        src={member.photo}
        alt={`${member.nickname} profile`}
        fill
        sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
        className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
        priority={index < 3}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(145deg, ${member.accent}18, transparent 38%)` }}
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <span className="font-mono text-[9px] tracking-[.18em] text-white/50">{member.number} / 25</span>
        <span className="font-mono text-[9px] uppercase tracking-[.16em] text-white/60">{member.status}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/50">{member.role} / {member.hero}</div>
        <div className="mt-2 truncate font-display text-5xl uppercase leading-none sm:text-6xl" style={{ color: member.accent }}>
          {member.nickname}
        </div>
        <div className="mt-2 truncate text-xs text-white/55">{member.name}</div>
        <div className="mt-5 flex items-center justify-between border-t border-white/12 pt-3 font-mono text-[9px] uppercase tracking-[.17em] text-white/40">
          <span>{cuts > 0 ? `${cuts} public cuts` : 'No public cuts'}</span>
          <span>Open profile ↗</span>
        </div>
      </div>
    </button>
  );
}

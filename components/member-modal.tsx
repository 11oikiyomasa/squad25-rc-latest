'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { normalizeYoutubeId, type Member } from '@/data/squad';

function youtubeThumbnail(value: string) {
  const id = normalizeYoutubeId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}
import { Play, X } from './icons';

export function MemberModal({ member, initialMontageIndex = 0, onClose }: { member: Member | null; initialMontageIndex?: number; onClose: () => void }) {
  const [video, setVideo] = useState(member?.montages[initialMontageIndex] ?? member?.montages[0] ?? null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (member) { setVideo(member.montages[initialMontageIndex] ?? member.montages[0] ?? null); setPlaying(false); } }, [member, initialMontageIndex]);
  useEffect(() => {
    if (!member) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', handler); };
  }, [member, onClose]);
  if (!member) return null;
  const activeVideo = video ?? member.montages[0] ?? null;
  return (
    <div role="dialog" aria-modal="true" aria-label={`${member.nickname} player profile`} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div className="max-h-[92vh] w-full max-w-6xl overflow-auto border border-white/10 bg-[#0c0e11] shadow-2xl" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="grid lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative min-h-[340px] overflow-hidden bg-[#15181d] lg:min-h-[680px]">
            <Image src={member.photo} alt={`${member.nickname} profile`} fill sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" priority />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/35 to-transparent p-6 pt-24">
              <div className="mb-3 text-xs tracking-[.28em] text-white/55">PROFILE / {member.number}</div>
              <div className="font-display text-6xl uppercase leading-none" style={{color:member.accent}}>{member.nickname}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[.18em] text-white/65"><span>{member.role}</span><span>•</span><span>{member.hero}</span><span>•</span><span>{member.status}</span></div>
            </div>
          </div>
          <div className="p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-xs uppercase tracking-[.24em] text-white/45">{member.name}</div><h3 className="mt-2 text-2xl font-semibold">The tape</h3></div>
              <Link href={`/member/${member.id}`} className="border border-white/10 px-3 py-2 text-[9px] font-semibold uppercase tracking-[.16em] text-white/45 hover:border-white/25 hover:text-white">Open profile</Link>
              <button type="button" onClick={onClose} aria-label="Close player profile" className="rounded-full border border-white/10 p-2 text-white/55 hover:text-white"><X/></button>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/60">{member.bio}</p>
            <div className="mt-7 overflow-hidden border border-white/10 bg-black">
              <div className="aspect-video w-full bg-[#090a0c]">
                {activeVideo && normalizeYoutubeId(activeVideo.youtubeId) ? (
                  playing ? (
                    <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${normalizeYoutubeId(activeVideo.youtubeId)}?rel=0`} title={activeVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                  ) : (
                    <button type="button" onClick={() => setPlaying(true)} className="group relative block h-full w-full text-left">
                      <Image src={youtubeThumbnail(activeVideo.youtubeId)} alt="" fill sizes="(max-width: 639px) 100vw, 800px" className="object-cover opacity-70 transition group-hover:opacity-85" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25" />
                      <div className="absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-[#d7ff43] text-black shadow-[0_0_0_14px_rgba(215,255,67,.08)] transition group-hover:scale-105"><Play size={20}/></span></div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4"><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/70">Play cut</span><span className="font-mono text-[10px] uppercase tracking-[.16em] text-white/45">{activeVideo.duration}</span></div>
                    </button>
                  )
                ) : (
                  <div className="grid h-full place-items-center p-8 text-center">
                    <div><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-white/10 text-[#d7ff43]"><Play size={18}/></div><div className="text-sm font-semibold">No tape yet.</div><div className="mt-2 max-w-sm text-xs leading-5 text-white/35">This player’s archive is still being assembled.</div></div>
                  </div>
                )}
              </div>
              {activeVideo && <div className="border-t border-white/10 p-4">
                <div className="text-sm font-semibold">{activeVideo.title}</div><div className="mt-1 text-xs text-white/45">{activeVideo.hero} · {activeVideo.duration}</div>
              </div>}
            </div>
            <div className="mt-7 space-y-2">
              <div className="mb-3 text-[11px] uppercase tracking-[.22em] text-white/35">More cuts</div>
              {member.montages.map((m, idx)=>(
                <button type="button" key={m.title} onClick={()=>{ setVideo(m); setPlaying(false); }} className={`flex w-full items-center gap-4 border p-3 text-left transition ${activeVideo?.title===m.title?'border-white/20 bg-white/[.06]':'border-white/8 bg-white/[.02] hover:bg-white/[.045]'}`}>
                  <div className="relative h-10 w-14 shrink-0 overflow-hidden border border-white/10 bg-black">{youtubeThumbnail(m.youtubeId) ? <Image src={youtubeThumbnail(m.youtubeId)} alt="" fill sizes="56px" className="object-cover" /> : <div className="grid h-full w-full place-items-center"><Play size={15}/></div>}</div>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm">{m.title}</div><div className="mt-1 text-xs text-white/40">{idx+1} / {m.hero} / {m.duration}</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

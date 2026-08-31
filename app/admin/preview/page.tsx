'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MemberModal } from '@/components/member-modal';
import type { ContentSnapshot } from '@/lib/content';

const STORAGE_KEY = 'squad25-content-v1';
type ContentState = ContentSnapshot;

function isContentState(value: unknown): value is ContentState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ContentState>;
  return Boolean(v.profile && Array.isArray(v.members) && v.members.length === 25 && Array.isArray(v.achievements) && Array.isArray(v.gallery));
}

export default function AdminPreviewPage() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedMemberId = params.get('member') || '';
  const [data, setData] = useState<ContentState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      setData(isContentState(parsed) ? parsed : null);
    } catch {
      setData(null);
    } finally {
      setReady(true);
    }
  }, []);

  const selected = useMemo(
    () => data?.members.find((member) => member.id === requestedMemberId) ?? data?.members[0] ?? null,
    [data, requestedMemberId],
  );

  if (!ready) {
    return <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#0c0d0f] px-5 text-[#f4f0e7]"><div className="text-center"><div className="font-display text-5xl uppercase">Loading preview.</div><p className="mt-3 text-sm text-white/35">Reading the current local draft…</p></div></main>;
  }

  if (!data || !selected) {
    return <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#0c0d0f] px-5 text-[#f4f0e7]"><div className="max-w-md text-center"><div className="text-[9px] uppercase tracking-[.2em] text-[#ff6b38]">Admin / Preview</div><h1 className="mt-3 font-display text-6xl uppercase leading-none">No draft.</h1><p className="mt-5 text-sm leading-7 text-white/45">Buat atau simpan perubahan di Content Studio dulu. Preview tidak memakai data live supaya draft dan published content tidak tercampur.</p><div className="mt-6 flex justify-center gap-2"><Link href="/admin/roster" className="border border-white/10 px-4 py-3 text-[9px] font-black uppercase tracking-[.18em] text-white/60 hover:border-white/25 hover:text-white">Back to editor</Link><Link href="/admin/overview" className="bg-[#d7ff43] px-4 py-3 text-[9px] font-black uppercase tracking-[.18em] text-black">Overview</Link></div></div></main>;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#0c0d0f] text-[#f4f0e7]">
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-5">
          <div><div className="text-[9px] uppercase tracking-[.22em] text-[#d7ff43]">Draft preview / {data.profile.name}</div><h1 className="mt-2 text-2xl font-semibold">{selected.nickname} · unpublished</h1></div>
          <div className="flex gap-2"><Link href="/admin/roster" className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/55 hover:border-white/25 hover:text-white">Back to editor</Link><button type="button" onClick={() => router.replace('/admin/roster')} className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/55 hover:border-white/25 hover:text-white">Close</button></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative aspect-[4/5] overflow-hidden border border-white/10 bg-black sm:col-span-1"><Image src={selected.photo || '/images/members/ryuu.svg'} alt={`${selected.nickname} draft preview`} fill sizes="(max-width: 639px) 100vw, 33vw" className="object-cover" priority /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/45 to-transparent p-5 pt-24"><div className="text-[9px] uppercase tracking-[.2em] text-white/45">{selected.role} / {selected.status}</div><div className="mt-2 font-display text-5xl uppercase leading-none" style={{ color: selected.accent }}>{selected.nickname}</div></div></div>
          <div className="border border-white/8 bg-[#101216] p-6 sm:col-span-2"><div className="text-[9px] uppercase tracking-[.2em] text-white/30">Draft snapshot</div><p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">This is the exact client-side draft snapshot from Content Studio. Nothing here is published until you press Publish.</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="border border-white/8 bg-black/15 p-4"><div className="font-display text-4xl">{selected.number}</div><div className="mt-1 text-[9px] uppercase tracking-[.15em] text-white/30">Player no.</div></div><div className="border border-white/8 bg-black/15 p-4"><div className="font-display text-4xl">{selected.montages.length}</div><div className="mt-1 text-[9px] uppercase tracking-[.15em] text-white/30">Cuts</div></div><div className="border border-white/8 bg-black/15 p-4"><div className="font-display text-4xl">{data.members.length}</div><div className="mt-1 text-[9px] uppercase tracking-[.15em] text-white/30">Roster</div></div></div><div className="mt-6 border border-white/8 bg-black/15 p-5"><div className="text-[9px] uppercase tracking-[.18em] text-white/30">Bio</div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/60">{selected.bio || 'No bio yet.'}</p></div></div>
        </div>
      </section>
      <MemberModal member={selected} onClose={() => router.replace('/admin/roster')} />
    </main>
  );
}

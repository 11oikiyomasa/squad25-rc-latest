'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from '@/components/icons';
import type { ContentSnapshot } from '@/lib/content';

type ContentState = ContentSnapshot;

const DRAFT_KEY = 'squad25-content-v1';
const PUBLISHED_KEY = 'squad25-published-v1';

function isContentState(value: unknown): value is ContentState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ContentState>;
  return Boolean(v.profile && Array.isArray(v.members) && v.members.length === 25 && Array.isArray(v.achievements) && Array.isArray(v.gallery));
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminMediaStudio() {
  const [data, setData] = useState<ContentState | null>(null);
  const [published, setPublished] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const draft = readJson(DRAFT_KEY);
    const pub = localStorage.getItem(PUBLISHED_KEY) ?? '';
    setPublished(pub);
    if (isContentState(draft)) setData(draft);

    let cancelled = false;
    fetch('/api/admin/content', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load cloud content.');
        return response.json();
      })
      .then((remote: unknown) => {
        if (cancelled) return;
        if (!isContentState(remote)) throw new Error('Cloud content payload is invalid.');
        const currentDraft = readJson(DRAFT_KEY);
        const currentPublished = localStorage.getItem(PUBLISHED_KEY) ?? '';
        const draftSerialized = isContentState(currentDraft) ? JSON.stringify(currentDraft) : '';
        if (draftSerialized && draftSerialized !== currentPublished) {
          setData(currentDraft);
          setPublished(currentPublished);
          setMessage('Unsaved draft preserved.');
          return;
        }
        const serialized = JSON.stringify(remote);
        setData(remote);
        setPublished(serialized);
        localStorage.setItem(DRAFT_KEY, serialized);
        localStorage.setItem(PUBLISHED_KEY, serialized);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Unable to load media.');
      })
      .finally(() => { if (!cancelled) setReady(true); });

    return () => { cancelled = true; };
  }, []);

  const dirty = useMemo(() => Boolean(data && JSON.stringify(data) !== published), [data, published]);

  function save(next: ContentState) {
    setData(next);
    const serialized = JSON.stringify(next);
    try {
      localStorage.setItem(DRAFT_KEY, serialized);
      setMessage('Media draft saved locally.');
    } catch {
      setMessage('Browser storage unavailable.');
    }
  }

  function updateGallery(index: number, patch: Partial<ContentState['gallery'][number]>) {
    if (!data) return;
    save({ ...data, gallery: data.gallery.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  }

  function updateAchievement(index: number, patch: Partial<ContentState['achievements'][number]>) {
    if (!data) return;
    save({ ...data, achievements: data.achievements.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  }

  function addGallery() {
    if (!data) return;
    save({ ...data, gallery: [...data.gallery, { id: `draft-${Date.now()}`, title: 'New archive item', meta: 'Archive', image: '' }] });
  }

  function removeGallery(index: number) {
    if (!data) return;
    save({ ...data, gallery: data.gallery.filter((_, itemIndex) => itemIndex !== index) });
  }

  function addAchievement() {
    if (!data) return;
    save({ ...data, achievements: [...data.achievements, { year: '2026', title: 'New achievement', note: '' }] });
  }

  function removeAchievement(index: number) {
    if (!data) return;
    save({ ...data, achievements: data.achievements.filter((_, itemIndex) => itemIndex !== index) });
  }

  async function publish() {
    if (!data || !dirty) return;
    if (!window.confirm('Publish media and achievements to the live site?')) return;
    setBusy(true);
    setMessage('Publishing…');
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isContentState(payload)) throw new Error((payload as { error?: string } | null)?.error || 'Publish failed.');
      const serialized = JSON.stringify(payload);
      setData(payload);
      setPublished(serialized);
      localStorage.setItem(DRAFT_KEY, serialized);
      localStorage.setItem(PUBLISHED_KEY, serialized);
      setMessage('Media published successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Publish failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <main className="grid min-h-[60vh] place-items-center bg-[#0c0d0f] text-[#f4f0e7]"><div className="text-center"><div className="font-display text-5xl uppercase">Loading media.</div><p className="mt-3 text-sm text-white/35">Checking cloud state and local draft…</p></div></main>;
  if (!data) return <main className="grid min-h-[60vh] place-items-center bg-[#0c0d0f] px-5 text-[#f4f0e7]"><div className="max-w-md text-center"><div className="text-[9px] uppercase tracking-[.2em] text-[#ff6b38]">Admin / Media</div><h1 className="mt-3 font-display text-6xl uppercase leading-none">Media unavailable.</h1><p className="mt-5 text-sm leading-7 text-white/45">{message || 'No valid content snapshot is available.'}</p></div></main>;

  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-white/8 pb-6">
          <div><div className="text-[9px] uppercase tracking-[.22em] text-[#d7ff43]">Content Studio / Media</div><h1 className="mt-2 font-display text-6xl uppercase leading-none sm:text-8xl">Archive room.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">Edit gallery and achievement metadata, review the draft, then publish the complete snapshot.</p></div>
          <div className="flex items-center gap-2"><span className={`text-[9px] uppercase tracking-[.15em] ${dirty ? 'text-[#ff6b38]' : 'text-white/25'}`}>{dirty ? 'Unsaved draft' : 'Published'}</span><button type="button" disabled={!dirty || busy} onClick={() => void publish()} className="bg-[#d7ff43] px-4 py-3 text-[9px] font-black uppercase tracking-[.16em] text-black disabled:cursor-not-allowed disabled:opacity-35">{busy ? 'Publishing…' : 'Publish'}</button></div>
        </div>
        {message && <div className="mt-5 border border-white/8 bg-white/[.02] px-4 py-3 text-xs text-white/55">{message}</div>}

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_.75fr]">
          <section className="border border-white/8 bg-[#101216] p-5 sm:p-6"><div className="flex items-end justify-between gap-4 border-b border-white/8 pb-4"><div><div className="text-[9px] uppercase tracking-[.2em] text-[#ff6b38]">Gallery archive</div><h2 className="mt-1 text-xl font-semibold">{data.gallery.length} items</h2></div><button type="button" onClick={addGallery} className="border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-white/55 hover:border-white/25 hover:text-white">+ Add</button></div><div className="mt-5 space-y-4">{data.gallery.map((item, index) => <article key={item.id || index} className="grid gap-4 border border-white/8 p-4 lg:grid-cols-[150px_1fr]"><div className="relative aspect-[4/3] overflow-hidden border border-white/8 bg-black">{item.image ? <Image src={item.image} alt={item.title} fill sizes="150px" className="object-cover" /> : <div className="grid h-full place-items-center text-[9px] uppercase tracking-[.15em] text-white/20">No image</div>}</div><div className="grid gap-3"><Field label="Title" value={item.title} onChange={(value) => updateGallery(index, { title: value })}/><Field label="Caption / Meta" value={item.meta} onChange={(value) => updateGallery(index, { meta: value })}/><Field label="Image URL" value={item.image} onChange={(value) => updateGallery(index, { image: value })}/><button type="button" onClick={() => removeGallery(index)} className="justify-self-start text-[9px] uppercase tracking-[.16em] text-[#ff6b38]">Remove item</button></div></article>)}</div></section>

          <section className="border border-white/8 bg-[#101216] p-5 sm:p-6"><div className="flex items-end justify-between gap-4 border-b border-white/8 pb-4"><div><div className="text-[9px] uppercase tracking-[.2em] text-[#d7ff43]">Achievements</div><h2 className="mt-1 text-xl font-semibold">{data.achievements.length} records</h2></div><button type="button" onClick={addAchievement} className="border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-white/55 hover:border-white/25 hover:text-white">+ Add</button></div><div className="mt-5 space-y-4">{data.achievements.map((achievement, index) => <article key={`${achievement.year}-${achievement.title}-${index}`} className="border border-white/8 p-4"><div className="grid gap-3 sm:grid-cols-[100px_1fr]"><Field label="Year" value={achievement.year} onChange={(value) => updateAchievement(index, { year: value })}/><Field label="Title" value={achievement.title} onChange={(value) => updateAchievement(index, { title: value })}/><div className="sm:col-span-2"><label className="block"><span className="text-[9px] uppercase tracking-[.18em] text-white/25">Note</span><textarea value={achievement.note} onChange={(event) => updateAchievement(index, { note: event.target.value })} className="mt-2 min-h-24 w-full border border-white/10 bg-[#0d0f11] p-3 text-xs leading-6 text-white outline-none focus:border-[#d7ff43]/35"/></label></div></div><button type="button" onClick={() => removeAchievement(index)} className="mt-3 text-[9px] uppercase tracking-[.16em] text-[#ff6b38]">Remove record</button></article>)}</div></section>
        </div>
        <div className="mt-6 flex justify-end"><Link href="/admin/preview" className="inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-[9px] uppercase tracking-[.16em] text-white/55 hover:border-white/25 hover:text-white">Open draft preview <ArrowUpRight size={13}/></Link></div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-[9px] uppercase tracking-[.18em] text-white/25">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-white/10 bg-[#0d0f11] px-3 py-2.5 text-xs text-white outline-none focus:border-[#d7ff43]/35"/></label>;
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { normalizeYoutubeId, type Member, type Montage, type Role } from '@/data/squad';
import type { ContentSnapshot } from '@/lib/content';
import { safeImageSource } from '@/lib/image-sources';
import { ArrowUpRight, Search } from '@/components/icons';

type ContentState = ContentSnapshot;
const DRAFT_KEY = 'squad25-content-v1';
const PUBLISHED_KEY = 'squad25-published-v1';
const roles: Role[] = ['EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM'];

function isContentState(value: unknown): value is ContentState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ContentState>;
  return Boolean(v.profile && Array.isArray(v.members) && v.members.length === 25 && Array.isArray(v.achievements) && Array.isArray(v.gallery));
}

function readLocal(): ContentState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isContentState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export default function AdminStudioV2({ initialTab = 'overview' }: { initialTab?: 'overview' | 'members' | 'settings' }) {
  const [data, setData] = useState<ContentState | null>(null);
  const [published, setPublished] = useState('');
  const [tab, setTab] = useState(initialTab);
  const [selectedId, setSelectedId] = useState('ryuu');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const local = readLocal();
    const publishedSnapshot = localStorage.getItem(PUBLISHED_KEY) ?? '';
    setPublished(publishedSnapshot);
    if (local) setData(local);

    if (!isSupabaseConfigured()) {
      setLoadError('Supabase belum dikonfigurasi.');
      setReady(true);
      return () => { cancelled = true; };
    }

    fetch('/api/admin/content', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Cloud content unavailable');
        return response.json();
      })
      .then((remote: unknown) => {
        if (cancelled) return;
        if (!isContentState(remote)) throw new Error('Cloud content payload is invalid.');
        const draft = readLocal();
        const currentPublished = localStorage.getItem(PUBLISHED_KEY) ?? '';
        const serializedDraft = draft ? JSON.stringify(draft) : '';
        const hasUnsavedDraft = Boolean(serializedDraft && (!currentPublished || serializedDraft !== currentPublished));

        if (hasUnsavedDraft && draft) {
          setData(draft);
          setPublished(currentPublished);
          setMessage('Unsaved draft preserved. Review before publishing.');
          return;
        }

        const serialized = JSON.stringify(remote);
        setData(remote);
        setPublished(serialized);
        localStorage.setItem(DRAFT_KEY, serialized);
        localStorage.setItem(PUBLISHED_KEY, serialized);
      })
      .catch((error) => {
        if (cancelled) return;
        const detail = error instanceof Error ? error.message : 'Cloud content unavailable';
        setLoadError(detail);
        setMessage(detail);
      })
      .finally(() => { if (!cancelled) setReady(true); });

    return () => { cancelled = true; };
  }, []);

  const selected = data?.members.find((member) => member.id === selectedId) ?? data?.members[0] ?? null;
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!data || !term) return data?.members ?? [];
    return data.members.filter((member) => `${member.nickname} ${member.name} ${member.role}`.toLowerCase().includes(term));
  }, [data, query]);
  const dirty = Boolean(data && JSON.stringify(data) !== published);

  function save(next: ContentState, status = 'Draft saved locally.') {
    setData(next);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      setMessage(status);
    } catch {
      setMessage('Browser storage unavailable. Export the JSON draft.');
    }
  }

  function editMember(patch: Partial<Member>) {
    if (!data || !selected) return;
    save({ ...data, members: data.members.map((member) => member.id === selected.id ? { ...member, ...patch } : member) });
  }

  function editMontage(index: number, patch: Partial<Montage>) {
    if (!selected) return;
    editMember({ montages: selected.montages.map((montage, montageIndex) => montageIndex === index ? { ...montage, ...patch } : montage) });
  }

  function addMontage() {
    if (!selected) return;
    editMember({ montages: [...selected.montages, { title: `${selected.nickname} — new cut`, hero: selected.hero, duration: '00:00', youtubeId: '', description: '' }] });
  }

  function removeMontage(index: number) {
    if (!selected) return;
    editMember({ montages: selected.montages.filter((_, montageIndex) => montageIndex !== index) });
  }

  async function uploadPhoto(file: File) {
    if (!selected || !isSupabaseConfigured()) {
      setMessage('Supabase belum dikonfigurasi.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setMessage('Gunakan JPG/PNG/WEBP, maksimal 8 MB.');
      return;
    }
    setBusy(true);
    setMessage('Uploading photo…');
    try {
      const supabase = createClient();
      const ext = file.type.split('/')[1] || 'jpg';
      const path = `members/${selected.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('squad-media').upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type });
      if (error) throw error;
      const { data: publicUrl } = supabase.storage.from('squad-media').getPublicUrl(path);
      editMember({ photo: publicUrl.publicUrl });
      setMessage('Photo uploaded. Publish to make it live.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Photo upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!data || !isSupabaseConfigured() || !dirty) return;
    if (!window.confirm('Publish this draft to the live site?')) return;
    setBusy(true);
    setMessage('Publishing…');
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isContentState(payload)) {
        throw new Error((payload as { error?: string } | null)?.error || 'Publish failed.');
      }
      const serialized = JSON.stringify(payload);
      setData(payload);
      setPublished(serialized);
      localStorage.setItem(DRAFT_KEY, serialized);
      localStorage.setItem(PUBLISHED_KEY, serialized);
      setMessage('Published successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Publish failed.');
    } finally {
      setBusy(false);
    }
  }

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'squad25-content.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!isContentState(parsed)) throw new Error('Invalid');
        save(parsed, 'Draft JSON imported.');
      } catch {
        setMessage('JSON konten tidak valid.');
      }
    };
    reader.readAsText(file);
  }

  if (!ready) return <LoadingState label="Loading Studio." detail="Checking draft and cloud state…" />;
  if (!data) return <main className="grid min-h-[70vh] place-items-center bg-[#0c0d0f] px-5 text-[#f4f0e7]"><div className="max-w-md text-center"><div className="font-display text-5xl uppercase">Studio unavailable.</div><p className="mt-4 text-sm leading-7 text-white/45">{loadError ?? 'No valid content snapshot is available.'}</p></div></main>;

  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-white/8 pb-6">
          <div><div className="text-[10px] uppercase tracking-[.24em] text-[#d7ff43]">Content Studio</div><h1 className="mt-3 font-display text-7xl uppercase leading-[.8] sm:text-9xl">Control<br/><span className="text-[#ff6b38]">room.</span></h1><p className="mt-5 max-w-2xl text-sm leading-6 text-white/45">Edit roster content, keep drafts local, preview before publishing, and publish a validated snapshot to Supabase.</p></div>
          <div className="flex flex-wrap items-center gap-2"><span className={`text-[9px] uppercase tracking-[.15em] ${dirty ? 'text-[#ff6b38]' : 'text-white/25'}`}>{dirty ? 'Unsaved draft' : 'Published'}</span><button type="button" disabled={!dirty || busy} onClick={() => void publish()} className="bg-[#d7ff43] px-4 py-3 text-[9px] font-black uppercase tracking-[.16em] text-black disabled:cursor-not-allowed disabled:opacity-35">{busy ? 'Saving…' : 'Publish'}</button></div>
        </div>

        <nav className="mt-5 flex w-full gap-1 overflow-x-auto border-b border-white/8 pb-2" aria-label="Content Studio sections">
          <StudioTab active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</StudioTab>
          <StudioTab active={tab === 'members'} onClick={() => setTab('members')}>Members</StudioTab>
          <StudioTab active={tab === 'settings'} onClick={() => setTab('settings')}>Settings</StudioTab>
          <Link href="/admin/media" className="shrink-0 border border-transparent px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/35 hover:border-white/10 hover:text-white">Media ↗</Link>
        </nav>

        {message && <div role="status" className="mt-5 border border-white/8 bg-white/[.02] px-4 py-3 text-xs text-white/55">{message}</div>}

        {tab === 'overview' && <Overview data={data} onMembers={() => setTab('members')} onExport={exportJson} onImport={() => fileRef.current?.click()} />}
        {tab === 'settings' && <Settings data={data} save={save} />}
        {tab === 'members' && selected && (
          <div className="mt-8 grid gap-6 xl:grid-cols-[290px_1fr]">
            <aside className="border border-white/8 bg-[#101216] p-4">
              <div className="flex items-center gap-2 border border-white/8 px-3 py-2 text-white/35"><Search size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roster" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/20"/></div>
              <div className="mt-4 space-y-1">{filtered.map((member) => <button key={member.id} type="button" onClick={() => setSelectedId(member.id)} className={`flex w-full items-center gap-3 border p-2 text-left ${member.id === selected.id ? 'border-[#d7ff43]/30 bg-[#d7ff43]/[.06]' : 'border-transparent hover:border-white/8'}`}><Image src={safeImageSource(member.photo)} alt="" width={40} height={50} className="h-10 w-8 object-cover"/><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{member.nickname}</span><span className="block text-[9px] uppercase tracking-[.13em] text-white/25">{member.role} / {member.status}</span></span><span className="text-[9px] text-white/20">{member.number}</span></button>)}</div>
            </aside>
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-5"><div><div className="text-[9px] uppercase tracking-[.22em] text-[#d7ff43]">Member editor / {selected.number}</div><h2 className="mt-2 font-display text-6xl uppercase leading-none" style={{ color: selected.accent }}>{selected.nickname}</h2></div><Link href={`/admin/preview?member=${selected.id}`} target="_blank" className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/55 hover:text-white">Preview <ArrowUpRight size={13}/></Link></div>
              <div className="grid gap-6 lg:grid-cols-[210px_1fr]"><div className="border border-white/8 bg-[#101216] p-3"><div className="relative aspect-[4/5] overflow-hidden bg-black"><Image src={safeImageSource(selected.photo)} alt={`${selected.nickname} profile`} fill sizes="210px" className="object-cover"/></div><label className="mt-3 block cursor-pointer border border-white/10 px-3 py-2 text-center text-[9px] uppercase tracking-[.16em] text-white/55 hover:border-[#d7ff43]/35"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPhoto(file); event.currentTarget.value = ''; }}/ >Upload photo</label></div><div className="grid gap-3 md:grid-cols-2"><Field label="Nickname" value={selected.nickname} onChange={(value) => editMember({ nickname: value })}/><Field label="Name" value={selected.name} onChange={(value) => editMember({ name: value })}/><Field label="Photo URL" value={selected.photo} onChange={(value) => editMember({ photo: value })}/><SelectField label="Role" value={selected.role} options={roles} onChange={(value) => editMember({ role: value as Role })}/><Field label="Hero" value={selected.hero} onChange={(value) => editMember({ hero: value })}/><SelectField label="Status" value={selected.status} options={['ACTIVE','BENCH','CAPTAIN']} onChange={(value) => editMember({ status: value as Member['status'] })}/><div className="md:col-span-2"><label className="block"><span className="text-[9px] uppercase tracking-[.18em] text-white/25">Bio</span><textarea value={selected.bio} onChange={(event) => editMember({ bio: event.target.value })} className="mt-2 min-h-28 w-full border border-white/10 bg-[#101216] p-3 text-sm leading-6 text-white outline-none focus:border-[#d7ff43]/35"/></label></div></div></div>
              <div className="border border-white/8 bg-[#101216] p-5"><div className="flex items-end justify-between border-b border-white/8 pb-4"><div><div className="text-[9px] uppercase tracking-[.22em] text-[#ff6b38]">Montage archive</div><h3 className="mt-1 text-xl font-semibold">{selected.montages.length} cuts</h3></div><button type="button" onClick={addMontage} className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/55">+ Add cut</button></div><div className="mt-4 space-y-3">{selected.montages.map((montage, index) => <div key={`${montage.title}-${index}`} className="grid gap-3 border border-white/8 p-4"><div className="grid gap-3 md:grid-cols-2"><Field label={`Title ${index + 1}`} value={montage.title} onChange={(value) => editMontage(index, { title: value })}/><Field label="YouTube URL / ID" value={montage.youtubeId} onChange={(value) => editMontage(index, { youtubeId: normalizeYoutubeId(value) || value })}/><Field label="Hero" value={montage.hero} onChange={(value) => editMontage(index, { hero: value })}/><Field label="Duration" value={montage.duration} onChange={(value) => editMontage(index, { duration: value })}/><div className="md:col-span-2"><Field label="Description" value={montage.description} onChange={(value) => editMontage(index, { description: value })}/></div></div><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-white/20">Cut {String(index + 1).padStart(2, '0')}</span><button type="button" onClick={() => removeMontage(index)} className="text-[9px] uppercase tracking-[.16em] text-[#ff6b38]">Remove</button></div></div>)}</div></div>
            </div>
          </div>
        )}
      </section>
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) importJson(file); event.currentTarget.value = ''; }}/>
    </main>
  );
}

function LoadingState({ label, detail }: { label: string; detail: string }) { return <main className="grid min-h-[70vh] place-items-center bg-[#0c0d0f] text-[#f4f0e7]"><div className="text-center"><div className="font-display text-5xl uppercase">{label}</div><p className="mt-3 text-sm text-white/35">{detail}</p></div></main>; }
function StudioTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) { return <button type="button" onClick={onClick} className={`shrink-0 border px-3 py-2 text-[9px] uppercase tracking-[.16em] ${active ? 'border-[#d7ff43]/25 bg-[#d7ff43]/[.06] text-[#d7ff43]' : 'border-transparent text-white/35 hover:border-white/10 hover:text-white'}`}>{children}</button>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="text-[9px] uppercase tracking-[.18em] text-white/25">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-white/10 bg-[#0d0f11] px-3 py-2.5 text-xs text-white outline-none focus:border-[#d7ff43]/35"/></label>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className="block"><span className="text-[9px] uppercase tracking-[.18em] text-white/25">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-white/10 bg-[#0d0f11] px-3 py-2.5 text-xs text-white outline-none focus:border-[#d7ff43]/35">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }
function Overview({ data, onMembers, onExport, onImport }: { data: ContentState; onMembers: () => void; onExport: () => void; onImport: () => void }) { return <div className="mt-8 space-y-8"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Players" value={String(data.members.length)}/><Metric label="Montage cuts" value={String(data.members.reduce((total, member) => total + member.montages.length, 0))}/><Metric label="Achievements" value={String(data.achievements.length)}/><Metric label="Archive items" value={String(data.gallery.length)}/></div><div className="grid gap-6 lg:grid-cols-2"><div className="border border-white/8 bg-[#101216] p-5"><div className="text-[9px] uppercase tracking-[.22em] text-[#ff6b38]">Actions</div><div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onMembers} className="border border-white/10 px-4 py-3 text-left text-[10px] uppercase tracking-[.18em]">Edit roster →</button><Link href={`/admin/preview?member=${data.members[0]?.id ?? 'ryuu'}`} target="_blank" className="border border-white/10 px-4 py-3 text-[10px] uppercase tracking-[.18em]">Preview draft ↗</Link><button type="button" onClick={onExport} className="border border-white/10 px-4 py-3 text-left text-[10px] uppercase tracking-[.18em]">Export JSON</button><button type="button" onClick={onImport} className="border border-white/10 px-4 py-3 text-left text-[10px] uppercase tracking-[.18em]">Import JSON</button></div></div><div className="border border-white/8 bg-[#101216] p-5"><div className="text-[9px] uppercase tracking-[.22em] text-[#d7ff43]">Publish checklist</div><div className="mt-5 space-y-3 text-sm text-white/55"><Check done={data.members.length === 25} text="25 player records present"/><Check done={data.members.every((member) => Boolean(member.photo))} text="Every player has a photo path"/><Check done={data.gallery.length >= 6} text="Archive has entries"/></div></div></div></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="border border-white/8 bg-[#101216] p-5"><div className="font-display text-4xl">{value}</div><div className="mt-1 text-[9px] uppercase tracking-[.16em] text-white/30">{label}</div></div>; }
function Check({ done, text }: { done: boolean; text: string }) { return <div className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${done ? 'bg-[#d7ff43]' : 'bg-white/15'}`}/><span>{text}</span></div>; }
function Settings({ data, save }: { data: ContentState; save: (next: ContentState) => void }) { return <div className="mt-8 max-w-3xl border border-white/8 bg-[#101216] p-5 sm:p-6"><div className="text-[9px] uppercase tracking-[.22em] text-[#d7ff43]">Squad identity</div><h2 className="mt-2 text-2xl font-semibold">Public metadata</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Squad name" value={data.profile.name} onChange={(value) => save({ ...data, profile: { ...data.profile, name: value } })}/><Field label="Season" value={data.profile.season} onChange={(value) => save({ ...data, profile: { ...data.profile, season: value } })}/><div className="sm:col-span-2"><Field label="Tagline" value={data.profile.tagline} onChange={(value) => save({ ...data, profile: { ...data.profile, tagline: value } })}/></div><Field label="Instagram URL" value={data.profile.instagram} onChange={(value) => save({ ...data, profile: { ...data.profile, instagram: value } })}/><Field label="TikTok URL" value={data.profile.tiktok} onChange={(value) => save({ ...data, profile: { ...data.profile, tiktok: value } })}/><div className="sm:col-span-2"><Field label="YouTube URL" value={data.profile.youtube} onChange={(value) => save({ ...data, profile: { ...data.profile, youtube: value } })}/></div></div></div>; }

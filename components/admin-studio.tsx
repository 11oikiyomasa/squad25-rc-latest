'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { logout } from '@/app/login/actions';
import { normalizeYoutubeId, type Member, type Montage, type Role } from '@/data/squad';
import type { ContentSnapshot } from '@/lib/content';
import { ArrowUpRight, Search } from '@/components/icons';

const STORAGE_KEY = 'squad25-content-v1';
const PUBLISHED_KEY = 'squad25-published-v1';
const roles: Role[] = ['EXP','JUNGLE','MID','GOLD','ROAM'];

type ContentState = ContentSnapshot;

function isContentState(value: unknown): value is ContentState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ContentState>;
  return Boolean(v.profile && Array.isArray(v.members) && v.members.length === 25 && Array.isArray(v.achievements) && Array.isArray(v.gallery));
}

function readLocal(): ContentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return isContentState(parsed) ? parsed : null;
  } catch { return null; }
}

export default function AdminStudio() {
  const [data, setData] = useState<ContentState | null>(null);
  const [published, setPublished] = useState('');
  const [tab, setTab] = useState<'overview'|'members'|'settings'>('overview');
  const [selectedId, setSelectedId] = useState('ryuu');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const local = readLocal();
    const pub = localStorage.getItem(PUBLISHED_KEY) ?? '';
    setPublished(pub);
    if (local) setData(local);
    if (!isSupabaseConfigured()) { setReady(true); return () => { cancelled = true; }; }
    fetch('/api/admin/content', { cache: 'no-store' })
      .then(async (r) => { if (!r.ok) throw new Error('Cloud content unavailable'); return r.json(); })
      .then((remote) => {
        if (cancelled || !isContentState(remote)) return;
        const draft = localStorage.getItem(STORAGE_KEY);
        const hasUnsaved = Boolean(draft && pub && draft !== pub);
        if (!hasUnsaved) {
          const serialized = JSON.stringify(remote);
          setData(remote); setPublished(serialized);
          localStorage.setItem(STORAGE_KEY, serialized); localStorage.setItem(PUBLISHED_KEY, serialized);
        } else {
          setMessage('Draft lokal dipertahankan. Review lalu Preview sebelum Publish.');
        }
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : 'Cloud content unavailable'))
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  const selected = data?.members.find((m) => m.id === selectedId) ?? data?.members[0] ?? null;
  const filtered = useMemo(() => data?.members.filter((m) => `${m.nickname} ${m.name} ${m.role}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data, query]);
  const dirty = Boolean(data && JSON.stringify(data) !== published);

  function save(next: ContentState) {
    setData(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { setMessage('Browser storage unavailable. Export the JSON draft.'); }
    setMessage('Draft saved locally.');
  }

  function editMember(patch: Partial<Member>) {
    if (!data || !selected) return;
    save({ ...data, members: data.members.map((m) => m.id === selected.id ? { ...m, ...patch } : m) });
  }

  function editMontage(index: number, patch: Partial<Montage>) {
    if (!selected) return;
    editMember({ montages: selected.montages.map((m, i) => i === index ? { ...m, ...patch } : m) });
  }

  function addMontage() {
    if (!selected) return;
    editMember({ montages: [...selected.montages, { title: `${selected.nickname} — new cut`, hero: selected.hero, duration: '00:00', youtubeId: '', description: '' }] });
  }

  function removeMontage(index: number) {
    if (!selected) return;
    editMember({ montages: selected.montages.filter((_, i) => i !== index) });
  }

  async function publish() {
    if (!data || !isSupabaseConfigured()) { setMessage('Supabase belum dikonfigurasi.'); return; }
    if (!window.confirm('Publish draft ke website live?')) return;
    setBusy(true); setMessage('Publishing…');
    try {
      const response = await fetch('/api/admin/content', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
      const payload = await response.json();
      if (!response.ok || !isContentState(payload)) throw new Error(payload?.error ?? 'Publish failed');
      const serialized = JSON.stringify(payload);
      setData(payload); setPublished(serialized);
      localStorage.setItem(STORAGE_KEY, serialized); localStorage.setItem(PUBLISHED_KEY, serialized);
      setMessage('Published successfully.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Publish failed'); }
    finally { setBusy(false); }
  }

  async function uploadPhoto(file: File) {
    if (!selected || !isSupabaseConfigured()) { setMessage('Supabase belum dikonfigurasi.'); return; }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) { setMessage('Gunakan JPG/PNG/WEBP, maksimal 8 MB.'); return; }
    setBusy(true); setMessage('Uploading photo…');
    try {
      const supabase = createClient();
      const ext = file.type.split('/')[1] || 'jpg';
      const path = `members/${selected.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('squad-media').upload(path, file, { upsert:false, cacheControl:'3600', contentType:file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('squad-media').getPublicUrl(path);
      editMember({ photo: urlData.publicUrl });
      setMessage('Photo uploaded. Publish to make it live.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Photo upload failed'); }
    finally { setBusy(false); }
  }

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='squad25-content.json'; a.click(); URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try { const parsed: unknown = JSON.parse(String(reader.result)); if (!isContentState(parsed)) throw new Error('Invalid'); save(parsed); setMessage('Draft JSON imported.'); }
      catch { setMessage('JSON konten tidak valid.'); }
    };
    reader.readAsText(file);
  }

  if (!ready || !data) return <main className="grid min-h-screen place-items-center bg-[#0c0d0f] text-[#f4f0e7]"><div className="text-center"><div className="font-display text-5xl uppercase">Loading Studio.</div><div className="mt-3 text-sm text-white/35">Checking draft and cloud state…</div></div></main>;

  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c0d0f]/90 backdrop-blur-md"><div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8"><Link href="/" className="text-sm font-black tracking-[.2em]">{data.profile.name}</Link><nav className="hidden items-center gap-1 sm:flex"><Tab active={tab==='overview'} onClick={()=>setTab('overview')}>Overview</Tab><Tab active={tab==='members'} onClick={()=>setTab('members')}>Members</Tab><Tab active={tab==='settings'} onClick={()=>setTab('settings')}>Settings</Tab></nav><div className="flex items-center gap-2"><span className={`hidden text-[9px] uppercase tracking-[.15em] sm:inline ${dirty?'text-[#ff6b38]':'text-white/25'}`}>{dirty?'Unsaved draft':'Published'}</span><button type="button" onClick={()=>void publish()} disabled={busy || !dirty} className="bg-[#d7ff43] px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-black disabled:cursor-not-allowed disabled:opacity-35">{busy?'Saving…':'Publish'}</button><form action={logout}><button type="submit" className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/45 hover:text-white">Logout</button></form></div></div><div className="border-t border-white/8 px-5 py-2 text-center text-[9px] uppercase tracking-[.16em] text-white/25 sm:hidden">{dirty?'Unsaved draft':'Published'}</div></header>

      {message && <div className="mx-auto max-w-7xl px-5 pt-5 lg:px-8"><div className="border border-white/8 bg-white/[.02] px-4 py-3 text-xs text-white/55">{message}</div></div>}

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        {tab==='overview' && <Overview data={data} onMembers={()=>setTab('members')} onExport={exportJson} onImport={()=>fileRef.current?.click()}/>} 
        {tab==='settings' && <Settings data={data} save={save}/>} 
        {tab==='members' && selected && (
          <div className="grid gap-6 xl:grid-cols-[290px_1fr]">
            <aside className="border border-white/8 bg-[#101216] p-4"><div className="flex items-center gap-2 border border-white/8 px-3 py-2 text-white/35"><Search size={14}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search roster" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/20"/></div><div className="mt-4 space-y-1">{filtered.map((m)=><button key={m.id} type="button" onClick={()=>setSelectedId(m.id)} className={`flex w-full items-center gap-3 border p-2 text-left ${m.id===selected.id?'border-[#d7ff43]/30 bg-[#d7ff43]/[.06]':'border-transparent hover:border-white/8'}`}><Image src={m.photo} alt="" width={40} height={50} className="h-10 w-8 object-cover"/><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{m.nickname}</span><span className="block text-[9px] uppercase tracking-[.13em] text-white/25">{m.role} / {m.status}</span></span><span className="text-[9px] text-white/20">{m.number}</span></button>)}</div></aside>
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-5"><div><div className="text-[9px] uppercase tracking-[.22em] text-[#d7ff43]">Member editor / {selected.number}</div><h1 className="mt-2 font-display text-6xl uppercase leading-none" style={{color:selected.accent}}>{selected.nickname}</h1></div><Link href={`/admin/preview?member=${selected.id}`} target="_blank" className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/55 hover:text-white">Preview <ArrowUpRight size={13}/></Link></div>
              <div className="grid gap-6 lg:grid-cols-[210px_1fr]"><div className="border border-white/8 bg-[#101216] p-3"><div className="relative aspect-[4/5] overflow-hidden bg-black"><Image src={selected.photo} alt={`${selected.nickname} profile`} fill sizes="210px" className="object-cover"/></div><label className="mt-3 block cursor-pointer border border-white/10 px-3 py-2 text-center text-[9px] uppercase tracking-[.16em] text-white/55 hover:border-[#d7ff43]/35"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e)=>{const f=e.target.files?.[0]; if(f) void uploadPhoto(f); e.currentTarget.value='';}}/>Upload photo</label></div>
                <div className="grid gap-3 md:grid-cols-2"><Field label="Nickname" value={selected.nickname} onChange={(v)=>editMember({nickname:v})}/><Field label="Name" value={selected.name} onChange={(v)=>editMember({name:v})}/><Field label="Photo URL" value={selected.photo} onChange={(v)=>editMember({photo:v})}/><SelectField label="Role" value={selected.role} options={roles} onChange={(v)=>editMember({role:v as Role})}/><Field label="Hero" value={selected.hero} onChange={(v)=>editMember({hero:v})}/><SelectField label="Status" value={selected.status} options={['ACTIVE','BENCH','CAPTAIN']} onChange={(v)=>editMember({status:v as Member['status']})}/><div className="md:col-span-2"><label className="block text-[9px] uppercase tracking-[.18em] text-white/25">Bio</label><textarea value={selected.bio} onChange={(e)=>editMember({bio:e.target.value})} className="mt-2 min-h-28 w-full border border-white/10 bg-[#101216] p-3 text-sm leading-6 text-white outline-none focus:border-[#d7ff43]/35"/></div></div>
              </div>
              <div className="border border-white/8 bg-[#101216] p-5"><div className="flex items-end justify-between border-b border-white/8 pb-4"><div><div className="text-[9px] uppercase tracking-[.22em] text-[#ff6b38]">Montage archive</div><h2 className="mt-1 text-xl font-semibold">{selected.montages.length} cuts</h2></div><button type="button" onClick={addMontage} className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/55">+ Add cut</button></div><div className="mt-4 space-y-3">{selected.montages.map((m,i)=><div key={`${m.title}-${i}`} className="grid gap-3 border border-white/8 p-4"><div className="grid gap-3 md:grid-cols-2"><Field label={`Title ${i+1}`} value={m.title} onChange={(v)=>editMontage(i,{title:v})}/><Field label="YouTube URL / ID" value={m.youtubeId} onChange={(v)=>editMontage(i,{youtubeId:normalizeYoutubeId(v) || v})}/><Field label="Hero" value={m.hero} onChange={(v)=>editMontage(i,{hero:v})}/><Field label="Duration" value={m.duration} onChange={(v)=>editMontage(i,{duration:v})}/><div className="md:col-span-2"><Field label="Description" value={m.description} onChange={(v)=>editMontage(i,{description:v})}/></div></div><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-white/20">Cut {String(i+1).padStart(2,'0')}</span><button type="button" onClick={()=>removeMontage(i)} className="text-[9px] uppercase tracking-[.16em] text-[#ff6b38]">Remove</button></div></div>)}</div></div>
            </div>
          </div>
        )}
      </section>
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) importJson(f); e.currentTarget.value='';}}/>
    </main>
  );
}

function Tab({active,onClick,children}:{active:boolean;onClick:()=>void;children:string}){return <button type="button" onClick={onClick} className={`px-3 py-2 text-[9px] uppercase tracking-[.16em] ${active?'bg-white/8 text-white':'text-white/35 hover:text-white'}`}>{children}</button>}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="block"><span className="text-[9px] uppercase tracking-[.18em] text-white/25">{label}</span><input value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 w-full border border-white/10 bg-[#0d0f11] px-3 py-2.5 text-xs text-white outline-none focus:border-[#d7ff43]/35"/></label>}
function SelectField({label,value,options,onChange}:{label:string;value:string;options:readonly string[];onChange:(v:string)=>void}){return <label className="block"><span className="text-[9px] uppercase tracking-[.18em] text-white/25">{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 w-full border border-white/10 bg-[#0d0f11] px-3 py-2.5 text-xs text-white outline-none focus:border-[#d7ff43]/35">{options.map((o)=><option key={o} value={o}>{o}</option>)}</select></label>}
function Overview({data,onMembers,onExport,onImport}:{data:ContentState;onMembers:()=>void;onExport:()=>void;onImport:()=>void}){return <div className="space-y-8"><div><div className="text-[10px] uppercase tracking-[.25em] text-[#d7ff43]">Content Studio</div><h1 className="mt-3 font-display text-7xl uppercase leading-[.78] sm:text-9xl">Control<br/><span className="text-[#ff6b38]">Room.</span></h1><p className="mt-6 max-w-2xl text-sm leading-6 text-white/45">Edit the roster, review a draft, then publish a validated snapshot to Supabase.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Players" value={String(data.members.length)}/><Metric label="Montage cuts" value={String(data.members.reduce((n,m)=>n+m.montages.length,0))}/><Metric label="Achievements" value={String(data.achievements.length)}/><Metric label="Archive items" value={String(data.gallery.length)}/></div><div className="grid gap-6 lg:grid-cols-2"><div className="border border-white/8 bg-[#101216] p-5"><div className="text-[9px] uppercase tracking-[.22em] text-[#ff6b38]">Actions</div><div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onMembers} className="border border-white/10 px-4 py-3 text-left text-[10px] uppercase tracking-[.18em]">Edit roster →</button><Link href={`/admin/preview?member=${data.members[0]?.id ?? 'ryuu'}`} target="_blank" className="border border-white/10 px-4 py-3 text-[10px] uppercase tracking-[.18em]">Preview draft ↗</Link><button type="button" onClick={onExport} className="border border-white/10 px-4 py-3 text-left text-[10px] uppercase tracking-[.18em]">Export JSON</button><button type="button" onClick={onImport} className="border border-white/10 px-4 py-3 text-left text-[10px] uppercase tracking-[.18em]">Import JSON</button></div></div><div className="border border-white/8 bg-[#101216] p-5"><div className="text-[9px] uppercase tracking-[.22em] text-[#d7ff43]">Publish checklist</div><div className="mt-5 space-y-3 text-sm text-white/55"><Check done={data.members.length===25} text="25 player records present"/><Check done={data.members.every((m)=>Boolean(m.photo))} text="Every player has a photo path"/><Check done={data.gallery.length>=6} text="Archive has entries"/></div></div></div></div>}
function Settings({data,save}:{data:ContentState;save:(next:ContentState)=>void}){return <div className="max-w-3xl space-y-6"><div className="border border-white/8 bg-[#101216] p-5 lg:p-6"><div className="text-[9px] uppercase tracking-[.22em] text-[#d7ff43]">Squad identity</div><h1 className="mt-2 text-2xl font-semibold">Public metadata</h1><div className="mt-6 space-y-4"><Field label="Squad name" value={data.profile.name} onChange={(v)=>save({...data,profile:{...data.profile,name:v}})}/><Field label="Tagline" value={data.profile.tagline} onChange={(v)=>save({...data,profile:{...data.profile,tagline:v}})}/><Field label="Instagram" value={data.profile.instagram} onChange={(v)=>save({...data,profile:{...data.profile,instagram:v}})}/><Field label="TikTok" value={data.profile.tiktok} onChange={(v)=>save({...data,profile:{...data.profile,tiktok:v}})}/><Field label="YouTube" value={data.profile.youtube} onChange={(v)=>save({...data,profile:{...data.profile,youtube:v}})}/></div></div></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="border border-white/8 bg-[#101216] p-5"><div className="font-display text-4xl">{value}</div><div className="mt-2 text-[9px] uppercase tracking-[.18em] text-white/25">{label}</div></div>}
function Check({done,text}:{done:boolean;text:string}){return <div className="flex items-center gap-3"><span className={`grid h-5 w-5 place-items-center border text-[10px] ${done?'border-[#d7ff43] bg-[#d7ff43] text-black':'border-white/15 text-white/20'}`}>{done?'✓':'—'}</span>{text}</div>}

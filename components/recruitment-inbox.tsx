'use client';

import { useEffect, useMemo, useState } from 'react';

type Application = {
  id: string;
  created_at: string;
  full_name: string;
  nickname: string;
  role: string;
  rank: string;
  hero_pool: string;
  experience: string;
  availability: string;
  contact: string;
  social_url: string;
  message: string;
  status: 'NEW' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';
  admin_note: string;
  reviewed_at: string | null;
};

const statuses: Application['status'][] = ['NEW', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'];

function formatDate(value: string) {
  try { return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return value; }
}

export default function RecruitmentInbox() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState<Application['status'] | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Application['status']>('NEW');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selected = applications.find((item) => item.id === selectedId) ?? null;

  const filtered = useMemo(() => applications.filter((item) => {
    const matchesStatus = filter === 'ALL' || item.status === filter;
    const haystack = `${item.full_name} ${item.nickname} ${item.role} ${item.rank}`.toLowerCase();
    return matchesStatus && haystack.includes(search.toLowerCase());
  }), [applications, filter, search]);

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/recruitment', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to load applications.');
      const next = Array.isArray(payload?.applications) ? payload.applications as Application[] : [];
      setApplications(next);
      if (next.length && !next.some((item) => item.id === selectedId)) setSelectedId(next[0].id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load applications.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (selected) { setStatus(selected.status); setNote(selected.admin_note); }
  }, [selected]);

  async function saveReview() {
    if (!selected || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/recruitment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status, adminNote: note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? 'Update failed.');
      setApplications((current) => current.map((item) => item.id === payload.id ? payload as Application : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Update failed.');
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <aside className="border border-white/8 bg-[#101216] p-4">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div><div className="text-[9px] uppercase tracking-[.2em] text-[#ff6b38]">Recruitment</div><h1 className="mt-1 text-xl font-semibold">Applications</h1></div>
          <button type="button" onClick={() => void load()} className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/50 hover:border-white/25 hover:text-white">Refresh</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(['ALL', ...statuses] as const).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={`border px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[.14em] ${filter === value ? 'border-[#d7ff43] bg-[#d7ff43] text-black' : 'border-white/8 text-white/35 hover:text-white'}`}>{value}</button>)}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applicant" className="mt-3 w-full border border-white/10 bg-[#0c0d0f] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#d7ff43]/30" />
        <div className="mt-4 space-y-2">
          {loading && <div className="px-3 py-8 text-center text-xs text-white/30">Loading queue…</div>}
          {!loading && !filtered.length && <div className="border border-white/8 px-3 py-8 text-center text-xs text-white/30">No applications match.</div>}
          {!loading && filtered.map((item) => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full border p-3 text-left ${selected?.id === item.id ? 'border-[#d7ff43]/30 bg-[#d7ff43]/[.04]' : 'border-white/8 hover:border-white/15'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-semibold">{item.nickname} <span className="font-normal text-white/35">/ {item.full_name}</span></div><div className="mt-1 text-[9px] uppercase tracking-[.16em] text-white/25">{item.role} · {item.rank || 'rank not listed'}</div></div><span className="text-[8px] uppercase tracking-[.12em] text-white/35">{item.status}</span></div><div className="mt-3 text-[9px] text-white/20">{formatDate(item.created_at)}</div></button>)}
        </div>
      </aside>

      <section className="border border-white/8 bg-[#101216] p-5 sm:p-7">
        {!selected ? <div className="grid min-h-[420px] place-items-center text-center"><div><div className="font-display text-5xl uppercase">Select an applicant.</div><div className="mt-3 text-sm text-white/30">The review file will appear here.</div></div></div> : <>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-5"><div><div className="text-[9px] uppercase tracking-[.2em] text-[#d7ff43]">Player trial file</div><h2 className="mt-2 font-display text-5xl uppercase leading-none">{selected.nickname}</h2><div className="mt-2 text-sm text-white/40">{selected.full_name} · {selected.role}</div></div><div className="text-right text-[9px] uppercase tracking-[.15em] text-white/25">Submitted<br/><span className="text-white/45">{formatDate(selected.created_at)}</span></div></div>
          {error && <div role="alert" className="mt-5 border border-[#ff6b38]/25 bg-[#ff6b38]/[.04] px-4 py-3 text-xs text-[#ffb197]">{error}</div>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info label="Role" value={selected.role} /><Info label="Current rank" value={selected.rank || '—'} /><Info label="Hero pool" value={selected.hero_pool || '—'} /><Info label="Availability" value={selected.availability || '—'} /><Info label="Contact" value={selected.contact} /><Info label="Social" value={selected.social_url || '—'} />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2"><LongInfo label="Experience" value={selected.experience || 'No competitive experience listed.'} /><LongInfo label="Why trial?" value={selected.message || 'No statement submitted.'} /></div>
          <div className="mt-6 border-t border-white/8 pt-5"><div className="grid gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-end"><label><span className="block text-[9px] uppercase tracking-[.18em] text-white/25">Admin note</span><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1600} className="mt-2 min-h-24 w-full border border-white/10 bg-[#0c0d0f] p-3 text-sm text-white outline-none focus:border-[#d7ff43]/30" placeholder="Trial notes, concerns, follow-up…" /></label><label><span className="block text-[9px] uppercase tracking-[.18em] text-white/25">Status</span><select value={status} onChange={(e) => setStatus(e.target.value as Application['status'])} className="mt-2 w-full border border-white/10 bg-[#0c0d0f] px-3 py-3 text-sm text-white outline-none focus:border-[#d7ff43]/30">{statuses.map((value) => <option key={value}>{value}</option>)}</select></label><button type="button" onClick={() => void saveReview()} disabled={busy} className="bg-[#d7ff43] px-5 py-3 text-xs font-black uppercase tracking-[.16em] text-black disabled:opacity-50">{busy ? 'Saving…' : 'Save review'}</button></div></div>
        </>}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="border border-white/8 bg-[#0c0d0f] p-4"><div className="text-[8px] uppercase tracking-[.18em] text-white/25">{label}</div><div className="mt-2 break-words text-sm text-white/75">{value}</div></div>;
}

function LongInfo({ label, value }: { label: string; value: string }) {
  return <div className="border border-white/8 bg-[#0c0d0f] p-4"><div className="text-[8px] uppercase tracking-[.18em] text-white/25">{label}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/55">{value}</p></div>;
}

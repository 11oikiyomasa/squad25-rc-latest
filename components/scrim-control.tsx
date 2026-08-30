'use client';

import { useEffect, useMemo, useState } from 'react';

type ScrimStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
type ScrimVisibility = 'PUBLIC' | 'PRIVATE';
type Scrim = {
  id: string;
  scheduled_at: string;
  opponent_name: string;
  format: 'BO1' | 'BO2' | 'BO3' | 'BO5';
  event_name: string;
  status: ScrimStatus;
  visibility: ScrimVisibility;
  result_for: number | null;
  result_against: number | null;
  public_note: string;
  recap_url: string | null;
  media_url: string | null;
  admin_note: string;
};
type Form = { date: string; time: string; opponentName: string; eventName: string; format: Scrim['format']; status: ScrimStatus; visibility: ScrimVisibility; resultFor: string; resultAgainst: string; publicNote: string; recapUrl: string; mediaUrl: string; adminNote: string };

const blank: Form = { date: '', time: '', opponentName: '', eventName: 'Scrim Session', format: 'BO3', status: 'SCHEDULED', visibility: 'PUBLIC', resultFor: '', resultAgainst: '', publicNote: '', recapUrl: '', mediaUrl: '', adminNote: '' };

function toForm(scrim: Scrim): Form {
  const date = new Date(scrim.scheduled_at);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}`, opponentName: scrim.opponent_name, eventName: scrim.event_name, format: scrim.format, status: scrim.status, visibility: scrim.visibility, resultFor: scrim.result_for?.toString() ?? '', resultAgainst: scrim.result_against?.toString() ?? '', publicNote: scrim.public_note, recapUrl: scrim.recap_url ?? '', mediaUrl: scrim.media_url ?? '', adminNote: scrim.admin_note };
}

function toPayload(form: Form) {
  if (!form.date || !form.time) throw new Error('Date and time are required.');
  const scheduledAt = new Date(`${form.date}T${form.time}:00+07:00`).toISOString();
  return { scheduledAt, opponentName: form.opponentName, eventName: form.eventName, format: form.format, status: form.status, visibility: form.visibility, resultFor: form.status === 'LIVE' || form.status === 'COMPLETED' ? (form.resultFor === '' ? null : Number(form.resultFor)) : null, resultAgainst: form.status === 'LIVE' || form.status === 'COMPLETED' ? (form.resultAgainst === '' ? null : Number(form.resultAgainst)) : null, publicNote: form.publicNote, recapUrl: form.recapUrl || null, mediaUrl: form.mediaUrl || null, adminNote: form.adminNote };
}

function statusesFor(form: Form, editing: boolean): ScrimStatus[] {
  if (!editing) return ['SCHEDULED'];
  if (form.status === 'SCHEDULED') return ['SCHEDULED', 'LIVE', 'CANCELLED'];
  if (form.status === 'LIVE') return ['LIVE', 'COMPLETED', 'CANCELLED'];
  return [form.status];
}

export default function ScrimControl() {
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/scrims', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to load matches.');
      setScrims(payload.scrims ?? []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to load matches.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const activeCount = useMemo(() => scrims.filter((item) => item.status === 'SCHEDULED' || item.status === 'LIVE').length, [scrims]);
  const availableStatuses = statusesFor(form, Boolean(editingId));

  function update<K extends keyof Form>(key: K, value: Form[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function updateStatus(status: ScrimStatus) { setForm((current) => ({ ...current, status, ...(status === 'SCHEDULED' || status === 'CANCELLED' ? { resultFor: '', resultAgainst: '' } : {}) })); }
  function edit(scrim: Scrim) { setEditingId(scrim.id); setForm(toForm(scrim)); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function reset() { setEditingId(null); setForm(blank); setError(''); }

  async function save() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/scrims', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { id: editingId, ...toPayload(form) } : toPayload(form)) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to save match.');
      reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to save match.'); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (busy || !window.confirm('Delete this match record?')) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/scrims', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to delete match.');
      if (editingId === id) reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to delete match.'); }
    finally { setBusy(false); }
  }

  const input = 'mt-2 w-full border border-white/10 bg-[#101216] px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#d7ff43]/35 disabled:cursor-not-allowed disabled:opacity-45';
  const label = 'block text-[9px] uppercase tracking-[.18em] text-white/30';
  const fmt = (value: string) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
  const scoreEnabled = form.status === 'LIVE' || form.status === 'COMPLETED';

  return (
    <div className="space-y-10">
      <section className="border border-white/10 bg-[#101216] p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-5"><div><div className="text-[10px] uppercase tracking-[.24em] text-[#ff6b38]">{editingId ? 'Lifecycle control' : 'Schedule match'}</div><h2 className="mt-2 text-2xl font-semibold">Match control</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/35">New rooms always start as SCHEDULED. Valid transitions are SCHEDULED → LIVE → COMPLETED, or SCHEDULED/LIVE → CANCELLED. Time is stored and shown in WIB.</p></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{activeCount} active</div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className={label}>Date *</span><input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} className={input} /></label>
          <label><span className={label}>Time / WIB *</span><input type="time" value={form.time} onChange={(event) => update('time', event.target.value)} className={input} /></label>
          <label className="lg:col-span-2"><span className={label}>Opponent *</span><input value={form.opponentName} onChange={(event) => update('opponentName', event.target.value)} className={input} placeholder="Team name" /></label>
          <label className="lg:col-span-2"><span className={label}>Event *</span><input maxLength={120} value={form.eventName} onChange={(event) => update('eventName', event.target.value)} className={input} placeholder="League / scrim block / tournament" /></label>
          <label><span className={label}>Format</span><select value={form.format} onChange={(event) => update('format', event.target.value as Form['format'])} className={input}>{['BO1','BO2','BO3','BO5'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span className={label}>Lifecycle state</span><select value={form.status} onChange={(event) => updateStatus(event.target.value as ScrimStatus)} className={input}>{availableStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span className={label}>Visibility</span><select value={form.visibility} onChange={(event) => update('visibility', event.target.value as ScrimVisibility)} className={input}><option>PUBLIC</option><option>PRIVATE</option></select></label>
          <label><span className={label}>Our score</span><input type="number" min="0" max="99" value={form.resultFor} onChange={(event) => update('resultFor', event.target.value)} className={input} placeholder="—" disabled={!scoreEnabled} /></label>
          <label><span className={label}>Opponent score</span><input type="number" min="0" max="99" value={form.resultAgainst} onChange={(event) => update('resultAgainst', event.target.value)} className={input} placeholder="—" disabled={!scoreEnabled} /></label>
          <label className="sm:col-span-2"><span className={label}>Recap URL</span><input type="url" value={form.recapUrl} onChange={(event) => update('recapUrl', event.target.value)} className={input} placeholder="https://…" /></label>
          <label className="sm:col-span-2"><span className={label}>Media URL</span><input type="url" value={form.mediaUrl} onChange={(event) => update('mediaUrl', event.target.value)} className={input} placeholder="https://…" /></label>
          <label className="sm:col-span-2 lg:col-span-4"><span className={label}>Public note</span><input maxLength={300} value={form.publicNote} onChange={(event) => update('publicNote', event.target.value)} className={input} placeholder="Optional text shown publicly" /></label>
          <label className="sm:col-span-2 lg:col-span-4"><span className={label}>Admin note</span><textarea maxLength={1200} value={form.adminNote} onChange={(event) => update('adminNote', event.target.value)} className={`${input} min-h-28`} placeholder="Internal preparation notes" /></label>
        </div>
        {error && <div role="alert" className="mt-5 border border-[#ff6b38]/25 bg-[#ff6b38]/[.04] px-4 py-3 text-xs text-[#ffb197]">{error}</div>}
        <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="font-mono text-[9px] uppercase tracking-[.15em] text-white/25">Lifecycle state changes are one-way by design.</div><div className="flex gap-3 sm:justify-end"><button type="button" onClick={reset} className="border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white/55">Cancel</button><button type="button" disabled={busy} onClick={() => void save()} className="bg-[#d7ff43] px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] text-black disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Save changes' : 'Schedule match'}</button></div></div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-white/8 pb-5"><div><div className="text-[10px] uppercase tracking-[.24em] text-white/30">Control room</div><h2 className="mt-2 font-display text-5xl uppercase leading-none sm:text-7xl">All rooms.</h2></div><button type="button" onClick={() => void load()} className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.18em] text-white/45">Refresh</button></div>
        {loading ? <div className="mt-5 border border-white/8 p-8 text-sm text-white/35">Loading matches…</div> : scrims.length === 0 ? <div className="mt-5 border border-white/8 p-8 text-sm text-white/35">No matches yet. Schedule the first room above.</div> : <div className="mt-5 space-y-3">{scrims.map((scrim) => <article key={scrim.id} className="border border-white/8 bg-[#101216] p-5"><div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-[.15em]"><span className="border border-white/10 px-2 py-1 text-white/45">{scrim.status}</span><span className="border border-white/10 px-2 py-1 text-white/35">{scrim.format}</span><span className="border border-white/10 px-2 py-1 text-white/35">{scrim.event_name}</span><span className={scrim.visibility === 'PUBLIC' ? 'border border-[#d7ff43]/20 px-2 py-1 text-[#d7ff43]' : 'border border-white/10 px-2 py-1 text-white/30'}>{scrim.visibility}</span></div><div className="mt-3 font-mono text-[9px] uppercase tracking-[.16em] text-white/25">{fmt(scrim.scheduled_at)}</div><div className="mt-2 text-xl font-semibold">SQUAD.25 <span className="text-white/20">vs</span> {scrim.opponent_name}</div></div><div className="text-right">{scrim.result_for !== null && scrim.result_against !== null ? <div className="font-display text-4xl">{scrim.result_for} — {scrim.result_against}</div> : <div className="font-mono text-[9px] uppercase tracking-[.16em] text-white/25">No score</div>}</div><div className="flex gap-2 lg:justify-end"><button type="button" onClick={() => edit(scrim)} className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/55">Edit</button><button type="button" onClick={() => void remove(scrim.id)} className="border border-[#ff6b38]/20 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-[#ff8d68]">Delete</button></div></div>{(scrim.recap_url || scrim.media_url || scrim.public_note || scrim.admin_note) && <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/8 pt-4 text-xs text-white/35"><span className="mr-auto">{scrim.public_note || scrim.admin_note || 'No note.'}</span>{scrim.recap_url && <a href={scrim.recap_url} target="_blank" rel="noreferrer" className="text-white/55 hover:text-white">Recap ↗</a>}{scrim.media_url && <a href={scrim.media_url} target="_blank" rel="noreferrer" className="text-white/55 hover:text-white">Media ↗</a>}</div>}</article>)}</div>}
      </section>
    </div>
  );
}

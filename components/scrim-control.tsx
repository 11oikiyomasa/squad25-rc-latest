'use client';

import { useEffect, useMemo, useState } from 'react';

type ScrimStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
type ScrimVisibility = 'PUBLIC' | 'PRIVATE';
type Scrim = {
  id: string;
  scheduled_at: string;
  opponent_name: string;
  format: 'BO1' | 'BO2' | 'BO3' | 'BO5';
  status: ScrimStatus;
  visibility: ScrimVisibility;
  result_for: number | null;
  result_against: number | null;
  public_note: string;
  admin_note: string;
};

type Form = { date: string; time: string; opponentName: string; format: Scrim['format']; status: ScrimStatus; visibility: ScrimVisibility; resultFor: string; resultAgainst: string; publicNote: string; adminNote: string };

const blank: Form = { date: '', time: '', opponentName: '', format: 'BO3', status: 'SCHEDULED', visibility: 'PUBLIC', resultFor: '', resultAgainst: '', publicNote: '', adminNote: '' };

function toForm(scrim: Scrim): Form {
  const date = new Date(scrim.scheduled_at);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}`, opponentName: scrim.opponent_name, format: scrim.format, status: scrim.status, visibility: scrim.visibility, resultFor: scrim.result_for?.toString() ?? '', resultAgainst: scrim.result_against?.toString() ?? '', publicNote: scrim.public_note, adminNote: scrim.admin_note };
}

function toPayload(form: Form) {
  if (!form.date || !form.time) throw new Error('Date and time are required.');
  const scheduledAt = new Date(`${form.date}T${form.time}:00+07:00`).toISOString();
  return { scheduledAt, opponentName: form.opponentName, format: form.format, status: form.status, visibility: form.visibility, resultFor: form.resultFor === '' ? null : Number(form.resultFor), resultAgainst: form.resultAgainst === '' ? null : Number(form.resultAgainst), publicNote: form.publicNote, adminNote: form.adminNote };
}

export default function ScrimControl() {
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/scrims', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to load scrims.');
      setScrims(payload.scrims ?? []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to load scrims.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const upcomingCount = useMemo(() => scrims.filter((item) => item.status === 'SCHEDULED' || item.status === 'LIVE').length, [scrims]);

  function update<K extends keyof Form>(key: K, value: Form[K]) { setForm((current) => ({ ...current, [key]: value })); }

  function edit(scrim: Scrim) { setEditingId(scrim.id); setForm(toForm(scrim)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function reset() { setEditingId(null); setForm(blank); setError(''); }

  async function save() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/scrims', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { id: editingId, ...toPayload(form) } : toPayload(form)) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to save scrim.');
      reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to save scrim.'); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (busy || !window.confirm('Delete this scrim?')) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/scrims', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to delete scrim.');
      if (editingId === id) reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to delete scrim.'); }
    finally { setBusy(false); }
  }

  const input = 'mt-2 w-full border border-white/10 bg-[#101216] px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#d7ff43]/35';
  const label = 'block text-[9px] uppercase tracking-[.18em] text-white/30';
  const fmt = (value: string) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));

  return (
    <div className="space-y-10">
      <section className="border border-white/10 bg-[#101216] p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-5"><div><div className="text-[10px] uppercase tracking-[.24em] text-[#ff6b38]">{editingId ? 'Edit scrim' : 'New scrim'}</div><h2 className="mt-2 text-2xl font-semibold">Scrim control</h2><p className="mt-2 text-sm leading-6 text-white/35">Time is stored as WIB. Public/private only controls what appears on the public schedule.</p></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{upcomingCount} upcoming</div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className={label}>Date *</span><input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} className={input} /></label>
          <label><span className={label}>Time / WIB *</span><input type="time" value={form.time} onChange={(event) => update('time', event.target.value)} className={input} /></label>
          <label className="lg:col-span-2"><span className={label}>Opponent *</span><input value={form.opponentName} onChange={(event) => update('opponentName', event.target.value)} className={input} placeholder="TBD / team name" /></label>
          <label><span className={label}>Format</span><select value={form.format} onChange={(event) => update('format', event.target.value as Form['format'])} className={input}>{['BO1','BO2','BO3','BO5'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span className={label}>Status</span><select value={form.status} onChange={(event) => update('status', event.target.value as ScrimStatus)} className={input}>{['SCHEDULED','LIVE','COMPLETED','CANCELLED'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span className={label}>Visibility</span><select value={form.visibility} onChange={(event) => update('visibility', event.target.value as ScrimVisibility)} className={input}><option>PUBLIC</option><option>PRIVATE</option></select></label>
          <label><span className={label}>Our score</span><input type="number" min="0" max="99" value={form.resultFor} onChange={(event) => update('resultFor', event.target.value)} className={input} placeholder="—" /></label>
          <label><span className={label}>Opponent score</span><input type="number" min="0" max="99" value={form.resultAgainst} onChange={(event) => update('resultAgainst', event.target.value)} className={input} placeholder="—" /></label>
          <label className="sm:col-span-2 lg:col-span-4"><span className={label}>Public note</span><input maxLength={300} value={form.publicNote} onChange={(event) => update('publicNote', event.target.value)} className={input} placeholder="Optional note shown on the public schedule" /></label>
          <label className="sm:col-span-2 lg:col-span-4"><span className={label}>Admin note</span><textarea maxLength={1200} value={form.adminNote} onChange={(event) => update('adminNote', event.target.value)} className={`${input} min-h-28`} placeholder="Internal prep / opponent notes" /></label>
        </div>
        {error && <div role="alert" className="mt-5 border border-[#ff6b38]/25 bg-[#ff6b38]/[.04] px-4 py-3 text-xs text-[#ffb197]">{error}</div>}
        <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={reset} className="border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white/55">Cancel</button><button type="button" disabled={busy} onClick={() => void save()} className="bg-[#d7ff43] px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] text-black disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Update scrim' : 'Publish scrim'}</button></div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-white/8 pb-5"><div><div className="text-[10px] uppercase tracking-[.24em] text-white/30">Control room</div><h2 className="mt-2 font-display text-5xl uppercase leading-none sm:text-7xl">All rooms.</h2></div><button type="button" onClick={() => void load()} className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.18em] text-white/45">Refresh</button></div>
        {loading ? <div className="mt-5 border border-white/8 p-8 text-sm text-white/35">Loading scrims…</div> : scrims.length === 0 ? <div className="mt-5 border border-white/8 p-8 text-sm text-white/35">No scrims yet. Add the first room above.</div> : <div className="mt-5 space-y-3">{scrims.map((scrim) => <article key={scrim.id} className="border border-white/8 bg-[#101216] p-5"><div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{fmt(scrim.scheduled_at)} / {scrim.format}</div><div className="mt-2 text-xl font-semibold">SQUAD.25 <span className="text-white/20">vs</span> {scrim.opponent_name}</div></div><div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-[.15em]"><span className="border border-white/10 px-2 py-1 text-white/45">{scrim.status}</span><span className={scrim.visibility === 'PUBLIC' ? 'border border-[#d7ff43]/20 px-2 py-1 text-[#d7ff43]' : 'border border-white/10 px-2 py-1 text-white/30'}>{scrim.visibility}</span>{scrim.result_for !== null && <span className="border border-white/10 px-2 py-1 text-white/60">{scrim.result_for} — {scrim.result_against}</span>}</div><div className="flex gap-2 lg:justify-end"><button type="button" onClick={() => edit(scrim)} className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/55">Edit</button><button type="button" onClick={() => void remove(scrim.id)} className="border border-[#ff6b38]/20 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-[#ff8d68]">Delete</button></div></div>{scrim.admin_note && <div className="mt-4 border-t border-white/8 pt-4 text-xs leading-6 text-white/35">Internal: {scrim.admin_note}</div>}</article>)}</div>}
      </section>
    </div>
  );
}

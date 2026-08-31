'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Tables } from '@/types/database';

type Status = 'NEW' | 'REVIEWING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
type Application = Pick<Tables<'recruitment_applications'>, 'id' | 'created_at' | 'updated_at' | 'full_name' | 'nickname' | 'email' | 'phone' | 'role' | 'portfolio_link' | 'status' | 'resume_original_name' | 'resume_size' | 'job_id' | 'cover_letter' | 'resume_path'> & {
  recruitment_jobs: { title: string; slug: string } | null;
};
type Note = Pick<Tables<'recruitment_application_notes'>, 'id' | 'admin_name' | 'note' | 'created_at'>;
type Detail = { application: Application; notes: Note[]; resumeUrl: string | null };
type Opening = Pick<Tables<'recruitment_jobs'>, 'id' | 'title' | 'slug' | 'cycle_id' | 'is_active' | 'closes_at'>;
type Cycle = Pick<Tables<'recruitment_cycles'>, 'id' | 'name' | 'status' | 'starts_at' | 'closes_at' | 'created_at' | 'updated_at'>;

const statuses: Status[] = ['NEW', 'REVIEWING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'];
const transitions: Record<Status, Status[]> = {
  NEW: ['NEW', 'REVIEWING', 'REJECTED'],
  REVIEWING: ['REVIEWING', 'SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['SHORTLISTED', 'ACCEPTED', 'REJECTED'],
  ACCEPTED: ['ACCEPTED'],
  REJECTED: ['REJECTED'],
};
const formatDate = (v: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v));

export default function RecruitmentInbox() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL');
  const [openingFilter, setOpeningFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('NEW');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cycleBusy, setCycleBusy] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (filter !== 'ALL') qs.set('status', filter);
      if (openingFilter) qs.set('opening', openingFilter);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      if (search.trim()) qs.set('q', search.trim());
      const r = await fetch(`/api/admin/recruitment?${qs}`, { cache: 'no-store' });
      const p = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(p?.error ?? 'Failed to load recruitment.');
      setApplications(p.applications ?? []);
      setTotal(p.total ?? 0);
      setOpenings(p.openings ?? []);
      setCycles(p.cycles ?? []);
      if (p.applications?.length) await open(p.applications[0].id);
      else setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recruitment.');
    } finally {
      setLoading(false);
    }
  }

  async function open(id: string) {
    const r = await fetch(`/api/admin/recruitment/${id}`, { cache: 'no-store' });
    const p = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(p?.error ?? 'Failed to load application.');
    setSelected(p);
    setStatus(p.application.status as Status);
    setNote('');
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [page, filter, openingFilter, from, to, search]);

  async function save() {
    if (!selected || busy) return;
    if (status !== selected.application.status && (status === 'ACCEPTED' || status === 'REJECTED')) {
      const action = status === 'ACCEPTED' ? 'accept' : 'reject';
      if (!window.confirm(`Confirm ${action} this application? This is a terminal status.`)) return;
    }
    if (!transitions[selected.application.status as Status]?.includes(status)) {
      setError('That status transition is not allowed.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/recruitment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'application', id: selected.application.id, status, expectedStatus: selected.application.status, note }),
      });
      const p = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(p?.error ?? 'Update failed.');
      await open(selected.application.id);
      setApplications((xs) => xs.map((x) => x.id === p.id ? { ...x, status: p.status } : x));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }

  async function setCycleStatus(cycle: Cycle, nextStatus: 'OPEN' | 'CLOSED') {
    if (cycle.status === nextStatus || cycleBusy) return;
    if (nextStatus === 'CLOSED' && !window.confirm(`Close recruitment cycle “${cycle.name}”?`)) return;
    setCycleBusy(cycle.id);
    setError('');
    try {
      const r = await fetch('/api/admin/recruitment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cycle', id: cycle.id, status: nextStatus }),
      });
      const p = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(p?.error ?? 'Unable to update recruitment cycle.');
      setCycles((items) => items.map((item) => item.id === cycle.id ? p.cycle : item));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update recruitment cycle.');
    } finally {
      setCycleBusy('');
    }
  }

  const currentTransitions = useMemo(() => selected ? transitions[selected.application.status as Status] ?? [selected.application.status as Status] : [], [selected]);

  return (
    <div className="space-y-5">
      <section className="border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5" aria-labelledby="recruitment-cycles-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="ui-eyebrow">Recruitment cycles</div>
            <h2 id="recruitment-cycles-title" className="mt-1 font-display text-3xl uppercase">Availability</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">Admin-only · server-authorized</span>
        </div>
        {cycles.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{cycle.name}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">{cycle.starts_at ? `Starts ${formatDate(cycle.starts_at)}` : 'Start not set'}{cycle.closes_at ? ` · Closes ${formatDate(cycle.closes_at)}` : ''}</div>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[.16em]" aria-label={`Cycle status ${cycle.status}`}>{cycle.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void setCycleStatus(cycle, 'OPEN')} disabled={cycle.status === 'OPEN' || cycleBusy === cycle.id} className="ui-button ui-button-sm ui-button-primary disabled:opacity-100">Open cycle</button>
                  <button type="button" onClick={() => void setCycleStatus(cycle, 'CLOSED')} disabled={cycle.status === 'CLOSED' || cycleBusy === cycle.id} className="ui-button ui-button-sm ui-button-secondary">Close cycle</button>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="ui-empty mt-4 min-h-0 py-8"><div><div className="ui-empty-mark mx-auto" /><h3 className="ui-empty-title">No cycles configured</h3><p className="ui-empty-description">There is no Recruitment Cycle record available to control.</p></div></div>}
      </section>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <aside className="border border-[var(--border)] bg-[var(--surface)] p-4" aria-label="Application Inbox">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div><div className="ui-eyebrow">Recruitment</div><h1 className="mt-1 text-xl font-semibold">Applications</h1></div>
            <button type="button" onClick={() => void load()} className="ui-button ui-button-sm ui-button-ghost">Refresh</button>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Filter by status">
            {(['ALL', ...statuses] as const).map((v) => <button type="button" key={v} onClick={() => { setFilter(v); setPage(1); }} aria-pressed={filter === v} className={`ui-button ui-button-sm ui-filter-button ${filter === v ? 'ui-button-primary' : 'ui-button-ghost'}`}>{v}</button>)}
          </div>

          <label className="mt-3 block text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]" htmlFor="admin-application-search">Search</label>
          <input id="admin-application-search" value={search} onChange={(e) => { setSearch(e.target.value.slice(0, 100)); setPage(1); }} placeholder="Name, email, nickname" className="ui-field mt-2 w-full" />

          <label className="mt-3 block text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]" htmlFor="admin-opening-filter">Recruitment opening</label>
          <select id="admin-opening-filter" value={openingFilter} onChange={(e) => { setOpeningFilter(e.target.value); setPage(1); }} className="ui-field mt-2 w-full">
            <option value="">All openings</option>
            {openings.map((opening) => <option key={opening.id} value={opening.id}>{opening.title}</option>)}
          </select>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]" htmlFor="admin-from">From<input id="admin-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="ui-field mt-2 w-full" /></label>
            <label className="block text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]" htmlFor="admin-to">To<input id="admin-to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="ui-field mt-2 w-full" /></label>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
            <span className="ui-eyebrow">Newest first</span>
            <span className="font-mono text-[9px] text-[var(--text-muted)]">{total} total</span>
          </div>

          <div className="mt-4 space-y-2">
            {loading && <div role="status" className="px-3 py-8 text-center text-xs text-[var(--text-muted)]">Loading queue…</div>}
            {!loading && !applications.length && <div className="ui-empty min-h-0 py-8"><div><div className="ui-empty-mark mx-auto" /><h2 className="ui-empty-title text-3xl">No applications</h2><p className="ui-empty-description">No applications match the current filters.</p></div></div>}
            {applications.map((a) => <button type="button" key={a.id} onClick={() => void open(a.id)} aria-pressed={selected?.application.id === a.id} className={`w-full border p-3 text-left focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 ${selected?.application.id === a.id ? 'border-[var(--brand)] bg-[var(--brand)]/[.04]' : 'border-[var(--border)]'}`}><div className="flex justify-between gap-3"><span className="truncate text-sm font-semibold">{a.nickname} <span className="font-normal text-[var(--text-muted)]">/ {a.full_name}</span></span><span className="font-mono text-[8px] text-[var(--text-muted)]">{a.status}</span></div><div className="mt-2 text-[9px] text-[var(--text-muted)]">{a.email} · {formatDate(a.created_at)}</div></button>)}
          </div>

          <div className="mt-4 flex items-center justify-between text-[9px] text-[var(--text-muted)]">
            <button type="button" className="ui-button ui-button-sm ui-button-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <span aria-label={`Page ${page} of ${Math.max(1, Math.ceil(total / 20))}`}>{page} / {Math.max(1, Math.ceil(total / 20))}</span>
            <button type="button" className="ui-button ui-button-sm ui-button-ghost" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        </aside>

        <section className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7" aria-label="Application detail">
          {error && <div role="alert" className="mb-5 border border-[var(--danger)]/40 bg-[var(--state-error-bg)] px-4 py-3 text-xs text-[var(--state-error-fg)]">{error}</div>}
          {!selected ? <div className="ui-empty min-h-[420px]"><div><div className="ui-empty-mark mx-auto" /><h2 className="ui-empty-title">Select an applicant.</h2><p className="ui-empty-description">Choose an Application from the Inbox to review its immutable submission data.</p></div></div> : <>
            <div className="border-b border-[var(--border)] pb-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="ui-eyebrow text-[var(--brand)]">{selected.application.recruitment_jobs?.title ?? 'Application'}</div><h2 className="mt-2 font-display text-5xl uppercase">{selected.application.nickname}</h2><div className="mt-2 text-sm text-[var(--text-muted)]">{selected.application.full_name} · {selected.application.email} · {selected.application.phone}</div></div><Link href={`/admin/recruitment/${selected.application.id}`} className="ui-button ui-button-sm ui-button-secondary">Open full detail ↗</Link></div></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><Info label="Role" value={selected.application.role}/><Info label="Submitted" value={formatDate(selected.application.created_at)}/><Info label="Portfolio" value={selected.application.portfolio_link || '—'}/><Info label="Resume" value={selected.application.resume_original_name || '—'}/></div>
            <div className="mt-6 border border-[var(--border)] bg-[var(--background)] p-4"><div className="ui-eyebrow">Cover letter</div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-muted)]">{selected.application.cover_letter || '—'}</p></div>
            {selected.resumeUrl && <a href={selected.resumeUrl} target="_blank" rel="noreferrer" className="ui-button ui-button-secondary mt-4">Open private resume ↗</a>}
            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_220px_auto]">
                <label className="block text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]" htmlFor="application-note">Append internal note<textarea id="application-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 2000))} maxLength={2000} className="ui-field mt-2 min-h-24 w-full py-3" placeholder="Append internal note…" /></label>
                <label className="block text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]" htmlFor="application-status">Status<select id="application-status" value={status} onChange={(e) => setStatus(e.target.value as Status)} className="ui-field mt-2 w-full">{currentTransitions.map((s) => <option key={s}>{s}</option>)}</select></label>
                <button type="button" onClick={() => void save()} disabled={busy} className="ui-button ui-button-primary self-end">{busy ? 'Saving…' : 'Save review'}</button>
              </div>
            </div>
            <div className="mt-6 border-t border-[var(--border)] pt-5"><div className="ui-eyebrow">Internal notes</div><div className="mt-3 space-y-2">{selected.notes.map((n) => <div key={n.id} className="border border-[var(--border)] bg-[var(--background)] p-3"><div className="text-[9px] text-[var(--text-muted)]">{n.admin_name} · {formatDate(n.created_at)}</div><p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-muted)]">{n.note}</p></div>)}</div></div>
          </>}
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="border border-[var(--border)] bg-[var(--background)] p-4"><div className="text-[8px] uppercase tracking-[.18em] text-[var(--text-muted)]">{label}</div><div className="mt-2 break-words text-sm text-[var(--text-primary)]">{value}</div></div>;
}

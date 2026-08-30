'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

type FormState = {
  fullName: string;
  nickname: string;
  role: string;
  rank: string;
  heroPool: string;
  experience: string;
  availability: string;
  contact: string;
  socialUrl: string;
  message: string;
  website: string;
};

const initial: FormState = {
  fullName: '', nickname: '', role: 'FLEX', rank: '', heroPool: '', experience: '', availability: '', contact: '', socialUrl: '', message: '', website: '',
};

const roles = ['FLEX', 'EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM'];

export default function RecruitmentForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setDone(false);
    setError('');
    try {
      const response = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 429) {
        const retryAfter = Number(payload?.retryAfter) || Number(response.headers.get('Retry-After')) || 900;
        const retryMinutes = Math.max(1, Math.ceil(retryAfter / 60));
        throw new Error(`Terlalu banyak pengiriman. Coba lagi sekitar ${retryMinutes} menit.`);
      }
      if (!response.ok) throw new Error(payload?.error ?? 'Application gagal dikirim.');
      setForm(initial);
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Application gagal dikirim.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="border border-[#d7ff43]/25 bg-[#d7ff43]/[.04] p-6 sm:p-8">
        <div className="text-[10px] uppercase tracking-[.24em] text-[#d7ff43]">Application received</div>
        <h2 className="mt-3 font-display text-5xl uppercase leading-none sm:text-7xl">Masuk queue.</h2>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/50">Data lo sudah masuk ke review queue. Kalau profilnya cocok, tim akan menghubungi lewat kontak yang lo kasih.</p>
        <Link href="/" className="mt-7 inline-flex border border-white/12 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white/70 hover:border-white/25 hover:text-white">Back to squad</Link>
      </div>
    );
  }

  const fieldClass = 'mt-2 w-full border border-white/10 bg-[#101216] px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#d7ff43]/35';
  const labelClass = 'block text-[9px] uppercase tracking-[.18em] text-white/30';

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className={labelClass}>Full name *</span><input required maxLength={80} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className={fieldClass} placeholder="Nama lengkap" /></label>
        <label><span className={labelClass}>Nickname *</span><input required maxLength={30} value={form.nickname} onChange={(e) => update('nickname', e.target.value)} className={fieldClass} placeholder="IGN / nickname" /></label>
        <label><span className={labelClass}>Preferred role *</span><select required value={form.role} onChange={(e) => update('role', e.target.value)} className={fieldClass}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
        <label><span className={labelClass}>Current rank</span><input maxLength={60} value={form.rank} onChange={(e) => update('rank', e.target.value)} className={fieldClass} placeholder="Mythical Glory, etc." /></label>
        <label className="sm:col-span-2"><span className={labelClass}>Hero pool</span><input maxLength={240} value={form.heroPool} onChange={(e) => update('heroPool', e.target.value)} className={fieldClass} placeholder="Contoh: Yu Zhong, Terizla, Khaleed" /></label>
        <label className="sm:col-span-2"><span className={labelClass}>Competitive / team experience</span><textarea maxLength={1200} value={form.experience} onChange={(e) => update('experience', e.target.value)} className={`${fieldClass} min-h-28`} placeholder="Turnamen, scrim, rank, pengalaman team, role sebelumnya…" /></label>
        <label><span className={labelClass}>Availability</span><input maxLength={300} value={form.availability} onChange={(e) => update('availability', e.target.value)} className={fieldClass} placeholder="Contoh: Weekday 20:00–24:00 WIB" /></label>
        <label><span className={labelClass}>Best contact *</span><input required maxLength={120} value={form.contact} onChange={(e) => update('contact', e.target.value)} className={fieldClass} placeholder="WhatsApp / Discord" /></label>
        <label className="sm:col-span-2"><span className={labelClass}>Social / profile link</span><input maxLength={300} value={form.socialUrl} onChange={(e) => update('socialUrl', e.target.value)} className={fieldClass} placeholder="https://..." /></label>
        <label className="sm:col-span-2"><span className={labelClass}>Why should we trial you?</span><textarea maxLength={1600} value={form.message} onChange={(e) => update('message', e.target.value)} className={`${fieldClass} min-h-36`} placeholder="Kasih alasan yang spesifik. Jangan template." /></label>
        <label className="hidden" aria-hidden="true"><span>Website</span><input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} /></label>
      </div>

      {error && <div role="alert" className="border border-[#ff6b38]/25 bg-[#ff6b38]/[.04] px-4 py-3 text-xs text-[#ffb197]">{error}</div>}
      <div className="flex flex-col gap-4 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-[11px] leading-5 text-white/30">Recruitment data hanya dipakai buat proses seleksi tim. Jangan kirim password, OTP, atau data sensitif lain.</p>
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-3 bg-[#d7ff43] px-5 py-3 text-xs font-black uppercase tracking-[.18em] text-black disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Sending…' : 'Submit application'} <span aria-hidden>↗</span></button>
      </div>
    </form>
  );
}

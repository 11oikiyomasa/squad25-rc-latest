'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const roles = ['FLEX', 'EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM'];

declare global { interface Window { turnstile?: { render: (el: HTMLElement, options: Record<string, unknown>) => string; reset: (id?: string) => void } } }

type Props = { jobId: string; jobTitle: string };

export default function RecruitmentForm({ jobId, jobTitle }: Props) {
  const router = useRouter();
  const captchaRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !captchaRef.current) return;
    const render = () => {
      if (!window.turnstile || !captchaRef.current || captchaId) return;
      const id = window.turnstile.render(captchaRef.current, { sitekey: siteKey, callback: (value: unknown) => setToken(typeof value === 'string' ? value : ''), 'expired-callback': () => setToken(''), 'error-callback': () => setToken('') });
      setCaptchaId(id);
    };
    if (window.turnstile) render();
    else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.defer = true; script.onload = render;
      document.head.appendChild(script);
      return () => { script.onload = null; };
    }
  }, [captchaId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    form.set('jobId', jobId); form.set('turnstileToken', token);
    try {
      const response = await fetch('/api/recruitment', { method: 'POST', body: form, cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Application gagal dikirim.');
      router.replace('/recruitment/success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Application gagal dikirim.');
      if (captchaId && window.turnstile) window.turnstile.reset(captchaId);
      setToken('');
    } finally { setBusy(false); }
  }

  const field = 'mt-2 w-full border border-white/10 bg-[#101216] px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#d7ff43]/35';
  const label = 'block text-[9px] uppercase tracking-[.18em] text-white/30';
  return <form onSubmit={submit} encType="multipart/form-data" className="space-y-6">
    <input type="hidden" name="jobTitle" value={jobTitle} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className={label}>Full name *</span><input required name="fullName" minLength={2} maxLength={80} className={field} autoComplete="name" /></label>
      <label><span className={label}>Nickname *</span><input required name="nickname" maxLength={30} className={field} autoComplete="nickname" /></label>
      <label><span className={label}>Email *</span><input required name="email" type="email" maxLength={254} className={field} autoComplete="email" /></label>
      <label><span className={label}>Phone *</span><input required name="phone" maxLength={40} className={field} autoComplete="tel" /></label>
      <label><span className={label}>Preferred role *</span><select required name="role" defaultValue="FLEX" className={field}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
      <label><span className={label}>Portfolio / profile URL</span><input name="portfolioLink" type="url" maxLength={500} className={field} placeholder="https://..." /></label>
      <label className="sm:col-span-2"><span className={label}>Resume / CV — PDF only, max 5 MB *</span><input required name="resume" type="file" accept="application/pdf,.pdf" className={`${field} file:mr-3 file:border-0 file:bg-[#d7ff43] file:px-3 file:py-2 file:text-xs file:font-bold file:text-black`} /></label>
      <label className="sm:col-span-2"><span className={label}>Cover letter *</span><textarea required name="coverLetter" minLength={20} maxLength={5000} className={`${field} min-h-40`} placeholder="Kenapa posisi ini cocok buat lo?" /></label>
      <label className="hidden" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
    <div className="border-t border-white/8 pt-5"><div ref={captchaRef} aria-label="Anti-spam verification" />{!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <p className="text-[10px] text-white/25">Anti-spam verification is not configured.</p>}</div>
    {error && <div role="alert" className="border border-[#ff6b38]/25 bg-[#ff6b38]/[.04] px-4 py-3 text-xs text-[#ffb197]">{error}</div>}
    <div className="flex flex-col gap-4 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-[11px] leading-5 text-white/30">Data dipakai untuk proses seleksi. Jangan kirim password, OTP, atau data sensitif lain.</p><button type="submit" disabled={busy || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !token)} className="inline-flex items-center justify-center gap-3 bg-[#d7ff43] px-5 py-3 text-xs font-black uppercase tracking-[.18em] text-black disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Sending…' : 'Submit application'} ↗</button></div>
  </form>;
}

'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const roles = ['FLEX', 'EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM'] as const;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

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
      const id = window.turnstile.render(captchaRef.current, {
        sitekey: siteKey,
        callback: (value: unknown) => setToken(typeof value === 'string' ? value : ''),
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
      setCaptchaId(id);
    };
    if (window.turnstile) render();
    else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
      return () => { script.onload = null; };
    }
  }, [captchaId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('jobId', jobId);
    form.set('turnstileToken', token);
    try {
      const response = await fetch('/api/recruitment', { method: 'POST', body: form, cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Application gagal dikirim.');
      router.replace('/recruitment/success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Application gagal dikirim.');
      if (captchaId && window.turnstile) window.turnstile.reset(captchaId);
      setToken('');
    } finally {
      setBusy(false);
    }
  }

  const label = 'block text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]';

  return (
    <form onSubmit={submit} encType="multipart/form-data" className="space-y-6" aria-describedby={error ? 'recruitment-form-error' : undefined}>
      <input type="hidden" name="jobTitle" value={jobTitle} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor="application-full-name"><span className={label}>Full name <span aria-hidden="true">*</span></span><input id="application-full-name" required aria-required="true" name="fullName" minLength={2} maxLength={80} className="ui-field mt-2 w-full" autoComplete="name" /></label>
        <label htmlFor="application-nickname"><span className={label}>Nickname <span aria-hidden="true">*</span></span><input id="application-nickname" required aria-required="true" name="nickname" maxLength={30} className="ui-field mt-2 w-full" autoComplete="nickname" /></label>
        <label htmlFor="application-email"><span className={label}>Email <span aria-hidden="true">*</span></span><input id="application-email" required aria-required="true" name="email" type="email" maxLength={254} className="ui-field mt-2 w-full" autoComplete="email" /></label>
        <label htmlFor="application-phone"><span className={label}>Phone <span aria-hidden="true">*</span></span><input id="application-phone" required aria-required="true" name="phone" maxLength={40} className="ui-field mt-2 w-full" autoComplete="tel" /></label>
        <label htmlFor="application-role"><span className={label}>Preferred role <span aria-hidden="true">*</span></span><select id="application-role" required aria-required="true" name="role" defaultValue="FLEX" className="ui-field mt-2 w-full">{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
        <label htmlFor="application-portfolio"><span className={label}>Portfolio / profile URL</span><input id="application-portfolio" name="portfolioLink" type="url" maxLength={500} className="ui-field mt-2 w-full" placeholder="https://..." /></label>
        <label className="sm:col-span-2" htmlFor="application-resume"><span className={label}>Resume / CV — PDF only, max 5 MB <span aria-hidden="true">*</span></span><input id="application-resume" required aria-required="true" name="resume" type="file" accept="application/pdf,.pdf" className="ui-field mt-2 w-full file:mr-3 file:border-0 file:bg-[var(--brand)] file:px-3 file:py-2 file:text-xs file:font-bold file:text-black" /></label>
        <label className="sm:col-span-2" htmlFor="application-cover-letter"><span className={label}>Cover letter <span aria-hidden="true">*</span></span><textarea id="application-cover-letter" required aria-required="true" name="coverLetter" minLength={20} maxLength={5000} className="ui-field mt-2 min-h-40 w-full py-3" placeholder="Kenapa posisi ini cocok buat lo?" /></label>
        <label className="hidden" aria-hidden="true" htmlFor="application-website"><span>Website</span><input id="application-website" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="border-t border-white/8 pt-5">
        <div ref={captchaRef} aria-label="Anti-spam verification" />
        {!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <p className="text-[10px] text-[var(--text-muted)]">Anti-spam verification is not configured.</p>}
      </div>

      {error && <div id="recruitment-form-error" role="alert" aria-live="assertive" className="border border-[var(--danger)]/40 bg-[var(--state-error-bg)] px-4 py-3 text-xs text-[var(--state-error-fg)]">{error}</div>}

      <div className="flex flex-col gap-4 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-[11px] leading-5 text-[var(--text-muted)]">Data dipakai untuk proses seleksi. Jangan kirim password, OTP, atau data sensitif lain.</p>
        <button type="submit" disabled={busy || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !token)} className="ui-button ui-button-primary" aria-label={busy ? 'Sending application' : 'Submit application'}>{busy ? 'Sending…' : 'Submit application'} ↗</button>
      </div>
    </form>
  );
}

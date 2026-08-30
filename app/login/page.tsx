import Link from 'next/link';
import { login } from './actions';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { AppShell, Button, Card } from '@/components/ui';

type LoginPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const messages: Record<string, string> = {
  not_configured: 'Supabase belum dikonfigurasi di environment ini.',
  missing_fields: 'Email dan password wajib diisi.',
  invalid_credentials: 'Email atau password salah.',
  invalid_callback: 'Link autentikasi tidak valid.',
  auth_failed: 'Sesi autentikasi gagal dibuat.',
  auth_unavailable: 'Layanan autentikasi belum tersedia.',
  not_authenticated: 'Silakan login terlebih dahulu.',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorKey = typeof params.error === 'string' ? params.error : '';
  const next = typeof params.next === 'string' && params.next.startsWith('/') && !params.next.startsWith('//') ? params.next : '/admin';
  const configured = isSupabaseConfigured();

  return (
    <AppShell className="grid place-items-center px-[var(--page-gutter)] py-8 sm:py-12">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <Link href="/" className="text-[10px] uppercase tracking-[.22em] text-white/30 transition-colors hover:text-white">SQUAD.25 / Public site</Link>
        <h1 className="mt-8 font-display text-6xl uppercase leading-[.8]">Studio<br/><span className="text-[var(--acid)]">Access.</span></h1>
        <p className="mt-6 text-sm leading-6 text-white/45">Private publishing area for roster, montage, archive, and squad metadata.</p>

        {!configured ? (
          <div className="mt-8 border border-[color-mix(in_srgb,var(--ember)_25%,transparent)] bg-[color-mix(in_srgb,var(--ember)_5%,transparent)] p-4 text-sm leading-6 text-white/55">
            Supabase belum aktif. Isi konfigurasi public Supabase, lalu ulangi login.
          </div>
        ) : (
          <form action={login} className="mt-8 space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block"><span className="ui-eyebrow text-white/25">Email</span><input name="email" type="email" autoComplete="email" required className="ui-field mt-2 w-full" /></label>
            <label className="block"><span className="ui-eyebrow text-white/25">Password</span><input name="password" type="password" autoComplete="current-password" required className="ui-field mt-2 w-full" /></label>
            <Button type="submit" className="w-full">Enter Studio</Button>
          </form>
        )}

        {errorKey && <div role="alert" className="mt-4 border border-[var(--line)] px-4 py-3 text-xs text-white/55">{messages[errorKey] ?? 'Terjadi kesalahan.'}</div>}
      </Card>
    </AppShell>
  );
}

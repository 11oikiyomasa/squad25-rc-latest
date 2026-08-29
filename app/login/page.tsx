import Link from 'next/link';
import { login } from './actions';
import { isSupabaseConfigured } from '@/lib/supabase/server';

type LoginPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const messages: Record<string, string> = {
  not_configured: 'Supabase belum dikonfigurasi di environment ini.',
  missing_fields: 'Email dan password wajib diisi.',
  invalid_credentials: 'Email atau password salah.',
  invalid_callback: 'Link autentikasi tidak valid.',
  auth_failed: 'Sesi autentikasi gagal dibuat.',
  auth_unavailable: 'Layanan autentikasi belum tersedia.',
  not_authenticated: 'Silakan login terlebih dahulu.',
  not_admin: 'Akun ini belum memiliki akses admin.',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorKey = typeof params.error === 'string' ? params.error : '';
  const next = typeof params.next === 'string' && params.next.startsWith('/') ? params.next : '/admin';
  const configured = isSupabaseConfigured();

  return (
    <main className="grid min-h-screen place-items-center bg-[#0c0d0f] px-5 text-[#f4f0e7]">
      <div className="w-full max-w-md border border-white/10 bg-[#101216] p-6 sm:p-8">
        <Link href="/" className="text-[10px] uppercase tracking-[.22em] text-white/30 hover:text-white">SQUAD.25 / Public site</Link>
        <h1 className="mt-8 font-display text-6xl uppercase leading-[.8]">Studio<br/><span className="text-[#d7ff43]">Access.</span></h1>
        <p className="mt-6 text-sm leading-6 text-white/45">Private publishing area for roster, montage, archive, and squad metadata.</p>

        {!configured ? (
          <div className="mt-8 border border-[#ff6b38]/25 bg-[#ff6b38]/[.05] p-4 text-sm leading-6 text-white/55">
            Supabase belum aktif. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, lalu ulangi login.
          </div>
        ) : (
          <form action={login} className="mt-8 space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block"><span className="text-[9px] uppercase tracking-[.18em] text-white/25">Email</span><input name="email" type="email" autoComplete="email" required className="mt-2 w-full border border-white/10 bg-[#0d0f11] px-3 py-3 text-sm outline-none focus:border-[#d7ff43]/35" /></label>
            <label className="block"><span className="text-[9px] uppercase tracking-[.18em] text-white/25">Password</span><input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full border border-white/10 bg-[#0d0f11] px-3 py-3 text-sm outline-none focus:border-[#d7ff43]/35" /></label>
            <button type="submit" className="w-full bg-[#d7ff43] px-4 py-3 text-[10px] font-black uppercase tracking-[.2em] text-black hover:bg-[#e7ff83]">Enter Studio</button>
          </form>
        )}

        {errorKey && <div className="mt-4 border border-white/10 px-4 py-3 text-xs text-white/55">{messages[errorKey] ?? 'Terjadi kesalahan.'}</div>}
      </div>
    </main>
  );
}

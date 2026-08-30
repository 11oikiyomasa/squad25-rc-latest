import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Access Denied — SQUAD.25',
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0c0d0f] px-5 text-[#f4f0e7]">
      <div className="w-full max-w-lg border border-white/10 bg-[#101216] p-7 sm:p-10">
        <div className="text-[10px] font-black uppercase tracking-[.24em] text-[#ff6b38]">403 / Access denied</div>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[.82] sm:text-8xl">Not<br/><span className="text-[#d7ff43]">authorized.</span></h1>
        <p className="mt-6 max-w-md text-sm leading-7 text-white/50">
          Akun lo sudah login, tapi belum terdaftar sebagai admin SQUAD.25. Tidak ada yang perlu diulang dari halaman login.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white/70 hover:border-white/25 hover:text-white">
            Back to squad
          </Link>
          <Link href="/login" className="inline-flex border border-[#d7ff43]/25 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-[#d7ff43] hover:border-[#d7ff43]/50">
            Use another account
          </Link>
        </div>
      </div>
    </main>
  );
}

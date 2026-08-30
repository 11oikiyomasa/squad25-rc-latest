import type { Metadata } from 'next';
import { AppShell, Button, Card } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Access Denied — SQUAD.25',
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <AppShell className="grid place-items-center px-[var(--page-gutter)] py-8 sm:py-12">
      <Card className="w-full max-w-lg p-7 sm:p-10">
        <div className="ui-eyebrow">403 / Access denied</div>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[.82] sm:text-8xl">Not<br/><span className="text-[var(--acid)]">authorized.</span></h1>
        <p className="mt-6 max-w-md text-sm leading-7 text-white/50">
          Akun lo sudah login, tapi belum terdaftar sebagai admin SQUAD.25. Tidak ada yang perlu diulang dari halaman login.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/" variant="secondary">Back to squad</Button>
          <Button href="/login" variant="ghost" className="text-[var(--acid)]">Use another account</Button>
        </div>
      </Card>
    </AppShell>
  );
}

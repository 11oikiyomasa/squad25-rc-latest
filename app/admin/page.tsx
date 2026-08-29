import type { Metadata } from 'next';
import Link from 'next/link';
import AdminStudio from '@/components/admin-studio';
import { requireAdmin } from '@/lib/admin-auth';

export const metadata: Metadata = {
  title: 'Content Studio — SQUAD.25',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdmin();
  return (
    <>
      <AdminStudio />
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 sm:flex-row">
        <Link href="/admin/scrims" className="inline-flex items-center gap-2 border border-[#ff6b38]/30 bg-[#101216]/95 px-4 py-3 text-[9px] font-black uppercase tracking-[.16em] text-[#ff8d68] shadow-xl backdrop-blur-md hover:border-[#ff6b38]/60">Scrim Control <span aria-hidden>↗</span></Link>
        <Link href="/admin/recruitment" className="inline-flex items-center gap-2 border border-[#d7ff43]/30 bg-[#101216]/95 px-4 py-3 text-[9px] font-black uppercase tracking-[.16em] text-[#d7ff43] shadow-xl backdrop-blur-md hover:border-[#d7ff43]/60">Recruitment Inbox <span aria-hidden>↗</span></Link>
      </div>
    </>
  );
}

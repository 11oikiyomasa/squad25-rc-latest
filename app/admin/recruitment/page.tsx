import type { Metadata } from 'next';
import RecruitmentInbox from '@/components/recruitment-inbox';

export const metadata: Metadata = {
  title: 'Recruitment Inbox',
  robots: { index: false, follow: false },
};

export default function RecruitmentAdminPage() {
  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12"><RecruitmentInbox /></section>
    </main>
  );
}

import { notFound, redirect } from 'next/navigation';
import PublicNav from '@/components/public-nav';
import RecruitmentForm from '@/components/recruitment-form';
import { AppShell, Card, Section } from '@/components/ui';
import { getRecruitmentOpeningState } from '@/lib/recruitment/public-state';

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const state = await getRecruitmentOpeningState(slug);

  if (state.kind === 'missing') notFound();
  if (state.kind === 'ineligible') redirect('/recruitment/closed');

  const { job } = state;

  return (
    <AppShell>
      <PublicNav active="recruit" />
      <Section className="ui-container py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="ui-eyebrow text-[var(--acid)]">Application / {job.title}</div>
          <h1 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">Player file.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">
            Kirim data yang relevan dan resume PDF. Satu email hanya dapat mengajukan satu kali untuk posisi ini.
          </p>
          <Card className="mt-8 p-5 sm:p-8">
            <RecruitmentForm jobId={job.id} jobTitle={job.title} />
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}

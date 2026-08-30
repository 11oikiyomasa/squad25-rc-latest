import { notFound } from 'next/navigation';
import PublicNav from '@/components/public-nav';
import RecruitmentForm from '@/components/recruitment-form';
import { AppShell, Card, Section } from '@/components/ui';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) notFound();
  const { data: job } = await (await createClient()).from('recruitment_jobs').select('id,title,slug').eq('slug', (await params).slug).eq('is_active', true).maybeSingle();
  if (!job) notFound();
  return <AppShell><PublicNav active="recruit" /><Section className="ui-container py-14 sm:py-20"><div className="mx-auto max-w-3xl"><div className="ui-eyebrow text-[var(--acid)]">Application / {job.title}</div><h1 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">Player file.</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">Kirim data yang relevan dan resume PDF. Satu email hanya dapat mengajukan satu kali untuk posisi ini.</p><Card className="mt-8 p-5 sm:p-8"><RecruitmentForm jobId={job.id} jobTitle={job.title} /></Card></div></Section></AppShell>;
}

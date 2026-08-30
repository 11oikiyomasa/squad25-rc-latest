import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicNav from '@/components/public-nav';
import { AppShell, Card, Section } from '@/components/ui';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

async function getJob(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const { data } = await (await createClient()).from('recruitment_jobs').select('id,title,slug,description,requirements,closes_at').eq('slug', slug).eq('is_active', true).maybeSingle();
  return data ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const job = await getJob((await params).slug);
  return { title: job ? `${job.title} — Recruitment` : 'Position not found', robots: { index: Boolean(job), follow: Boolean(job) } };
}

export default async function JobRequirementsPage({ params }: { params: Promise<{ slug: string }> }) {
  const job = await getJob((await params).slug);
  if (!job) notFound();
  return <AppShell><PublicNav active="recruit" /><Section className="ui-container py-14 sm:py-20">
    <Link href="/recruitment" className="text-[9px] uppercase tracking-[.18em] text-white/30 hover:text-white">← All positions</Link>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_.65fr]">
      <div><div className="ui-eyebrow text-[var(--acid)]">Requirements</div><h1 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">{job.title}</h1><p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-white/50">{job.description}</p></div>
      <Card className="p-6 sm:p-8"><div className="ui-eyebrow">Criteria</div><ul className="mt-5 space-y-3">{(job.requirements ?? []).map((item: string) => <li key={item} className="border-l border-[var(--acid)]/50 pl-3 text-sm leading-6 text-white/65">{item}</li>)}</ul><Link href={`/recruitment/${job.slug}/apply`} className="mt-8 inline-flex w-full items-center justify-center bg-[var(--acid)] px-5 py-3 text-xs font-black uppercase tracking-[.18em] text-black">Apply for this position ↗</Link></Card>
    </div>
  </Section></AppShell>;
}

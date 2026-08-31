import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Button, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

async function getApplication(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recruitment_applications')
    .select('id,created_at,full_name,nickname,email,phone,role,portfolio_link,status,cover_letter,resume_original_name,resume_size,resume_path,recruitment_jobs(title,slug)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('Unable to load application.');
  if (!data) return null;
  const { data: notes } = await supabase
    .from('recruitment_application_notes')
    .select('id,admin_name,note,created_at')
    .eq('application_id', id)
    .order('created_at', { ascending: false });
  let resumeUrl: string | null = null;
  if (data.resume_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage.from('recruitment-resumes').createSignedUrl(data.resume_path, 300);
    resumeUrl = signed?.signedUrl ?? null;
  }
  return { application: data, notes: notes ?? [], resumeUrl };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  await requireAdmin();
  const result = await getApplication((await params).id);
  return { title: result ? `${result.application.nickname} — Recruitment Review` : 'Application not found', robots: { index: false, follow: false } };
}

export default async function RecruitmentApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const result = await getApplication((await params).id);
  if (!result) return notFound();
  const { application, notes, resumeUrl } = result;
  const job = Array.isArray(application.recruitment_jobs) ? application.recruitment_jobs[0] : application.recruitment_jobs;
  const formatDate = (value: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c0d0f]/90 backdrop-blur-md"><div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 lg:px-8"><div><div className="text-[9px] uppercase tracking-[.2em] text-white/25">Admin / Recruitment</div><div className="mt-1 text-sm font-black tracking-[.18em]">APPLICATION REVIEW</div></div><Link href="/admin/recruitment" className="border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.16em] text-white/50 hover:border-white/25 hover:text-white">Back to Inbox</Link></div></header>
      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[9px] font-mono uppercase tracking-[.16em] text-white/30"><Link href="/admin/overview" className="hover:text-white">Admin</Link><span aria-hidden="true">/</span><Link href="/admin/recruitment" className="hover:text-white">Recruitment</Link><span aria-hidden="true">/</span><span className="text-white/55">{application.nickname}</span></nav>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_.72fr]">
          <Card className="p-6 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-6"><div><div className="ui-eyebrow text-[#d7ff43]">{job?.title ?? 'Application'}</div><h1 className="mt-2 font-display text-5xl uppercase sm:text-7xl">{application.nickname}</h1><p className="mt-2 text-sm text-white/40">{application.full_name} · submitted {formatDate(application.created_at)}</p></div><span className="border border-white/10 px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[.17em] text-white/50">{application.status}</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><Info label="Email" value={application.email}/><Info label="Phone" value={application.phone}/><Info label="Role" value={application.role}/><Info label="Portfolio" value={application.portfolio_link || '—'}/></div><div className="mt-6 border border-white/8 bg-black/20 p-5"><div className="ui-eyebrow">Cover letter</div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/60">{application.cover_letter || '—'}</p></div><div className="mt-6 flex flex-wrap gap-3"><Button href="/admin/recruitment" variant="secondary">Open inbox</Button>{resumeUrl && <a href={resumeUrl} target="_blank" rel="noreferrer" className="ui-button ui-button-primary">Open private resume ↗</a>}</div></Card>
          <div className="space-y-5"><Card className="p-6 sm:p-8"><div className="ui-eyebrow">Application metadata</div><div className="mt-5 space-y-3"><Info label="Application ID" value={application.id}/><Info label="Resume" value={application.resume_original_name || 'Not supplied'}/><Info label="Resume size" value={application.resume_size ? `${Math.round(application.resume_size / 1024)} KB` : '—'}/><Info label="Job slug" value={job?.slug ?? '—'}/></div></Card><Card className="p-6 sm:p-8"><div className="ui-eyebrow">Internal notes</div><div className="mt-4 space-y-3">{notes.length ? notes.map((note) => <div key={note.id} className="border border-white/8 bg-black/20 p-4"><div className="text-[9px] text-white/30">{note.admin_name} · {formatDate(note.created_at)}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/55">{note.note}</p></div>) : <p className="text-sm leading-6 text-white/35">No internal notes yet. Use the inbox to append a review note or change status.</p>}</div></Card></div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="border border-white/8 bg-[#0c0d0f] p-4"><div className="text-[8px] uppercase tracking-[.18em] text-white/25">{label}</div><div className="mt-2 break-words text-sm text-white/75">{value}</div></div>; }

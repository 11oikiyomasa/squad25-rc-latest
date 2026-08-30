import { NextResponse } from 'next/server';
import { randomUUID, createHash } from 'node:crypto';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertPdf, clientIp, hasPdfMagicBytes, isValidEmail, isValidHttpUrl, text, verifyTurnstile, MAX_RESUME_SIZE } from '@/lib/recruitment-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROLES = new Set(['EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM', 'FLEX']);
const MAX_MULTIPART_BYTES = 7 * 1024 * 1024;

function fail(message: string, status = 422) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function sendConfirmationEmail(to: string, name: string, jobTitle: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RECRUITMENT_FROM_EMAIL;
  if (!apiKey || !from) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: `Application received — ${jobTitle}`, html: `<p>Hi ${name.replace(/[<>&"']/g, '')},</p><p>We received your application for <strong>${jobTitle.replace(/[<>&"']/g, '')}</strong>. The team will review it and contact you if there is a next step.</p>` }),
      cache: 'no-store', signal: AbortSignal.timeout(7000),
    });
  } catch (error) { console.error('Recruitment confirmation email failed:', error); }
}

export async function GET() {
  if (!isSupabaseConfigured()) return fail('Recruitment is temporarily unavailable.', 503);
  const supabase = await createClient();
  const { data, error } = await supabase.from('recruitment_jobs').select('id,title,slug,description,requirements,closes_at').eq('is_active', true).order('created_at', { ascending: false });
  if (error) return fail('Recruitment is temporarily unavailable.', 503);
  return NextResponse.json({ jobs: data ?? [] }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return fail('Recruitment is temporarily unavailable.', 503);
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_MULTIPART_BYTES) return fail('Payload terlalu besar. Resume maksimal 5 MB.', 413);

  const form = await request.formData().catch(() => null);
  if (!form) return fail('Multipart payload tidak valid.', 400);
  if (text(form.get('website'), 120)) return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });

  const jobId = text(form.get('jobId'), 64);
  const fullName = text(form.get('fullName'), 80);
  const nickname = text(form.get('nickname'), 30);
  const email = text(form.get('email'), 254).toLowerCase();
  const phone = text(form.get('phone'), 40);
  const role = text(form.get('role'), 10).toUpperCase();
  const portfolioLink = text(form.get('portfolioLink'), 500);
  const coverLetter = text(form.get('coverLetter'), 5000);
  const captchaToken = text(form.get('turnstileToken'), 2048);
  const resume = form.get('resume');

  if (!jobId || fullName.length < 2 || fullName.length > 80 || nickname.length < 1 || !isValidEmail(email) || phone.length < 3 || !ROLES.has(role)) return fail('Periksa nama, email, nomor telepon, dan role.');
  if (portfolioLink && !isValidHttpUrl(portfolioLink)) return fail('Portfolio URL tidak valid.');
  if (!(resume instanceof File) || !assertPdf(resume) || !(await hasPdfMagicBytes(resume))) return fail('Resume harus berupa PDF valid maksimal 5 MB.');
  if (!(await verifyTurnstile(captchaToken, request))) return fail('Verifikasi anti-spam gagal. Silakan coba lagi.', 403);

  const objectPath = `applications/${randomUUID()}.pdf`;
  const bytes = Buffer.from(await resume.arrayBuffer());
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from('recruitment-resumes').upload(objectPath, bytes, { contentType: 'application/pdf', upsert: false });
  if (uploadError) { console.error('Resume upload failed:', uploadError.message); return fail('Resume gagal diupload. Coba lagi.', 500); }

  const supabase = await createClient();
  const { data: applicationId, error } = await supabase.rpc('submit_recruitment_application_v7', {
    payload: { jobId, fullName, nickname, email, phone, role, portfolioLink, coverLetter, resumePath: objectPath, resumeSize: resume.size, website: '' },
    client_ip: clientIp(request),
  });

  if (error || !applicationId) {
    await admin.storage.from('recruitment-resumes').remove([objectPath]);
    const message = error?.message ?? '';
    if (message.includes('DUPLICATE_APPLICATION')) return fail('Email ini sudah pernah dipakai untuk lowongan tersebut.', 409);
    if (message.includes('RECRUITMENT_RATE_LIMIT')) return fail('Terlalu banyak pengiriman. Coba lagi nanti.', 429);
    if (message.includes('JOB_UNAVAILABLE')) return fail('Lowongan sudah tidak tersedia.', 409);
    console.error('Recruitment RPC failed:', message);
    return fail('Application gagal disimpan. Coba lagi.', 500);
  }

  await admin.from('recruitment_applications').update({ resume_sha256: sha256, resume_original_name: resume.name.slice(0, 255), captcha_verified_at: new Date().toISOString() }).eq('id', applicationId);
  const { data: job } = await admin.from('recruitment_jobs').select('title').eq('id', jobId).maybeSingle();
  await sendConfirmationEmail(email, fullName, job?.title ?? 'the position');
  return NextResponse.json({ ok: true, applicationId }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

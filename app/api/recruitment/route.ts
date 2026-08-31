import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { verifyTurnstile, text } from '@/lib/recruitment-security';
import { probeRecruitmentResume } from '@/lib/recruitment/file-probe';
import { SCHEMA_APPLICATION_SUBMISSION_V1 } from '@/lib/recruitment/schema';
import { ApplicationWriteError, persistApplicationSubmission } from '@/lib/recruitment/server-write';
import { recruitmentErrorResponse } from '@/lib/recruitment/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_MAX_MULTIPART_BODY = 7 * 1024 * 1024;

function invalidRequest() {
  return recruitmentErrorResponse('APPLICATION_INVALID_REQUEST');
}

function readSubmission(form: FormData) {
  return {
    job_id: text(form.get('jobId'), 64),
    full_name: text(form.get('fullName'), 80),
    nickname: text(form.get('nickname'), 30),
    email: text(form.get('email'), 254),
    phone: text(form.get('phone'), 40),
    role: text(form.get('role'), 10).toUpperCase(),
    portfolio_link: text(form.get('portfolioLink'), 500),
    resume: form.get('resume'),
    cover_letter: text(form.get('coverLetter'), 5000),
    turnstile_token: text(form.get('turnstileToken'), 2048),
    honeypot_website: text(form.get('website'), 120),
  };
}

function fieldValidationFailed() {
  return NextResponse.json(
    { error: 'Invalid application submission.' },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  );
}

async function persist(input: Parameters<typeof persistApplicationSubmission>[0], request: Request) {
  try {
    return await persistApplicationSubmission(input, request);
  } catch (error) {
    if (error instanceof ApplicationWriteError) {
      return { error };
    }
    return { error: new ApplicationWriteError('APPLICATION_PERSISTENCE_FAILED') };
  }
}

export async function POST(request: Request) {
  // Steps 4 and 5 are intentionally split across proxy + Route Handler.
  // The proxy has already enforced rate-limit, public audience, Origin, and host/body perimeter.
  if (!isSupabaseConfigured()) return recruitmentErrorResponse('APPLICATION_PERSISTENCE_FAILED');

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > APP_MAX_MULTIPART_BODY) {
      return NextResponse.json(
        { error: 'Request payload is too large.' },
        { status: 413, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

  const form = await request.formData().catch(() => null);
  if (!form) return invalidRequest();

  const candidate = readSubmission(form);
  const parsed = SCHEMA_APPLICATION_SUBMISSION_V1.safeParse(candidate);
  if (!parsed.success) return fieldValidationFailed();

  const probe = await probeRecruitmentResume(parsed.data.resume);
  if (!probe.ok) return recruitmentErrorResponse('APPLICATION_INVALID_RESUME');

  if (!(await verifyTurnstile(parsed.data.turnstile_token, request))) {
    return recruitmentErrorResponse('APPLICATION_CAPTCHA_FAILED');
  }

  const writeResult = await persist(parsed.data, request);
  if ('error' in writeResult) {
    if (writeResult.error.code === 'APPLICATION_CLOSED') {
      return recruitmentErrorResponse('APPLICATION_CLOSED');
    }
    if (writeResult.error.code === 'APPLICATION_DUPLICATE') {
      return recruitmentErrorResponse('APPLICATION_DUPLICATE');
    }
    if (writeResult.error.code === 'APPLICATION_UPLOAD_FAILED') {
      return recruitmentErrorResponse('APPLICATION_UPLOAD_FAILED');
    }
    return recruitmentErrorResponse('APPLICATION_PERSISTENCE_FAILED');
  }

  // Keep the request-local hash computation available for future audit/metadata work.
  // No second Application write is performed here.
  void createHash('sha256').update(Buffer.from(await parsed.data.resume.arrayBuffer())).digest('hex');

  return NextResponse.json(
    { ok: true, applicationId: writeResult.applicationId },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  );
}

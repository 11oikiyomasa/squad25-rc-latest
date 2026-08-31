import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { verifyTurnstile } from '@/lib/recruitment-security';
import { probeRecruitmentResume } from '@/lib/recruitment/file-probe';
import { SCHEMA_APPLICATION_SUBMISSION_V1 } from '@/lib/recruitment/schema';
import { ApplicationWriteError, persistApplicationSubmission } from '@/lib/recruitment/server-write';
import { recruitmentErrorResponse } from '@/lib/recruitment/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_MAX_MULTIPART_BODY = 7 * 1024 * 1024;

function rawText(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function readSubmission(form: FormData) {
  return {
    job_id: rawText(form.get('jobId')),
    full_name: rawText(form.get('fullName')),
    nickname: rawText(form.get('nickname')),
    email: rawText(form.get('email')),
    phone: rawText(form.get('phone')),
    role: rawText(form.get('role')).toUpperCase(),
    portfolio_link: rawText(form.get('portfolioLink')),
    resume: form.get('resume'),
    cover_letter: rawText(form.get('coverLetter')),
    turnstile_token: rawText(form.get('turnstileToken')),
    honeypot_website: rawText(form.get('website')),
  };
}

async function persist(
  input: Parameters<typeof persistApplicationSubmission>[0],
  request: Request,
) {
  try {
    return await persistApplicationSubmission(input, request);
  } catch (error) {
    if (error instanceof ApplicationWriteError) return { error };
    return { error: new ApplicationWriteError('APPLICATION_PERSISTENCE_FAILED') };
  }
}

export async function POST(request: Request) {
  // Step 4 runs first in proxy.ts: rate limit -> public audience -> Origin -> host body ceiling.
  // Step 5 begins here: application body ceiling -> Zod -> file probe -> anti-abuse -> write.
  if (!isSupabaseConfigured()) return recruitmentErrorResponse('APPLICATION_PERSISTENCE_FAILED');

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > APP_MAX_MULTIPART_BODY) {
      return recruitmentErrorResponse('APPLICATION_INVALID_REQUEST');
    }
  }

  const form = await request.formData().catch(() => null);
  if (!form) return recruitmentErrorResponse('APPLICATION_INVALID_REQUEST');

  const parsed = SCHEMA_APPLICATION_SUBMISSION_V1.safeParse(readSubmission(form));
  if (!parsed.success) return recruitmentErrorResponse('APPLICATION_INVALID_REQUEST');

  const probe = await probeRecruitmentResume(parsed.data.resume);
  if (!probe.ok) return recruitmentErrorResponse('APPLICATION_INVALID_RESUME');

  if (!(await verifyTurnstile(parsed.data.turnstile_token, request))) {
    return recruitmentErrorResponse('APPLICATION_CAPTCHA_FAILED');
  }

  const writeResult = await persist(parsed.data, request);
  if ('error' in writeResult) {
    switch (writeResult.error.code) {
      case 'APPLICATION_CLOSED':
        return recruitmentErrorResponse('APPLICATION_CLOSED');
      case 'APPLICATION_DUPLICATE':
        return recruitmentErrorResponse('APPLICATION_DUPLICATE');
      case 'APPLICATION_UPLOAD_FAILED':
        return recruitmentErrorResponse('APPLICATION_UPLOAD_FAILED');
      default:
        return recruitmentErrorResponse('APPLICATION_PERSISTENCE_FAILED');
    }
  }

  return NextResponse.json(
    { ok: true, applicationId: writeResult.applicationId },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  );
}

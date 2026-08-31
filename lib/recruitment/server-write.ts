import 'server-only';

import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { clientIp } from '@/lib/recruitment-security';
import { RECRUITMENT_RESUME_BUCKET } from '@/lib/recruitment/file-probe';
import type { ApplicationSubmissionV1 } from '@/lib/recruitment/schema';

export type ApplicationWriteErrorCode =
  | 'APPLICATION_CLOSED'
  | 'APPLICATION_DUPLICATE'
  | 'APPLICATION_UPLOAD_FAILED'
  | 'APPLICATION_PERSISTENCE_FAILED';

export class ApplicationWriteError extends Error {
  constructor(public readonly code: ApplicationWriteErrorCode) {
    super(code);
    this.name = 'ApplicationWriteError';
  }
}

function mapRpcError(message: string): ApplicationWriteErrorCode {
  if (message.includes('DUPLICATE_APPLICATION')) return 'APPLICATION_DUPLICATE';
  if (message.includes('RECRUITMENT_CLOSED') || message.includes('JOB_UNAVAILABLE')) {
    return 'APPLICATION_CLOSED';
  }
  return 'APPLICATION_PERSISTENCE_FAILED';
}

async function assertOpeningEligible(jobId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: job, error: jobError } = await admin
    .from('recruitment_jobs')
    .select('id,cycle_id,is_active,closes_at')
    .eq('id', jobId)
    .maybeSingle();

  if (jobError) throw new ApplicationWriteError('APPLICATION_PERSISTENCE_FAILED');
  if (!job || !job.is_active || (job.closes_at && new Date(job.closes_at).getTime() <= Date.now())) {
    throw new ApplicationWriteError('APPLICATION_CLOSED');
  }

  const { data: cycle, error: cycleError } = await admin
    .from('recruitment_cycles')
    .select('status')
    .eq('id', job.cycle_id)
    .maybeSingle();

  if (cycleError) throw new ApplicationWriteError('APPLICATION_PERSISTENCE_FAILED');
  if (!cycle || cycle.status !== 'OPEN') {
    throw new ApplicationWriteError('APPLICATION_CLOSED');
  }
}

async function assertNotDuplicate(
  input: ApplicationSubmissionV1,
  admin: ReturnType<typeof createAdminClient>,
) {
  const { data, error } = await admin
    .from('recruitment_applications')
    .select('id')
    .eq('job_id', input.job_id)
    .eq('email', input.email)
    .limit(1);

  if (error) throw new ApplicationWriteError('APPLICATION_PERSISTENCE_FAILED');
  if ((data ?? []).length > 0) throw new ApplicationWriteError('APPLICATION_DUPLICATE');
}

export async function persistApplicationSubmission(
  input: ApplicationSubmissionV1,
  request: Request,
): Promise<{ applicationId: string }> {
  const admin = createAdminClient();

  // All reads here are still after Zod, file probe and anti-abuse in the caller.
  // No storage/database write occurs until eligibility and duplicate checks pass.
  await assertOpeningEligible(input.job_id, admin);
  await assertNotDuplicate(input, admin);

  const objectPath = `applications/${randomUUID()}.pdf`;
  const bytes = Buffer.from(await input.resume.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(RECRUITMENT_RESUME_BUCKET)
    .upload(objectPath, bytes, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    throw new ApplicationWriteError('APPLICATION_UPLOAD_FAILED');
  }

  const { data: applicationId, error: rpcError } = await admin.rpc(
    'submit_recruitment_application_v7',
    {
      payload: {
        jobId: input.job_id,
        fullName: input.full_name,
        nickname: input.nickname,
        email: input.email,
        phone: input.phone,
        role: input.role,
        portfolioLink: input.portfolio_link,
        coverLetter: input.cover_letter,
        resumePath: objectPath,
        resumeSize: input.resume.size,
        resumeOriginalName: input.resume.name.slice(0, 255),
      },
      client_ip: clientIp(request),
    },
  );

  if (rpcError || !applicationId) {
    await admin.storage.from(RECRUITMENT_RESUME_BUCKET).remove([objectPath]);
    throw new ApplicationWriteError(mapRpcError(rpcError?.message ?? ''));
  }

  return { applicationId };
}

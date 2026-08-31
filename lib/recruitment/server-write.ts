import 'server-only';

import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
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

export async function persistApplicationSubmission(
  input: ApplicationSubmissionV1,
): Promise<{ applicationId: string }> {
  const objectPath = `applications/${randomUUID()}.pdf`;
  const bytes = Buffer.from(await input.resume.arrayBuffer());
  const admin = createAdminClient();

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
      client_ip: '0.0.0.0',
    },
  );

  if (rpcError || !applicationId) {
    await admin.storage.from(RECRUITMENT_RESUME_BUCKET).remove([objectPath]);
    throw new ApplicationWriteError(mapRpcError(rpcError?.message ?? ''));
  }

  return { applicationId };
}

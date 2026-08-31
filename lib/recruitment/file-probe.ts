import { assertPdf, hasPdfMagicBytes, MAX_RESUME_SIZE } from '@/lib/recruitment-security';

export const RECRUITMENT_RESUME_BUCKET = 'recruitment-resumes' as const;
export const RECRUITMENT_RESUME_MIME = 'application/pdf' as const;
export const RECRUITMENT_RESUME_MAX_BYTES = MAX_RESUME_SIZE;

export type ResumeProbeResult =
  | { ok: true; sha256Input: File }
  | { ok: false; code: 'INVALID_RESUME' };

export async function probeRecruitmentResume(file: File): Promise<ResumeProbeResult> {
  if (!assertPdf(file)) return { ok: false, code: 'INVALID_RESUME' };
  if (!(await hasPdfMagicBytes(file))) return { ok: false, code: 'INVALID_RESUME' };

  return { ok: true, sha256Input: file };
}

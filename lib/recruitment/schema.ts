import { z } from 'zod';

const APPLICATION_ROLES = ['EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM', 'FLEX'] as const;

function normalizedString(min: number, max: number) {
  return z.preprocess(
    (value) => (typeof value === 'string' ? value.normalize('NFKC').trim() : value),
    z.string().min(min).max(max),
  );
}

const optionalHttpUrl = z.preprocess(
  (value) => (typeof value === 'string' ? value.normalize('NFKC').trim() : value),
  z
    .string()
    .max(500)
    .refine((value) => {
      if (value === '') return true;
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }, { message: 'portfolio_link must be an HTTP or HTTPS URL.' }),
);

const recruitmentFile = z.custom<File>(
  (value) => typeof File !== 'undefined' && value instanceof File,
  { message: 'resume is required.' },
);

const normalizedEmail = z.preprocess(
  (value) => (typeof value === 'string' ? value.normalize('NFKC').trim().toLowerCase() : value),
  z.string().email().max(254),
);

export const SCHEMA_APPLICATION_SUBMISSION_V1 = z.object({
  job_id: z.string().uuid(),
  full_name: normalizedString(2, 80),
  nickname: normalizedString(1, 30),
  email: normalizedEmail,
  phone: normalizedString(3, 40),
  role: z.enum(APPLICATION_ROLES),
  portfolio_link: optionalHttpUrl,
  resume: recruitmentFile,
  cover_letter: normalizedString(20, 5000),

  // Security fields are validated here but never persisted as Application content.
  turnstile_token: z.string().trim().max(2048),
  honeypot_website: z.string().max(120).refine((value) => value === '', {
    message: 'Invalid anti-bot field.',
  }),
}).strict();

export type ApplicationSubmissionV1 = z.infer<typeof SCHEMA_APPLICATION_SUBMISSION_V1>;

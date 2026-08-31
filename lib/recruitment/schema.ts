import { z } from 'zod';

const APPLICATION_ROLES = ['EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM', 'FLEX'] as const;

const optionalHttpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (value === '') return true;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, { message: 'portfolio_link must be an HTTP or HTTPS URL.' });

const recruitmentFile = z.custom<File>(
  (value) => typeof File !== 'undefined' && value instanceof File,
  { message: 'resume is required.' },
);

export const SCHEMA_APPLICATION_SUBMISSION_V1 = z.object({
  job_id: z.string().uuid(),
  full_name: z.string().trim().normalize('NFKC').min(2).max(80),
  nickname: z.string().trim().normalize('NFKC').min(1).max(30),
  email: z.string().trim().normalize('NFKC').email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().normalize('NFKC').min(3).max(40),
  role: z.enum(APPLICATION_ROLES),
  portfolio_link: optionalHttpUrl,
  resume: recruitmentFile,
  cover_letter: z.string().trim().normalize('NFKC').min(20).max(5000),

  // Security fields are validated here but never persisted as Application content.
  turnstile_token: z.string().trim().max(2048),
  honeypot_website: z.string().max(120).refine((value) => value === '', {
    message: 'Invalid anti-bot field.',
  }),
}).strict();

export type ApplicationSubmissionV1 = z.infer<typeof SCHEMA_APPLICATION_SUBMISSION_V1>;

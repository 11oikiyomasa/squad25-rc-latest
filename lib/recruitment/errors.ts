import { NextResponse } from 'next/server';

export type RecruitmentErrorCode =
  | 'APPLICATION_INVALID_REQUEST'
  | 'APPLICATION_INVALID_RESUME'
  | 'APPLICATION_CLOSED'
  | 'APPLICATION_DUPLICATE'
  | 'APPLICATION_CAPTCHA_FAILED'
  | 'APPLICATION_UPLOAD_FAILED'
  | 'APPLICATION_PERSISTENCE_FAILED';

const ERROR_STATUS: Record<RecruitmentErrorCode, number> = {
  APPLICATION_INVALID_REQUEST: 400,
  APPLICATION_INVALID_RESUME: 400,
  APPLICATION_CLOSED: 409,
  APPLICATION_DUPLICATE: 409,
  APPLICATION_CAPTCHA_FAILED: 403,
  APPLICATION_UPLOAD_FAILED: 500,
  APPLICATION_PERSISTENCE_FAILED: 500,
};

const ERROR_MESSAGE: Record<RecruitmentErrorCode, string> = {
  APPLICATION_INVALID_REQUEST: 'Invalid application submission.',
  APPLICATION_INVALID_RESUME: 'Resume must be a valid PDF up to 5 MB.',
  APPLICATION_CLOSED: 'This recruitment opening is no longer available.',
  APPLICATION_DUPLICATE: 'This email has already been used for this opening.',
  APPLICATION_CAPTCHA_FAILED: 'Anti-spam verification failed. Please try again.',
  APPLICATION_UPLOAD_FAILED: 'Resume could not be uploaded. Please try again.',
  APPLICATION_PERSISTENCE_FAILED: 'Application could not be saved. Please try again.',
};

export function recruitmentErrorResponse(code: RecruitmentErrorCode) {
  return NextResponse.json(
    { error: ERROR_MESSAGE[code] },
    {
      status: ERROR_STATUS[code],
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

import { NextResponse } from 'next/server';

export type SecurityErrorCode =
  | 'INVALID_REQUEST'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'SEC_INVALID_ORIGIN'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'RATE_LIMIT_UNAVAILABLE'
  | 'INTERNAL_ERROR';

const MESSAGES: Record<SecurityErrorCode, string> = {
  INVALID_REQUEST: 'Invalid request.',
  AUTH_REQUIRED: 'Authentication required.',
  FORBIDDEN: 'Access denied.',
  SEC_INVALID_ORIGIN: 'Request origin is not allowed.',
  PAYLOAD_TOO_LARGE: 'Request payload is too large.',
  RATE_LIMITED: 'Too many requests. Try again later.',
  RATE_LIMIT_UNAVAILABLE: 'Request cannot be processed at this time.',
  INTERNAL_ERROR: 'Unable to process the request.',
};

const STATUS: Record<SecurityErrorCode, number> = {
  INVALID_REQUEST: 400,
  AUTH_REQUIRED: 401,
  FORBIDDEN: 403,
  SEC_INVALID_ORIGIN: 403,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  RATE_LIMIT_UNAVAILABLE: 429,
  INTERNAL_ERROR: 500,
};

export function securityResponse(code: SecurityErrorCode) {
  return NextResponse.json(
    { error: MESSAGES[code] },
    {
      status: STATUS[code],
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

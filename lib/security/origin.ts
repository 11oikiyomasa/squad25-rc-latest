import type { NextRequest } from 'next/server';

export const SEC_INVALID_ORIGIN = 'SEC_INVALID_ORIGIN' as const;

function canonicalOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return null;

  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

export function hasValidRecruitmentOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const expected = canonicalOrigin();

  if (!origin || !expected) return false;

  try {
    return new URL(origin).origin === expected;
  } catch {
    return false;
  }
}

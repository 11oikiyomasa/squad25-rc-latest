import type { NextRequest } from 'next/server';

export const HOST_MAX_REQUEST_BODY = 8 * 1024 * 1024;

export function exceedsRequestBodyLimit(request: NextRequest) {
  const raw = request.headers.get('content-length');
  if (raw === null) return false;

  const contentLength = Number(raw);
  return !Number.isFinite(contentLength) || contentLength < 0 || contentLength > HOST_MAX_REQUEST_BODY;
}

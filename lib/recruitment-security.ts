const MAX_JSON_BYTES = 2 * 1024 * 1024;
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export const MAX_APPLICATION_BODY_BYTES = MAX_JSON_BYTES;
export const MAX_RESUME_SIZE = MAX_RESUME_BYTES;

export function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || '0.0.0.0';
  return request.headers.get('x-real-ip')?.trim() || '0.0.0.0';
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && value.length <= 500;
  } catch {
    return false;
  }
}

export function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.normalize('NFKC').trim().slice(0, max) : '';
}

export async function verifyTurnstile(token: string, request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!token || token.length > 2048) return false;
  const form = new URLSearchParams({ secret, response: token, remoteip: clientIp(request) });
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form,
    cache: 'no-store', signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!response?.ok) return false;
  const result = await response.json().catch(() => null) as { success?: boolean } | null;
  return result?.success === true;
}

export function assertPdf(file: File) {
  if (file.size <= 0 || file.size > MAX_RESUME_BYTES) return false;
  if (file.type !== 'application/pdf') return false;
  return file.name.toLowerCase().endsWith('.pdf');
}

export async function hasPdfMagicBytes(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return bytes.length === 5 && String.fromCharCode(...bytes) === '%PDF-';
}

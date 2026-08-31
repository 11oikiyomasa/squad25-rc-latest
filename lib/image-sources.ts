const SUPABASE_HOST = 'wyjsosamlkbwksrslona.supabase.co';
const MEDIA_MARKER = '/storage/v1/object/public/squad-media/';
const FALLBACK_MEMBER_IMAGE = '/images/members/ryuu.svg';

export function isAllowedImageSource(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const source = value.trim();
  if (source.startsWith('/images/')) return true;
  try {
    const url = new URL(source);
    return url.protocol === 'https:' && url.hostname === SUPABASE_HOST && url.pathname.startsWith(MEDIA_MARKER);
  } catch {
    return false;
  }
}

export function safeImageSource(value: unknown, fallback = FALLBACK_MEMBER_IMAGE): string {
  return isAllowedImageSource(value) ? value.trim() : fallback;
}

export { FALLBACK_MEMBER_IMAGE };

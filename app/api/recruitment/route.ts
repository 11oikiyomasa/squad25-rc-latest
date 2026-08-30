import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

const roles = new Set(['EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM', 'FLEX']);

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function rateLimitResponse(retryAfter: unknown, message: string) {
  const seconds = Math.max(1, Math.min(86400, Number(retryAfter) || 900));
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(seconds), 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Recruitment is temporarily unavailable.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid application payload.' }, { status: 400 });
  }

  if (cleanText(body.website, 120)) {
    return NextResponse.json({ ok: true });
  }

  const fullName = cleanText(body.fullName, 80);
  const nickname = cleanText(body.nickname, 30);
  const role = cleanText(body.role, 10).toUpperCase();
  const rank = cleanText(body.rank, 60);
  const heroPool = cleanText(body.heroPool, 240);
  const experience = cleanText(body.experience, 1200);
  const availability = cleanText(body.availability, 300);
  const contact = cleanText(body.contact, 120);
  const socialUrl = cleanText(body.socialUrl, 300);
  const message = cleanText(body.message, 1600);

  if (fullName.length < 2 || nickname.length < 1 || !roles.has(role) || contact.length < 3) {
    return NextResponse.json({ error: 'Isi nama, nickname, role, dan kontak wajib.' }, { status: 422 });
  }

  if (socialUrl) {
    try {
      const url = new URL(socialUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol');
    } catch {
      return NextResponse.json({ error: 'Social URL tidak valid.' }, { status: 422 });
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_recruitment_application', {
    payload: {
      fullName,
      nickname,
      role,
      rank,
      heroPool,
      experience,
      availability,
      contact,
      socialUrl,
      message,
      website: '',
    },
    client_ip: getClientIp(request),
  });

  if (error) {
    if (error.message === 'RECRUITMENT_RATE_LIMIT') {
      return rateLimitResponse(error.details, 'Terlalu banyak pengiriman. Coba lagi nanti.');
    }
    if (error.message === 'RECRUITMENT_CONTACT_COOLDOWN') {
      return rateLimitResponse(error.details, 'Kontak ini sudah mengirim aplikasi. Coba lagi besok.');
    }

    console.error('Recruitment submission failed:', error.message);
    return NextResponse.json({ error: 'Application gagal disimpan. Coba lagi.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

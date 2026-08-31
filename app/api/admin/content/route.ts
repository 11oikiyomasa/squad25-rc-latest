import { NextResponse } from 'next/server';
import { getSquadContent } from '@/lib/content';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

const MEDIA_BUCKET = 'squad-media';
const PUBLIC_OBJECT_MARKER = `/storage/v1/object/public/${MEDIA_BUCKET}/`;

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
}

function storagePathFromPublicUrl(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const markerIndex = url.pathname.indexOf(PUBLIC_OBJECT_MARKER);
    if (markerIndex < 0) return null;
    const path = decodeURIComponent(url.pathname.slice(markerIndex + PUBLIC_OBJECT_MARKER.length)).replace(/^\/+|\/+$/g, '');
    if (!path || path.split('/').some((segment) => segment === '..')) return null;
    return path;
  } catch {
    return null;
  }
}

async function ensureAdmin() {
  if (!isSupabaseConfigured()) return { ok: false as const, status: 503, message: 'Supabase is not configured.' };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const subject = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : '';
  if (!subject) return { ok: false as const, status: 401, message: 'Authentication required.' };
  const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', subject).maybeSingle();
  if (!admin) return { ok: false as const, status: 403, message: 'Admin access required.' };
  return { ok: true as const, supabase };
}

export async function GET() {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  return NextResponse.json(await getSquadContent(), { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PUT(request: Request) {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid content payload.' }, { status: 400 });

  const candidate = body as Record<string, unknown>;
  const profile = candidate.profile;
  const members = candidate.members;
  const achievements = candidate.achievements;
  const gallery = candidate.gallery;
  if (!profile || typeof profile !== 'object' || !Array.isArray(members) || members.length !== 25 || !Array.isArray(achievements) || !Array.isArray(gallery)) {
    return NextResponse.json({ error: 'Content must contain a profile, exactly 25 members, achievements, and gallery.' }, { status: 422 });
  }

  const memberIds = members.map((m) => (m && typeof m === 'object' && typeof (m as Record<string, unknown>).id === 'string' ? (m as Record<string, unknown>).id : ''));
  if (memberIds.some((id) => !id) || new Set(memberIds).size !== 25) {
    return NextResponse.json({ error: 'Member IDs must be present and unique.' }, { status: 422 });
  }

  const client = gate.supabase;
  const candidateProfile = profile as Record<string, unknown>;

  const profilePayload = {
    name: String(candidateProfile.name ?? '').slice(0, 80),
    tagline: String(candidateProfile.tagline ?? '').slice(0, 180),
    season: String(candidateProfile.season ?? '').slice(0, 20),
    instagram: String(candidateProfile.instagram ?? '#').slice(0, 300),
    tiktok: String(candidateProfile.tiktok ?? '#').slice(0, 300),
    youtube: String(candidateProfile.youtube ?? '#').slice(0, 300),
  };

  const normalizedMembers = members.map((raw, index) => {
    const m = raw as Record<string, unknown>;
    const list = Array.isArray(m.montages) ? m.montages : [];
    return {
      id: String(m.id),
      number: String(m.number ?? String(index + 1).padStart(2, '0')),
      nickname: String(m.nickname ?? '').slice(0, 30),
      name: String(m.name ?? '').slice(0, 80),
      role: String(m.role),
      hero: String(m.hero ?? '').slice(0, 50),
      status: String(m.status),
      bio: String(m.bio ?? '').slice(0, 600),
      accent: String(m.accent ?? '#d7ff43').slice(0, 20),
      photo: String(m.photo ?? '').slice(0, 500),
      montages: list.slice(0, 30).map((rawMontage) => {
        const montage = rawMontage as Record<string, unknown>;
        return {
          title: String(montage.title ?? '').slice(0, 120),
          hero: String(montage.hero ?? m.hero ?? '').slice(0, 50),
          duration: String(montage.duration ?? '00:00').slice(0, 20),
          youtubeId: String(montage.youtubeId ?? '').slice(0, 100),
          description: String(montage.description ?? '').slice(0, 500),
        };
      }).filter((montage) => montage.title),
    };
  });

  if (normalizedMembers.some((m) => !m.nickname || !m.name || !['EXP','JUNGLE','MID','GOLD','ROAM'].includes(m.role) || !['ACTIVE','BENCH','CAPTAIN'].includes(m.status))) {
    return NextResponse.json({ error: 'One or more member fields are invalid.' }, { status: 422 });
  }

  const normalizedAchievements = achievements.slice(0, 50).map((raw, index) => {
    const achievement = raw as Record<string, unknown>;
    const rawYear = String(achievement.year ?? '').trim();
    const year = /^\d{4}$/.test(rawYear) ? Number(rawYear) : null;
    return {
      title: String(achievement.title ?? '').normalize('NFKC').trim().slice(0, 160),
      description: String(achievement.note ?? achievement.description ?? '').normalize('NFKC').trim().slice(0, 600),
      year,
      sort_order: index,
    };
  }).filter((achievement) => achievement.title);

  const normalizedGallery = gallery.slice(0, 100).map((raw, index) => {
    const item = raw as Record<string, unknown>;
    return {
      title: String(item.title ?? '').normalize('NFKC').trim().slice(0, 160),
      caption: String(item.meta ?? item.caption ?? '').normalize('NFKC').trim().slice(0, 300),
      image_url: String(item.image ?? item.image_url ?? '').trim().slice(0, 800),
      sort_order: index,
    };
  }).filter((item) => item.title && item.image_url);

  const previous = await getSquadContent();
  const previousPhotoPaths = new Set(
    previous.members.map((member) => storagePathFromPublicUrl(member.photo)).filter((path): path is string => Boolean(path)),
  );

  const { data: result, error: publishError } = await client.rpc('publish_squad_content', {
    payload: {
      profile: profilePayload,
      members: normalizedMembers,
      achievements: normalizedAchievements,
      gallery: normalizedGallery,
    },
  });
  if (publishError) {
    const status = publishError.code === '42501' ? 403 : publishError.code === '22023' ? 422 : publishError.code === '23503' ? 409 : 500;
    return NextResponse.json({ error: publishError.message }, { status });
  }

  const response = await getSquadContent();
  const currentPhotoPaths = new Set(
    response.members.map((member) => storagePathFromPublicUrl(member.photo)).filter((path): path is string => Boolean(path)),
  );
  const stalePhotoPaths = [...previousPhotoPaths].filter((path) => !currentPhotoPaths.has(path));
  if (stalePhotoPaths.length) {
    const { error: cleanupError } = await client.storage.from(MEDIA_BUCKET).remove(stalePhotoPaths);
    if (cleanupError) console.warn('Storage cleanup skipped:', cleanupError.message);
  }

  return NextResponse.json({ ...response, ...(result as Record<string, unknown>), profileKey: slug(profilePayload.name) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

import { gallery as seedGallery, achievements as seedAchievements, members as seedMembers, squadProfile, normalizeYoutubeId, type Member } from '@/data/squad';
import { createClient as createPublicSupabaseClient } from '@supabase/supabase-js';

export type ContentSnapshot = {
  profile: typeof squadProfile;
  members: Member[];
  achievements: typeof seedAchievements;
  gallery: typeof seedGallery;
};

type MemberRow = { id: string; slug: string; number: string; nickname: string; full_name: string | null; role: Member['role']; main_hero: string | null; status: Member['status']; bio: string; accent: string; photo_url: string | null; sort_order: number };
type MontageRow = { id: string; member_id: string; title: string; hero: string | null; duration: string; youtube_id: string; description: string; sort_order: number; };
type ProfileRow = { id: number; name: string; tagline: string; season: string; instagram_url: string | null; tiktok_url: string | null; youtube_url: string | null };
type GalleryRow = { id: string; title: string; caption: string; image_url: string; sort_order: number };
type AchievementRow = { year: number | null; title: string; description: string; };

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

function normalizeAccent(role: Member['role'], value: string): string {
  const accent = value.trim().toLowerCase();
  if (accent === '#d7ff43' || accent === '#ff6b38') return accent;
  return role === 'JUNGLE' || role === 'GOLD' ? '#ff6b38' : '#d7ff43';
}

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase public configuration is missing.');
  return createPublicSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getSquadContent(): Promise<ContentSnapshot> {
  if (!isSupabaseConfigured()) return { profile: squadProfile, members: seedMembers, achievements: seedAchievements, gallery: seedGallery };

  try {
    const supabase = createPublicClient();
    const [profileResult, membersResult, montagesResult, achievementsResult, galleryResult] = await Promise.all([
      supabase.from('squad_settings').select('id,name,tagline,season,instagram_url,tiktok_url,youtube_url').eq('id', 1).maybeSingle(),
      supabase.from('members').select('id,slug,number,nickname,full_name,role,main_hero,status,bio,accent,photo_url,sort_order').order('sort_order', { ascending: true }),
      supabase.from('montages').select('id,member_id,title,hero,duration,youtube_id,description,sort_order').order('sort_order', { ascending: true }),
      supabase.from('achievements').select('year,title,description').order('sort_order', { ascending: true }),
      supabase.from('gallery_items').select('id,title,caption,image_url,sort_order').order('sort_order', { ascending: true }),
    ]);

    if (profileResult.error || membersResult.error || montagesResult.error || achievementsResult.error || galleryResult.error) throw new Error(profileResult.error?.message || membersResult.error?.message || montagesResult.error?.message || achievementsResult.error?.message || galleryResult.error?.message || 'Supabase content query failed.');
    const profile = profileResult.data;
    const memberRows = membersResult.data;
    const montageRows = montagesResult.data;
    const achievementRows = achievementsResult.data;
    const galleryRows = galleryResult.data;
    if (!memberRows || memberRows.length !== 25) throw new Error(`Supabase roster integrity check failed: expected 25 members, found ${memberRows?.length ?? 0}.`);

    const montagesByMember = new Map<string, MontageRow[]>();
    for (const montage of (montageRows ?? []) as MontageRow[]) {
      const bucket = montagesByMember.get(montage.member_id) ?? [];
      bucket.push(montage);
      montagesByMember.set(montage.member_id, bucket);
    }
    const members: Member[] = (memberRows as unknown as MemberRow[]).map((row) => ({
      id: row.slug, number: row.number, nickname: row.nickname, name: row.full_name ?? row.nickname, role: row.role, hero: row.main_hero ?? '', status: row.status,
      bio: row.bio, accent: normalizeAccent(row.role, row.accent), photo: row.photo_url ?? '',
      montages: (montagesByMember.get(row.id) ?? []).map((m) => ({ title: m.title, hero: m.hero ?? '', duration: m.duration, youtubeId: normalizeYoutubeId(m.youtube_id), description: m.description })),
    }));

    return {
      profile: profile ? ({ name: (profile as ProfileRow).name, tagline: (profile as ProfileRow).tagline, season: (profile as ProfileRow).season || squadProfile.season, instagram: (profile as ProfileRow).instagram_url || '#', tiktok: (profile as ProfileRow).tiktok_url || '#', youtube: (profile as ProfileRow).youtube_url || '#' } as typeof squadProfile) : squadProfile,
      members,
      achievements: (achievementRows as unknown as AchievementRow[]).map((a) => ({ year: String(a.year ?? ''), title: a.title, note: a.description })),
      gallery: (galleryRows as unknown as GalleryRow[]).map((g) => ({ id: g.id, title: g.title, meta: g.caption, image: g.image_url })),
    };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Supabase content query failed.');
  }
}
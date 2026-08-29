import { NextResponse } from 'next/server';
import { normalizeYoutubeId } from '@/data/squad';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: true, source: 'seed', database: 'not-configured', content: 'seed' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const supabase = await createClient();
    const [{ count: members, error: memberError }, { data: montageRows, error: montageError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase.from('members').select('id', { count: 'exact', head: true }),
      supabase.from('montages').select('youtube_id'),
      supabase.from('squad_settings').select('id').eq('id', 1).maybeSingle(),
    ]);

    const healthy = !memberError && !montageError && !settingsError && !!settings && members === 25;
    const montages = montageRows?.length ?? 0;
    const playableMontages = (montageRows ?? []).filter((row) => normalizeYoutubeId(row.youtube_id).length === 11).length;
    const content = !healthy ? 'unavailable' : playableMontages > 0 ? 'ready' : 'no-playable-montages';

    return NextResponse.json(
      { ok: healthy, source: 'supabase', database: healthy ? 'ok' : 'degraded', content, members: members ?? 0, montages, playableMontages },
      { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, source: 'supabase', database: 'unavailable', content: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

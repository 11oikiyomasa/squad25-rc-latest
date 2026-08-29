import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, source: 'seed', database: 'not-configured' }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const supabase = await createClient();
    const [{ count: members, error: memberError }, { count: montages, error: montageError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase.from('members').select('id', { count: 'exact', head: true }),
      supabase.from('montages').select('id', { count: 'exact', head: true }),
      supabase.from('squad_settings').select('id').eq('id', 1).maybeSingle(),
    ]);

    const healthy = !memberError && !montageError && !settingsError && !!settings && members === 25 && (montages ?? 0) >= 0;
    return NextResponse.json(
      { ok: healthy, source: 'supabase', database: healthy ? 'ok' : 'degraded', members: members ?? 0, montages: montages ?? 0 },
      { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ ok: false, source: 'supabase', database: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

const statuses = new Set(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']);
const formats = new Set(['BO1', 'BO2', 'BO3', 'BO5']);
const visibilities = new Set(['PUBLIC', 'PRIVATE']);
const fields = 'id,scheduled_at,opponent_name,format,status,visibility,result_for,result_against,public_note,admin_note,created_at,updated_at';

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

function parsePayload(body: unknown) {
  if (!body || typeof body !== 'object') throw new Error('Invalid payload.');
  const payload = body as Record<string, unknown>;
  const scheduledAt = typeof payload.scheduledAt === 'string' ? payload.scheduledAt : '';
  const opponentName = typeof payload.opponentName === 'string' ? payload.opponentName.trim().slice(0, 80) : '';
  const format = typeof payload.format === 'string' ? payload.format.toUpperCase() : '';
  const status = typeof payload.status === 'string' ? payload.status.toUpperCase() : '';
  const visibility = typeof payload.visibility === 'string' ? payload.visibility.toUpperCase() : '';
  const publicNote = typeof payload.publicNote === 'string' ? payload.publicNote.trim().slice(0, 300) : '';
  const adminNote = typeof payload.adminNote === 'string' ? payload.adminNote.trim().slice(0, 1200) : '';
  const resultFor = payload.resultFor === null || payload.resultFor === '' || typeof payload.resultFor === 'undefined' ? null : Number(payload.resultFor);
  const resultAgainst = payload.resultAgainst === null || payload.resultAgainst === '' || typeof payload.resultAgainst === 'undefined' ? null : Number(payload.resultAgainst);
  if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) throw new Error('A valid scheduled time is required.');
  if (!opponentName) throw new Error('Opponent name is required.');
  if (!formats.has(format)) throw new Error('Invalid format.');
  if (!statuses.has(status)) throw new Error('Invalid status.');
  if (!visibilities.has(visibility)) throw new Error('Invalid visibility.');
  if (resultFor !== null && (!Number.isInteger(resultFor) || resultFor < 0)) throw new Error('Invalid result.');
  if (resultAgainst !== null && (!Number.isInteger(resultAgainst) || resultAgainst < 0)) throw new Error('Invalid result.');
  if (status === 'COMPLETED' && (resultFor === null || resultAgainst === null)) throw new Error('Completed scrims require a result.');
  return { scheduled_at: new Date(scheduledAt).toISOString(), opponent_name: opponentName, format, status, visibility, result_for: resultFor, result_against: resultAgainst, public_note: publicNote, admin_note: adminNote };
}

export async function GET() {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  const { data, error } = await gate.supabase.from('scrims').select(fields).order('scheduled_at', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scrims: data ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  try {
    const row = parsePayload(body);
    const { data, error } = await gate.supabase.from('scrims').insert(row).select(fields).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload.' }, { status: 422 });
  }
}

export async function PATCH(request: Request) {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid payload.' }, { status: 422 });
  const payload = body as Record<string, unknown>;
  const id = typeof payload.id === 'string' ? payload.id : '';
  if (!id) return NextResponse.json({ error: 'Scrim id is required.' }, { status: 422 });
  try {
    const row = parsePayload(body);
    const { data, error } = await gate.supabase.from('scrims').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id).select(fields).single();
    if (error) return NextResponse.json({ error: error.code === 'PGRST116' ? 'Scrim not found.' : error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload.' }, { status: 422 });
  }
}

export async function DELETE(request: Request) {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  const id = body && typeof body === 'object' && typeof (body as Record<string, unknown>).id === 'string' ? (body as Record<string, string>).id : '';
  if (!id) return NextResponse.json({ error: 'Scrim id is required.' }, { status: 422 });
  const { error } = await gate.supabase.from('scrims').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

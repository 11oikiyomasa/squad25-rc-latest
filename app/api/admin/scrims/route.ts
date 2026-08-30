import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { selectFields } from '@/lib/scrims';

const statuses = new Set(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']);
const formats = new Set(['BO1', 'BO2', 'BO3', 'BO5']);
const visibilities = new Set(['PUBLIC', 'PRIVATE']);

type PayloadRow = {
  scheduled_at: string;
  opponent_name: string;
  format: 'BO1' | 'BO2' | 'BO3' | 'BO5';
  event_name: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  visibility: 'PUBLIC' | 'PRIVATE';
  result_for: number | null;
  result_against: number | null;
  public_note: string;
  recap_url: string | null;
  media_url: string | null;
  admin_note: string;
};

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

function parseOptionalUrl(value: unknown, label: string) {
  if (value === null || value === '' || typeof value === 'undefined') return null;
  if (typeof value !== 'string') throw new Error(`${label} must be a URL.`);
  const raw = value.trim().slice(0, 500);
  if (!raw) return null;
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new Error(`${label} must be a valid URL.`); }
  if (parsed.protocol !== 'https:') throw new Error(`${label} must use HTTPS.`);
  return parsed.toString();
}

function parsePayload(body: unknown): PayloadRow {
  if (!body || typeof body !== 'object') throw new Error('Invalid payload.');
  const payload = body as Record<string, unknown>;
  const scheduledAt = typeof payload.scheduledAt === 'string' ? payload.scheduledAt : '';
  const opponentName = typeof payload.opponentName === 'string' ? payload.opponentName.trim().slice(0, 80) : '';
  const eventName = typeof payload.eventName === 'string' ? payload.eventName.trim().slice(0, 120) : '';
  const format = typeof payload.format === 'string' ? payload.format.toUpperCase() : '';
  const status = typeof payload.status === 'string' ? payload.status.toUpperCase() : '';
  const visibility = typeof payload.visibility === 'string' ? payload.visibility.toUpperCase() : '';
  const publicNote = typeof payload.publicNote === 'string' ? payload.publicNote.trim().slice(0, 300) : '';
  const adminNote = typeof payload.adminNote === 'string' ? payload.adminNote.trim().slice(0, 1200) : '';
  const recapUrl = parseOptionalUrl(payload.recapUrl, 'Recap URL');
  const mediaUrl = parseOptionalUrl(payload.mediaUrl, 'Media URL');
  const resultFor = payload.resultFor === null || payload.resultFor === '' || typeof payload.resultFor === 'undefined' ? null : Number(payload.resultFor);
  const resultAgainst = payload.resultAgainst === null || payload.resultAgainst === '' || typeof payload.resultAgainst === 'undefined' ? null : Number(payload.resultAgainst);

  if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) throw new Error('A valid scheduled time is required.');
  if (!opponentName) throw new Error('Opponent name is required.');
  if (!eventName) throw new Error('Event name is required.');
  if (!formats.has(format)) throw new Error('Invalid format.');
  if (!statuses.has(status)) throw new Error('Invalid status.');
  if (!visibilities.has(visibility)) throw new Error('Invalid visibility.');
  if (resultFor !== null && (!Number.isInteger(resultFor) || resultFor < 0)) throw new Error('Our score must be a non-negative integer.');
  if (resultAgainst !== null && (!Number.isInteger(resultAgainst) || resultAgainst < 0)) throw new Error('Opponent score must be a non-negative integer.');
  if ((resultFor === null) !== (resultAgainst === null)) throw new Error('Both scores must be provided together.');
  if (status === 'COMPLETED' && (resultFor === null || resultAgainst === null)) throw new Error('Completed matches require a result.');
  if (status !== 'COMPLETED' && status !== 'LIVE' && (resultFor !== null || resultAgainst !== null)) throw new Error('Scheduled or cancelled matches cannot have a result.');

  return {
    scheduled_at: new Date(scheduledAt).toISOString(),
    opponent_name: opponentName,
    format: format as PayloadRow['format'],
    event_name: eventName,
    status: status as PayloadRow['status'],
    visibility: visibility as PayloadRow['visibility'],
    result_for: resultFor,
    result_against: resultAgainst,
    public_note: publicNote,
    recap_url: recapUrl,
    media_url: mediaUrl,
    admin_note: adminNote,
  };
}

const transitionError = (from: string, to: string) => `Invalid lifecycle transition: ${from} → ${to}. Use SCHEDULED → LIVE/CANCELLED → COMPLETED.`;

export async function GET() {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  const { data, error } = await gate.supabase.from('scrims').select(`${selectFields},admin_note,created_at,updated_at`).order('scheduled_at', { ascending: false }).limit(200);
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
    if (row.status !== 'SCHEDULED') throw new Error('New matches must start as SCHEDULED. Progress them through the lifecycle from the control room.');
    const { data, error } = await gate.supabase.from('scrims').insert(row).select(`${selectFields},admin_note,created_at,updated_at`).single();
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
    const { data: current, error: currentError } = await gate.supabase.from('scrims').select('status').eq('id', id).maybeSingle();
    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
    if (!current) return NextResponse.json({ error: 'Scrim not found.' }, { status: 404 });
    if (current.status !== row.status) {
      const valid = (current.status === 'SCHEDULED' && (row.status === 'LIVE' || row.status === 'CANCELLED')) || (current.status === 'LIVE' && (row.status === 'COMPLETED' || row.status === 'CANCELLED'));
      if (!valid) return NextResponse.json({ error: transitionError(current.status, row.status) }, { status: 422 });
    }
    const { data, error } = await gate.supabase.from('scrims').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id).select(`${selectFields},admin_note,created_at,updated_at`).single();
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

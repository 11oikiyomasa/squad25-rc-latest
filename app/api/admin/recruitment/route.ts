import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

const statuses = new Set(['NEW', 'REVIEWING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']);

async function ensureAdmin() {
  if (!isSupabaseConfigured()) return { ok: false as const, status: 503, message: 'Supabase is not configured.' };
  const supabase = await createClient(); const { data: claims } = await supabase.auth.getClaims();
  const subject = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : '';
  if (!subject) return { ok: false as const, status: 401, message: 'Authentication required.' };
  const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', subject).maybeSingle();
  if (!admin) return { ok: false as const, status: 403, message: 'Admin access required.' };
  return { ok: true as const, supabase, subject };
}

export async function GET(request: Request) {
  const gate = await ensureAdmin(); if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  const url = new URL(request.url); const page = Math.max(1, Number(url.searchParams.get('page') || 1)); const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
  const search = (url.searchParams.get('q') || '').normalize('NFKC').replace(/[^a-zA-Z0-9@._\- ]/g, '').trim().slice(0, 100); const status = url.searchParams.get('status')?.toUpperCase() || '';
  const from = url.searchParams.get('from') || ''; const to = url.searchParams.get('to') || '';
  if (status && !statuses.has(status)) return NextResponse.json({ error: 'Invalid status filter.' }, { status: 422 });
  let query = gate.supabase.from('recruitment_applications').select('id,job_id,created_at,updated_at,full_name,nickname,email,phone,role,portfolio_link,status,resume_original_name,resume_size,reviewed_at,source,recruitment_jobs(title,slug)', { count: 'exact' });
  if (search) query = query.or(`full_name.ilike.%${search}%,nickname.ilike.%${search}%,email.ilike.%${search}%`);
  if (status) query = query.eq('status', status);
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte('created_at', `${from}T00:00:00.000Z`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lt('created_at', `${to}T23:59:59.999Z`);
  const start = (page - 1) * pageSize; const { data, error, count } = await query.order('created_at', { ascending: false }).range(start, start + pageSize - 1);
  if (error) return NextResponse.json({ error: 'Unable to load applications.' }, { status: 500 });
  return NextResponse.json({ applications: data ?? [], page, pageSize, total: count ?? 0 }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request) {
  const gate = await ensureAdmin(); if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.id !== 'string' || typeof body.status !== 'string') return NextResponse.json({ error: 'Invalid application update.' }, { status: 422 });
  const id = body.id.trim(); const nextStatus = body.status.toUpperCase(); const expectedStatus = typeof body.expectedStatus === 'string' ? body.expectedStatus.toUpperCase() : ''; const note = typeof body.note === 'string' ? body.note.normalize('NFKC').trim().slice(0, 2000) : '';
  if (!id || !statuses.has(nextStatus) || (expectedStatus && !statuses.has(expectedStatus))) return NextResponse.json({ error: 'Invalid status.' }, { status: 422 });
  const { data, error } = await gate.supabase.rpc('admin_update_recruitment_application_v7', { application_id: id, next_status: nextStatus, expected_status: expectedStatus, note_text: note, client_ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '' });
  if (error) {
    if (error.message.includes('ADMIN_REQUIRED')) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    if (error.message.includes('APPLICATION_NOT_FOUND')) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (error.message.includes('STALE_APPLICATION')) return NextResponse.json({ error: 'Application changed by another admin. Refresh first.' }, { status: 409 });
    if (error.message.includes('INVALID_TRANSITION')) return NextResponse.json({ error: 'That status transition is not allowed.' }, { status: 409 });
    if (error.message.includes('NO_CHANGE')) return NextResponse.json({ error: 'No change requested.' }, { status: 422 });
    console.error('Admin recruitment update failed:', error.message); return NextResponse.json({ error: 'Unable to update application.' }, { status: 500 });
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}

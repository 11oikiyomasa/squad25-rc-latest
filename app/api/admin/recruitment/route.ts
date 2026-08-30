import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const statuses = new Set(['NEW', 'REVIEWING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']);
const transitions: Record<string, Set<string>> = {
  NEW: new Set(['REVIEWING', 'REJECTED']),
  REVIEWING: new Set(['SHORTLISTED', 'REJECTED']),
  SHORTLISTED: new Set(['ACCEPTED', 'REJECTED']),
  ACCEPTED: new Set(),
  REJECTED: new Set(),
};

async function ensureAdmin() {
  if (!isSupabaseConfigured()) return { ok: false as const, status: 503, message: 'Supabase is not configured.' };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const subject = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : '';
  if (!subject) return { ok: false as const, status: 401, message: 'Authentication required.' };
  const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', subject).maybeSingle();
  if (!admin) return { ok: false as const, status: 403, message: 'Admin access required.' };
  return { ok: true as const, supabase, subject };
}

export async function GET(request: Request) {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
  const search = url.searchParams.get('q')?.trim().slice(0, 100) || '';
  const status = url.searchParams.get('status')?.toUpperCase() || '';
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';
  if (status && !statuses.has(status)) return NextResponse.json({ error: 'Invalid status filter.' }, { status: 422 });

  let query = gate.supabase.from('recruitment_applications').select('id,job_id,created_at,updated_at,full_name,nickname,email,phone,role,portfolio_link,status,resume_original_name,resume_size,reviewed_at,source,recruitment_jobs(title,slug)', { count: 'exact' });
  if (search) query = query.or(`full_name.ilike.%${search}%,nickname.ilike.%${search}%,email.ilike.%${search}%`);
  if (status) query = query.eq('status', status);
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte('created_at', `${from}T00:00:00.000Z`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lt('created_at', `${to}T23:59:59.999Z`);
  const start = (page - 1) * pageSize;
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(start, start + pageSize - 1);
  if (error) return NextResponse.json({ error: 'Unable to load applications.' }, { status: 500 });
  return NextResponse.json({ applications: data ?? [], page, pageSize, total: count ?? 0 }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request) {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.id !== 'string' || typeof body.status !== 'string') return NextResponse.json({ error: 'Invalid application update.' }, { status: 422 });
  const id = body.id.trim();
  const nextStatus = body.status.toUpperCase();
  const expectedStatus = typeof body.expectedStatus === 'string' ? body.expectedStatus.toUpperCase() : '';
  const note = typeof body.note === 'string' ? body.note.normalize('NFKC').trim().slice(0, 2000) : '';
  if (!id || !statuses.has(nextStatus) || (expectedStatus && !statuses.has(expectedStatus))) return NextResponse.json({ error: 'Invalid status.' }, { status: 422 });

  const { data: current, error: readError } = await gate.supabase.from('recruitment_applications').select('id,status,full_name,email,job_id').eq('id', id).maybeSingle();
  if (readError) return NextResponse.json({ error: 'Unable to load application.' }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  const oldStatus = current.status as string;
  if (expectedStatus && expectedStatus !== oldStatus) return NextResponse.json({ error: 'Application changed by another admin. Refresh and try again.' }, { status: 409 });
  if (oldStatus !== nextStatus && !transitions[oldStatus]?.has(nextStatus)) return NextResponse.json({ error: `Transition ${oldStatus} → ${nextStatus} is not allowed.` }, { status: 409 });
  if (oldStatus === nextStatus && !note) return NextResponse.json({ error: 'No change requested.' }, { status: 422 });

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await gate.supabase.from('recruitment_applications').update({ status: nextStatus, reviewed_at: now, updated_at: now }).eq('id', id).eq('status', oldStatus).select('id,job_id,created_at,updated_at,full_name,nickname,email,phone,role,portfolio_link,cover_letter,resume_path,resume_original_name,resume_size,status,reviewed_at,source').single();
  if (updateError) return NextResponse.json({ error: updateError.code === 'PGRST116' ? 'Application changed by another admin.' : 'Unable to update application.' }, { status: updateError.code === 'PGRST116' ? 409 : 500 });

  const adminClient = createAdminClient();
  const { data: authUser } = await adminClient.auth.admin.getUserById(gate.subject);
  const actorName = String(authUser.user?.user_metadata?.full_name || authUser.user?.user_metadata?.name || authUser.user?.email || 'Admin').slice(0, 120);

  if (note) {
    const { error: noteError } = await adminClient.from('recruitment_application_notes').insert({ application_id: id, admin_user_id: gate.subject, admin_name: actorName, note });
    if (noteError) return NextResponse.json({ error: 'Status updated but note could not be saved.' }, { status: 500 });
  }

  const { error: auditError } = await adminClient.from('audit_logs').insert({ actor_user_id: gate.subject, actor_name: actorName, action: oldStatus === nextStatus ? 'APPLICATION_NOTE_ADDED' : 'APPLICATION_STATUS_CHANGED', entity_type: 'recruitment_application', entity_id: id, before_data: { status: oldStatus }, after_data: { status: nextStatus, noteAdded: Boolean(note) }, ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null });
  if (auditError) return NextResponse.json({ error: 'Status updated but audit logging failed.' }, { status: 500 });

  return NextResponse.json(updated, { headers: { 'Cache-Control': 'private, no-store' } });
}

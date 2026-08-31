import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

const statuses = new Set(['NEW', 'REVIEWING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']);
const cycleStatuses = new Set(['OPEN', 'CLOSED']);

const applicationPatchSchema = z.object({
  type: z.literal('application').default('application'),
  id: z.string().uuid(),
  status: z.string().transform((value) => value.toUpperCase()),
  expectedStatus: z.string().transform((value) => value.toUpperCase()).optional(),
  note: z.string().max(2000).optional().default(''),
});

const cyclePatchSchema = z.object({
  type: z.literal('cycle'),
  id: z.string().uuid(),
  status: z.enum(['OPEN', 'CLOSED']),
});

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

function firstDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : null;
}

function nextDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

export async function GET(request: Request) {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
  const search = (url.searchParams.get('q') || '').normalize('NFKC').replace(/[^a-zA-Z0-9@._\- ]/g, '').trim().slice(0, 100);
  const status = url.searchParams.get('status')?.toUpperCase() || '';
  const openingId = url.searchParams.get('opening') || '';
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';

  if (status && !statuses.has(status)) return NextResponse.json({ error: 'Invalid status filter.' }, { status: 422 });
  if (openingId && !/^[0-9a-f-]{36}$/i.test(openingId)) return NextResponse.json({ error: 'Invalid opening filter.' }, { status: 422 });

  let query = gate.supabase
    .from('recruitment_applications')
    .select('id,job_id,created_at,updated_at,full_name,nickname,email,phone,role,portfolio_link,status,resume_original_name,resume_size,reviewed_at,source,recruitment_jobs(title,slug)', { count: 'exact' });

  if (search) query = query.or(`full_name.ilike.%${search}%,nickname.ilike.%${search}%,email.ilike.%${search}%`);
  if (status) query = query.eq('status', status);
  if (openingId) query = query.eq('job_id', openingId);
  const fromValue = firstDay(from);
  const toValue = nextDay(to);
  if (fromValue) query = query.gte('created_at', fromValue);
  if (toValue) query = query.lt('created_at', toValue);

  const start = (page - 1) * pageSize;
  const [{ data, error, count }, { data: openings, error: openingsError }, { data: cycles, error: cyclesError }] = await Promise.all([
    query.order('created_at', { ascending: false }).range(start, start + pageSize - 1),
    gate.supabase.from('recruitment_jobs').select('id,title,slug,cycle_id,is_active,closes_at').order('created_at', { ascending: false }),
    gate.supabase.from('recruitment_cycles').select('id,name,status,starts_at,closes_at,created_at,updated_at').order('created_at', { ascending: false }),
  ]);

  if (error || openingsError || cyclesError) return NextResponse.json({ error: 'Unable to load recruitment data.' }, { status: 500 });

  return NextResponse.json(
    { applications: data ?? [], page, pageSize, total: count ?? 0, openings: openings ?? [], cycles: cycles ?? [] },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function PATCH(request: Request) {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid admin update.' }, { status: 400 });

  if ('type' in body && body.type === 'cycle') {
    const parsed = cyclePatchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid cycle update.' }, { status: 400 });

    const { data, error } = await gate.supabase
      .from('recruitment_cycles')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.id)
      .select('id,name,status,starts_at,closes_at,created_at,updated_at')
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Unable to update recruitment cycle.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Recruitment cycle not found.' }, { status: 404 });
    return NextResponse.json({ cycle: data }, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const parsed = applicationPatchSchema.safeParse(body);
  if (!parsed.success || !statuses.has(parsed.data.status) || (parsed.data.expectedStatus && !statuses.has(parsed.data.expectedStatus))) {
    return NextResponse.json({ error: 'Invalid application update.' }, { status: 400 });
  }

  const note = parsed.data.note.normalize('NFKC').trim();
  const { data, error } = await gate.supabase.rpc('admin_update_recruitment_application_v7', {
    application_id: parsed.data.id,
    next_status: parsed.data.status,
    expected_status: parsed.data.expectedStatus || '',
    note_text: note,
    client_ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '',
  });

  if (error) {
    if (error.message.includes('ADMIN_REQUIRED')) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    if (error.message.includes('APPLICATION_NOT_FOUND')) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (error.message.includes('STALE_APPLICATION')) return NextResponse.json({ error: 'Application changed by another admin. Refresh first.' }, { status: 409 });
    if (error.message.includes('INVALID_TRANSITION')) return NextResponse.json({ error: 'That status transition is not allowed.' }, { status: 409 });
    if (error.message.includes('NO_CHANGE')) return NextResponse.json({ error: 'No change requested.' }, { status: 422 });
    console.error('Admin recruitment update failed:', error.message);
    return NextResponse.json({ error: 'Unable to update application.' }, { status: 500 });
  }

  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}

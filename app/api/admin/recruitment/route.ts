import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

const statuses = new Set(['NEW', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']);

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

  const { data, error } = await gate.supabase
    .from('recruitment_applications')
    .select('id,created_at,updated_at,full_name,nickname,role,rank,hero_pool,experience,availability,contact,social_url,message,status,admin_note,reviewed_at,source')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request) {
  const gate = await ensureAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });

  const payload = body as Record<string, unknown>;
  const id = typeof payload.id === 'string' ? payload.id : '';
  const status = typeof payload.status === 'string' ? payload.status.toUpperCase() : '';
  const adminNote = typeof payload.adminNote === 'string' ? payload.adminNote.trim().slice(0, 1600) : '';
  if (!id || !statuses.has(status)) return NextResponse.json({ error: 'Invalid application update.' }, { status: 422 });

  const { data, error } = await gate.supabase
    .from('recruitment_applications')
    .update({ status, admin_note: adminNote, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,created_at,updated_at,full_name,nickname,role,rank,hero_pool,experience,availability,contact,social_url,message,status,admin_note,reviewed_at,source')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}

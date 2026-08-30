import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function adminGate() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : '';
  if (!userId) return null;
  const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
  return data ? { supabase, userId } : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await adminGate();
  if (!gate) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { id } = await params;
  const { data: application, error } = await gate.supabase.from('recruitment_applications').select('*,recruitment_jobs(title,slug,description,requirements)').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to load application.' }, { status: 500 });
  if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  const { data: notes } = await gate.supabase.from('recruitment_application_notes').select('id,admin_user_id,admin_name,note,created_at').eq('application_id', id).order('created_at', { ascending: false });

  let resumeUrl: string | null = null;
  if (application.resume_path) {
    const admin = createAdminClient();
    const { data } = await admin.storage.from('recruitment-resumes').createSignedUrl(application.resume_path, 300);
    resumeUrl = data?.signedUrl ?? null;
  }
  return NextResponse.json({ application, notes: notes ?? [], resumeUrl }, { headers: { 'Cache-Control': 'private, no-store' } });
}

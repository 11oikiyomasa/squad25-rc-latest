import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

type AdminContext =
  | { ok: false; reason: 'unconfigured' | 'unauthenticated' | 'forbidden' | 'unavailable'; status: 401 | 403 | 503; message: string }
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string };

async function getAdminContext(): Promise<AdminContext> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: 'unconfigured', status: 503, message: 'Supabase is not configured.' };
  }

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const subject = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : '';

  if (claimsError || !subject) {
    return { ok: false, reason: 'unauthenticated', status: 401, message: 'Authentication required.' };
  }

  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', subject)
    .maybeSingle();

  if (adminError) {
    return { ok: false, reason: 'unavailable', status: 503, message: 'Unable to verify admin access.' };
  }

  if (!admin) {
    return { ok: false, reason: 'forbidden', status: 403, message: 'Admin access required.' };
  }

  return { ok: true, supabase, userId: subject };
}

export async function ensureAdmin() {
  return getAdminContext();
}

export async function requireAdmin() {
  const gate = await getAdminContext();

  if (gate.ok) return { configured: true as const, userId: gate.userId };
  if (gate.reason === 'unconfigured') return { configured: false as const };
  if (gate.reason === 'unauthenticated') redirect('/login?error=not_authenticated&next=%2Fadmin');
  if (gate.reason === 'forbidden') redirect('/403');
  redirect('/login?error=admin_unavailable&next=%2Fadmin');
}

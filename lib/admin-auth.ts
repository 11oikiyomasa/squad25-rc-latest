import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function requireAdmin() {
  if (!isSupabaseConfigured()) return { configured: false as const };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = typeof data?.claims?.sub === 'string' ? data.claims.sub : '';

  if (error || !subject) redirect('/login?error=not_authenticated&next=%2Fadmin');

  const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', subject).maybeSingle();
  if (!admin) redirect('/login?error=not_admin&next=%2Fadmin');

  return { configured: true as const, userId: subject };
}

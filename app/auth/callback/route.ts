import { NextResponse, type NextRequest } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next');
  const destination = next && next.startsWith('/') ? next : '/admin';

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login?error=invalid_callback', request.url));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth_unavailable', request.url));
  }
}

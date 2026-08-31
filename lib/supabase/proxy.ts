import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { exceedsRequestBodyLimit } from '@/lib/security/body-limit';
import { hasValidRecruitmentOrigin } from '@/lib/security/origin';
import { checkRecruitmentRateLimit } from '@/lib/security/rate-limit';
import { securityResponse } from '@/lib/security/error-response';

const ROLE_ANON = 'ROLE_ANON' as const;
const ROLE_ADMIN = 'ROLE_ADMIN' as const;
type RequestRole = typeof ROLE_ANON | typeof ROLE_ADMIN;

function isRecruitmentPost(request: NextRequest) {
  return request.method === 'POST' && request.nextUrl.pathname === '/api/recruitment';
}

async function getRequestRole(
  supabase: ReturnType<typeof createServerClient>,
): Promise<RequestRole | null> {
  const { data } = await supabase.auth.getClaims();
  const subject = typeof data?.claims?.sub === 'string' ? data.claims.sub : '';
  if (!subject) return ROLE_ANON;

  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', subject)
    .maybeSingle();

  if (error) return null;
  return admin?.user_id === subject ? ROLE_ADMIN : ROLE_ANON;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminApiRoute = pathname.startsWith('/api/admin/');

  // Recruitment perimeter runs before the Route Handler is allowed to inspect
  // the request body. Step 5 owns Zod, file probing, anti-abuse, and persistence.
  if (isRecruitmentPost(request)) {
    const rateLimit = await checkRecruitmentRateLimit(request);
    if ('unavailable' in rateLimit && rateLimit.unavailable) return securityResponse('RATE_LIMIT_UNAVAILABLE');

    if (!rateLimit.allowed) {
      const response = securityResponse('RATE_LIMITED');
      response.headers.set('Retry-After', String(rateLimit.retryAfterSeconds));
      return response;
    }

    if (!hasValidRecruitmentOrigin(request)) return securityResponse('SEC_INVALID_ORIGIN');
    if (exceedsRequestBodyLimit(request)) return securityResponse('PAYLOAD_TOO_LARGE');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    if (isAdminRoute || isAdminApiRoute) return securityResponse('INTERNAL_ERROR');
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => supabaseResponse.headers.set(name, value));
      },
    },
  });

  if (isAdminRoute || isAdminApiRoute) {
    const { data } = await supabase.auth.getClaims();
    const subject = typeof data?.claims?.sub === 'string' ? data.claims.sub : '';

    if (!subject) {
      if (isAdminRoute) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.search = '';
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return securityResponse('AUTH_REQUIRED');
    }

    const role = await getRequestRole(supabase);
    if (role === null) return securityResponse('INTERNAL_ERROR');
    if (role !== ROLE_ADMIN) return securityResponse('FORBIDDEN');
  }

  return supabaseResponse;
}

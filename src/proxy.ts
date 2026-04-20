import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(), payment=()'
  );
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  return res;
}

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session (important for token renewal)
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect /dashboard routes (except login and register)
  if (
    pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/dashboard/login') &&
    !pathname.startsWith('/dashboard/register')
  ) {
    if (!user) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/dashboard/login', request.url))
      );
    }
  }

  // Protect /admin routes — only super admin
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/dashboard/login', request.url))
      );
    }
    // Admin check is done at the page level (checking briefing_profiles.is_admin)
    // Proxy just ensures authentication
  }

  // Redirect logged-in users away from login/register
  if (
    user &&
    (pathname === '/dashboard/login' || pathname === '/dashboard/register')
  ) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL('/dashboard', request.url))
    );
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { authCookieOptions, publishableKey, supabaseConfigured, supabaseUrl } from './lib/supabase/config';

/**
 * 1. Keeps the Supabase session fresh (rotates the access token into HttpOnly cookies before it expires).
 * 2. Coarse gate: /admin and /account need a session. The real checks (staff row, role, second factor,
 *    customer ownership) run on the server in requireStaff / requireCustomer for every page and action.
 * 3. Private areas are never cached by browsers or CDNs.
 */
const PUBLIC_ADMIN = ['/admin/login'];
const PUBLIC_ACCOUNT = ['/account/login', '/account/register', '/account/forgot', '/account/reset'];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  let res = NextResponse.next({ request: req });
  let signedIn = false;

  if (supabaseConfigured()) {
    const supabase = createServerClient(supabaseUrl(), publishableKey(), {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: list => {
          for (const { name, value } of list) req.cookies.set(name, value);
          res = NextResponse.next({ request: req });
          for (const { name, value, options } of list) res.cookies.set(name, value, { ...options, httpOnly: true });
        },
      },
    });
    // Must run straight after creating the client: verifies the JWT and refreshes it if needed.
    const { data } = await supabase.auth.getClaims();
    signedIn = !!data?.claims?.sub;
  }

  const redirect = (to: URL) => {
    const r = NextResponse.redirect(to);
    for (const c of res.cookies.getAll()) r.cookies.set(c); // keep any refreshed session cookies
    return r;
  };

  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAccount = pathname === '/account' || pathname.startsWith('/account/');
  if (isAdmin && !PUBLIC_ADMIN.some(p => pathname === p || pathname.startsWith(p + '/')) && !signedIn) {
    return redirect(new URL('/admin/login', req.url));
  }
  if (isAccount && !PUBLIC_ACCOUNT.includes(pathname) && !signedIn) {
    const u = new URL('/account/login', req.url); u.searchParams.set('next', pathname + search);
    return redirect(u);
  }
  if (isAdmin || isAccount || pathname.startsWith('/order/') || pathname.startsWith('/invoice/') || pathname.startsWith('/checkout')) {
    res.headers.set('Cache-Control', 'private, no-store, max-age=0');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export const config = {
  // Everything except static assets and image optimisation (no session work for files).
  matcher: ['/((?!_next/static|_next/image|favicon|icon|apple-icon|robots.txt|sitemap.xml|images/|models/|videos/|decor/|brand/|fonts/|research/|uploads/|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|glb|mp4|webm|woff2?|pdf|txt|xml)$).*)'],
};

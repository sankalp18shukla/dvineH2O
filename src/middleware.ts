import { NextResponse, type NextRequest } from 'next/server';
import { CUSTOMER_COOKIE, STAFF_COOKIE, readSession } from './lib/session';

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const s = await readSession(req.cookies.get(STAFF_COOKIE)?.value);
    if (!s || s.kind !== 'staff') return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  if (pathname.startsWith('/account') && !['/account/login', '/account/register'].includes(pathname)) {
    const s = await readSession(req.cookies.get(CUSTOMER_COOKIE)?.value);
    if (!s || s.kind !== 'customer') {
      const u = new URL('/account/login', req.url); u.searchParams.set('next', pathname + search);
      return NextResponse.redirect(u);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/account/:path*'] };

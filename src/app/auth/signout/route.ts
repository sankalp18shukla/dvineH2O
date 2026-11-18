import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { safeNext } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * Ends the session and continues to `next` (used when a staff session reaches its maximum age).
 * Only signs out for same-site navigations, so another site can't log people out with a link.
 */
export async function GET(req: NextRequest) {
  const site = req.headers.get('sec-fetch-site');
  if (supabaseConfigured() && (site === 'same-origin' || site === 'none')) await (await supabaseServer()).auth.signOut();
  return NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get('next'), '/'), req.nextUrl.origin), 303);
}

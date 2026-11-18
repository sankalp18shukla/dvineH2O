import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { linkCustomerAccount } from '@/lib/customers';
import { safeNext } from '@/lib/security';

export const dynamic = 'force-dynamic';

const TYPES: EmailOtpType[] = ['signup', 'email', 'recovery', 'invite', 'email_change', 'magiclink'];

/**
 * Landing page for links in Supabase Auth emails (see docs/supabase.md › Email templates):
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 * The one-time token is exchanged on the server for a session in HttpOnly cookies.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const code = url.searchParams.get('code'); // PKCE links (emailRedirectTo with the default templates)
  const go = (path: string) => NextResponse.redirect(new URL(path, url.origin), 303);

  const sb = await supabaseServer();
  let user = null;
  if (tokenHash && type && TYPES.includes(type)) {
    const { data, error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) user = data.user;
  } else if (code) {
    const { data, error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) user = data.user;
  }
  if (!user) return go('/account/login?link=expired');

  if (type === 'recovery') return go('/account/reset');
  if (type === 'email_change') return go('/account/profile?email=updated');
  const customer = await linkCustomerAccount(user);
  if (!customer) return go('/admin');
  return go(safeNext(url.searchParams.get('next'), '/account?welcome=1'));
}

import { NextResponse, type NextRequest } from 'next/server';
import { setCoupon } from '@/lib/cart';
import { findReferrer, getReferralSettings } from '@/lib/referrals';
import { CODE_RE, normaliseCode } from '@/lib/coupon-info';
import { limitRequest } from '@/lib/security';

const safePath = (p: string | null) => (p && p.startsWith('/') && !p.startsWith('//') && !p.startsWith('/\\') ? p : null);

/**
 * A customer's share link, e.g. /r/ANITA-7K2Q (or /r/ANITA-7K2Q?to=/hydrogen-bottles). It puts the friend's code on
 * the visitor's cart and lands them on the home page, where a note says the welcome discount is waiting.
 * Whether they qualify (first order, not their own code) is checked in the cart and again at checkout.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = normaliseCode(decodeURIComponent((await params).code));
  const dest = new URL(safePath(req.nextUrl.searchParams.get('to')) ?? '/', req.nextUrl.origin);
  let result = 'invalid';
  if (CODE_RE.test(code) && (await limitRequest('coupon'))) {
    const [referrer, s] = await Promise.all([findReferrer(code), getReferralSettings()]);
    if (referrer && s.enabled) { await setCoupon(code); result = 'referral'; }
    else if (referrer) result = 'paused';
  }
  dest.searchParams.set('offer', `${result}:${code}`);
  const res = NextResponse.redirect(dest, 303);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}

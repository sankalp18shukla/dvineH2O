import { NextResponse, type NextRequest } from 'next/server';
import { setCoupon } from '@/lib/cart';
import { liveCoupon } from '@/lib/promo-codes';
import { CODE_RE, normaliseCode } from '@/lib/coupon-info';
import { limitRequest } from '@/lib/security';

/** Only paths on this site; anything else goes to the cart. */
const safePath = (p: string | null) => (p && p.startsWith('/') && !p.startsWith('//') && !p.startsWith('/\\') ? p : null);

/**
 * Share link for a coupon, e.g. /offer/DIWALI10 or /offer/DIWALI10?to=/hydrogen-bottles. It puts the code on the
 * visitor's cart and lands them on the page (or back where they tapped the ribbon), where a note says it is applied.
 * Links can go in WhatsApp messages, Instagram bios and emails; the discount shows once the cart has a product it covers.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = normaliseCode(decodeURIComponent((await params).code));
  const ref = (() => { try { return new URL(req.headers.get('referer') ?? ''); } catch { return null; } })();
  // the offer note is added afresh, so an earlier one on the page we came from is dropped
  ref?.searchParams.delete('offer');
  const back = ref && ref.origin === req.nextUrl.origin ? ref.pathname + ref.search : null;
  const dest = new URL(safePath(req.nextUrl.searchParams.get('to')) ?? safePath(back) ?? '/cart', req.nextUrl.origin);

  let result = 'invalid';
  if (CODE_RE.test(code) && (await limitRequest('coupon'))) {
    const r = await liveCoupon(code);
    if ('coupon' in r) { await setCoupon(code); result = 'applied'; }
    else result = r.state === 'ended' || r.state === 'used' ? 'ended' : r.state === 'scheduled' ? 'soon' : 'invalid';
  }
  dest.searchParams.set('offer', `${result}:${code}`);
  return NextResponse.redirect(dest, 303);
}

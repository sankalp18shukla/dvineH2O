import { db, type DB, type Tx } from './db';
import { computeTotals, findCoupon, type PriceLine, type Totals } from './pricing';
import { getCommerce } from './settings';
import { findReferrer, getReferralSettings, referralBlocker, referralDiscount } from './referrals';

export type Shopper = { customerId: number | null; email?: string | null; phone?: string | null };
export type CartTotals = Totals & { isReferral?: boolean; referrerId?: number };

/**
 * Applies a coupon or a friend's referral code (whichever the code turns out to be). Pass `q` inside a
 * transaction. `who` is the shopper: a customer id in the cart, plus email and phone at checkout, so a referral
 * code is refused for the referrer themselves and for anyone who has ordered before.
 */
export async function priceCart(lines: PriceLine[], code: string | null, who: number | null | Shopper, q: DB | Tx = db): Promise<CartTotals> {
  const shopper: Shopper = typeof who === 'object' && who ? who : { customerId: who as number | null };
  const commerce = await getCommerce(q);
  const base = { shippingFee: commerce.shippingFee, freeShippingAbove: commerce.freeShippingAbove, customerId: shopper.customerId };
  if (!code) return computeTotals(lines, base);
  const coupon = await findCoupon(q, code);
  if (coupon) return computeTotals(lines, { ...base, coupon, couponCode: code });
  const referrer = await findReferrer(code, q);
  if (referrer) {
    const s = await getReferralSettings(q);
    const blocked = await referralBlocker(referrer, shopper, s, q);
    const amount = blocked ? 0 : referralDiscount(s, lines.reduce((t, l) => t + l.unitPrice * l.qty, 0));
    if (amount) return { ...computeTotals(lines, { ...base, couponCode: code, referralAmount: amount }), isReferral: true, referrerId: referrer.id };
    return { ...computeTotals(lines, base), couponCode: null, couponError: blocked ?? 'This code is not valid.' };
  }
  return computeTotals(lines, { ...base, couponCode: code });
}

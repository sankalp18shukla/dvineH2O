import { db, type DB, type Tx } from './db';
import { computeTotals, findCoupon, type PriceLine } from './pricing';
import { getCommerce } from './settings';
import { findReferrer, getReferralSettings, referralDiscount } from './referrals';

/** Applies a coupon or a friend's referral code (whichever the code turns out to be). Pass `q` inside a transaction. */
export async function priceCart(lines: PriceLine[], code: string | null, customerId: number | null, q: DB | Tx = db) {
  const commerce = await getCommerce(q);
  const base = { shippingFee: commerce.shippingFee, freeShippingAbove: commerce.freeShippingAbove, customerId };
  if (!code) return computeTotals(lines, base);
  const coupon = await findCoupon(q, code);
  if (coupon) return computeTotals(lines, { ...base, coupon, couponCode: code });
  const referrer = await findReferrer(code, q);
  if (referrer && referrer.id !== customerId) {
    const s = await getReferralSettings(q);
    const amount = referralDiscount(s, lines.reduce((t, l) => t + l.unitPrice * l.qty, 0));
    if (amount) return { ...computeTotals(lines, { ...base, couponCode: code, referralAmount: amount }), isReferral: true };
  }
  return computeTotals(lines, { ...base, couponCode: code });
}

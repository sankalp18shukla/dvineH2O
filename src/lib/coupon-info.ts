/**
 * Coupons as the website, the admin and the chat assistant describe them. Plain values only (dates as ISO
 * strings), so the same object can be passed to client components. The cart's own rules are in pricing.ts.
 */
import { formatINR } from './money';

export type CouponInfo = {
  code: string; type: 'percent' | 'flat'; value: number; minOrder: number; maxDiscount: number | null;
  appliesTo: string[] | null; startsAt: string | null; endsAt: string | null;
  usageLimit: number | null; usedCount: number; active: boolean;
};

type Row = Omit<CouponInfo, 'startsAt' | 'endsAt'> & { startsAt: Date | null; endsAt: Date | null };
export const couponInfo = (c: Row): CouponInfo => ({
  code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, maxDiscount: c.maxDiscount, appliesTo: c.appliesTo?.length ? c.appliesTo : null,
  startsAt: c.startsAt?.toISOString() ?? null, endsAt: c.endsAt?.toISOString() ?? null, usageLimit: c.usageLimit, usedCount: c.usedCount, active: c.active,
});

/** Products a coupon can be limited to (Titan is sold on quotation, so never through the cart). */
export const COUPON_PRODUCTS = [{ slug: 'crystal', name: 'Crystal' }, { slug: 'hyper', name: 'Hyper' }] as const;

/** live: works in the cart now. The others say why it does not. */
export type CouponState = 'live' | 'scheduled' | 'ended' | 'used' | 'off';
export function couponState(c: CouponInfo, now = new Date()): CouponState {
  if (!c.active) return 'off';
  if (c.endsAt && new Date(c.endsAt) < now) return 'ended';
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return 'used';
  if (c.startsAt && new Date(c.startsAt) > now) return 'scheduled';
  return 'live';
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
export const COUPON_STATE_LABEL: Record<CouponState, (c: CouponInfo) => string> = {
  live: c => (c.endsAt ? `Live until ${day(c.endsAt)}` : 'Live'),
  scheduled: c => `Starts ${day(c.startsAt!)}`,
  ended: c => `Ended ${day(c.endsAt!)}`,
  used: () => 'Fully used',
  off: () => 'Switched off',
};

/** Which products the coupon is limited to, or null when it covers everything the cart sells. */
export function couponProducts(c: Pick<CouponInfo, 'appliesTo'>): string[] | null {
  const list = COUPON_PRODUCTS.filter(p => c.appliesTo?.includes(p.slug));
  return !c.appliesTo?.length || list.length === COUPON_PRODUCTS.length ? null : list.map(p => p.name);
}

/** What the code gives, in a line: "10% off Crystal, up to ₹2,000 · on orders of ₹5,000 or more". */
export function describeCoupon(c: CouponInfo) {
  const off = c.type === 'percent' ? `${c.value}% off` : `${formatINR(c.value)} off`;
  const on = couponProducts(c);
  const parts = [`${off}${on ? ` ${on.join(' and ')}` : ''}${c.type === 'percent' && c.maxDiscount ? `, up to ${formatINR(c.maxDiscount)}` : ''}`];
  if (c.minOrder) parts.push(`on orders of ${formatINR(c.minOrder)} or more`);
  return parts.join(' · ');
}

/** Codes are letters, numbers and dashes; anything else is not one of ours. */
export const normaliseCode = (raw: string) => raw.trim().toUpperCase().replace(/\s+/g, '');
export const CODE_RE = /^[A-Z0-9-]{3,24}$/;

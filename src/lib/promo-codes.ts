import 'server-only';
import { and, desc, inArray, isNull } from 'drizzle-orm';
import { db } from './db';
import { coupons } from './db/schema';
import { couponInfo, couponState, describeCoupon, type CouponInfo, type CouponState } from './coupon-info';
import { couponDiscount, type PriceLine } from './pricing';
import { PRODUCT_PAGES, isLive, todayIST, type SiteContent } from './site-content';

/** Every coupon the team can promote. Personal reward coupons are left out. */
export async function publicCoupons(): Promise<CouponInfo[]> {
  const rows = await db.query.coupons.findMany({ where: isNull(coupons.ownerCustomerId), orderBy: desc(coupons.createdAt) });
  return rows.map(couponInfo);
}

/**
 * Every promotion that can carry a code: where it is (for the admin), and whether it shows today.
 * Titan's offer ticket is left out: its code is free text that visitors quote when they enquire.
 */
type Holder = { code: string };
export function codeSpots(c: SiteContent, today = todayIST()) {
  const out: { holder: Holder; where: string; showing: boolean }[] = [];
  const name = (t: string, tag: string) => `“${(t || tag || 'untitled').replace(/\n/g, ' ')}”`;
  out.push({ holder: c.ribbon, where: 'Announcement ribbon', showing: c.ribbon.enabled && isLive(c.ribbon, today) });
  c.slides.forEach(s => out.push({ holder: s, where: `Hero slide ${name(s.title, s.tag)}`, showing: isLive(s, today) }));
  c.promo.cards.forEach(x => out.push({ holder: x, where: `Homepage card ${name(x.title, x.tag)}`, showing: c.promo.enabled && isLive(x, today) }));
  for (const p of PRODUCT_PAGES) {
    const pp = c.products[p.key];
    if (p.key !== 'titan') out.push({ holder: pp.offer, where: `${p.name} offer ticket`, showing: isLive(pp.offer, today) });
    pp.banner.cards.forEach(x => out.push({ holder: x, where: `${p.name} page card ${name(x.title, x.tag)}`, showing: pp.banner.enabled && isLive(x, today) }));
  }
  return out.filter(s => s.holder.code.trim());
}

async function couponsByCode(codes: string[]) {
  if (!codes.length) return [];
  return db.query.coupons.findMany({ where: and(inArray(coupons.code, codes), isNull(coupons.ownerCustomerId)) });
}

/**
 * The content as visitors see it: a promotion shows its code only while that coupon works in the cart, so the
 * site never advertises a code that has ended, run out, or not started. The promotion itself still shows.
 */
export async function withLiveCodes(c: SiteContent): Promise<SiteContent> {
  const n = structuredClone(c);
  const spots = codeSpots(n);
  if (!spots.length) return n;
  const codes = [...new Set(spots.map(s => s.holder.code.trim().toUpperCase()))];
  const live = new Set(await couponsByCode(codes).then(rows => rows.map(couponInfo).filter(x => couponState(x) === 'live').map(x => x.code), () => [] as string[]));
  for (const s of spots) { const k = s.holder.code.trim().toUpperCase(); s.holder.code = live.has(k) ? k : ''; }
  return n;
}

/** The coupons promoted on the site today that work in the cart now (for the cart's offer list and the chat). */
export async function liveOffers(c: SiteContent) {
  const codes = [...new Set(codeSpots(c).filter(s => s.showing).map(s => s.holder.code.toUpperCase()))];
  const rows = await couponsByCode(codes).catch(() => []);
  return rows.filter(r => couponState(couponInfo(r)) === 'live');
}

export type CartOffer = { code: string; text: string; saving: number; reason?: string };

/** The offers running on the site today, and what each would take off this cart (or why it would not apply). */
export async function cartOffers(c: SiteContent, lines: PriceLine[]): Promise<CartOffer[]> {
  return (await liveOffers(c))
    .map(r => {
      const d = couponDiscount(r, lines);
      return { code: r.code, text: describeCoupon(couponInfo(r)), saving: d.amount, reason: d.amount ? undefined : d.error };
    })
    .sort((a, b) => b.saving - a.saving);
}

const WHY: Record<Exclude<CouponState, 'live'>, string> = {
  scheduled: 'This offer has not started yet.', ended: 'This offer has ended.', used: 'This offer has been fully claimed.', off: 'This code is not valid.',
};
/** A code a visitor taps or follows a link for: the coupon when it works now, otherwise the reason it does not. */
export async function liveCoupon(code: string): Promise<{ coupon: CouponInfo } | { error: string; state: CouponState | 'missing' }> {
  const [row] = await couponsByCode([code]).catch(() => []);
  if (!row) return { error: 'This code is not valid.', state: 'missing' };
  const c = couponInfo(row);
  const st = couponState(c);
  return st === 'live' ? { coupon: c } : { error: WHY[st], state: st };
}

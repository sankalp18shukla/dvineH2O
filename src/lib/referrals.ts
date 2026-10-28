import { and, eq, sql } from 'drizzle-orm';
import { db, type Tx } from './db';
import { coupons, customers, referrals, orders } from './db/schema';
import { getSetting } from './settings';
import { randomToken } from './numbering';

export type ReferralSettings = { enabled: boolean; friendPercent: number; friendMax: number; rewardFlat: number; rewardMinOrder: number; rewardValidDays: number };
export const DEFAULT_REFERRAL: ReferralSettings = { enabled: true, friendPercent: 5, friendMax: 300000, rewardFlat: 100000, rewardMinOrder: 0, rewardValidDays: 180 };
export const getReferralSettings = () => getSetting<ReferralSettings>('referral', DEFAULT_REFERRAL);

/** Each registered customer gets one code, e.g. ANITA-7K2Q. */
export async function ensureReferralCode(customerId: number) {
  const c = await db.query.customers.findFirst({ where: eq(customers.id, customerId) });
  if (!c) return null;
  if (c.referralCode) return c.referralCode;
  const base = (c.name.split(' ')[0] || 'DVINE').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'DVINE';
  for (let i = 0; i < 5; i++) {
    const code = `${base}-${randomToken(4).toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 4)}`;
    try { await db.update(customers).set({ referralCode: code }).where(eq(customers.id, customerId)); return code; } catch { /* collision, retry */ }
  }
  return null;
}

export async function findReferrer(code: string) {
  return db.query.customers.findFirst({ where: eq(sql`upper(${customers.referralCode})`, code.trim().toUpperCase()) });
}

/** Friend discount for a referral code (percent of subtotal, capped). */
export function referralDiscount(s: ReferralSettings, subtotal: number) {
  if (!s.enabled) return 0;
  return Math.min(Math.round((subtotal * s.friendPercent) / 100), s.friendMax);
}

/** When a referred order is paid, record it and issue the referrer a personal reward coupon. */
export async function qualifyReferral(tx: Tx, orderId: number) {
  const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order?.referralCode) return;
  const referrer = await tx.query.customers.findFirst({ where: eq(sql`upper(${customers.referralCode})`, order.referralCode.toUpperCase()) });
  if (!referrer || referrer.id === order.customerId) return;
  const s = await getReferralSettings();
  const code = `THANKS-${randomToken(5).toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 6)}`;
  const ends = new Date(Date.now() + s.rewardValidDays * 86400_000);
  await tx.insert(coupons).values({ code, type: 'flat', value: s.rewardFlat, minOrder: s.rewardMinOrder, usageLimit: 1, endsAt: ends, ownerCustomerId: referrer.id, note: `Referral reward for ${order.number}` });
  await tx.insert(referrals).values({ referrerId: referrer.id, referredCustomerId: order.customerId, orderId, code: order.referralCode, discount: order.discount, status: 'rewarded', rewardCouponCode: code });
}

/** Cancelled/refunded referred order: void the unused reward. */
export async function voidReferral(tx: Tx, orderId: number) {
  const r = await tx.query.referrals.findFirst({ where: eq(referrals.orderId, orderId) });
  if (!r) return;
  await tx.update(referrals).set({ status: 'void' }).where(eq(referrals.id, r.id));
  if (r.rewardCouponCode) await tx.update(coupons).set({ active: false }).where(and(eq(coupons.code, r.rewardCouponCode), eq(coupons.usedCount, 0)));
}

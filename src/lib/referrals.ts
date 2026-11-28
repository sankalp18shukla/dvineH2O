/**
 * Refer a friend.
 *
 * A customer gets a personal code (ANITA-7K2Q) and share link (/r/ANITA-7K2Q) after their first purchase (client,
 * Nov 2026): it is created when the payment comes in, and shown in their account only once they have bought. A friend who uses it
 * gets a discount on their first DVINE order. The referrer's reward is a one-time ₹ coupon, personal to their
 * account, released only once the friend's order has been delivered and kept past the return window, so a
 * cancelled or returned order never pays out.
 *
 *   friend pays ─▶ pending ─▶ order delivered ─▶ qualified ─▶ hold days pass ─▶ rewarded (coupon + WhatsApp/email)
 *                    └──────────── cancelled / returned / fully refunded ─────────▶ void (unused reward switched off)
 *
 * Rewards are released by the maintenance job (/api/cron/maintenance), on delivery when the hold is 0 days,
 * whenever the referrer or the team opens their referral page, or by hand from Admin › Referrals.
 */
import { and, desc, eq, inArray, ne, or, sql } from 'drizzle-orm';
import { db, type DB, type Tx } from './db';
import { coupons, customers, referrals, orders, orderEvents } from './db/schema';
import { getSetting, setSetting } from './settings';
import { randomToken } from './numbering';
import { formatINR } from './money';

export type ReferralSettings = {
  enabled: boolean;
  /** friend's discount: % of the cart, capped at friendMax (paise) */
  friendPercent: number; friendMax: number;
  /** referrer's reward: a flat ₹ coupon (paise), usable on orders of at least rewardMinOrder, for rewardValidDays */
  rewardFlat: number; rewardMinOrder: number; rewardValidDays: number;
  /** days after delivery before the reward is released (the return window) */
  holdDays: number;
  /** most rewards one customer can earn; 0 = no limit */
  maxRewards: number;
};
export const DEFAULT_REFERRAL: ReferralSettings = {
  enabled: true, friendPercent: 5, friendMax: 300000, rewardFlat: 100000, rewardMinOrder: 0, rewardValidDays: 180, holdDays: 7, maxRewards: 0,
};
export const getReferralSettings = (q?: DB | Tx) => getSetting<ReferralSettings>('referral', DEFAULT_REFERRAL, q);
export const saveReferralSettingsValue = (v: ReferralSettings) => setSetting('referral', v);

/** "5% off your first order, up to ₹3,000" */
export const friendOfferText = (s: ReferralSettings) => `${s.friendPercent}% off ${s.friendMax ? `(up to ${formatINR(s.friendMax)}) ` : ''}their first order`;

/** A customer's one code, e.g. ANITA-7K2Q. Called once they have paid for an order (see referralCodeIfBought). */
export async function ensureReferralCode(customerId: number) {
  const c = await db.query.customers.findFirst({ where: eq(customers.id, customerId) });
  if (!c) return null;
  if (c.referralCode) return c.referralCode;
  const base = (c.name.split(' ')[0] || 'DVINE').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'DVINE';
  for (let i = 0; i < 5; i++) {
    const code = `${base}-${randomToken(6).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/[O0I1]/g, '').slice(0, 4).padEnd(4, 'X')}`;
    try { await db.update(customers).set({ referralCode: code }).where(eq(customers.id, customerId)); return code; } catch { /* collision, retry */ }
  }
  return null;
}

/** The customer's code once they have paid for an order, created on first need; null before their first purchase. */
export async function referralCodeIfBought(customerId: number) {
  const [paid] = await db.select({ id: orders.id }).from(orders)
    .where(and(eq(orders.customerId, customerId), inArray(orders.paymentStatus, ['paid', 'partially_refunded']))).limit(1);
  return paid ? ensureReferralCode(customerId) : null;
}

export async function findReferrer(code: string, q: DB | Tx = db) {
  return q.query.customers.findFirst({ where: eq(sql`upper(${customers.referralCode})`, code.trim().toUpperCase()) });
}

/** Friend discount for a referral code (percent of subtotal, capped). */
export function referralDiscount(s: ReferralSettings, subtotal: number) {
  if (!s.enabled) return 0;
  // whole rupees, so the invoice shows ₹749 off rather than ₹749.95
  const pct = Math.floor((subtotal * s.friendPercent) / 100 / 100) * 100;
  return s.friendMax ? Math.min(pct, s.friendMax) : pct;
}

const digits = (p?: string | null) => (p ?? '').replace(/\D/g, '').slice(-10);
const sameEmail = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Why a referral code can't be used by this shopper, or null when it can. Checked in the cart (signed-in shoppers)
 * and again at checkout, once the email and phone are known.
 */
export async function referralBlocker(
  referrer: typeof customers.$inferSelect, who: { customerId?: number | null; email?: string | null; phone?: string | null }, s: ReferralSettings, q: DB | Tx = db,
): Promise<string | null> {
  if (!s.enabled) return 'Referral codes are paused right now.';
  if ((who.customerId && who.customerId === referrer.id) || sameEmail(who.email, referrer.email) || (digits(who.phone).length === 10 && digits(who.phone) === digits(referrer.phone)))
    return 'You can’t use your own referral code. Share it with a friend instead.';
  const conds = [
    who.customerId ? eq(orders.customerId, who.customerId) : undefined,
    who.email ? eq(sql`lower(${orders.contactEmail})`, who.email.trim().toLowerCase()) : undefined,
    digits(who.phone).length === 10 ? sql`right(regexp_replace(${orders.contactPhone}, '\\D', '', 'g'), 10) = ${digits(who.phone)}` : undefined,
  ].filter(Boolean);
  if (conds.length) {
    const prior = await q.select({ id: orders.id }).from(orders).where(and(or(...conds), inArray(orders.paymentStatus, ['paid', 'partially_refunded', 'refunded']))).limit(1);
    if (prior.length) return 'Referral codes are for a first order with DVINE.';
  }
  if (s.maxRewards > 0) {
    const used = await q.$count(referrals, and(eq(referrals.referrerId, referrer.id), ne(referrals.status, 'void')));
    if (used >= s.maxRewards) return 'This referral code has reached its limit.';
  }
  return null;
}

/** Friend's order is paid: record the referral (the reward waits for delivery). Returns what to tell the referrer. */
export async function qualifyReferral(tx: Tx, orderId: number) {
  const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order?.referralCode) return null;
  const referrer = await findReferrer(order.referralCode, tx);
  if (!referrer || referrer.id === order.customerId) return null;
  if (await tx.query.referrals.findFirst({ where: eq(referrals.orderId, orderId) })) return null;
  // one reward per friend, even if two first orders were paid at the same time
  const earlier = await tx.query.referrals.findFirst({ where: and(eq(referrals.referredCustomerId, order.customerId), ne(referrals.status, 'void')) });
  await tx.insert(referrals).values({ referrerId: referrer.id, referredCustomerId: order.customerId, orderId, code: order.referralCode, discount: order.discount, status: earlier ? 'void' : 'pending' });
  return earlier ? null : { referrer, friend: order.contactName.split(' ')[0] };
}

/** The friend's order arrived: start the hold. With a 0-day hold the reward goes out now. */
export async function markReferralDelivered(orderId: number) {
  const [r] = await db.update(referrals).set({ status: 'qualified' }).where(and(eq(referrals.orderId, orderId), eq(referrals.status, 'pending'))).returning();
  if (r) await releaseDueReferrals({ referralId: r.id });
}

/** Cancelled / returned / fully refunded referred order: void it and switch off an unused reward. */
export async function voidReferral(tx: Tx, orderId: number) {
  const r = await tx.query.referrals.findFirst({ where: eq(referrals.orderId, orderId) });
  if (!r || r.status === 'void') return;
  await tx.update(referrals).set({ status: 'void' }).where(eq(referrals.id, r.id));
  if (r.rewardCouponCode) await tx.update(coupons).set({ active: false }).where(and(eq(coupons.code, r.rewardCouponCode), eq(coupons.usedCount, 0)));
}

/** When the referred order was delivered (null if it hasn't been). */
async function deliveredAt(orderId: number, q: DB | Tx = db) {
  const ev = await q.query.orderEvents.findFirst({ where: and(eq(orderEvents.orderId, orderId), eq(orderEvents.status, 'delivered')), orderBy: desc(orderEvents.createdAt) });
  return ev?.createdAt ?? null;
}

/** When a qualified referral's reward is due. */
export async function rewardDueAt(r: { orderId: number | null }, s: ReferralSettings, q: DB | Tx = db) {
  if (!r.orderId) return null;
  const at = await deliveredAt(r.orderId, q);
  return at ? new Date(at.getTime() + s.holdDays * 86_400_000) : null;
}

/**
 * Issues every reward whose hold has passed (or the given ones; `force` skips the hold, for the team).
 * Each referral is claimed with a conditional update first, so two runs at once never issue twice.
 * `q` and `silent` are for tests (run inside a transaction that is rolled back, without messaging anyone).
 */
export async function releaseDueReferrals(opts: { referralId?: number; referrerId?: number; force?: boolean; silent?: boolean } = {}, q: DB | Tx = db) {
  const s = await getReferralSettings(q);
  const list = await q.query.referrals.findMany({
    where: and(
      opts.force ? inArray(referrals.status, ['pending', 'qualified']) : eq(referrals.status, 'qualified'),
      opts.referralId ? eq(referrals.id, opts.referralId) : undefined,
      opts.referrerId ? eq(referrals.referrerId, opts.referrerId) : undefined,
    ),
    with: { order: true, referrer: true },
  });
  const issued: { code: string; referrerId: number }[] = [];
  for (const r of list) {
    if (!r.order || r.order.paymentStatus !== 'paid' || ['cancelled', 'returned'].includes(r.order.status)) continue;
    if (!opts.force) {
      const due = await rewardDueAt(r, s, q);
      if (!due || due > new Date()) continue;
    }
    const code = `THANKS-${randomToken(8).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/[O0I1]/g, '').slice(0, 6).padEnd(6, 'X')}`;
    const ends = new Date(Date.now() + s.rewardValidDays * 86_400_000);
    const ok = await q.transaction(async tx => {
      const [claimed] = await tx.update(referrals).set({ status: 'rewarded', rewardCouponCode: code }).where(and(eq(referrals.id, r.id), inArray(referrals.status, ['pending', 'qualified']))).returning();
      if (!claimed) return false;
      await tx.insert(coupons).values({ code, type: 'flat', value: s.rewardFlat, minOrder: s.rewardMinOrder, usageLimit: 1, endsAt: ends, ownerCustomerId: r.referrerId, note: `Referral reward for ${r.order!.number}` });
      return true;
    });
    if (!ok) continue;
    issued.push({ code, referrerId: r.referrerId });
    if (opts.silent) continue;
    const { notify, templates, links } = await import('./notify');
    await notify({ email: r.referrer.email, phone: r.referrer.phone }, templates.referralReward({
      name: r.referrer.name.split(' ')[0], code, reward: formatINR(s.rewardFlat), link: links.referrals(),
      until: ends.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }),
    }));
  }
  return issued;
}

/** What one customer sees on their referral page. */
export async function referralSummary(customerId: number) {
  await releaseDueReferrals({ referrerId: customerId }).catch(e => console.error('referral release', e));
  const s = await getReferralSettings();
  const [list, rewards] = await Promise.all([
    db.query.referrals.findMany({ where: eq(referrals.referrerId, customerId), orderBy: desc(referrals.createdAt), with: { order: true } }),
    db.query.coupons.findMany({ where: and(eq(coupons.ownerCustomerId, customerId)), orderBy: desc(coupons.createdAt) }),
  ]);
  const rows = await Promise.all(list.map(async r => ({
    id: r.id, at: r.createdAt, status: r.status, friend: r.order?.contactName.split(' ')[0] ?? 'A friend',
    saved: r.discount, rewardCode: r.rewardCouponCode, dueAt: r.status === 'qualified' ? await rewardDueAt(r, s) : null,
  })));
  return { settings: s, rows, rewards };
}

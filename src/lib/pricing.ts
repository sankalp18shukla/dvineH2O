import { and, eq, sql } from 'drizzle-orm';
import { splitInclusive } from './gst';
import { coupons } from './db/schema';
import type { DB, Tx } from './db';

export type PriceLine = { productId: number; slug: string; sku: string; name: string; hsn: string | null; qty: number; unitPrice: number; gstRate: number };
export type Coupon = typeof coupons.$inferSelect;

export type Totals = {
  lines: (PriceLine & { gross: number; discount: number; lineTotal: number; tax: number })[];
  subtotal: number; discount: number; shipping: number; tax: number; total: number; couponCode: string | null; couponError?: string;
};

/** Validates a coupon against cart lines. Returns the discount in paise or an error message. */
export function couponDiscount(c: Coupon | undefined, lines: PriceLine[], now = new Date()): { amount: number; eligible: number[]; error?: string } {
  if (!c || !c.active) return { amount: 0, eligible: [], error: 'This code is not valid.' };
  if (c.startsAt && c.startsAt > now) return { amount: 0, eligible: [], error: 'This code is not active yet.' };
  if (c.endsAt && c.endsAt < now) return { amount: 0, eligible: [], error: 'This code has expired.' };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { amount: 0, eligible: [], error: 'This code has been fully used.' };
  const eligible = lines.map((l, i) => (!c.appliesTo?.length || c.appliesTo.includes(l.slug) ? i : -1)).filter(i => i >= 0);
  const base = eligible.reduce((s, i) => s + lines[i].unitPrice * lines[i].qty, 0);
  if (!base) return { amount: 0, eligible: [], error: 'This code does not apply to the items in your cart.' };
  if (base < c.minOrder) return { amount: 0, eligible: [], error: `Add items worth ₹${Math.ceil((c.minOrder - base) / 100).toLocaleString('en-IN')} more to use this code.` };
  let amount = c.type === 'percent' ? Math.round((base * c.value) / 100) : c.value;
  if (c.maxDiscount != null) amount = Math.min(amount, c.maxDiscount);
  return { amount: Math.min(amount, base), eligible };
}

/** Totals with the discount spread across eligible lines (so GST is computed on the discounted value). */
export function computeTotals(lines: PriceLine[], opts: { coupon?: Coupon; couponCode?: string | null; shippingFee?: number; freeShippingAbove?: number; referralAmount?: number; customerId?: number | null } = {}): Totals {
  let cd = opts.couponCode ? couponDiscount(opts.coupon, lines) : { amount: 0, eligible: [] as number[] } as ReturnType<typeof couponDiscount>;
  // personal reward coupons only work for their owner
  if (opts.coupon?.ownerCustomerId && opts.coupon.ownerCustomerId !== opts.customerId) cd = { amount: 0, eligible: [], error: 'Sign in to the account this code was issued to.' };
  // a referral code applies to the whole cart
  if (opts.referralAmount) cd = { amount: Math.min(opts.referralAmount, lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)), eligible: lines.map((_, i) => i) };
  const eligibleBase = cd.eligible.reduce((s, i) => s + lines[i].unitPrice * lines[i].qty, 0);
  let remaining = cd.amount;
  const out = lines.map((l, i) => {
    const gross = l.unitPrice * l.qty;
    let discount = 0;
    if (cd.amount && cd.eligible.includes(i)) {
      const last = cd.eligible[cd.eligible.length - 1] === i;
      discount = last ? remaining : Math.round((cd.amount * gross) / eligibleBase);
      remaining -= discount;
    }
    const lineTotal = gross - discount;
    return { ...l, gross, discount, lineTotal, tax: splitInclusive(lineTotal, l.gstRate).tax };
  });
  const subtotal = out.reduce((s, l) => s + l.gross, 0);
  const discount = out.reduce((s, l) => s + l.discount, 0);
  const afterDiscount = subtotal - discount;
  const fee = opts.shippingFee ?? 0;
  const shipping = !lines.length || !fee || (opts.freeShippingAbove && afterDiscount >= opts.freeShippingAbove) ? 0 : fee;
  const tax = out.reduce((s, l) => s + l.tax, 0) + (shipping ? splitInclusive(shipping, 1800).tax : 0);
  return {
    lines: out, subtotal, discount, shipping, tax, total: afterDiscount + shipping,
    couponCode: cd.amount ? (opts.couponCode ?? null) : null,
    couponError: opts.couponCode && !cd.amount ? cd.error : undefined,
  };
}

export async function findCoupon(tx: DB | Tx, code: string) {
  return tx.query.coupons.findFirst({ where: eq(sql`upper(${coupons.code})`, code.trim().toUpperCase()) });
}
export async function consumeCoupon(tx: Tx, code: string) {
  await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(and(eq(sql`upper(${coupons.code})`, code.toUpperCase())));
}

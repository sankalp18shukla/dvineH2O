/**
 * Dashboard numbers, following "Core KPIs for the current stage" in the requirements doc.
 * All money in paise. Ranges are [from, to) in server time.
 */
import { and, eq, gte, inArray, lt, sql, isNotNull } from 'drizzle-orm';
import { db } from './db';
import { orders, orderItems, payments, refunds, products, carts, customers, enquiries, waterTests, ORDER_STATUSES } from './db/schema';
import { available, stockState } from './inventory';

export type Range = { from: Date; to: Date; label: string; key: string };

export function parseRange(key?: string, fromS?: string, toS?: string): Range {
  const now = new Date();
  const sod = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const tomorrow = new Date(sod(now).getTime() + 86400_000);
  switch (key) {
    case 'today': return { from: sod(now), to: tomorrow, label: 'Today', key };
    case '7d': return { from: new Date(sod(now).getTime() - 6 * 86400_000), to: tomorrow, label: 'Last 7 days', key };
    case 'month': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: tomorrow, label: 'This month', key };
    case 'custom': {
      const f = fromS ? new Date(fromS + 'T00:00:00') : sod(now); const t = toS ? new Date(new Date(toS + 'T00:00:00').getTime() + 86400_000) : tomorrow;
      return { from: f, to: t, label: `${f.toLocaleDateString('en-IN')} – ${new Date(t.getTime() - 1).toLocaleDateString('en-IN')}`, key };
    }
    default: return { from: new Date(sod(now).getTime() - 29 * 86400_000), to: tomorrow, label: 'Last 30 days', key: '30d' };
  }
}

const n = (v: unknown) => Number(v ?? 0);
const pct = (a: number, b: number) => (b ? a / b : 0);

export async function overview(r: Range) {
  const inRange = (col: Parameters<typeof gte>[0]) => and(gte(col, r.from), lt(col, r.to));
  const confirmedStatuses = ['confirmed', 'processing', 'packed', 'shipped', 'delivered', 'returned', 'cancelled'] as const;

  // Orders placed (paid) in range — counts cancellations as confirmed orders, per the KPI definition
  const placed = and(inRange(orders.placedAt), isNotNull(orders.placedAt), inArray(orders.status, confirmedStatuses));
  const [sales] = await db.select({
    orders: sql<number>`count(*)`, gross: sql<number>`coalesce(sum(${orders.subtotal}),0)`, discount: sql<number>`coalesce(sum(${orders.discount}),0)`,
    gst: sql<number>`coalesce(sum(${orders.taxTotal}),0)`, total: sql<number>`coalesce(sum(${orders.total}),0)`,
    cancelled: sql<number>`sum(case when ${orders.status} = 'cancelled' then 1 else 0 end)`,
  }).from(orders).where(placed);
  const [units] = await db.select({ u: sql<number>`coalesce(sum(${orderItems.qty}),0)` }).from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).where(and(placed, sql`${orders.status} != 'cancelled'`));
  const [ref] = await db.select({ s: sql<number>`coalesce(sum(${refunds.amount}),0)` }).from(refunds).where(and(inRange(refunds.initiatedAt), inArray(refunds.status, ['pending', 'processed'])));
  const netSales = n(sales.total) - n(ref.s);
  const confirmedOrders = n(sales.orders);

  // Pipeline (current, not range-bound)
  const pipelineRows = await db.select({ status: orders.status, c: sql<number>`count(*)` }).from(orders).groupBy(orders.status);
  const pipeline = Object.fromEntries(ORDER_STATUSES.map(s => [s, n(pipelineRows.find(p => p.status === s)?.c)])) as Record<typeof ORDER_STATUSES[number], number>;

  // Product snapshot
  const prods = await db.select().from(products);
  const perSku = await db.select({ productId: orderItems.productId, units: sql<number>`coalesce(sum(${orderItems.qty}),0)`, sales: sql<number>`coalesce(sum(${orderItems.lineTotal}),0)` })
    .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).where(and(placed, sql`${orders.status} != 'cancelled'`)).groupBy(orderItems.productId);
  const enqBy = await db.select({ i: enquiries.productInterest, c: sql<number>`count(*)` }).from(enquiries).where(inRange(enquiries.createdAt)).groupBy(enquiries.productInterest);
  const productSnapshot = prods.map(p => ({
    slug: p.slug, name: p.shortName, saleMode: p.saleMode, units: n(perSku.find(x => x.productId === p.id)?.units), sales: n(perSku.find(x => x.productId === p.id)?.sales),
    enquiries: n(enqBy.find(e => e.i === p.slug)?.c), onHand: p.onHand, reserved: p.reserved, available: available(p), reorderLevel: p.reorderLevel, state: stockState(p), buildToOrder: p.buildToOrder,
  }));

  // Cart & checkout
  const [cartStats] = await db.select({
    created: sql<number>`count(*)`,
    abandoned: sql<number>`sum(case when ${carts.status} = 'abandoned' then 1 else 0 end)`,
    checkouts: sql<number>`sum(case when ${carts.checkoutStartedAt} is not null then 1 else 0 end)`,
  }).from(carts).where(and(inRange(carts.createdAt), sql`exists (select 1 from cart_events ce where ce.cart_id = ${carts.id} and ce.action = 'add')`));
  const [abandonedValue] = await db.select({ v: sql<number>`coalesce(sum(ci.qty * ci.unit_price),0)` }).from(sql`cart_items ci join carts c on c.id = ci.cart_id`).where(sql`c.status = 'abandoned' and c.created_at >= ${r.from.getTime()} and c.created_at < ${r.to.getTime()}`);
  const [pay] = await db.select({ attempts: sql<number>`count(*)`, success: sql<number>`sum(case when ${payments.status} = 'success' then 1 else 0 end)`, failed: sql<number>`sum(case when ${payments.status} = 'failed' then 1 else 0 end)` })
    .from(payments).where(and(inRange(payments.createdAt), inArray(payments.status, ['success', 'failed', 'pending'])));
  const [createdAttempts] = await db.select({ c: sql<number>`count(*)` }).from(payments).where(and(inRange(payments.createdAt), eq(payments.status, 'created')));
  const failReasons = await db.select({ reason: sql<string>`coalesce(${payments.errorDescription}, ${payments.errorCode}, 'Unknown')`, c: sql<number>`count(*)` }).from(payments).where(and(inRange(payments.createdAt), eq(payments.status, 'failed'))).groupBy(sql`1`).orderBy(sql`2 desc`).limit(5);

  // Customers
  const [cust] = await db.select({ total: sql<number>`count(*)`, newInRange: sql<number>`sum(case when ${customers.createdAt} >= ${r.from.getTime()} and ${customers.createdAt} < ${r.to.getTime()} then 1 else 0 end)` }).from(customers);
  const completedByCustomer = await db.select({ c: orders.customerId, k: sql<number>`count(*)`, spend: sql<number>`sum(${orders.total})` }).from(orders).where(inArray(orders.status, ['delivered', 'shipped', 'confirmed', 'processing', 'packed'])).groupBy(orders.customerId);
  const buyers = completedByCustomer.length;
  const repeat = completedByCustomer.filter(x => n(x.k) >= 2).length;
  const spend = completedByCustomer.reduce((s, x) => s + n(x.spend), 0);

  // Enquiries & water testing
  const enqRows = await db.select({ type: enquiries.type, status: enquiries.status, c: sql<number>`count(*)` }).from(enquiries).where(inRange(enquiries.createdAt)).groupBy(enquiries.type, enquiries.status);
  const enqTotal = enqRows.reduce((s, e) => s + n(e.c), 0);
  const qualifiedPlus = enqRows.filter(e => ['qualified', 'converted'].includes(e.status)).reduce((s, e) => s + n(e.c), 0);
  const converted = enqRows.filter(e => e.status === 'converted').reduce((s, e) => s + n(e.c), 0);
  const openEnquiries = await db.$count(enquiries, inArray(enquiries.status, ['new', 'contacted', 'qualified']));
  const [wt] = await db.select({ booked: sql<number>`count(*)`, completed: sql<number>`sum(case when ${waterTests.status} in ('completed','report_ready') then 1 else 0 end)`, converted: sql<number>`sum(case when ${waterTests.convertedOrderId} is not null then 1 else 0 end)` }).from(waterTests).where(inRange(waterTests.createdAt));
  const byType = Object.fromEntries(['product', 'demo', 'water_test', 'consultation', 'distributorship', 'bulk', 'support', 'general', 'chat'].map(t => [t, enqRows.filter(e => e.type === t).reduce((s, e) => s + n(e.c), 0)]));

  // Post-purchase
  const [post] = await db.select({
    instPending: sql<number>`(select count(*) from installations where status in ('pending','scheduled'))`,
    instDone: sql<number>`(select count(*) from installations where status = 'completed' and completed_at >= ${r.from.getTime()} and completed_at < ${r.to.getTime()})`,
    warrActive: sql<number>`(select count(*) from warranties where status = 'active' and expires_at > ${Date.now()})`,
    ticketsOpen: sql<number>`(select count(*) from service_tickets where status in ('open','assigned','in_progress'))`,
    reviewsPending: sql<number>`(select count(*) from reviews where status = 'pending')`,
    returnsOpen: sql<number>`(select count(*) from returns where status in ('requested','approved','received'))`,
    exceptionsOpen: sql<number>`(select count(*) from order_exceptions where status = 'open')`,
    refundsPending: sql<number>`(select count(*) from refunds where status = 'pending')`,
    shipDelayed: sql<number>`(select count(*) from shipments where status in ('delayed','exception','rto'))`,
    avgRating: sql<number>`(select coalesce(avg(rating),0) from service_tickets where rating is not null)`,
  }).from(sql`(select 1)`);

  // Return rate (orders): returned ÷ delivered-or-returned
  const delivered = pipeline.delivered + pipeline.returned;

  // Daily series for the chart
  const daily = await db.select({ d: sql<string>`date(${orders.placedAt} / 1000, 'unixepoch', 'localtime')`, total: sql<number>`sum(${orders.total})`, c: sql<number>`count(*)` })
    .from(orders).where(and(placed, sql`${orders.status} != 'cancelled'`)).groupBy(sql`1`).orderBy(sql`1`);

  return {
    range: r,
    sales: { orders: confirmedOrders, units: n(units.u), gross: n(sales.gross), discount: n(sales.discount), gst: n(sales.gst), refunds: n(ref.s), net: netSales, aov: confirmedOrders ? Math.round(netSales / confirmedOrders) : 0 },
    pipeline,
    products: productSnapshot,
    carts: { created: n(cartStats.created), abandoned: n(cartStats.abandoned), abandonedValue: n(abandonedValue.v), checkouts: n(cartStats.checkouts), attempts: n(pay.attempts), success: n(pay.success), failed: n(pay.failed), unfinished: n(createdAttempts.c), failReasons },
    customers: { total: n(cust.total), new: n(cust.newInRange), buyers, repeat, spend },
    enquiries: { total: enqTotal, open: openEnquiries, qualified: qualifiedPlus, converted, byType, tests: { booked: n(wt.booked), completed: n(wt.completed), converted: n(wt.converted) } },
    post: Object.fromEntries(Object.entries(post).map(([k, v]) => [k, n(v)])) as Record<keyof typeof post, number>,
    kpis: {
      cartAbandonment: pct(n(cartStats.abandoned), n(cartStats.created)),
      checkoutConversion: pct(confirmedOrders, n(cartStats.checkouts)),
      paymentSuccess: pct(n(pay.success), n(pay.success) + n(pay.failed)),
      cancellationRate: pct(n(sales.cancelled), confirmedOrders),
      returnRate: pct(pipeline.returned, delivered),
      repeatRate: pct(repeat, buyers),
      lowStock: productSnapshot.filter(p => !p.buildToOrder && (p.state === 'low_stock' || p.state === 'out_of_stock')).length,
      leadToSale: pct(converted, qualifiedPlus),
    },
    daily: daily.map(d => ({ d: d.d, total: n(d.total), c: n(d.c) })),
  };
}
export type Overview = Awaited<ReturnType<typeof overview>>;


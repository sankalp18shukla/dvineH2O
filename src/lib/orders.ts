import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import { db, type Tx } from './db';
import {
  carts, cartEvents, orders, orderItems, orderEvents, payments, products, warranties, installations, shipments, refunds, waterTests,
  type Address,
} from './db/schema';
import { orderNumber, randomToken } from './numbering';
import { reserve, release, commitSale, moveStock, StockError } from './inventory';
import { consumeCoupon, type PriceLine } from './pricing';
import { getCommerce } from './settings';
import { findOrCreateCustomer } from './customers';
import { issueInvoice, issueCreditNote } from './invoice';
import { notify, templates, links } from './notify';
import { formatINR } from './money';
import { createRzpOrder, createRzpRefund, razorpayEnabled, verifyPaymentSignature } from './razorpay';
import { qualifyReferral, voidReferral } from './referrals';
import { priceCart } from './cart-pricing';

export type OrderStatus = typeof orders.$inferSelect['status'];

/** Allowed manual status moves in the admin dashboard. */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pending payment', confirmed: 'Confirmed', processing: 'Processing', packed: 'Packed', shipped: 'Shipped',
  delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned',
  pending: 'Pending', paid: 'Paid', failed: 'Failed', refunded: 'Refunded', partially_refunded: 'Partly refunded',
};

export class CheckoutError extends Error {}

type CheckoutInput = {
  cartId: number; customerId?: number | null;
  contact: { name: string; email: string; phone: string };
  shipping: Address; billing: Address; note?: string; consent: boolean; marketing?: boolean;
};

/** Creates a pending-payment order from the cart and holds stock until payment or expiry. */
export async function createOrderFromCart(input: CheckoutInput) {
  const commerce = await getCommerce();
  return db.transaction(async tx => {
    const cart = await tx.query.carts.findFirst({ where: eq(carts.id, input.cartId), with: { items: { with: { product: true } } } });
    if (!cart || !cart.items.length) throw new CheckoutError('Your cart is empty.');
    const items = cart.items.filter(i => i.product.status === 'active' && i.product.saleMode === 'cart');
    if (!items.length) throw new CheckoutError('Your cart is empty.');

    const lines: PriceLine[] = items.map(i => ({ productId: i.productId, slug: i.product.slug, sku: i.product.sku, name: i.product.name, hsn: i.product.hsn, qty: i.qty, unitPrice: i.product.price, gstRate: i.product.gstRate }));
    const totals = await priceCart(lines, cart.couponCode, input.customerId ?? null);
    const isReferral = 'isReferral' in totals && !!totals.isReferral;

    const customer = input.customerId
      ? (await tx.query.customers.findFirst({ where: (c, { eq }) => eq(c.id, input.customerId!) }))!
      : await findOrCreateCustomer({ name: input.contact.name, email: input.contact.email, phone: input.contact.phone, city: input.shipping.city, state: input.shipping.state, pincode: input.shipping.pincode, consent: input.consent, marketing: input.marketing }, tx);

    const number = await orderNumber(tx);
    const [order] = await tx.insert(orders).values({
      number, accessToken: randomToken(), customerId: customer.id, cartId: cart.id,
      contactName: input.contact.name, contactEmail: input.contact.email, contactPhone: input.contact.phone,
      shippingAddress: input.shipping, billingAddress: input.billing,
      subtotal: totals.subtotal, discount: totals.discount, shipping: totals.shipping, taxTotal: totals.tax, total: totals.total,
      couponCode: isReferral ? null : totals.couponCode, referralCode: isReferral ? totals.couponCode : null, customerNote: input.note || null,
      reservationExpiresAt: new Date(Date.now() + commerce.reservationMinutes * 60_000),
    }).returning();

    for (const l of totals.lines) {
      await tx.insert(orderItems).values({ orderId: order.id, productId: l.productId, sku: l.sku, name: l.name, hsn: l.hsn, qty: l.qty, unitPrice: l.unitPrice, discount: l.discount, taxRate: l.gstRate, taxAmount: l.tax, lineTotal: l.lineTotal });
      try { await reserve(tx, l.productId, l.qty, number); }
      catch (e) { if (e instanceof StockError) throw new CheckoutError(e.message); throw e; }
    }
    await tx.insert(orderEvents).values({ orderId: order.id, status: 'pending_payment', note: 'Order created, awaiting payment', actor: 'customer' });
    await tx.update(carts).set({ status: 'checkout', checkoutStartedAt: cart.checkoutStartedAt ?? new Date(), lastActivityAt: new Date(), customerId: customer.id }).where(eq(carts.id, cart.id));
    await tx.insert(cartEvents).values({ cartId: cart.id, action: 'checkout_start' });
    return order;
  });
}

/* ─────────────────────────── Payments ─────────────────────────── */

type PayTarget = { purpose: 'order'; order: typeof orders.$inferSelect } | { purpose: 'water_test'; test: typeof waterTests.$inferSelect };

/** Starts a payment attempt. Razorpay when keys are configured, otherwise a built-in test gateway. */
export async function startPayment(target: PayTarget) {
  const amount = target.purpose === 'order' ? target.order.total : target.test.price;
  const refId = target.purpose === 'order' ? target.order.id : target.test.id;
  const where = target.purpose === 'order' ? eq(payments.orderId, refId) : eq(payments.waterTestId, refId);
  const prev = await db.select({ n: sql<number>`count(*)` }).from(payments).where(where);
  const attempt = Number(prev[0].n) + 1;
  const receipt = target.purpose === 'order' ? target.order.number : target.test.ref;

  if (razorpayEnabled()) {
    const rz = await createRzpOrder(amount, receipt, { purpose: target.purpose, ref: receipt });
    const [p] = await db.insert(payments).values({ purpose: target.purpose, orderId: target.purpose === 'order' ? refId : null, waterTestId: target.purpose === 'water_test' ? refId : null, gateway: 'razorpay', gatewayOrderId: rz.id, amount, attempt, status: 'created' }).returning();
    return { mode: 'razorpay' as const, paymentId: p.id, keyId: process.env.RAZORPAY_KEY_ID!, gatewayOrderId: rz.id, amount, receipt };
  }
  const [p] = await db.insert(payments).values({ purpose: target.purpose, orderId: target.purpose === 'order' ? refId : null, waterTestId: target.purpose === 'water_test' ? refId : null, gateway: 'test', gatewayOrderId: `test_${randomToken(8)}`, amount, attempt, status: 'created' }).returning();
  return { mode: 'test' as const, paymentId: p.id, gatewayOrderId: p.gatewayOrderId!, amount, receipt };
}

/** Razorpay checkout callback. Verifies the signature before trusting anything from the browser. */
export async function confirmRazorpayPayment(gatewayOrderId: string, gatewayPaymentId: string, signature: string, method?: string) {
  if (!verifyPaymentSignature(gatewayOrderId, gatewayPaymentId, signature)) throw new Error('Payment signature mismatch');
  return applyPaymentSuccess(gatewayOrderId, gatewayPaymentId, method);
}

/** Marks a payment successful and fulfils whatever it pays for. Safe to call more than once (webhook + callback). */
export async function applyPaymentSuccess(gatewayOrderId: string, gatewayPaymentId: string, method?: string) {
  const result = await db.transaction(async tx => {
    const p = await tx.query.payments.findFirst({ where: eq(payments.gatewayOrderId, gatewayOrderId) });
    if (!p) throw new Error('Unknown payment');
    if (p.status === 'success') return { payment: p, fresh: false };
    await tx.update(payments).set({ status: 'success', gatewayPaymentId, method: method ?? p.method }).where(eq(payments.id, p.id));
    if (p.purpose === 'order' && p.orderId) await markOrderPaid(tx, p.orderId);
    if (p.purpose === 'water_test' && p.waterTestId) await tx.update(waterTests).set({ paymentStatus: 'paid', status: 'confirmed' }).where(eq(waterTests.id, p.waterTestId));
    return { payment: p, fresh: true };
  });
  if (result.fresh && result.payment.orderId) {
    const o = await db.query.orders.findFirst({ where: eq(orders.id, result.payment.orderId) });
    if (o) await notify({ email: o.contactEmail, phone: o.contactPhone }, templates.orderConfirmed({ number: o.number, name: o.contactName.split(' ')[0], total: formatINR(o.total), link: links.order(o.number, o.accessToken) }));
  }
  return result.payment;
}

export async function applyPaymentFailure(gatewayOrderId: string, info: { gatewayPaymentId?: string; code?: string; description?: string; stage?: string; method?: string }) {
  const p = await db.query.payments.findFirst({ where: eq(payments.gatewayOrderId, gatewayOrderId) });
  if (!p || p.status === 'success') return p;
  await db.update(payments).set({ status: 'failed', gatewayPaymentId: info.gatewayPaymentId ?? p.gatewayPaymentId, errorCode: info.code, errorDescription: info.description, failureStage: info.stage, method: info.method }).where(eq(payments.id, p.id));
  if (p.orderId) {
    await db.update(orders).set({ paymentStatus: 'failed' }).where(and(eq(orders.id, p.orderId), eq(orders.status, 'pending_payment')));
    await db.insert(orderEvents).values({ orderId: p.orderId, status: 'payment_failed', note: info.description ?? 'Payment failed', actor: 'system' });
  }
  return p;
}

async function markOrderPaid(tx: Tx, orderId: number) {
  const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
  if (!order) throw new Error('Order not found');
  if (order.paymentStatus === 'paid') return;
  // If the reservation already expired and was released, re-reserve before committing.
  if (order.status === 'cancelled') {
    for (const i of order.items) await reserve(tx, i.productId, i.qty, order.number);
  }
  const now = new Date();
  await tx.update(orders).set({ status: 'confirmed', paymentStatus: 'paid', placedAt: now, reservationExpiresAt: null, cancelledAt: null, cancelReason: null, cancelledBy: null }).where(eq(orders.id, orderId));
  await tx.insert(orderEvents).values({ orderId, status: 'confirmed', note: 'Payment received', actor: 'system' });
  for (const i of order.items) {
    await commitSale(tx, i.productId, i.qty, order.number);
    const product = await tx.query.products.findFirst({ where: eq(products.id, i.productId) });
    if (product) {
      for (let k = 0; k < i.qty; k++) {
        const expires = new Date(now); expires.setMonth(expires.getMonth() + product.warrantyMonths);
        await tx.insert(warranties).values({ orderId, orderItemId: i.id, productId: i.productId, customerId: order.customerId, purchaseDate: now, expiresAt: expires });
      }
      if (product.requiresInstallation) await tx.insert(installations).values({ orderId, notes: `${product.shortName} × ${i.qty}` });
    }
  }
  if (order.couponCode) await consumeCoupon(tx, order.couponCode);
  if (order.referralCode) await qualifyReferral(tx, orderId);
  if (order.cartId) await tx.update(carts).set({ status: 'converted', convertedOrderId: orderId }).where(eq(carts.id, order.cartId));
  await issueInvoice(tx, orderId);
}

/* ─────────────────────────── Fulfilment ─────────────────────────── */

export async function setOrderStatus(orderId: number, to: OrderStatus, actor: string, note?: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
  if (!order) throw new Error('Order not found');
  if (!TRANSITIONS[order.status].includes(to)) throw new Error(`Cannot move an order from ${STATUS_LABEL[order.status]} to ${STATUS_LABEL[to]}.`);
  if (to === 'cancelled') return cancelOrder(orderId, actor, note ?? 'Cancelled');
  await db.transaction(async tx => {
    await tx.update(orders).set({ status: to }).where(eq(orders.id, orderId));
    await tx.insert(orderEvents).values({ orderId, status: to, note, actor });
    if (to === 'delivered') {
      await tx.update(shipments).set({ status: 'delivered', deliveredAt: new Date() }).where(and(eq(shipments.orderId, orderId), inArray(shipments.status, ['pending', 'in_transit', 'delayed'])));
    }
    if (to === 'returned') {
      for (const i of order.items) await moveStock(tx, i.productId, 'return', i.qty, { reference: order.number, note: note ?? 'Order returned' });
    }
  });
  const link = links.order(order.number, order.accessToken);
  if (to === 'shipped') {
    const s = await db.query.shipments.findFirst({ where: eq(shipments.orderId, orderId) });
    await notify({ email: order.contactEmail, phone: order.contactPhone }, templates.orderShipped({ number: order.number, name: order.contactName.split(' ')[0], courier: s?.courier, awb: s?.awb, link }));
  }
  if (to === 'delivered') await notify({ email: order.contactEmail, phone: order.contactPhone }, templates.orderDelivered({ number: order.number, name: order.contactName.split(' ')[0], link }));
}

/** Cancels an order: releases held stock or returns committed stock, and refunds a paid order in full. */
export async function cancelOrder(orderId: number, actor: string, reason: string, staffId?: number) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
  if (!order) throw new Error('Order not found');
  if (['shipped', 'delivered', 'cancelled', 'returned'].includes(order.status)) throw new Error('This order can no longer be cancelled.');
  await db.transaction(async tx => {
    for (const i of order.items) {
      if (order.paymentStatus === 'paid') await moveStock(tx, i.productId, 'return', i.qty, { reference: order.number, note: 'Cancelled before dispatch' });
      else await release(tx, i.productId, i.qty, order.number, 'Order cancelled');
    }
    await tx.update(orders).set({ status: 'cancelled', cancelledAt: new Date(), cancelReason: reason, cancelledBy: actor, reservationExpiresAt: null }).where(eq(orders.id, orderId));
    await tx.insert(orderEvents).values({ orderId, status: 'cancelled', note: reason, actor });
    await tx.update(warranties).set({ status: 'void' }).where(eq(warranties.orderId, orderId));
    await voidReferral(tx, orderId);
  });
  if (order.paymentStatus === 'paid') await refundOrder(orderId, order.total, `Cancellation: ${reason}`, staffId);
  if (actor !== 'system') await notify({ email: order.contactEmail, phone: order.contactPhone }, templates.orderCancelled({ number: order.number, name: order.contactName.split(' ')[0] }));
}

/** Refunds part or all of a paid order through the gateway that took the payment, with a GST credit note. */
export async function refundOrder(orderId: number, amount: number, reason: string, staffId?: number) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new Error('Order not found');
  const pay = await db.query.payments.findFirst({ where: and(eq(payments.orderId, orderId), eq(payments.status, 'success')) });
  if (!pay) throw new Error('No successful payment to refund.');
  const done = await db.select({ s: sql<number>`coalesce(sum(${refunds.amount}),0)` }).from(refunds).where(and(eq(refunds.orderId, orderId), inArray(refunds.status, ['pending', 'processed'])));
  const already = Number(done[0].s);
  if (amount <= 0 || amount + already > pay.amount) throw new Error(`You can refund up to ${formatINR(pay.amount - already)}.`);

  let gatewayRefundId: string | null = null; let status: 'pending' | 'processed' = 'processed';
  if (pay.gateway === 'razorpay' && pay.gatewayPaymentId) {
    const r = await createRzpRefund(pay.gatewayPaymentId, amount, { order: order.number, reason });
    gatewayRefundId = r.id; status = r.status === 'processed' ? 'processed' : 'pending';
  } else gatewayRefundId = `test_rfnd_${randomToken(6)}`;

  await db.transaction(async tx => {
    await tx.insert(refunds).values({ orderId, paymentId: pay.id, amount, gatewayRefundId, status, reason, initiatedBy: staffId ?? null, completedAt: status === 'processed' ? new Date() : null });
    const full = amount + already >= pay.amount;
    await tx.update(orders).set({ paymentStatus: full ? 'refunded' : 'partially_refunded' }).where(eq(orders.id, orderId));
    await tx.insert(orderEvents).values({ orderId, status: full ? 'refunded' : 'partially_refunded', note: `${formatINR(amount)} refund ${status === 'processed' ? 'processed' : 'initiated'}: ${reason}`, actor: staffId ? `staff:${staffId}` : 'system' });
    await issueCreditNote(tx, orderId, amount);
  });
}

/** Releases stock held by unpaid orders past their reservation window, and marks idle carts as abandoned. */
export async function runMaintenance() {
  const commerce = await getCommerce();
  const now = new Date();
  const stale = await db.query.orders.findMany({ where: and(eq(orders.status, 'pending_payment'), lt(orders.reservationExpiresAt, now)) });
  for (const o of stale) await cancelOrder(o.id, 'system', 'Payment not completed in time');
  const cutoff = new Date(now.getTime() - commerce.abandonmentMinutes * 60_000);
  const abandoned = await db.update(carts).set({ status: 'abandoned' })
    .where(and(inArray(carts.status, ['active', 'checkout']), lt(carts.lastActivityAt, cutoff), sql`exists (select 1 from cart_items ci where ci.cart_id = ${carts.id})`))
    .returning({ id: carts.id });
  return { releasedOrders: stale.length, abandonedCarts: abandoned.length };
}

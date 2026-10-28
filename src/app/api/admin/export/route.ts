import { and, gte, lt, eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, payments, refunds, invoices, enquiries, waterTests, stockMovements, products, serviceTickets } from '@/lib/db/schema';
import { getStaff } from '@/lib/auth';
import { can } from '@/lib/session';
import { parseRange } from '@/lib/metrics';
import { audit } from '@/lib/audit';

/** Date-filtered CSV exports (open in Excel / Google Sheets). */
const rupees = (p: number | null | undefined) => (p == null ? '' : (p / 100).toFixed(2));
const d = (x: Date | null | undefined) => (x ? x.toISOString().replace('T', ' ').slice(0, 19) : '');

function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return 'No rows\n';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : '') + s.replace(/"/g, '""')}"` : s; };
  return '﻿' + [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\r\n');
}

export async function GET(req: Request) {
  const s = await getStaff();
  if (!s || !can(s.role, 'reports')) return new Response('Forbidden', { status: 403 });
  const u = new URL(req.url);
  const type = u.searchParams.get('type') ?? 'orders';
  const r = parseRange(u.searchParams.get('range') ?? '30d', u.searchParams.get('from') ?? undefined, u.searchParams.get('to') ?? undefined);
  const inR = (col: Parameters<typeof gte>[0]) => and(gte(col, r.from), lt(col, r.to));
  let rows: Record<string, unknown>[] = [];

  if (type === 'orders') {
    const list = await db.query.orders.findMany({ where: inR(orders.createdAt), orderBy: desc(orders.createdAt), with: { items: true, customer: true, shipments: true, invoices: true } });
    rows = list.map(o => ({ order: o.number, created: d(o.createdAt), placed: d(o.placedAt), status: o.status, payment: o.paymentStatus, customer: o.contactName, email: o.contactEmail, phone: o.contactPhone, city: o.shippingAddress.city, state: o.shippingAddress.state, pincode: o.shippingAddress.pincode, items: o.items.map(i => `${i.sku} x${i.qty}`).join('; '), units: o.items.reduce((t, i) => t + i.qty, 0), subtotal: rupees(o.subtotal), discount: rupees(o.discount), coupon: o.couponCode ?? o.referralCode ?? '', shipping: rupees(o.shipping), gst: rupees(o.taxTotal), total: rupees(o.total), invoice: o.invoices.find(i => i.kind === 'invoice')?.number ?? '', awb: o.shipments[0]?.awb ?? '', courier: o.shipments[0]?.courier ?? '' }));
  } else if (type === 'items') {
    const list = await db.select({ o: orders, i: orderItems }).from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).where(inR(orders.createdAt));
    rows = list.map(({ o, i }) => ({ order: o.number, placed: d(o.placedAt), status: o.status, sku: i.sku, name: i.name, hsn: i.hsn, qty: i.qty, unit_price: rupees(i.unitPrice), discount: rupees(i.discount), gst_rate: i.taxRate / 100, gst: rupees(i.taxAmount), line_total: rupees(i.lineTotal), serials: (i.serials ?? []).join(' ') }));
  } else if (type === 'payments') {
    const list = await db.select({ p: payments, o: orders }).from(payments).leftJoin(orders, eq(orders.id, payments.orderId)).where(inR(payments.createdAt));
    rows = list.map(({ p, o }) => ({ id: p.id, created: d(p.createdAt), purpose: p.purpose, order: o?.number ?? '', gateway: p.gateway, gateway_order: p.gatewayOrderId, gateway_payment: p.gatewayPaymentId, amount: rupees(p.amount), method: p.method, status: p.status, attempt: p.attempt, error_code: p.errorCode, error: p.errorDescription, stage: p.failureStage }));
  } else if (type === 'refunds') {
    const list = await db.select({ f: refunds, o: orders }).from(refunds).innerJoin(orders, eq(orders.id, refunds.orderId)).where(inR(refunds.initiatedAt));
    rows = list.map(({ f, o }) => ({ order: o.number, initiated: d(f.initiatedAt), completed: d(f.completedAt), amount: rupees(f.amount), status: f.status, gateway_refund: f.gatewayRefundId, reason: f.reason }));
  } else if (type === 'invoices') {
    const list = await db.select({ v: invoices, o: orders }).from(invoices).innerJoin(orders, eq(orders.id, invoices.orderId)).where(inR(invoices.issuedAt));
    rows = list.map(({ v, o }) => ({ number: v.number, kind: v.kind, fy: v.fy, date: d(v.issuedAt), order: o.number, buyer: o.billingAddress.name, buyer_gstin: v.buyerGstin, place_of_supply: v.placeOfSupply, taxable: rupees(v.taxable), cgst: rupees(v.cgst), sgst: rupees(v.sgst), igst: rupees(v.igst), total: rupees(v.total) }));
  } else if (type === 'customers') {
    const list = await db.query.customers.findMany({ with: { orders: true } });
    rows = list.map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, city: c.city, state: c.state, pincode: c.pincode, registered: c.passwordHash ? 'yes' : 'guest', created: d(c.createdAt), orders: c.orders.filter(o => o.paymentStatus !== 'pending').length, spend: rupees(c.orders.filter(o => o.paymentStatus === 'paid').reduce((t, o) => t + o.total, 0)), marketing_consent: c.consentMarketing ? 'yes' : 'no', referral_code: c.referralCode }));
  } else if (type === 'enquiries') {
    const list = await db.query.enquiries.findMany({ where: inR(enquiries.createdAt), orderBy: desc(enquiries.createdAt) });
    rows = list.map(e => ({ ref: e.ref, created: d(e.createdAt), type: e.type, interest: e.productInterest, status: e.status, name: e.name, phone: e.phone, email: e.email, company: e.company, city: e.city, pincode: e.pincode, message: e.message, preferred: e.preferredAt, quote_value: rupees(e.quoteValue), quote_status: e.quoteStatus, outcome: e.outcomeProduct, outcome_ref: e.outcomeRef, source: e.source }));
  } else if (type === 'water_tests') {
    const list = await db.query.waterTests.findMany({ where: inR(waterTests.createdAt), with: { option: true } });
    rows = list.map(w => ({ ref: w.ref, created: d(w.createdAt), test: w.option?.name, name: w.name, phone: w.phone, city: w.city, pincode: w.pincode, date: w.preferredDate, slot: w.slot, status: w.status, price: rupees(w.price), payment: w.paymentStatus, interest: w.productInterest, recommended: w.recommendedProduct }));
  } else if (type === 'stock') {
    const list = await db.select({ m: stockMovements, p: products }).from(stockMovements).innerJoin(products, eq(products.id, stockMovements.productId)).where(inR(stockMovements.createdAt));
    rows = list.map(({ m, p }) => ({ date: d(m.createdAt), sku: p.sku, type: m.type, qty: m.qty, on_hand_after: m.onHandAfter, reserved_after: m.reservedAfter, reference: m.reference, note: m.note }));
  } else if (type === 'service') {
    const list = await db.query.serviceTickets.findMany({ where: inR(serviceTickets.createdAt), with: { product: true } });
    rows = list.map(t => ({ number: t.number, created: d(t.createdAt), product: t.product?.shortName, name: t.name, phone: t.phone, priority: t.priority, status: t.status, issue: t.issue, resolved: d(t.resolvedAt), action: t.actionTaken, parts: t.partsUsed, rating: t.rating }));
  } else if (type === 'warranties') {
    const list = await db.query.warranties.findMany({ with: { product: true, customer: true, order: true } });
    rows = list.map(w => ({ id: w.id, order: w.order.number, sku: w.product.sku, customer: w.customer.name, phone: w.customer.phone, serial: w.serial, purchased: d(w.purchaseDate), installed: d(w.installationDate), expires: d(w.expiresAt), status: w.status }));
  } else return new Response('Unknown export', { status: 400 });

  await audit(s.id, 'export', type, undefined, { range: r.label, rows: rows.length });
  return new Response(csv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="dvine-${type}-${r.from.toISOString().slice(0, 10)}-to-${new Date(r.to.getTime() - 1).toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' } });
}


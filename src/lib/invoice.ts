import { and, eq } from 'drizzle-orm';
import type { Tx } from './db';
import { invoices, orders, orderItems } from './db/schema';
import { invoiceNumber } from './numbering';
import { gstSplit, splitInclusive } from './gst';
import { getCompany } from './settings';

/** Issues the GST tax invoice for a paid order (idempotent). */
export async function issueInvoice(tx: Tx, orderId: number) {
  const existing = await tx.query.invoices.findFirst({ where: and(eq(invoices.orderId, orderId), eq(invoices.kind, 'invoice')) });
  if (existing) return existing;
  const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new Error('Order not found');
  const items = await tx.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
  const company = await getCompany();
  const tax = items.reduce((s, i) => s + i.taxAmount, 0) + (order.shipping ? splitInclusive(order.shipping, 1800).tax : 0);
  const split = gstSplit(tax, company.state, order.billingAddress.state);
  const { fy, seq, number } = await invoiceNumber(tx, 'invoice', company.invoicePrefix || 'DVH');
  const [inv] = await tx.insert(invoices).values({
    orderId, kind: 'invoice', number, fy, seq, sellerGstin: company.gstin || null, buyerGstin: order.billingAddress.gstin || null,
    placeOfSupply: order.billingAddress.state, taxable: order.total - tax, cgst: split.cgst, sgst: split.sgst, igst: split.igst, total: order.total,
  }).returning();
  return inv;
}

/** Credit note against the order's invoice for a refund amount (GST-inclusive). */
export async function issueCreditNote(tx: Tx, orderId: number, amount: number) {
  const inv = await tx.query.invoices.findFirst({ where: and(eq(invoices.orderId, orderId), eq(invoices.kind, 'invoice')) });
  if (!inv) return null;
  const company = await getCompany();
  const ratio = amount / inv.total;
  const cgst = Math.round(inv.cgst * ratio), sgst = Math.round(inv.sgst * ratio), igst = Math.round(inv.igst * ratio);
  const { fy, seq, number } = await invoiceNumber(tx, 'credit_note', company.invoicePrefix || 'DVH');
  const [cn] = await tx.insert(invoices).values({
    orderId, kind: 'credit_note', number, fy, seq, refInvoiceId: inv.id, sellerGstin: inv.sellerGstin, buyerGstin: inv.buyerGstin,
    placeOfSupply: inv.placeOfSupply, taxable: amount - cgst - sgst - igst, cgst, sgst, igst, total: amount,
  }).returning();
  return cn;
}

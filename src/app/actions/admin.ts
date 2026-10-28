'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  orders, orderItems, orderEvents, products, shipments, installations, warranties, enquiries, enquiryNotes, waterTests, serviceTickets,
  reviews, coupons, pincodes, staff, returns, orderExceptions, serialUnits, testOptions, ENQUIRY_STATUSES,
} from '@/lib/db/schema';
import { requireStaff, hashPassword } from '@/lib/auth';
import type { Permission } from '@/lib/session';
import { audit } from '@/lib/audit';
import { setOrderStatus, cancelOrder, refundOrder, STATUS_LABEL, type OrderStatus } from '@/lib/orders';
import { moveStock } from '@/lib/inventory';
import { pushOrder, assignAwb, trackAwb, trackingUrl, shiprocketEnabled, mapStatus } from '@/lib/shiprocket';
import { setSetting, DEFAULT_COMPANY, DEFAULT_COMMERCE } from '@/lib/settings';
import { DEFAULT_REFERRAL } from '@/lib/referrals';
import { toPaise } from '@/lib/money';
import { saveUpload, UploadError } from '@/lib/uploads';
import { notify } from '@/lib/notify';
import { formToObject, zodErrors, type FormState } from '@/lib/validators';
import type { ChatMsg } from '@/lib/chatbot';

type Act = (prev: FormState, fd: FormData) => Promise<FormState>;
/** Wraps an admin mutation: permission check, error → message, audit by the caller. */
function guarded(p: Permission, fn: (s: Awaited<ReturnType<typeof requireStaff>>, fd: FormData) => Promise<FormState | void>): Act {
  return async (_prev, fd) => {
    const s = await requireStaff(p);
    try { return (await fn(s, fd)) ?? { ok: true, message: 'Saved.' }; }
    catch (e) {
      if (e && typeof e === 'object' && 'digest' in e && String((e as { digest: string }).digest).startsWith('NEXT_REDIRECT')) throw e;
      return { ok: false, message: e instanceof Error ? e.message : 'Something went wrong.' };
    }
  };
}
const num = (fd: FormData, k: string) => Number(fd.get(k));
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

/* ─────────────── Orders ─────────────── */
export const changeOrderStatus = guarded('ordersWrite', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'orderId'); const to = str(fd, 'status') as OrderStatus; const note = str(fd, 'note') || undefined;
  if (to === 'cancelled') await cancelOrder(id, `staff:${s.id}`, note ?? 'Cancelled by DVINE', s.id);
  else await setOrderStatus(id, to, `staff:${s.id}`, note);
  await audit(s.id, 'order.status', 'order', id, { to, note });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: `Order moved to ${STATUS_LABEL[to]}.` };
});

export const saveOrderNote = guarded('orders', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'orderId');
  await db.update(orders).set({ internalNote: str(fd, 'internalNote') || null }).where(eq(orders.id, id));
  await audit(s.id, 'order.note', 'order', id);
  revalidatePath(`/admin/orders/${id}`);
});

export const issueRefund = guarded('refunds', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'orderId'); const amount = toPaise(str(fd, 'amount')); const reason = str(fd, 'reason') || 'Refund';
  await refundOrder(id, amount, reason, s.id);
  await audit(s.id, 'order.refund', 'order', id, { amount, reason });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: 'Refund recorded.' };
});

export const createShipment = guarded('ordersWrite', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'orderId'); const mode = str(fd, 'mode');
  const o = await db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true, shipments: true } });
  if (!o) throw new Error('Order not found');
  if (o.paymentStatus !== 'paid') throw new Error('Only paid orders can be shipped.');
  if (o.shipments.length) throw new Error('A shipment already exists for this order.');
  if (mode === 'shiprocket') {
    if (!shiprocketEnabled()) throw new Error('Shiprocket is not configured. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD, or create a manual shipment.');
    const dims = { length: num(fd, 'length') || 30, breadth: num(fd, 'breadth') || 30, height: num(fd, 'height') || 30, weight: num(fd, 'weight') || 1 };
    const res = await pushOrder(o, dims);
    const awb = await assignAwb(String(res.shipment_id)).catch(() => ({ awb: null, courier: null }));
    await db.insert(shipments).values({ orderId: id, provider: 'shiprocket', providerOrderId: String(res.order_id), providerShipmentId: String(res.shipment_id), awb: awb.awb, courier: awb.courier, trackingUrl: awb.awb ? trackingUrl(awb.awb) : null });
  } else {
    const awb = str(fd, 'awb') || null;
    await db.insert(shipments).values({ orderId: id, provider: 'manual', courier: str(fd, 'courier') || null, awb, trackingUrl: str(fd, 'trackingUrl') || null });
  }
  if (['confirmed', 'processing'].includes(o.status)) {
    if (o.status === 'confirmed') await setOrderStatus(id, 'processing', `staff:${s.id}`, 'Shipment created');
    await setOrderStatus(id, 'packed', `staff:${s.id}`, 'Packed for dispatch');
  }
  await audit(s.id, 'shipment.create', 'order', id, { mode });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: 'Shipment created and order marked packed.' };
});

export const updateShipment = guarded('ordersWrite', async (s, fd): Promise<FormState | void> => {
  const sid = num(fd, 'shipmentId');
  const sh = await db.query.shipments.findFirst({ where: eq(shipments.id, sid) });
  if (!sh) throw new Error('Shipment not found');
  const action = str(fd, 'action');
  if (action === 'refresh' && sh.awb && shiprocketEnabled()) {
    const t = await trackAwb(sh.awb);
    const acts = t?.shipment_track_activities ?? [];
    const latest = acts[0]?.activity ?? '';
    await db.update(shipments).set({ status: latest ? mapStatus(latest) : sh.status, events: acts.slice().reverse().map(a => ({ at: a.date, status: a.activity, location: a.location })) }).where(eq(shipments.id, sid));
  } else {
    const status = str(fd, 'status') as typeof sh.status;
    await db.update(shipments).set({ courier: str(fd, 'courier') || sh.courier, awb: str(fd, 'awb') || sh.awb, trackingUrl: str(fd, 'trackingUrl') || sh.trackingUrl, status, dispatchedAt: status === 'in_transit' && !sh.dispatchedAt ? new Date() : sh.dispatchedAt, events: [...(sh.events ?? []), { at: new Date().toISOString(), status: str(fd, 'eventNote') || status }] }).where(eq(shipments.id, sid));
    const o = await db.query.orders.findFirst({ where: eq(orders.id, sh.orderId) });
    if (o && status === 'in_transit' && o.status === 'packed') await setOrderStatus(o.id, 'shipped', `staff:${s.id}`, 'Dispatched');
    if (o && status === 'delivered' && o.status === 'shipped') await setOrderStatus(o.id, 'delivered', `staff:${s.id}`, 'Delivered');
    if (o && ['exception', 'rto'].includes(status)) await db.insert(orderExceptions).values({ orderId: o.id, type: 'delivery_failure', note: str(fd, 'eventNote') || status });
  }
  await audit(s.id, 'shipment.update', 'shipment', sid, { action });
  revalidatePath(`/admin/orders/${sh.orderId}`);
});

export const assignSerials = guarded('ordersWrite', async (s, fd): Promise<FormState | void> => {
  const itemId = num(fd, 'itemId');
  const item = await db.query.orderItems.findFirst({ where: eq(orderItems.id, itemId) });
  if (!item) throw new Error('Item not found');
  const serials = str(fd, 'serials').split(/[\s,]+/).filter(Boolean);
  if (serials.length !== item.qty) throw new Error(`Enter exactly ${item.qty} serial number${item.qty > 1 ? 's' : ''}.`);
  await db.transaction(async tx => {
    await tx.update(orderItems).set({ serials }).where(eq(orderItems.id, itemId));
    const ws = await tx.query.warranties.findMany({ where: eq(warranties.orderItemId, itemId) });
    for (let i = 0; i < ws.length; i++) await tx.update(warranties).set({ serial: serials[i] ?? null }).where(eq(warranties.id, ws[i].id));
    for (const sn of serials) await tx.insert(serialUnits).values({ productId: item.productId, serial: sn, status: 'sold', orderItemId: itemId }).onConflictDoUpdate({ target: serialUnits.serial, set: { status: 'sold', orderItemId: itemId } });
  });
  await audit(s.id, 'order.serials', 'order_item', itemId, { serials });
  revalidatePath(`/admin/orders/${item.orderId}`);
});

export const updateInstallation = guarded('service', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'installationId');
  const inst = await db.query.installations.findFirst({ where: eq(installations.id, id) });
  if (!inst) throw new Error('Not found');
  const status = str(fd, 'status') as typeof inst.status;
  const when = str(fd, 'scheduledAt');
  const completedAt = status === 'completed' ? new Date() : null;
  await db.update(installations).set({ status, scheduledAt: when ? new Date(when) : inst.scheduledAt, technician: str(fd, 'technician') || inst.technician, notes: str(fd, 'notes') || inst.notes, completedAt }).where(eq(installations.id, id));
  if (completedAt) await db.update(warranties).set({ installationDate: completedAt }).where(eq(warranties.orderId, inst.orderId));
  await audit(s.id, 'installation.update', 'installation', id, { status });
  revalidatePath(`/admin/orders/${inst.orderId}`); revalidatePath('/admin/service');
});

export const updateReturn = guarded('ordersWrite', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'returnId'); const status = str(fd, 'status') as 'requested' | 'approved' | 'received' | 'rejected' | 'refunded';
  const r = await db.query.returns.findFirst({ where: eq(returns.id, id), with: { order: true } });
  if (!r) throw new Error('Not found');
  await db.update(returns).set({ status, note: str(fd, 'note') || r.note }).where(eq(returns.id, id));
  if (status === 'received') {
    const item = r.orderItemId ? await db.query.orderItems.findFirst({ where: eq(orderItems.id, r.orderItemId) }) : null;
    if (item) await db.transaction(tx => moveStock(tx, item.productId, 'return', r.qty, { reference: r.order.number, note: 'Customer return received', staffId: s.id }));
    await db.insert(orderEvents).values({ orderId: r.orderId, status: 'return_received', note: r.reason, actor: `staff:${s.id}` });
  }
  await audit(s.id, 'return.update', 'return', id, { status });
  revalidatePath(`/admin/orders/${r.orderId}`);
});

export const resolveException = guarded('ordersWrite', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'exceptionId');
  const ex = await db.query.orderExceptions.findFirst({ where: eq(orderExceptions.id, id) });
  if (!ex) throw new Error('Not found');
  await db.update(orderExceptions).set({ status: 'resolved', resolvedAt: new Date(), note: [ex.note, str(fd, 'note')].filter(Boolean).join(' · ') }).where(eq(orderExceptions.id, id));
  await audit(s.id, 'exception.resolve', 'order', ex.orderId);
  revalidatePath(`/admin/orders/${ex.orderId}`);
});

export const addException = guarded('ordersWrite', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'orderId');
  await db.insert(orderExceptions).values({ orderId: id, type: str(fd, 'type') as 'other', note: str(fd, 'note') || null });
  await audit(s.id, 'exception.add', 'order', id);
  revalidatePath(`/admin/orders/${id}`);
});

/* ─────────────── Products & inventory ─────────────── */
const productSchema = z.object({
  name: z.string().min(2), shortName: z.string().min(2), status: z.enum(['active', 'draft', 'archived']), saleMode: z.enum(['cart', 'enquiry']),
  mrp: z.coerce.number().min(0), price: z.coerce.number().min(0), gstRate: z.coerce.number().min(0).max(28), hsn: z.string().optional(),
  reorderLevel: z.coerce.number().int().min(0), maxPerOrder: z.coerce.number().int().min(1), warrantyMonths: z.coerce.number().int().min(0),
  tagline: z.string().optional(), description: z.string().optional(), quoteNote: z.string().optional(),
  brochureUrl: z.string().optional(), manualUrl: z.string().optional(), videoUrl: z.string().optional(),
});
export const saveProduct = guarded('products', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'id');
  const o = formToObject(fd) as Record<string, string>;
  const p = productSchema.safeParse(o);
  if (!p.success) return { errors: zodErrors(p.error), message: 'Check the highlighted fields.' };
  const d = p.data;
  if (d.saleMode === 'cart' && d.status === 'active' && d.price <= 0) return { errors: { price: 'Set a price before selling online.' } };
  const specs = str(fd, 'specs').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const i = l.indexOf(':'); return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { label: l, value: '' }; });
  const lines = (k: string) => str(fd, k).split('\n').map(l => l.trim()).filter(Boolean);
  await db.update(products).set({
    name: d.name, shortName: d.shortName, status: d.status, saleMode: d.saleMode, mrp: toPaise(d.mrp), price: toPaise(d.price), gstRate: Math.round(d.gstRate * 100), hsn: d.hsn || null,
    reorderLevel: d.reorderLevel, maxPerOrder: d.maxPerOrder, warrantyMonths: d.warrantyMonths, tagline: d.tagline || null, description: d.description || null, quoteNote: d.quoteNote || null,
    brochureUrl: d.brochureUrl || null, manualUrl: d.manualUrl || null, videoUrl: d.videoUrl || null, specs, boxContents: lines('boxContents'), images: lines('images'),
    priceConfirmed: o.priceConfirmed === 'on', buildToOrder: o.buildToOrder === 'on', trackSerials: o.trackSerials === 'on', requiresInstallation: o.requiresInstallation === 'on',
  }).where(eq(products.id, id));
  await audit(s.id, 'product.update', 'product', id, { price: d.price, status: d.status });
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Product saved. The website is updated.' };
});

export const adjustStock = guarded('inventory', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'productId'); const type = str(fd, 'type') as 'inward' | 'adjustment' | 'damage';
  let qty = Math.trunc(num(fd, 'qty'));
  if (!qty) return { errors: { qty: 'Enter a quantity' } };
  if (type === 'damage' && qty > 0) qty = -qty;
  if (type === 'inward' && qty < 0) return { errors: { qty: 'Inward stock must be positive' } };
  const note = str(fd, 'note');
  if (type !== 'inward' && !note) return { errors: { note: 'Add a reason for adjustments and damage' } };
  await db.transaction(tx => moveStock(tx, id, type, qty, { reference: str(fd, 'reference') || undefined, note, staffId: s.id }));
  const serials = str(fd, 'serials').split(/[\s,]+/).filter(Boolean);
  for (const sn of serials) await db.insert(serialUnits).values({ productId: id, serial: sn }).onConflictDoNothing();
  await audit(s.id, 'stock.move', 'product', id, { type, qty, note });
  revalidatePath('/admin/inventory');
  return { ok: true, message: 'Stock updated.' };
});

/* ─────────────── Enquiries / CRM ─────────────── */
export const updateEnquiry = guarded('enquiries', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'id');
  const status = str(fd, 'status') as typeof ENQUIRY_STATUSES[number];
  const qv = str(fd, 'quoteValue');
  await db.update(enquiries).set({
    status, assignedTo: num(fd, 'assignedTo') || null, quoteValue: qv ? toPaise(qv) : null, quoteStatus: (str(fd, 'quoteStatus') || 'none') as 'none',
    outcomeProduct: str(fd, 'outcomeProduct') || null, outcomeRef: str(fd, 'outcomeRef') || null, productInterest: (str(fd, 'productInterest') || 'not_sure') as 'not_sure',
  }).where(eq(enquiries.id, id));
  const note = str(fd, 'note');
  if (note) await db.insert(enquiryNotes).values({ enquiryId: id, staffId: s.id, note });
  await audit(s.id, 'enquiry.update', 'enquiry', id, { status });
  revalidatePath(`/admin/enquiries/${id}`);
});

export const replyToChat = guarded('enquiries', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'id'); const text = str(fd, 'text');
  if (!text) return { errors: { text: 'Type a reply' } };
  const e = await db.query.enquiries.findFirst({ where: eq(enquiries.id, id) });
  const d = e?.data as { transcript: ChatMsg[] } & Record<string, unknown> | undefined;
  if (!e || e.type !== 'chat' || !d) throw new Error('Not a chat');
  await db.update(enquiries).set({ data: { ...d, transcript: [...d.transcript, { from: 'agent', text, at: new Date().toISOString() }] }, status: e.status === 'new' ? 'contacted' : e.status, assignedTo: e.assignedTo ?? s.id }).where(eq(enquiries.id, id));
  await audit(s.id, 'chat.reply', 'enquiry', id);
  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true, message: 'Reply sent. The customer sees it in the chat window.' };
});

/* ─────────────── Water tests ─────────────── */
export const updateWaterTest = guarded('enquiries', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'id');
  const w = await db.query.waterTests.findFirst({ where: eq(waterTests.id, id) });
  if (!w) throw new Error('Not found');
  let reportPath = w.reportPath;
  const file = fd.get('report');
  if (file instanceof File && file.size) {
    try { reportPath = (await saveUpload(file, { allowed: ['application/pdf'], maxMb: 15, visibility: 'private', folder: 'lab-reports' })).storedPath; }
    catch (e) { if (e instanceof UploadError) return { errors: { report: e.message } }; throw e; }
  }
  let status = str(fd, 'status') as typeof w.status;
  if (reportPath && !w.reportPath && ['requested', 'confirmed', 'collected'].includes(status)) status = 'report_ready';
  const conv = str(fd, 'convertedOrder');
  const convOrder = conv ? await db.query.orders.findFirst({ where: eq(orders.number, conv.toUpperCase()) }) : null;
  if (conv && !convOrder) return { errors: { convertedOrder: 'No order with that number' } };
  await db.update(waterTests).set({ status, reportPath, recommendedProduct: str(fd, 'recommendedProduct') || null, paymentStatus: (str(fd, 'paymentStatus') || w.paymentStatus) as typeof w.paymentStatus, convertedOrderId: convOrder?.id ?? w.convertedOrderId, slot: str(fd, 'slot') || w.slot, preferredDate: str(fd, 'preferredDate') || w.preferredDate }).where(eq(waterTests.id, id));
  if (w.enquiryId) await db.update(enquiries).set({ status: convOrder ? 'converted' : status === 'completed' ? 'qualified' : 'contacted', outcomeRef: convOrder?.number ?? null }).where(eq(enquiries.id, w.enquiryId));
  if (status === 'report_ready' && w.status !== 'report_ready') await notify({ email: w.email, phone: w.phone }, { template: 'water_report_ready', subject: `Your water test report ${w.ref} is ready`, text: `Hi ${w.name.split(' ')[0]},\n\nYour water test report is ready. View it here: ${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/admin/files/wt-${w.ref}?t=${w.accessToken}\n\nDVINE H2O` });
  await audit(s.id, 'watertest.update', 'water_test', id, { status });
  revalidatePath(`/admin/water-tests/${id}`);
});

export const saveTestOption = guarded('settings', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'id');
  const values = { name: str(fd, 'name'), summary: str(fd, 'summary') || null, parameters: str(fd, 'parameters').split(',').map(x => x.trim()).filter(Boolean), collectionMethod: str(fd, 'collectionMethod'), turnaround: str(fd, 'turnaround'), price: toPaise(str(fd, 'price') || '0'), active: fd.get('active') === 'on', sort: num(fd, 'sort') || 0 };
  if (!values.name || !values.parameters.length) return { message: 'Name and parameters are required.' };
  if (id) await db.update(testOptions).set(values).where(eq(testOptions.id, id)); else await db.insert(testOptions).values(values);
  await audit(s.id, 'testoption.save', 'test_option', id || values.name);
  revalidatePath('/admin/water-tests'); revalidatePath('/water-testing');
});

/* ─────────────── Service ─────────────── */
export const updateTicket = guarded('service', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'id'); const status = str(fd, 'status') as 'open';
  await db.update(serviceTickets).set({ status, priority: str(fd, 'priority') as 'normal', assignedTo: num(fd, 'assignedTo') || null, actionTaken: str(fd, 'actionTaken') || null, partsUsed: str(fd, 'partsUsed') || null, resolvedAt: ['resolved', 'closed'].includes(status) ? new Date() : null }).where(eq(serviceTickets.id, id));
  await audit(s.id, 'ticket.update', 'service_ticket', id, { status });
  revalidatePath('/admin/service');
});

export const createAdminTicket = guarded('service', async (s, fd): Promise<FormState | void> => {
  const { createTicket } = await import('@/lib/enquiries');
  const t = await createTicket({ name: str(fd, 'name'), phone: str(fd, 'phone') || undefined, email: str(fd, 'email') || undefined, issue: str(fd, 'issue'), productId: num(fd, 'productId') || null, priority: (str(fd, 'priority') || 'normal') as 'normal' });
  await audit(s.id, 'ticket.create', 'service_ticket', t.id);
  revalidatePath('/admin/service');
  return { ok: true, message: `Ticket ${t.number} created.` };
});

/* ─────────────── Reviews ─────────────── */
export const moderateReview = guarded('marketing', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'id'); const status = str(fd, 'status') as 'approved' | 'rejected';
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  await audit(s.id, 'review.moderate', 'review', id, { status });
  revalidatePath('/admin/reviews'); revalidatePath('/', 'layout');
});

/* ─────────────── Coupons & referrals ─────────────── */
export const saveCoupon = guarded('marketing', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'id');
  const code = str(fd, 'code').toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9-]{3,24}$/.test(code)) return { errors: { code: 'Use 3–24 letters, numbers or dashes' } };
  const type = str(fd, 'type') as 'percent' | 'flat';
  const raw = Number(str(fd, 'value'));
  if (!(raw > 0) || (type === 'percent' && raw > 90)) return { errors: { value: type === 'percent' ? 'Enter 1–90' : 'Enter an amount' } };
  const v = {
    code, type, value: type === 'percent' ? Math.round(raw) : toPaise(raw), minOrder: toPaise(str(fd, 'minOrder') || '0'), maxDiscount: str(fd, 'maxDiscount') ? toPaise(str(fd, 'maxDiscount')) : null,
    appliesTo: fd.getAll('appliesTo').map(String).filter(Boolean), startsAt: str(fd, 'startsAt') ? new Date(str(fd, 'startsAt')) : null, endsAt: str(fd, 'endsAt') ? new Date(str(fd, 'endsAt') + 'T23:59:59') : null,
    usageLimit: str(fd, 'usageLimit') ? Number(str(fd, 'usageLimit')) : null, active: fd.get('active') === 'on', note: str(fd, 'note') || null,
  };
  if (!v.appliesTo.length) v.appliesTo = null as unknown as string[];
  try { if (id) await db.update(coupons).set(v).where(eq(coupons.id, id)); else await db.insert(coupons).values(v); }
  catch { return { errors: { code: 'This code already exists' } }; }
  await audit(s.id, id ? 'coupon.update' : 'coupon.create', 'coupon', id || code);
  revalidatePath('/admin/marketing');
  return { ok: true, message: 'Coupon saved.' };
});

export const saveReferralSettings = guarded('marketing', async (s, fd): Promise<FormState | void> => {
  const v = { enabled: fd.get('enabled') === 'on', friendPercent: Math.min(50, Math.max(0, Number(str(fd, 'friendPercent')))), friendMax: toPaise(str(fd, 'friendMax') || '0'), rewardFlat: toPaise(str(fd, 'rewardFlat') || '0'), rewardMinOrder: toPaise(str(fd, 'rewardMinOrder') || '0'), rewardValidDays: Math.max(1, Number(str(fd, 'rewardValidDays')) || DEFAULT_REFERRAL.rewardValidDays) };
  await setSetting('referral', v);
  await audit(s.id, 'settings.referral', 'settings', 'referral', v);
  revalidatePath('/admin/marketing');
});

/* ─────────────── Pincodes ─────────────── */
export const savePincodes = guarded('settings', async (s, fd): Promise<FormState | void> => {
  // one per line: pincode,city,state,deliveryDays,installation(y/n),waterTesting(y/n)
  const rows = str(fd, 'rows').split('\n').map(l => l.trim()).filter(Boolean);
  let n = 0; const bad: string[] = [];
  for (const line of rows) {
    const [pin, city, state, days, inst, wt] = line.split(',').map(x => x?.trim());
    if (!/^[1-9]\d{5}$/.test(pin ?? '') || !city || !state) { bad.push(line); continue; }
    const v = { pincode: pin, city, state, serviceable: true, deliveryDays: Number(days) || 5, installation: !/^n/i.test(inst ?? 'y'), waterTesting: /^y/i.test(wt ?? 'n') };
    await db.insert(pincodes).values(v).onConflictDoUpdate({ target: pincodes.pincode, set: v }); n++;
  }
  await audit(s.id, 'pincodes.import', 'pincode', undefined, { n, bad: bad.length });
  revalidatePath('/admin/settings/pincodes');
  return { ok: !bad.length, message: `${n} pincode${n === 1 ? '' : 's'} saved.${bad.length ? ` ${bad.length} line(s) skipped: ${bad.slice(0, 3).join(' | ')}` : ''}` };
});
export const togglePincode = guarded('settings', async (s, fd): Promise<FormState | void> => {
  const pin = str(fd, 'pincode'); const field = str(fd, 'field') as 'serviceable' | 'installation' | 'waterTesting';
  const row = await db.query.pincodes.findFirst({ where: eq(pincodes.pincode, pin) });
  if (!row) throw new Error('Not found');
  await db.update(pincodes).set({ [field]: !row[field] }).where(eq(pincodes.pincode, pin));
  await audit(s.id, 'pincode.toggle', 'pincode', pin, { field });
  revalidatePath('/admin/settings/pincodes');
});

/* ─────────────── Settings & staff ─────────────── */
export const saveCompany = guarded('settings', async (s, fd): Promise<FormState | void> => {
  const o = formToObject(fd) as Record<string, string>;
  const gstin = (o.gstin ?? '').toUpperCase().trim();
  if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return { errors: { gstin: 'Enter a valid GSTIN' } };
  const v = { ...DEFAULT_COMPANY, legalName: o.legalName, tradeName: o.tradeName || o.legalName, gstin, pan: (o.pan ?? '').toUpperCase(), address: o.address, city: o.city, state: o.state, pincode: o.pincode, phone: o.phone, email: o.email, invoicePrefix: (o.invoicePrefix || 'DVH').toUpperCase().replace(/[^A-Z0-9]/g, ''), confirmed: o.confirmed === 'on' };
  await setSetting('company', v);
  await audit(s.id, 'settings.company', 'settings', 'company');
  revalidatePath('/admin/settings');
  return { ok: true, message: 'Company details saved.' };
});
export const saveCommerce = guarded('settings', async (s, fd): Promise<FormState | void> => {
  const v = { ...DEFAULT_COMMERCE, shippingFee: toPaise(str(fd, 'shippingFee') || '0'), freeShippingAbove: toPaise(str(fd, 'freeShippingAbove') || '0'), reservationMinutes: Math.max(5, num(fd, 'reservationMinutes') || 30), abandonmentMinutes: Math.max(10, num(fd, 'abandonmentMinutes') || 60), returnWindowDays: Math.max(0, num(fd, 'returnWindowDays')), cancelBefore: (str(fd, 'cancelBefore') || 'packed') as 'packed' };
  await setSetting('commerce', v);
  await audit(s.id, 'settings.commerce', 'settings', 'commerce', v);
  revalidatePath('/admin/settings');
  return { ok: true, message: 'Store settings saved.' };
});

export const saveStaff = guarded('settings', async (s, fd): Promise<FormState | void> => {
  const id = num(fd, 'id'); const email = str(fd, 'email').toLowerCase(); const pw = str(fd, 'password');
  const role = str(fd, 'role') as 'admin' | 'operations' | 'support';
  if (!z.string().email().safeParse(email).success) return { errors: { email: 'Enter a valid email' } };
  if (id === s.id && (role !== 'admin' || fd.get('active') !== 'on')) return { message: 'You can’t remove your own admin access.' };
  if (id) {
    await db.update(staff).set({ name: str(fd, 'name'), email, role, active: fd.get('active') === 'on', ...(pw ? { passwordHash: await hashPassword(pw) } : {}) }).where(eq(staff.id, id));
  } else {
    if (pw.length < 10) return { errors: { password: 'Use at least 10 characters' } };
    try { await db.insert(staff).values({ name: str(fd, 'name'), email, role, passwordHash: await hashPassword(pw) }); } catch { return { errors: { email: 'A staff member with this email exists' } }; }
  }
  await audit(s.id, id ? 'staff.update' : 'staff.create', 'staff', id || email, { role });
  revalidatePath('/admin/settings/staff');
  return { ok: true, message: 'Staff saved.' };
});

/* ─────────────── Customers ─────────────── */
export const addCustomerNote = guarded('customers', async (s, fd): Promise<FormState | void> => {
  // stored as a general enquiry note so it shows in the CRM timeline
  const cid = num(fd, 'customerId'); const note = str(fd, 'note');
  if (!note) return { errors: { note: 'Write a note' } };
  const c = await db.query.customers.findFirst({ where: (t, { eq }) => eq(t.id, cid) });
  if (!c) throw new Error('Not found');
  const { createEnquiry } = await import('@/lib/enquiries');
  const e = await createEnquiry({ type: 'general', name: c.name, email: c.email ?? undefined, phone: c.phone ?? undefined, message: note, source: 'admin', consent: true, customerId: c.id }, { silent: true });
  await db.update(enquiries).set({ status: 'closed', assignedTo: s.id }).where(eq(enquiries.id, e.id));
  await audit(s.id, 'customer.note', 'customer', cid);
  revalidatePath(`/admin/customers/${cid}`);
});

/* ─────────────── Maintenance ─────────────── */
export const runMaintenanceNow = guarded('settings', async (s): Promise<FormState | void> => {
  const { runMaintenance } = await import('@/lib/orders');
  const r = await runMaintenance();
  await audit(s.id, 'maintenance.run', 'system', undefined, r);
  revalidatePath('/admin');
  return { ok: true, message: `Released ${r.releasedOrders} expired order(s), marked ${r.abandonedCarts} cart(s) abandoned.` };
});

export async function goToOrder(fd: FormData) {
  await requireStaff('orders');
  const q = String(fd.get('q') ?? '').trim().toUpperCase();
  const o = await db.query.orders.findFirst({ where: eq(orders.number, q) });
  redirect(o ? `/admin/orders/${o.id}` : `/admin/orders?q=${encodeURIComponent(q)}`);
}


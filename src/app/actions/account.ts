'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderEvents, returns, reviews, installations, customers, addresses, warranties } from '@/lib/db/schema';
import { requireCustomer, hashPassword, verifyPassword } from '@/lib/auth';
import { cancelOrder } from '@/lib/orders';
import { createTicket } from '@/lib/enquiries';
import { getCommerce } from '@/lib/settings';
import { address, formToObject, name, phone, zodErrors, type FormState } from '@/lib/validators';
import { saveUpload, UploadError } from '@/lib/uploads';

async function ownOrder(number: string) {
  const c = await requireCustomer();
  const o = await db.query.orders.findFirst({ where: and(eq(orders.number, number), eq(orders.customerId, c.id)), with: { items: true } });
  if (!o) throw new Error('Order not found');
  return { c, o };
}

export async function cancelMyOrder(_: FormState, fd: FormData): Promise<FormState> {
  const { o } = await ownOrder(String(fd.get('number')));
  const commerce = await getCommerce();
  const blocked = commerce.cancelBefore === 'packed' ? ['packed', 'shipped', 'delivered'] : ['shipped', 'delivered'];
  if (blocked.includes(o.status) || ['cancelled', 'returned'].includes(o.status)) return { message: 'This order can no longer be cancelled online. Contact support and we’ll help.' };
  const reason = String(fd.get('reason') || 'Changed my mind').slice(0, 200);
  await cancelOrder(o.id, 'customer', reason);
  revalidatePath(`/account/orders/${o.number}`);
  return { ok: true, message: o.paymentStatus === 'paid' ? 'Your order is cancelled and a full refund has been started.' : 'Your order is cancelled.' };
}

export async function requestReturn(_: FormState, fd: FormData): Promise<FormState> {
  const { o } = await ownOrder(String(fd.get('number')));
  if (o.status !== 'delivered') return { message: 'Returns can be requested after delivery.' };
  const commerce = await getCommerce();
  const ev = await db.query.orderEvents.findFirst({ where: and(eq(orderEvents.orderId, o.id), eq(orderEvents.status, 'delivered')), orderBy: (e, { desc }) => desc(e.createdAt) });
  const deliveredAt = ev?.createdAt ?? o.updatedAt;
  if (Date.now() - deliveredAt.getTime() > commerce.returnWindowDays * 86400_000) return { message: `The ${commerce.returnWindowDays}-day return window for this order has closed. Raise a service request instead.` };
  const reason = String(fd.get('reason') ?? '').trim();
  const itemId = Number(fd.get('itemId'));
  if (reason.length < 5) return { errors: { reason: 'Tell us why you’re returning it.' } };
  const item = o.items.find(i => i.id === itemId) ?? o.items[0];
  const open = await db.query.returns.findFirst({ where: and(eq(returns.orderId, o.id), eq(returns.orderItemId, item.id)) });
  if (open) return { message: 'A return is already open for this item.' };
  await db.insert(returns).values({ orderId: o.id, orderItemId: item.id, qty: item.qty, reason });
  revalidatePath(`/account/orders/${o.number}`);
  return { ok: true, message: 'Return requested. Our team will review it and contact you to arrange collection.' };
}

export async function submitReview(_: FormState, fd: FormData): Promise<FormState> {
  const { c, o } = await ownOrder(String(fd.get('number')));
  if (o.status !== 'delivered') return { message: 'You can review a product after it’s delivered.' };
  const p = z.object({ productId: z.coerce.number(), rating: z.coerce.number().int().min(1, 'Choose a rating').max(5), title: z.string().trim().max(80).optional(), body: z.string().trim().min(10, 'Write at least a sentence').max(2000) }).safeParse(formToObject(fd));
  if (!p.success) return { errors: zodErrors(p.error) };
  if (!o.items.some(i => i.productId === p.data.productId)) return { message: 'That product is not in this order.' };
  const exists = await db.query.reviews.findFirst({ where: and(eq(reviews.customerId, c.id), eq(reviews.productId, p.data.productId), eq(reviews.orderId, o.id)) });
  if (exists) return { message: 'You’ve already reviewed this product for this order.' };
  const media: string[] = [];
  for (const f of fd.getAll('photos').slice(0, 4)) {
    if (!(f instanceof File) || !f.size) continue;
    try { media.push((await saveUpload(f, { allowed: ['image/jpeg', 'image/png', 'image/webp'], maxMb: 5, visibility: 'public', folder: 'reviews' })).publicUrl!); }
    catch (e) { if (e instanceof UploadError) return { errors: { photos: e.message } }; throw e; }
  }
  await db.insert(reviews).values({ productId: p.data.productId, customerId: c.id, orderId: o.id, rating: p.data.rating, title: p.data.title || null, body: p.data.body, media, verified: true });
  revalidatePath(`/account/orders/${o.number}`);
  return { ok: true, message: 'Thank you. Your review will appear once our team has checked it.' };
}

export async function preferInstallation(_: FormState, fd: FormData): Promise<FormState> {
  const { o } = await ownOrder(String(fd.get('number')));
  const date = String(fd.get('date') ?? '');
  const slot = String(fd.get('slot') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { errors: { date: 'Choose a date' } };
  const inst = await db.query.installations.findFirst({ where: eq(installations.orderId, o.id) });
  if (!inst) return { message: 'Installation does not apply to this order.' };
  if (inst.status === 'completed') return { message: 'Installation is already complete.' };
  await db.update(installations).set({ notes: `${inst.notes ?? ''}\nCustomer prefers ${date} ${slot}`.trim(), status: 'pending' }).where(eq(installations.id, inst.id));
  revalidatePath(`/account/orders/${o.number}`);
  return { ok: true, message: 'Thanks. We’ll confirm your installation slot.' };
}

export async function raiseServiceRequest(_: FormState, fd: FormData): Promise<FormState> {
  const c = await requireCustomer();
  const issue = String(fd.get('issue') ?? '').trim();
  const warrantyId = Number(fd.get('warrantyId')) || null;
  if (issue.length < 10) return { errors: { issue: 'Describe the issue (at least 10 characters).' } };
  const w = warrantyId ? await db.query.warranties.findFirst({ where: and(eq(warranties.id, warrantyId), eq(warranties.customerId, c.id)) }) : null;
  const t = await createTicket({ name: c.name, email: c.email ?? undefined, phone: c.phone ?? undefined, issue, productId: w?.productId ?? (Number(fd.get('productId')) || null), warrantyId: w?.id ?? null, orderId: w?.orderId ?? null, customerId: c.id });
  revalidatePath('/account/service');
  return { ok: true, message: `Service request ${t.number} created. We’ll be in touch.` };
}

export async function rateService(fd: FormData) {
  const c = await requireCustomer();
  const id = Number(fd.get('id')); const rating = Math.min(5, Math.max(1, Number(fd.get('rating'))));
  const { serviceTickets } = await import('@/lib/db/schema');
  await db.update(serviceTickets).set({ rating, feedback: String(fd.get('feedback') ?? '').slice(0, 500) || null }).where(and(eq(serviceTickets.id, id), eq(serviceTickets.customerId, c.id)));
  revalidatePath('/account/service');
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const c = await requireCustomer();
  const o = formToObject(fd) as Record<string, string>;
  const p = z.object({ name, phone, marketing: z.string().optional() }).safeParse(o);
  if (!p.success) return { errors: zodErrors(p.error), data: o };
  const clash = await db.query.customers.findFirst({ where: eq(customers.phone, p.data.phone) });
  if (clash && clash.id !== c.id) return { errors: { phone: 'This phone number is used by another account.' }, data: o };
  await db.update(customers).set({ name: p.data.name, phone: p.data.phone, consentMarketing: p.data.marketing === 'on' }).where(eq(customers.id, c.id));
  if (o.newPassword) {
    if (!c.passwordHash || !(await verifyPassword(o.currentPassword ?? '', c.passwordHash))) return { errors: { currentPassword: 'Current password is incorrect' }, data: o };
    if (o.newPassword.length < 8) return { errors: { newPassword: 'Use at least 8 characters' }, data: o };
    await db.update(customers).set({ passwordHash: await hashPassword(o.newPassword) }).where(eq(customers.id, c.id));
  }
  revalidatePath('/account/profile');
  return { ok: true, message: 'Profile saved.' };
}

export async function saveAddress(_: FormState, fd: FormData): Promise<FormState> {
  const c = await requireCustomer();
  const o = formToObject(fd) as Record<string, string>;
  const p = address.safeParse({ ...o, line2: o.line2 || undefined, gstin: o.gstin || undefined });
  if (!p.success) return { errors: zodErrors(p.error), data: o };
  if (o.isDefault === 'on') await db.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, c.id));
  await db.insert(addresses).values({ customerId: c.id, type: 'shipping', ...p.data, line2: p.data.line2 ?? null, isDefault: o.isDefault === 'on' });
  revalidatePath('/account/profile');
  return { ok: true, message: 'Address saved.' };
}

export async function deleteAddress(fd: FormData) {
  const c = await requireCustomer();
  await db.delete(addresses).where(and(eq(addresses.id, Number(fd.get('id'))), eq(addresses.customerId, c.id)));
  revalidatePath('/account/profile');
}


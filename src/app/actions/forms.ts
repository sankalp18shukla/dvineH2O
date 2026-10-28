'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { and, eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, pincodes, reportUploads, enquiries, INTERESTS } from '@/lib/db/schema';
import { createEnquiry, createWaterTest, createTicket } from '@/lib/enquiries';
import { getCustomer } from '@/lib/auth';
import { email, formToObject, name, optional, phone, pincode, zodErrors, type FormState } from '@/lib/validators';
import { saveUpload, UploadError } from '@/lib/uploads';

const consent = z.literal('on', { errorMap: () => ({ message: 'Please agree so we can contact you about this request.' }) });
const interest = z.enum(INTERESTS).default('not_sure');

/* Demo / product enquiry / Titan consultation / distributorship / bulk / general */
const enquirySchema = z.object({
  type: z.enum(['product', 'demo', 'consultation', 'distributorship', 'bulk', 'general']),
  interest, name, email: optional(email), phone, city: optional(z.string().trim().max(60)), pincode: optional(pincode),
  company: optional(z.string().trim().max(120)), message: optional(z.string().trim().max(2000)), preferredAt: optional(z.string().trim().max(80)),
  source: optional(z.string().max(120)), consent, marketing: z.string().optional(),
  // business fields
  setting: optional(z.string().max(60)), locations: optional(z.string().max(20)), users: optional(z.string().max(20)), peak: optional(z.string().max(60)),
  waterSource: optional(z.string().max(60)), timeline: optional(z.string().max(60)), quantity: optional(z.string().max(20)), demoMode: optional(z.string().max(40)),
  territory: optional(z.string().max(120)), gstin: optional(z.string().max(20)),
});

export async function submitEnquiry(_: FormState, fd: FormData): Promise<FormState> {
  const o = formToObject(fd) as Record<string, string>;
  if (o.website) return { ok: true, message: 'Thanks.' }; // honeypot
  const p = enquirySchema.safeParse(o);
  if (!p.success) return { errors: zodErrors(p.error), data: o };
  const d = p.data;
  // optional site / kitchen photos (up to 3), kept private and attached to the enquiry for the team
  const photos = fd.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);
  const saved = [];
  for (const f of photos) {
    try { saved.push(await saveUpload(f, { allowed: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maxMb: 10, visibility: 'private', folder: 'enquiries' })); }
    catch (err) { if (err instanceof UploadError) return { errors: { photos: err.message }, data: o }; throw err; }
  }
  const customer = await getCustomer();
  const extra = Object.fromEntries(Object.entries({ setting: d.setting, locations: d.locations, users: d.users, peak: d.peak, waterSource: d.waterSource, timeline: d.timeline, quantity: d.quantity, demoMode: d.demoMode, territory: d.territory, gstin: d.gstin }).filter(([, v]) => v));
  const e = await createEnquiry({
    type: d.type, interest: d.type === 'consultation' ? 'titan' : d.interest, name: d.name, email: d.email, phone: d.phone, city: d.city, pincode: d.pincode,
    company: d.company, message: d.message, preferredAt: d.preferredAt, data: Object.keys(extra).length ? extra : undefined, source: d.source,
    consent: true, marketing: d.marketing === 'on', customerId: customer?.id,
  });
  for (const f of saved) await db.insert(reportUploads).values({ enquiryId: e.id, fileName: f.fileName, storedPath: f.storedPath, mime: f.mime, size: f.size });
  return { ok: true, message: `Thank you, ${d.name.split(' ')[0]}. Your reference is ${e.ref}. Our team will be in touch shortly.` };
}

/* Water test booking */
const testSchema = z.object({
  optionId: z.coerce.number().int().positive({ message: 'Choose a test' }), name, phone, email: optional(email),
  address: z.string().trim().min(6, 'Enter the collection address').max(240), city: z.string().trim().min(2, 'Enter your city'), pincode,
  waterSource: optional(z.string().max(60)), sampleType: z.enum(['source', 'treated']).default('source'),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'), slot: z.string().min(1, 'Choose a time slot'), interest, consent,
});

export async function bookWaterTest(_: FormState, fd: FormData): Promise<FormState> {
  const o = formToObject(fd) as Record<string, string>;
  const p = testSchema.safeParse(o);
  if (!p.success) return { errors: zodErrors(p.error), data: o };
  const d = p.data;
  const day = new Date(d.preferredDate + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (day < new Date(today.getTime() + 86400_000)) return { errors: { preferredDate: 'Choose a date from tomorrow onwards' }, data: o };
  const pin = await db.query.pincodes.findFirst({ where: eq(pincodes.pincode, d.pincode) });
  if (!pin || !pin.waterTesting) return { errors: { pincode: 'Water testing is not available at this pincode yet. Upload an existing report, or send us an enquiry.' }, data: o };
  const customer = await getCustomer();
  const wt = await createWaterTest({ ...d, consent: true, customerId: customer?.id });
  redirect(`/water-testing/booking/${wt.ref}?t=${wt.accessToken}`);
}

/* Report upload */
export async function uploadReport(_: FormState, fd: FormData): Promise<FormState> {
  const o = formToObject(fd) as Record<string, string>;
  const p = z.object({ name, phone, email: optional(email), testDate: optional(z.string().max(20)), message: optional(z.string().max(2000)), consent }).safeParse(o);
  if (!p.success) return { errors: zodErrors(p.error), data: o };
  const file = fd.get('report');
  if (!(file instanceof File) || !file.size) return { errors: { report: 'Attach your report (PDF, JPG or PNG).' }, data: o };
  let saved;
  try { saved = await saveUpload(file, { allowed: ['application/pdf', 'image/jpeg', 'image/png'], maxMb: 10, visibility: 'private', folder: 'reports' }); }
  catch (e) { if (e instanceof UploadError) return { errors: { report: e.message }, data: o }; throw e; }
  const customer = await getCustomer();
  const d = p.data;
  const e = await createEnquiry({ type: 'water_test', name: d.name, phone: d.phone, email: d.email, message: d.message, data: { reportUpload: true, testDate: d.testDate }, source: '/water-testing#upload', consent: true, customerId: customer?.id });
  await db.insert(reportUploads).values({ enquiryId: e.id, fileName: saved.fileName, storedPath: saved.storedPath, mime: saved.mime, size: saved.size, testDate: d.testDate ?? null });
  return { ok: true, message: `Thanks, ${d.name.split(' ')[0]}. We've received your report (${e.ref}). Our team will review it and get back to you.` };
}

/* Support form: routes service/warranty topics to a service ticket, everything else to the CRM */
export async function supportRequest(_: FormState, fd: FormData): Promise<FormState> {
  const o = formToObject(fd) as Record<string, string>;
  if (o.website) return { ok: true, message: 'Thanks.' };
  const p = z.object({
    topic: z.string().min(1, 'Choose a topic'), name, contact: z.string().trim().min(5, 'Enter your phone or email'), city: optional(z.string().max(60)),
    message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(3000), product: optional(z.enum(['hyper', 'crystal', 'titan'])), consent,
  }).safeParse(o);
  if (!p.success) return { errors: zodErrors(p.error), data: o };
  const d = p.data;
  const isEmail = d.contact.includes('@');
  const ph = isEmail ? null : phone.safeParse(d.contact);
  const em = isEmail ? email.safeParse(d.contact) : null;
  if ((ph && !ph.success) || (em && !em.success)) return { errors: { contact: 'Enter a valid phone number or email address' }, data: o };
  const contact = { phone: ph?.success ? ph.data : undefined, email: em?.success ? em.data : undefined };
  const customer = await getCustomer();
  if (['Service request', 'Warranty', 'Product care', 'Installation'].includes(d.topic)) {
    const prod = d.product ? await db.query.products.findFirst({ where: (t, { eq }) => eq(t.slug, d.product!) }) : null;
    const t = await createTicket({ name: d.name, ...contact, issue: `[${d.topic}] ${d.message}`, productId: prod?.id, customerId: customer?.id });
    return { ok: true, message: `Thanks, ${d.name.split(' ')[0]}. Your service request number is ${t.number}. A DVINE engineer will contact you.` };
  }
  const e = await createEnquiry({ type: d.topic === 'Buying advice' ? 'product' : 'support', interest: d.product ?? 'not_sure', name: d.name, ...contact, city: d.city, message: `[${d.topic}] ${d.message}`, source: '/support', consent: true, customerId: customer?.id });
  return { ok: true, message: `Thanks, ${d.name.split(' ')[0]}. Your reference is ${e.ref}. We'll reply shortly.` };
}

/* Order lookup for guests */
export async function trackOrder(_: FormState, fd: FormData): Promise<FormState> {
  const o = formToObject(fd) as Record<string, string>;
  const number = String(o.number ?? '').trim().toUpperCase();
  const contact = String(o.contact ?? '').trim().toLowerCase();
  if (!number || !contact) return { errors: { ...(number ? {} : { number: 'Enter your order number' }), ...(contact ? {} : { contact: 'Enter the email or phone used for the order' }) }, data: o };
  const ph = phone.safeParse(contact);
  const order = await db.query.orders.findFirst({ where: and(eq(orders.number, number), or(eq(orders.contactEmail, contact), eq(orders.contactPhone, ph.success ? ph.data : contact))) });
  if (!order) return { message: 'We could not find an order with those details. Check the order number in your confirmation message.', data: o };
  redirect(`/order/${order.number}?t=${order.accessToken}`);
}

export async function enquiryExists(ref: string) {
  return !!(await db.query.enquiries.findFirst({ where: eq(enquiries.ref, ref) }));
}

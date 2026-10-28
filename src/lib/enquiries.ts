import { eq } from 'drizzle-orm';
import { db } from './db';
import { enquiries, waterTests, serviceTickets, testOptions, ENQUIRY_TYPES, INTERESTS } from './db/schema';
import { enquiryRef, waterTestRef, ticketNumber, randomToken } from './numbering';
import { findOrCreateCustomer } from './customers';
import { notify, templates, links } from './notify';

export type EnquiryType = typeof ENQUIRY_TYPES[number];
export type Interest = typeof INTERESTS[number];

export const ENQUIRY_LABEL: Record<EnquiryType, string> = {
  product: 'Product enquiry', demo: 'Demo', water_test: 'Water test', consultation: 'Titan consultation', distributorship: 'Distributorship',
  bulk: 'Bulk / gifting', support: 'Support', general: 'General', chat: 'Chat',
};
export const INTEREST_LABEL: Record<Interest, string> = { hyper: 'Hyper', crystal: 'Crystal', titan: 'Titan 111', multiple: 'Multiple', not_sure: 'Not sure' };

type EnquiryInput = {
  type: EnquiryType; interest?: Interest; name: string; email?: string; phone?: string; company?: string; city?: string; pincode?: string;
  message?: string; preferredAt?: string; data?: Record<string, unknown>; source?: string; consent: boolean; marketing?: boolean; customerId?: number | null;
};

/** Every website form lands here: one CRM record linked to a single customer profile. */
export async function createEnquiry(input: EnquiryInput, opts: { silent?: boolean } = {}) {
  const customer = input.customerId
    ? await db.query.customers.findFirst({ where: (c, { eq }) => eq(c.id, input.customerId!) })
    : (input.email || input.phone) ? await findOrCreateCustomer({ name: input.name, email: input.email, phone: input.phone, city: input.city, pincode: input.pincode, consent: input.consent, marketing: input.marketing }) : null;
  const ref = await enquiryRef(db);
  const [row] = await db.insert(enquiries).values({
    ref, customerId: customer?.id ?? null, type: input.type, productInterest: input.interest ?? 'not_sure', name: input.name,
    email: input.email || null, phone: input.phone || null, company: input.company || null, city: input.city || null, pincode: input.pincode || null,
    message: input.message || null, preferredAt: input.preferredAt || null, data: input.data ?? null, source: input.source ?? null, consent: input.consent,
  }).returning();
  if (!opts.silent) await notify({ email: row.email }, templates.enquiryReceived({ ref, name: input.name.split(' ')[0], what: ENQUIRY_LABEL[input.type].toLowerCase() }));
  return row;
}

type TestInput = { optionId: number; name: string; phone: string; email?: string; address: string; city: string; pincode: string; waterSource?: string; sampleType?: string; preferredDate?: string; slot?: string; interest?: Interest; consent: boolean; customerId?: number | null };

export async function createWaterTest(input: TestInput) {
  const option = await db.query.testOptions.findFirst({ where: eq(testOptions.id, input.optionId) });
  if (!option || !option.active) throw new Error('Please choose an available test.');
  const enquiry = await createEnquiry({ type: 'water_test', interest: input.interest, name: input.name, email: input.email, phone: input.phone, city: input.city, pincode: input.pincode, preferredAt: [input.preferredDate, input.slot].filter(Boolean).join(' · '), data: { test: option.name, waterSource: input.waterSource, sampleType: input.sampleType }, source: '/water-testing', consent: input.consent, customerId: input.customerId }, { silent: true });
  const ref = await waterTestRef(db);
  const [wt] = await db.insert(waterTests).values({
    ref, accessToken: randomToken(), customerId: enquiry.customerId, enquiryId: enquiry.id, testOptionId: option.id, name: input.name, phone: input.phone, email: input.email || null,
    address: input.address, city: input.city, pincode: input.pincode, waterSource: input.waterSource || null, sampleType: input.sampleType || null,
    preferredDate: input.preferredDate || null, slot: input.slot || null, price: option.price, paymentStatus: option.price ? 'pending' : 'not_required',
    productInterest: input.interest ?? null,
  }).returning();
  await notify({ email: wt.email, phone: wt.phone }, templates.waterTestBooked({ ref, name: input.name.split(' ')[0], when: [input.preferredDate, input.slot].filter(Boolean).join(', ') || 'your preferred time', link: links.waterTest(ref, wt.accessToken) }));
  return wt;
}

type TicketInput = { name: string; phone?: string; email?: string; issue: string; productId?: number | null; warrantyId?: number | null; orderId?: number | null; priority?: 'low' | 'normal' | 'high' | 'urgent'; customerId?: number | null };

export async function createTicket(input: TicketInput) {
  const customer = input.customerId ? { id: input.customerId } : (input.email || input.phone) ? await findOrCreateCustomer({ name: input.name, email: input.email, phone: input.phone }) : null;
  const number = await ticketNumber(db);
  const [t] = await db.insert(serviceTickets).values({
    number, customerId: customer?.id ?? null, productId: input.productId ?? null, warrantyId: input.warrantyId ?? null, orderId: input.orderId ?? null,
    name: input.name, phone: input.phone ?? null, email: input.email ?? null, issue: input.issue, priority: input.priority ?? 'normal',
  }).returning();
  await notify({ email: input.email, phone: input.phone }, templates.ticketOpened({ number, name: input.name.split(' ')[0] }));
  return t;
}

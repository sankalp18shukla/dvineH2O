import { eq, or } from 'drizzle-orm';
import { db, type Tx } from './db';
import { customers } from './db/schema';

type Input = { name: string; email?: string | null; phone?: string | null; city?: string | null; state?: string | null; pincode?: string | null; consent?: boolean; marketing?: boolean };

/** One customer record across orders and enquiries: match on email, then phone. */
export async function findOrCreateCustomer(input: Input, tx: Tx | typeof db = db) {
  const email = input.email?.toLowerCase() || null;
  const phone = input.phone || null;
  const conds = [email ? eq(customers.email, email) : undefined, phone ? eq(customers.phone, phone) : undefined].filter(Boolean);
  const existing = conds.length ? await tx.query.customers.findFirst({ where: or(...(conds as NonNullable<typeof conds[number]>[])) }) : undefined;
  const now = new Date();
  if (existing) {
    const patch: Partial<typeof customers.$inferInsert> = {};
    if (!existing.email && email) patch.email = email;
    if (!existing.phone && phone) patch.phone = phone;
    if (input.city) patch.city = input.city;
    if (input.state) patch.state = input.state;
    if (input.pincode) patch.pincode = input.pincode;
    if (input.consent && !existing.consentPrivacyAt) { patch.consentPrivacyAt = now; patch.consentTermsAt = now; }
    if (input.marketing) patch.consentMarketing = true;
    if (Object.keys(patch).length) await tx.update(customers).set(patch).where(eq(customers.id, existing.id));
    return { ...existing, ...patch };
  }
  const [row] = await tx.insert(customers).values({
    name: input.name, email, phone, city: input.city ?? null, state: input.state ?? null, pincode: input.pincode ?? null,
    consentPrivacyAt: input.consent ? now : null, consentTermsAt: input.consent ? now : null, consentMarketing: !!input.marketing,
  }).returning();
  return row;
}

import { and, asc, eq, isNull } from 'drizzle-orm';
import { db, type Tx } from './db';
import { customers, staff } from './db/schema';
import { queueSheetSync } from './sheet-queue';

type Input = { name: string; email?: string | null; phone?: string | null; city?: string | null; state?: string | null; pincode?: string | null; consent?: boolean; marketing?: boolean };

/**
 * One customer record across orders and enquiries.
 *  · With an email: match on that email (it is where every confirmation and link is sent).
 *  · Phone only (chat, call-back forms): match only a *guest* record with that phone. A phone number is never
 *    verified, so it must not attach anything to — or reveal anything from — a registered account.
 * Registered accounts never have their name or contact details overwritten by an anonymous form.
 */
export async function findOrCreateCustomer(input: Input, tx: Tx | typeof db = db) {
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone || null;
  const existing = email
    ? await tx.query.customers.findFirst({ where: eq(customers.email, email), orderBy: asc(customers.id) })
    : phone
      ? await tx.query.customers.findFirst({ where: and(eq(customers.phone, phone), isNull(customers.authUserId)), orderBy: asc(customers.id) })
      : undefined;
  const now = new Date();
  if (existing) {
    const patch: Partial<typeof customers.$inferInsert> = {};
    if (!existing.authUserId) {
      if (!existing.phone && phone) patch.phone = phone;
      if (input.city) patch.city = input.city;
      if (input.state) patch.state = input.state;
      if (input.pincode) patch.pincode = input.pincode;
    }
    if (input.consent && !existing.consentPrivacyAt) { patch.consentPrivacyAt = now; patch.consentTermsAt = now; }
    if (input.marketing) patch.consentMarketing = true;
    if (Object.keys(patch).length) { await tx.update(customers).set(patch).where(eq(customers.id, existing.id)); queueSheetSync('customers'); }
    return { ...existing, ...patch };
  }
  const [row] = await tx.insert(customers).values({
    name: input.name, email, phone, city: input.city ?? null, state: input.state ?? null, pincode: input.pincode ?? null,
    consentPrivacyAt: input.consent ? now : null, consentTermsAt: input.consent ? now : null, consentMarketing: !!input.marketing,
  }).returning();
  queueSheetSync('customers');
  return row;
}

type AuthUser = { id: string; email?: string | null; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> };

/**
 * Links a Supabase Auth user to their customer record (idempotent). Called after email confirmation and on
 * every sign-in. Earlier guest orders and enquiries are claimed only through a *verified* email address.
 * Returns null for staff accounts, which are kept apart from customer accounts.
 */
export async function linkCustomerAccount(user: AuthUser) {
  const linked = await db.query.customers.findFirst({ where: eq(customers.authUserId, user.id) });
  if (linked) return linked;
  if (await db.query.staff.findFirst({ where: eq(staff.authUserId, user.id) })) return null;
  const email = user.email?.toLowerCase();
  if (!email || !user.email_confirmed_at) return null;

  const meta = user.user_metadata ?? {};
  const str = (k: string, max: number) => (typeof meta[k] === 'string' ? (meta[k] as string).trim().slice(0, max) : '') || null;
  const name = str('name', 80) ?? email.split('@')[0];
  const phone = str('phone', 15);
  const consentAt = meta.consent === true ? new Date() : null;
  const marketing = meta.marketing === true;

  try {
    const guest = await db.query.customers.findFirst({ where: and(eq(customers.email, email), isNull(customers.authUserId)), orderBy: asc(customers.id) });
    let id: number;
    if (guest) {
      await db.update(customers).set({
        authUserId: user.id, name, phone: guest.phone ?? phone,
        consentTermsAt: guest.consentTermsAt ?? consentAt, consentPrivacyAt: guest.consentPrivacyAt ?? consentAt,
        consentMarketing: guest.consentMarketing || marketing,
      }).where(and(eq(customers.id, guest.id), isNull(customers.authUserId)));
      id = guest.id;
    } else {
      const [c] = await db.insert(customers).values({ authUserId: user.id, name, email, phone, consentTermsAt: consentAt, consentPrivacyAt: consentAt, consentMarketing: marketing }).returning();
      id = c.id;
    }
    queueSheetSync('customers');
  } catch (e) {
    // a concurrent request linked it first (unique auth_user_id) — fall through and read it back
    console.warn('[customers] link race', (e as Error).message);
  }
  return (await db.query.customers.findFirst({ where: eq(customers.authUserId, user.id) })) ?? null;
}

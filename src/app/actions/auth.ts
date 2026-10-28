'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, staff, carts } from '@/lib/db/schema';
import { hashPassword, verifyPassword, startCustomerSession, startStaffSession, endSession } from '@/lib/auth';
import { getCartRow } from '@/lib/cart';
import { email, formToObject, name, phone, zodErrors, type FormState } from '@/lib/validators';
import { audit } from '@/lib/audit';
import { ensureReferralCode } from '@/lib/referrals';

const safeNext = (n: unknown, fallback: string) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : fallback);

// Simple in-memory throttle per identifier (use a shared store such as Redis when running several instances).
const attempts = new Map<string, { n: number; until: number }>();
function throttled(key: string) {
  const a = attempts.get(key); const now = Date.now();
  if (a && a.until > now && a.n >= 6) return true;
  return false;
}
function recordFail(key: string) {
  const now = Date.now(); const a = attempts.get(key);
  attempts.set(key, a && a.until > now ? { n: a.n + 1, until: a.until } : { n: 1, until: now + 15 * 60_000 });
}

async function attachCart(customerId: number) {
  const cart = await getCartRow(false);
  if (cart && !cart.customerId) await db.update(carts).set({ customerId }).where(eq(carts.id, cart.id));
}

export async function registerCustomer(_: FormState, fd: FormData): Promise<FormState> {
  const o = formToObject(fd) as Record<string, string>;
  const p = z.object({
    name, email, phone, password: z.string().min(8, 'Use at least 8 characters'),
    consent: z.literal('on', { errorMap: () => ({ message: 'Please accept the terms and privacy policy.' }) }), marketing: z.string().optional(),
  }).safeParse(o);
  if (!p.success) return { errors: zodErrors(p.error), data: { ...o, password: '' } };
  const d = p.data;
  const existing = await db.query.customers.findFirst({ where: or(eq(customers.email, d.email), eq(customers.phone, d.phone)) });
  if (existing?.passwordHash) return { errors: { email: 'An account already exists with this email or phone. Sign in instead.' }, data: { ...o, password: '' } };
  const now = new Date();
  let id: number;
  if (existing) {
    // a guest who ordered or enquired before: claim the same customer record
    await db.update(customers).set({ name: d.name, email: d.email, phone: d.phone, passwordHash: await hashPassword(d.password), consentTermsAt: now, consentPrivacyAt: now, consentMarketing: d.marketing === 'on' }).where(eq(customers.id, existing.id));
    id = existing.id;
  } else {
    const [c] = await db.insert(customers).values({ name: d.name, email: d.email, phone: d.phone, passwordHash: await hashPassword(d.password), consentTermsAt: now, consentPrivacyAt: now, consentMarketing: d.marketing === 'on' }).returning();
    id = c.id;
  }
  await ensureReferralCode(id);
  await startCustomerSession({ id, name: d.name });
  await attachCart(id);
  redirect(safeNext(o.next, '/account'));
}

export async function loginCustomer(_: FormState, fd: FormData): Promise<FormState> {
  const o = formToObject(fd) as Record<string, string>;
  const id = String(o.identifier ?? '').trim().toLowerCase();
  const pw = String(o.password ?? '');
  if (!id || !pw) return { message: 'Enter your email or phone and password.', data: { identifier: id } };
  if (throttled(`c:${id}`)) return { message: 'Too many attempts. Try again in 15 minutes.', data: { identifier: id } };
  const ph = phone.safeParse(id);
  const c = await db.query.customers.findFirst({ where: or(eq(customers.email, id), eq(customers.phone, ph.success ? ph.data : id)) });
  if (!c?.passwordHash || !(await verifyPassword(pw, c.passwordHash))) { recordFail(`c:${id}`); return { message: 'That email/phone and password don’t match.', data: { identifier: id } }; }
  attempts.delete(`c:${id}`);
  await startCustomerSession(c);
  await attachCart(c.id);
  redirect(safeNext(o.next, '/account'));
}

export async function logoutCustomer() { await endSession('customer'); redirect('/'); }

export async function loginStaff(_: FormState, fd: FormData): Promise<FormState> {
  const em = String(fd.get('email') ?? '').trim().toLowerCase();
  const pw = String(fd.get('password') ?? '');
  if (throttled(`s:${em}`)) return { message: 'Too many attempts. Try again in 15 minutes.' };
  const s = await db.query.staff.findFirst({ where: eq(staff.email, em) });
  if (!s || !s.active || !(await verifyPassword(pw, s.passwordHash))) { recordFail(`s:${em}`); return { message: 'Email or password is incorrect.', data: { email: em } }; }
  attempts.delete(`s:${em}`);
  await db.update(staff).set({ lastLoginAt: new Date() }).where(eq(staff.id, s.id));
  await startStaffSession(s);
  await audit(s.id, 'login', 'staff', s.id);
  redirect('/admin');
}

export async function logoutStaff() { await endSession('staff'); redirect('/admin/login'); }

import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { customers, staff } from './db/schema';
import { CUSTOMER_COOKIE, STAFF_COOKIE, readSession, signSession, can, type Permission, type StaffRole } from './session';

export const hashPassword = (p: string) => bcrypt.hash(p, 11);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

const cookieOpts = (days: number) => ({
  httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: days * 86400,
});

export async function startCustomerSession(c: { id: number; name: string }) {
  (await cookies()).set(CUSTOMER_COOKIE, await signSession({ kind: 'customer', sub: c.id, name: c.name }, 30), cookieOpts(30));
}
export async function startStaffSession(s: { id: number; name: string; role: StaffRole }) {
  (await cookies()).set(STAFF_COOKIE, await signSession({ kind: 'staff', sub: s.id, name: s.name, role: s.role }, 1), cookieOpts(1));
}
export async function endSession(kind: 'customer' | 'staff') {
  (await cookies()).delete(kind === 'customer' ? CUSTOMER_COOKIE : STAFF_COOKIE);
}

export async function getCustomer() {
  const s = await readSession((await cookies()).get(CUSTOMER_COOKIE)?.value);
  if (!s || s.kind !== 'customer') return null;
  return (await db.query.customers.findFirst({ where: eq(customers.id, s.sub) })) ?? null;
}
export async function requireCustomer(next = '/account') {
  const c = await getCustomer();
  if (!c) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return c;
}

export async function getStaff() {
  const s = await readSession((await cookies()).get(STAFF_COOKIE)?.value);
  if (!s || s.kind !== 'staff') return null;
  const row = await db.query.staff.findFirst({ where: eq(staff.id, s.sub) });
  return row && row.active ? row : null;
}
/** Use in admin pages and actions. Redirects to login, or to the overview if the role lacks permission. */
export async function requireStaff(p: Permission = 'overview') {
  const s = await getStaff();
  if (!s) redirect('/admin/login');
  if (!can(s.role, p)) redirect('/admin?denied=1');
  return s;
}

import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { customers, staff } from './db/schema';
import { supabaseServer } from './supabase/server';
import { supabaseConfigured } from './supabase/config';
import { can, type Permission } from './session';

/**
 * Identity comes from Supabase Auth; what someone may do comes from our own tables.
 *  · Customer: a verified Supabase session (JWT signature checked) linked to a dvine.customers row.
 *  · Staff:    a session re-validated with the Auth server on every request, an active dvine.staff row,
 *              a second factor (TOTP, session at aal2) and a session no older than STAFF_SESSION_HOURS.
 */

/** Verified JWT claims of the current session (signature checked against the project's keys), or null. */
export const getClaims = cache(async () => {
  if (!supabaseConfigured()) return null;
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.getClaims();
    return error || !data?.claims?.sub ? null : data.claims;
  } catch { return null; }
});

/** The signed-in user, confirmed with the Auth server (catches revoked / signed-out sessions). */
export const getAuthUser = cache(async () => {
  if (!supabaseConfigured()) return null;
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.getUser();
    return error ? null : data.user;
  } catch { return null; }
});

/* ───────────── Customers ───────────── */
export const getCustomer = cache(async () => {
  const claims = await getClaims();
  if (!claims) return null;
  try {
    return (await db.query.customers.findFirst({ where: eq(customers.authUserId, claims.sub) })) ?? null;
  } catch { return null; }
});

export async function requireCustomer(next = '/account') {
  const c = await getCustomer();
  if (!c) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return c;
}

/* ───────────── Staff ───────────── */
const SESSION_HOURS = () => Math.min(24, Math.max(1, Number(process.env.STAFF_SESSION_HOURS) || 12));
/** MFA is mandatory in production. Outside production it can be switched off for local work and tests. */
export const staffMfaRequired = () => process.env.NODE_ENV === 'production' || process.env.STAFF_MFA_REQUIRED !== 'false';

type AmrEntry = { method: string; timestamp: number };

export type StaffSession = typeof staff.$inferSelect & {
  aal: 'aal1' | 'aal2'; mfaEnrolled: boolean; sessionStartedAt: Date | null; sessionExpired: boolean;
};

/** The staff member behind this session, whatever its assurance level. Null for customers / visitors / inactive staff. */
export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  const user = await getAuthUser();
  if (!user) return null;
  let row: typeof staff.$inferSelect | undefined;
  try { row = await db.query.staff.findFirst({ where: eq(staff.authUserId, user.id) }); } catch { return null; }
  if (!row || !row.active) return null;
  const sb = await supabaseServer();
  const [{ data: aal }, claims] = await Promise.all([sb.auth.mfa.getAuthenticatorAssuranceLevel(), getClaims()]);
  const amr = ((claims as { amr?: AmrEntry[] } | null)?.amr ?? []).filter(a => typeof a?.timestamp === 'number');
  const started = amr.length ? new Date(Math.min(...amr.map(a => a.timestamp)) * 1000) : null;
  return {
    ...row,
    aal: aal?.currentLevel === 'aal2' ? 'aal2' : 'aal1',
    mfaEnrolled: aal?.nextLevel === 'aal2',
    sessionStartedAt: started,
    sessionExpired: !!started && Date.now() - started.getTime() > SESSION_HOURS() * 3_600_000,
  };
});

/** Fully signed-in staff (second factor done, session fresh), or null. */
export const getStaff = cache(async () => {
  const s = await getStaffSession();
  if (!s || s.sessionExpired) return null;
  if (staffMfaRequired() && s.aal !== 'aal2') return null;
  return s;
});

/** Use in every admin page and action. Sends people to sign in, to the second step, or back to the overview. */
export async function requireStaff(p: Permission = 'overview') {
  const s = await getStaffSession();
  if (!s) redirect('/admin/login');
  if (s.sessionExpired) redirect('/auth/signout?next=/admin/login%3Fexpired%3D1');
  if (staffMfaRequired() && s.aal !== 'aal2') redirect('/admin/login/mfa');
  if (!can(s.role, p)) redirect('/admin?denied=1');
  return s;
}

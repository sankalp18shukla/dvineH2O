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
  aal: 'aal1' | 'aal2'; mfaEnrolled: boolean; sessionStartedAt: Date | null;
  /** Only without two-step sign-in (local dev): the password sign-in is older than STAFF_SESSION_HOURS. */
  sessionExpired: boolean;
  /** Two-step sign-in is required and the last authenticator code is missing or older than STAFF_SESSION_HOURS. */
  needsCode: boolean;
};

/**
 * The staff member behind this session, whatever its assurance level. Null for customers / visitors / inactive staff.
 * The Auth server check, the staff lookup and the assurance level run side by side (one round trip, not three).
 */
export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  const claims = await getClaims();
  if (!claims) return null;
  const sb = await supabaseServer();
  const [user, row, aalRes] = await Promise.all([
    getAuthUser(),
    db.query.staff.findFirst({ where: eq(staff.authUserId, claims.sub) }).catch(() => undefined),
    sb.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!user || user.id !== claims.sub || !row || !row.active) return null;
  const aal = aalRes.data;
  const amr = ((claims as { amr?: AmrEntry[] }).amr ?? []).filter(a => typeof a?.timestamp === 'number');
  const started = amr.length ? new Date(Math.min(...amr.map(a => a.timestamp)) * 1000) : null;
  const codeAt = Math.max(0, ...amr.filter(a => a.method === 'totp').map(a => a.timestamp)) * 1000;
  const limit = SESSION_HOURS() * 3_600_000;
  const level = aal?.currentLevel === 'aal2' ? 'aal2' : 'aal1';
  const mfa = staffMfaRequired();
  return {
    ...row,
    aal: level,
    mfaEnrolled: aal?.nextLevel === 'aal2',
    sessionStartedAt: started,
    // With two-step sign-in, a long session only asks for a fresh code; the password is needed again only after signing out.
    sessionExpired: !mfa && !!started && Date.now() - started.getTime() > limit,
    needsCode: mfa && (level !== 'aal2' || !codeAt || Date.now() - codeAt > limit),
  };
});

/** Fully signed-in staff (second factor done and recent), or null. */
export const getStaff = cache(async () => {
  const s = await getStaffSession();
  if (!s || s.sessionExpired || s.needsCode) return null;
  return s;
});

/** Use in every admin page and action. Sends people to sign in, to the code step, or back to the overview. */
export async function requireStaff(p: Permission = 'overview') {
  const s = await getStaffSession();
  if (!s) redirect('/admin/login');
  if (s.sessionExpired) redirect('/auth/signout?next=/admin/login%3Fexpired%3D1');
  if (s.needsCode) redirect('/admin/login/mfa');
  if (!can(s.role, p)) redirect('/admin?denied=1');
  return s;
}

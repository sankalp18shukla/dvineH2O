'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, staff, carts } from '@/lib/db/schema';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { getAuthUser, getStaffSession, staffMfaRequired } from '@/lib/auth';
import { getCartRow } from '@/lib/cart';
import { linkCustomerAccount } from '@/lib/customers';
import { email, formToObject, name, password, phone, zodErrors, type FormState } from '@/lib/validators';
import { audit } from '@/lib/audit';
import { limitRequest, safeNext, TOO_MANY } from '@/lib/security';

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const notConfigured: FormState = { message: 'Sign-in is not available right now. Please try again later.' };

async function attachCart(customerId: number) {
  const cart = await getCartRow(false);
  if (cart && !cart.customerId) await db.update(carts).set({ customerId }).where(eq(carts.id, cart.id));
}

/* ─────────────────────────── Customers ─────────────────────────── */

export async function registerCustomer(_: FormState, fd: FormData): Promise<FormState> {
  if (!supabaseConfigured()) return notConfigured;
  const o = formToObject(fd) as Record<string, string>;
  const keep = { ...o, password: '' };
  if (o.website) return { ok: true, message: 'Check your inbox to confirm your email.' }; // honeypot
  const p = z.object({
    name, email, phone, password,
    consent: z.literal('on', { errorMap: () => ({ message: 'Please accept the terms and privacy policy.' }) }), marketing: z.string().optional(),
  }).safeParse(o);
  if (!p.success) return { errors: zodErrors(p.error), data: keep };
  const d = p.data;
  if (!(await limitRequest('register'))) return { message: TOO_MANY, data: keep };

  // A phone number belongs to one registered account. If it's taken we say nothing (that would reveal who has
  // an account) and simply don't attach it; the owner of the new account can add a number later in their profile.
  const phoneTaken = await db.query.customers.findFirst({ where: and(eq(customers.phone, d.phone), isNotNull(customers.authUserId)) });
  const phoneForAccount = phoneTaken && phoneTaken.email !== d.email ? null : d.phone;

  const next = safeNext(o.next, '/account');
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signUp({
    email: d.email, password: d.password,
    options: {
      emailRedirectTo: `${site()}/auth/confirm?next=${encodeURIComponent(next)}`,
      data: { name: d.name, phone: phoneForAccount, consent: true, marketing: d.marketing === 'on' },
    },
  });
  if (error) {
    if (/password/i.test(error.message)) return { errors: { password: error.message }, data: keep };
    console.warn('[auth] sign-up', error.status, error.code);
    return { message: 'We couldn’t create your account just now. Please try again.', data: keep };
  }
  // Email confirmation off in Supabase → already signed in; on (recommended) → confirm first.
  if (data.session && data.user) {
    const c = await linkCustomerAccount(data.user);
    if (c) { await attachCart(c.id); redirect(next); }
  }
  // Same answer whether or not the email already had an account (no account enumeration).
  return { ok: true, message: `Almost there. We’ve sent a link to ${d.email}. Open it to confirm your email, and your account (with any earlier orders placed with that email) is ready.` };
}

export async function loginCustomer(_: FormState, fd: FormData): Promise<FormState> {
  if (!supabaseConfigured()) return notConfigured;
  const o = formToObject(fd) as Record<string, string>;
  const id = String(o.identifier ?? '').trim().toLowerCase();
  const pw = String(o.password ?? '');
  if (!id || !pw) return { message: 'Enter your email or phone and password.', data: { identifier: id } };
  if (!(await limitRequest('loginIp')) || !(await limitRequest('login', id))) return { message: TOO_MANY, data: { identifier: id } };

  let loginEmail = id;
  if (!id.includes('@')) {
    const ph = phone.safeParse(id);
    const c = ph.success ? await db.query.customers.findFirst({ where: and(eq(customers.phone, ph.data), isNotNull(customers.authUserId)) }) : null;
    loginEmail = c?.email ?? '';
  }
  const fail: FormState = { message: 'That email/phone and password don’t match.', data: { identifier: id } };
  if (!loginEmail) return fail;

  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email: loginEmail, password: pw });
  if (error || !data.user) {
    if (error?.code === 'email_not_confirmed') {
      await sb.auth.resend({ type: 'signup', email: loginEmail, options: { emailRedirectTo: `${site()}/auth/confirm` } }).catch(() => {});
      return { message: 'Please confirm your email first. We’ve sent the link again.', data: { identifier: id } };
    }
    return fail;
  }
  const c = await linkCustomerAccount(data.user);
  if (!c) {
    await sb.auth.signOut();
    return { message: 'This is a team account. Sign in at /admin instead.', data: { identifier: id } };
  }
  await attachCart(c.id);
  redirect(safeNext(o.next, '/account'));
}

export async function logoutCustomer() {
  if (supabaseConfigured()) await (await supabaseServer()).auth.signOut();
  redirect('/');
}

/** Always answers the same way, so it can't be used to discover who has an account. */
export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  if (!supabaseConfigured()) return notConfigured;
  const p = email.safeParse(String(fd.get('email') ?? ''));
  if (!p.success) return { errors: { email: 'Enter a valid email address' } };
  const done: FormState = { ok: true, message: `If ${p.data} has an account, a link to choose a new password is on its way. It works once and expires in an hour.` };
  if (!(await limitRequest('passwordReset', p.data))) return done;
  const sb = await supabaseServer();
  const { error } = await sb.auth.resetPasswordForEmail(p.data, { redirectTo: `${site()}/auth/confirm?next=/account/reset` });
  if (error) console.warn('[auth] reset', error.status, error.code);
  return done;
}

/** Sets a new password for the session opened by the reset link (or a signed-in user). */
export async function setNewPassword(_: FormState, fd: FormData): Promise<FormState> {
  if (!supabaseConfigured()) return notConfigured;
  const user = await getAuthUser();
  if (!user) return { message: 'This link has expired. Ask for a new one.' };
  const p = z.object({ password, confirm: z.string() }).refine(v => v.password === v.confirm, { message: 'The passwords don’t match', path: ['confirm'] })
    .safeParse({ password: fd.get('password'), confirm: fd.get('confirm') });
  if (!p.success) return { errors: zodErrors(p.error) };
  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password: p.data.password });
  if (error) return { errors: { password: /same/i.test(error.message) ? 'Choose a password you haven’t used here before.' : error.message } };
  // Sign out every other device that still knows the old password.
  await sb.auth.signOut({ scope: 'others' }).catch(() => {});
  const isStaff = await db.query.staff.findFirst({ where: eq(staff.authUserId, user.id) });
  if (isStaff) { await audit(isStaff.id, 'password.reset', 'staff', isStaff.id); redirect('/admin'); }
  redirect('/account?password=updated');
}

/* ─────────────────────────── Staff ─────────────────────────── */

const staffFail: FormState = { message: 'Email or password is incorrect.' };

export async function loginStaff(_: FormState, fd: FormData): Promise<FormState> {
  if (!supabaseConfigured()) return notConfigured;
  const em = String(fd.get('email') ?? '').trim().toLowerCase();
  const pw = String(fd.get('password') ?? '');
  if (!em || !pw) return { ...staffFail, data: { email: em } };
  if (!(await limitRequest('loginIp')) || !(await limitRequest('login', `staff:${em}`))) return { message: TOO_MANY, data: { email: em } };

  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email: em, password: pw });
  if (error || !data.user) return { ...staffFail, data: { email: em } };

  let row = await db.query.staff.findFirst({ where: eq(staff.authUserId, data.user.id) });
  if (!row && data.user.email_confirmed_at) {
    // first sign-in of a staff record created before its Auth user was linked: link by verified email
    const byEmail = await db.query.staff.findFirst({ where: eq(staff.email, em) });
    if (byEmail && !byEmail.authUserId) {
      await db.update(staff).set({ authUserId: data.user.id }).where(eq(staff.id, byEmail.id));
      row = { ...byEmail, authUserId: data.user.id };
    }
  }
  if (!row || !row.active) {
    await sb.auth.signOut();
    return { ...staffFail, data: { email: em } };
  }
  await audit(row.id, 'login.password', 'staff', row.id);
  if (!staffMfaRequired()) {
    await db.update(staff).set({ lastLoginAt: new Date() }).where(eq(staff.id, row.id));
    redirect('/admin');
  }
  redirect('/admin/login/mfa');
}

export type MfaSetup = { ok: boolean; message?: string; factorId?: string; qr?: string; secret?: string };

/** Starts authenticator-app enrolment for a staff member who has none yet (clears half-finished attempts). */
export async function startMfaEnrolment(): Promise<MfaSetup> {
  const s = await getStaffSession();
  if (!s) return { ok: false, message: 'Your session has ended. Sign in again.' };
  if (s.mfaEnrolled) return { ok: false, message: 'An authenticator is already set up. Enter its code.' };
  if (!(await limitRequest('mfa', `staff:${s.id}`))) return { ok: false, message: TOO_MANY };
  const sb = await supabaseServer();
  const { data: list } = await sb.auth.mfa.listFactors();
  for (const f of list?.all ?? []) if (f.status === 'unverified') await sb.auth.mfa.unenroll({ factorId: f.id }).catch(() => {});
  const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', issuer: 'DVINE H2O Admin', friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
  if (error || !data) return { ok: false, message: 'Couldn’t start the set-up. Check that TOTP MFA is enabled in Supabase › Authentication.' };
  return { ok: true, factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

/** Verifies a 6-digit code: completes enrolment or the sign-in challenge, raising the session to aal2. */
export async function verifyMfa(_: FormState, fd: FormData): Promise<FormState> {
  const s = await getStaffSession();
  if (!s) redirect('/admin/login');
  const code = String(fd.get('code') ?? '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return { errors: { code: 'Enter the 6-digit code from your authenticator app' } };
  if (!(await limitRequest('mfa', `staff:${s.id}`))) return { message: TOO_MANY };
  const sb = await supabaseServer();
  let factorId = String(fd.get('factorId') ?? '');
  if (!factorId) {
    const { data } = await sb.auth.mfa.listFactors();
    factorId = data?.totp?.[0]?.id ?? '';
  }
  if (!factorId) return { message: 'Set up your authenticator app first.' };
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) {
    await audit(s.id, 'login.mfa_failed', 'staff', s.id);
    return { errors: { code: 'That code didn’t work. Check the time on your phone and try the newest code.' } };
  }
  await db.update(staff).set({ lastLoginAt: new Date() }).where(eq(staff.id, s.id));
  await audit(s.id, 'login', 'staff', s.id, { mfa: true });
  redirect('/admin');
}

export async function logoutStaff() {
  const s = await getStaffSession();
  if (s) await audit(s.id, 'logout', 'staff', s.id);
  if (supabaseConfigured()) await (await supabaseServer()).auth.signOut();
  redirect('/admin/login');
}

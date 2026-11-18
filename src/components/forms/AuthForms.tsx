'use client';
/* eslint-disable @next/next/no-img-element -- the authenticator QR code is an inline SVG data URL from Supabase */
import Link from 'next/link';
import { useActionState, useState, useTransition } from 'react';
import { loginCustomer, registerCustomer, loginStaff, requestPasswordReset, setNewPassword, startMfaEnrolment, verifyMfa, type MfaSetup } from '@/app/actions/auth';
import type { FormState } from '@/lib/validators';
import { Field, Check, FormMessage, Honeypot } from './Field';
import { SubmitButton } from './SubmitButton';
import { ConsentText } from './ConsentText';

const PASSWORD_HINT = 'At least 10 characters, mixing letters with numbers or symbols.';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginCustomer, undefined);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? ''} />
      <Field name="identifier" label="Email or mobile number" autoComplete="username" required defaultValue={(state?.data?.identifier as string) ?? ''} />
      <Field name="password" label="Password" type="password" autoComplete="current-password" required />
      <p className="-mt-2 text-right font-sans text-sm"><Link href="/account/forgot" className="link">Forgot your password?</Link></p>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Signing in…" className="btn btn-primary w-full">Sign in</SubmitButton>
      <p className="text-center font-sans text-sm text-muted">New to DVINE? <Link href={`/account/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="link">Create an account</Link></p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(registerCustomer, undefined);
  const e = state?.errors ?? {}; const v = (k: string) => (state?.data?.[k] as string) ?? '';
  if (state?.ok) return <div className="grid gap-4"><FormMessage state={state} /><p className="font-sans text-sm text-muted">Didn’t get it? Check spam, or <Link href="/account/login" className="link">sign in</Link> and we’ll send it again.</p></div>;
  return (
    <form action={action} className="relative grid gap-4" noValidate>
      <Honeypot />
      <input type="hidden" name="next" value={next ?? ''} />
      <Field name="name" label="Full name" autoComplete="name" required defaultValue={v('name')} error={e.name} />
      <Field name="email" label="Email" type="email" autoComplete="email" required defaultValue={v('email')} error={e.email} hint="Use the email from any earlier order to see it in your account." />
      <Field name="phone" label="Mobile number" type="tel" autoComplete="tel" required defaultValue={v('phone')} error={e.phone} />
      <Field name="password" label="Password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} error={e.password} hint={PASSWORD_HINT} />
      <Check name="consent" label={<ConsentText />} error={e.consent} />
      <Check name="marketing" label="Send me product care tips and occasional offers." />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Creating account…" className="btn btn-primary w-full">Create account</SubmitButton>
      <p className="text-center font-sans text-sm text-muted">Already have an account? <Link href={`/account/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="link">Sign in</Link></p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, undefined);
  if (state?.ok) return <div className="grid gap-4"><FormMessage state={state} /><Link href="/account/login" className="btn btn-ghost w-full">Back to sign in</Link></div>;
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Field name="email" label="Email" type="email" autoComplete="email" required error={state?.errors?.email} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Sending…" className="btn btn-primary w-full">Send me a link</SubmitButton>
      <p className="text-center font-sans text-sm text-muted"><Link href="/account/login" className="link">Back to sign in</Link></p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(setNewPassword, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Field name="password" label="New password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} error={e.password} hint={PASSWORD_HINT} />
      <Field name="confirm" label="Type it again" type="password" autoComplete="new-password" required error={e.confirm} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Saving…" className="btn btn-primary w-full">Save new password</SubmitButton>
    </form>
  );
}

export function StaffLoginForm() {
  const [state, action] = useActionState<FormState, FormData>(loginStaff, undefined);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Field name="email" label="Work email" type="email" autoComplete="username" required defaultValue={(state?.data?.email as string) ?? ''} />
      <Field name="password" label="Password" type="password" autoComplete="current-password" required />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Signing in…" className="btn btn-primary w-full">Continue</SubmitButton>
      <p className="text-center font-sans text-[13px] text-muted"><Link href="/account/forgot" className="link">Forgot your password?</Link></p>
    </form>
  );
}

/** Second step for staff: set up an authenticator app (first time) or enter its 6-digit code. */
export function StaffMfaForm({ enrolled }: { enrolled: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(verifyMfa, undefined);
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [pending, start] = useTransition();
  const begin = () => start(async () => setSetup(await startMfaEnrolment()));

  if (!enrolled && !setup?.ok) return (
    <div className="grid gap-4 font-sans text-sm">
      <p className="text-muted">The dashboard holds customer and payment data, so every team account uses a second step. Install an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy…) on your phone, then continue.</p>
      {setup?.message && <p className="error-text">{setup.message}</p>}
      <button type="button" onClick={begin} disabled={pending} className="btn btn-primary w-full">{pending ? 'Preparing…' : 'Set up authenticator'}</button>
    </div>
  );
  return (
    <form action={action} className="grid gap-4" noValidate>
      {setup?.ok && (
        <div className="grid gap-3 font-sans text-sm">
          <p className="text-muted">Scan this code with your authenticator app, then enter the 6-digit code it shows.</p>
          <img src={setup.qr} alt="QR code for your authenticator app" className="mx-auto size-44 rounded-xl border border-line bg-white p-2" />
          <details className="text-[13px] text-muted"><summary className="cursor-pointer">Can’t scan? Enter this key instead</summary><code className="mt-1 block break-all rounded bg-paper p-2 text-ink">{setup.secret}</code></details>
          <input type="hidden" name="factorId" value={setup.factorId} />
        </div>
      )}
      <Field name="code" label="6-digit code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus error={state?.errors?.code} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Checking…" className="btn btn-primary w-full">Verify and sign in</SubmitButton>
    </form>
  );
}

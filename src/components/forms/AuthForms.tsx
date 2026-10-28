'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { loginCustomer, registerCustomer, loginStaff } from '@/app/actions/auth';
import type { FormState } from '@/lib/validators';
import { Field, Check, FormMessage } from './Field';
import { SubmitButton } from './SubmitButton';
import { ConsentText } from './ConsentText';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginCustomer, undefined);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? ''} />
      <Field name="identifier" label="Email or mobile number" autoComplete="username" required defaultValue={(state?.data?.identifier as string) ?? ''} />
      <Field name="password" label="Password" type="password" autoComplete="current-password" required />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Signing in…" className="btn btn-primary w-full">Sign in</SubmitButton>
      <p className="text-center font-sans text-sm text-muted">New to DVINE? <Link href={`/account/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="link">Create an account</Link></p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(registerCustomer, undefined);
  const e = state?.errors ?? {}; const v = (k: string) => (state?.data?.[k] as string) ?? '';
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? ''} />
      <Field name="name" label="Full name" autoComplete="name" required defaultValue={v('name')} error={e.name} />
      <Field name="email" label="Email" type="email" autoComplete="email" required defaultValue={v('email')} error={e.email} hint="Use the email from any earlier order to see it in your account." />
      <Field name="phone" label="Mobile number" type="tel" autoComplete="tel" required defaultValue={v('phone')} error={e.phone} />
      <Field name="password" label="Password" type="password" autoComplete="new-password" required minLength={8} error={e.password} hint="At least 8 characters." />
      <Check name="consent" label={<ConsentText />} error={e.consent} />
      <Check name="marketing" label="Send me product care tips and occasional offers." />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Creating account…" className="btn btn-primary w-full">Create account</SubmitButton>
      <p className="text-center font-sans text-sm text-muted">Already have an account? <Link href={`/account/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="link">Sign in</Link></p>
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
      <SubmitButton pendingLabel="Signing in…" className="btn btn-primary w-full">Sign in</SubmitButton>
    </form>
  );
}

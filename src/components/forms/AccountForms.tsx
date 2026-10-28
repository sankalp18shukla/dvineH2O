'use client';
import { useActionState } from 'react';
import { raiseServiceRequest, updateProfile, saveAddress } from '@/app/actions/account';
import type { FormState } from '@/lib/validators';
import { INDIAN_STATES } from '@/lib/gst';
import { Field, Select, TextArea, Check, FormMessage } from './Field';
import { SubmitButton } from './SubmitButton';

export function ServiceRequestForm({ warranties }: { warranties: { id: number; label: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(raiseServiceRequest, undefined);
  return (
    <form action={action} className="grid gap-4" key={state?.ok ? String(Date.now()) : 'f'}>
      <Select name="warrantyId" label="Product" options={[...warranties.map(w => ({ value: String(w.id), label: w.label })), { value: '', label: 'Something else' }]} />
      <TextArea name="issue" label="What’s happening?" rows={4} required error={state?.errors?.issue} hint="Tell us what you see, when it started and any messages on the display." />
      <FormMessage state={state} />
      <div><SubmitButton>Raise request</SubmitButton></div>
    </form>
  );
}

export function ProfileForm({ c }: { c: { name: string; email: string | null; phone: string | null; consentMarketing: boolean } }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field name="name" label="Full name" defaultValue={c.name} required error={e.name} />
      <Field name="email" label="Email" defaultValue={c.email ?? ''} disabled hint="Contact support to change your email." />
      <Field name="phone" label="Mobile number" defaultValue={c.phone ?? ''} required error={e.phone} />
      <div className="sm:col-span-2"><Check name="marketing" label="Send me product care tips and occasional offers." defaultChecked={c.consentMarketing} /></div>
      <Field name="currentPassword" label="Current password" type="password" autoComplete="current-password" error={e.currentPassword} hint="Only needed to change your password." />
      <Field name="newPassword" label="New password" type="password" autoComplete="new-password" error={e.newPassword} />
      <div className="sm:col-span-2 grid gap-3"><FormMessage state={state} /><div><SubmitButton>Save profile</SubmitButton></div></div>
    </form>
  );
}

export function AddressForm() {
  const [state, action] = useActionState<FormState, FormData>(saveAddress, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" key={state?.ok ? String(Date.now()) : 'a'}>
      <Field name="name" label="Name" required error={e.name} />
      <Field name="phone" label="Phone" required error={e.phone} />
      <Field name="line1" label="Address" required error={e.line1} className="sm:col-span-2" />
      <Field name="line2" label="Landmark / area" className="sm:col-span-2" />
      <Field name="pincode" label="Pincode" inputMode="numeric" maxLength={6} required error={e.pincode} />
      <Field name="city" label="City" required error={e.city} />
      <Select name="state" label="State" options={INDIAN_STATES} placeholder="Choose" required error={e.state} />
      <Field name="gstin" label="GSTIN (optional)" error={e.gstin} />
      <div className="sm:col-span-2"><Check name="isDefault" label="Use as my default address" /></div>
      <div className="sm:col-span-2 grid gap-3"><FormMessage state={state} /><div><SubmitButton>Save address</SubmitButton></div></div>
    </form>
  );
}

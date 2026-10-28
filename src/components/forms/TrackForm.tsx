'use client';
import { useActionState } from 'react';
import { trackOrder } from '@/app/actions/forms';
import type { FormState } from '@/lib/validators';
import { Field, FormMessage } from './Field';
import { SubmitButton } from './SubmitButton';

export function TrackForm() {
  const [state, action] = useActionState<FormState, FormData>(trackOrder, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
      <Field name="number" label="Order number" placeholder="DV-26-000123" required defaultValue={(state?.data?.number as string) ?? ''} error={e.number} className="uppercase" />
      <Field name="contact" label="Email or phone used" required defaultValue={(state?.data?.contact as string) ?? ''} error={e.contact} />
      <SubmitButton pendingLabel="Finding…">Track My Order</SubmitButton>
      <div className="sm:col-span-3"><FormMessage state={state} /></div>
    </form>
  );
}

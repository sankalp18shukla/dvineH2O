'use client';
import { useActionState } from 'react';
import { supportRequest } from '@/app/actions/forms';
import type { FormState } from '@/lib/validators';
import { Field, Select, TextArea, Check, FormMessage, Honeypot } from './Field';
import { SubmitButton } from './SubmitButton';
import { ConsentText } from './ConsentText';

export function SupportForm({ topics, defaultProduct }: { topics: string[]; defaultProduct?: string }) {
  const [state, action] = useActionState<FormState, FormData>(supportRequest, undefined);
  const e = state?.errors ?? {};
  const v = (k: string) => (state?.data?.[k] as string) ?? '';
  if (state?.ok) return <div className="card p-6"><FormMessage state={state} /></div>;
  return (
    <form action={action} className="relative grid gap-4" noValidate>
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select name="topic" label="Topic" options={topics} placeholder="Choose a topic" required defaultValue={v('topic')} error={e.topic} />
        <Select name="product" label="Product" options={[{ value: '', label: 'Not product-specific' }, { value: 'crystal', label: 'Crystal' }, { value: 'hyper', label: 'Hyper' }, { value: 'titan', label: 'Titan' }]} defaultValue={v('product') || defaultProduct || ''} />
        <Field name="name" label="Name" autoComplete="name" required defaultValue={v('name')} error={e.name} />
        <Field name="contact" label="Phone or email" required defaultValue={v('contact')} error={e.contact} />
        <Field name="city" label="City" defaultValue={v('city')} className="sm:col-span-2" />
      </div>
      <TextArea name="message" label="Message" required rows={5} defaultValue={v('message')} error={e.message} hint="Include your order number or serial number if you have it." />
      <Check name="consent" label={<ConsentText />} error={e.consent} />
      <FormMessage state={state} />
      <div><SubmitButton>Send Enquiry</SubmitButton></div>
    </form>
  );
}

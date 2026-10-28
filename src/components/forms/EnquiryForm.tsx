'use client';
import { useActionState } from 'react';
import { submitEnquiry } from '@/app/actions/forms';
import type { FormState } from '@/lib/validators';
import { Field, Select, TextArea, Check, FormMessage, Honeypot, FieldPrefix } from './Field';
import { SubmitButton } from './SubmitButton';
import { ConsentText } from './ConsentText';

type Variant = 'demo' | 'product' | 'consultation' | 'bulk' | 'distributorship' | 'general';
const INTERESTS = [{ value: 'crystal', label: 'Crystal' }, { value: 'hyper', label: 'Hyper' }, { value: 'titan', label: 'Titan 111' }, { value: 'multiple', label: 'More than one' }, { value: 'not_sure', label: 'Not sure yet' }];

/** Optional private photo upload (site photos for Titan, kitchen photo for Crystal). */
function Photos({ label, hint, error }: { label: string; hint: string; error?: string }) {
  return (
    <div className="field sm:col-span-2">
      <label htmlFor="f-photos" className="label">{label}</label>
      <input id="f-photos" name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" aria-invalid={!!error} aria-describedby="f-photos-h"
        className="input py-3 file:mr-4 file:rounded-full file:border-0 file:bg-paper file:px-4 file:py-1.5 file:font-sans file:font-semibold file:text-ink" />
      {error ? <p className="error-text">{error}</p> : <p id="f-photos-h" className="hint">{hint}</p>}
    </div>
  );
}

export function EnquiryForm({ idPrefix = '', ...props }: Props & { idPrefix?: string }) {
  return <FieldPrefix.Provider value={idPrefix}><Form {...props} /></FieldPrefix.Provider>;
}

type Props = { variant: Variant; source: string; defaultInterest?: string; submitLabel?: string; dark?: boolean; settings?: string[]; timelines?: string[]; photos?: boolean };

function Form({ variant, source, defaultInterest, submitLabel = 'Send Enquiry', dark = false, settings = [], timelines = [], photos = false }: Props) {
  const [state, action] = useActionState<FormState, FormData>(submitEnquiry, undefined);
  const e = state?.errors ?? {};
  const v = (k: string) => (state?.data?.[k] as string) ?? '';
  if (state?.ok) return <div className={dark ? 'rounded-2xl bg-white/10 p-6' : 'card p-6'}><FormMessage state={state} /></div>;
  const biz = variant === 'consultation';
  return (
    <form action={action} className={`relative grid gap-4 sm:grid-cols-2 ${dark ? '[&_.label]:text-white [&_.hint]:text-white/70 [&_label.font-sans]:text-white/75' : ''}`} noValidate>
      <Honeypot />
      <input type="hidden" name="type" value={variant} />
      <input type="hidden" name="source" value={source} />
      <Field name="name" label="Name" autoComplete="name" required defaultValue={v('name')} error={e.name} />
      {(biz || variant === 'bulk' || variant === 'distributorship') && (
        <Field name="company" label={variant === 'distributorship' ? 'Business name' : 'Company'} autoComplete="organization" defaultValue={v('company')} error={e.company} />
      )}
      <Field name="email" label={biz ? 'Work email' : 'Email'} type="email" autoComplete="email" defaultValue={v('email')} error={e.email} />
      <Field name="phone" label="Phone" type="tel" inputMode="tel" autoComplete="tel" required defaultValue={v('phone')} error={e.phone} />
      <Field name="city" label="City" autoComplete="address-level2" defaultValue={v('city')} error={e.city} />

      {biz && <>
        <Select name="setting" label="Setting" options={settings} placeholder="Choose" defaultValue={v('setting')} />
        <Field name="locations" label="No. of locations" inputMode="numeric" defaultValue={v('locations')} />
        <Field name="users" label="Daily users" inputMode="numeric" placeholder="Approximate" defaultValue={v('users')} />
        <Field name="peak" label="Peak demand" placeholder="e.g. 12–2 pm, 80 people" defaultValue={v('peak')} />
        <Field name="waterSource" label="Water source" placeholder="Municipal, borewell, tanker…" defaultValue={v('waterSource')} />
        <Select name="timeline" label="Expected timeline" options={timelines} placeholder="Choose" defaultValue={v('timeline')} className="sm:col-span-2" />
      </>}
      {variant === 'bulk' && <>
        <Select name="interest" label="Product" options={INTERESTS} defaultValue={v('interest') || 'hyper'} />
        <Field name="quantity" label="Quantity" inputMode="numeric" defaultValue={v('quantity')} />
        <Field name="gstin" label="GSTIN (for a GST invoice)" defaultValue={v('gstin')} className="sm:col-span-2" />
      </>}
      {variant === 'distributorship' && <>
        <Field name="territory" label="Territory or region" defaultValue={v('territory')} />
        <Field name="gstin" label="GSTIN" defaultValue={v('gstin')} />
      </>}
      {(variant === 'demo' || variant === 'product' || variant === 'general') && (
        <Select name="interest" label="Product" options={INTERESTS} defaultValue={v('interest') || defaultInterest || 'crystal'} />
      )}
      {variant === 'demo' && <>
        <Select name="demoMode" label="How would you like the demo?" options={['At my home', 'Video call', 'At a DVINE experience centre']} defaultValue={v('demoMode')} />
        <Field name="pincode" label="Pincode" inputMode="numeric" maxLength={6} defaultValue={v('pincode')} error={e.pincode} />
        <Field name="preferredAt" label="Preferred date and time" placeholder="e.g. Sat morning" defaultValue={v('preferredAt')} className="sm:col-span-2" />
      </>}
      {photos && (biz
        ? <Photos label="Site photos (optional)" hint="Up to 3 photos of the installation area, JPG, PNG or PDF, 10 MB each." error={e.photos} />
        : <Photos label="Photo of your kitchen (optional)" hint="A photo of the counter and water connection helps us check the setup. Up to 3 files, 10 MB each." error={e.photos} />)}
      <TextArea name="message" label={biz ? 'Anything else we should know?' : 'Message'} defaultValue={v('message')} error={e.message} className="sm:col-span-2" rows={4} />
      <div className="space-y-3 sm:col-span-2">
        <Check name="consent" label={<ConsentText />} error={e.consent} />
        <Check name="marketing" label="Send me occasional updates from DVINE H2O." />
      </div>
      <div className="sm:col-span-2 flex flex-col gap-3">
        <FormMessage state={state} />
        <div><SubmitButton className={`btn ${dark ? 'btn-volt' : 'btn-primary'}`}>{submitLabel}</SubmitButton></div>
      </div>
    </form>
  );
}

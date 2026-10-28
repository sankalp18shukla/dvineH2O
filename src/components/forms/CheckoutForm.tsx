'use client';
import { useActionState, useState } from 'react';
import { placeOrder } from '@/app/actions/checkout';
import type { FormState } from '@/lib/validators';
import { INDIAN_STATES } from '@/lib/gst';
import { Field, Select, TextArea, Check, FormMessage } from './Field';
import { SubmitButton } from './SubmitButton';
import { ConsentText } from './ConsentText';

type Prefill = { name?: string; email?: string; phone?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string };

export function CheckoutForm({ prefill, total }: { prefill: Prefill; total: string }) {
  const [state, action] = useActionState<FormState, FormData>(placeOrder, undefined);
  const [same, setSame] = useState(state?.data?.sameBilling !== undefined ? state.data.sameBilling === 'on' : true);
  const [gst, setGst] = useState(!!state?.data?.gstin);
  const e = state?.errors ?? {};
  const v = (k: string, d = '') => (state?.data?.[k] as string) ?? (prefill as Record<string, string>)[k] ?? d;
  return (
    <form id="checkout-form" action={action} className="grid gap-6" noValidate>
      <fieldset className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <legend className="px-1 font-sans text-lg font-semibold">Where should we send your order updates?</legend>
        <Field name="email" label="Email" type="email" autoComplete="email" required defaultValue={v('email')} error={e.email} hint="For your order confirmation and invoice." />
        <Field name="phone" label="Mobile number" type="tel" autoComplete="tel" required defaultValue={v('phone')} error={e.phone} hint="For delivery updates." />
      </fieldset>

      <fieldset className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <legend className="px-1 font-sans text-lg font-semibold">Where would you like your order delivered?</legend>
        <Field name="name" label="Full name" autoComplete="name" required defaultValue={v('name')} error={e.name} className="sm:col-span-2" />
        <Field name="line1" label="Address" autoComplete="address-line1" required defaultValue={v('line1')} error={e['ship.line1']} className="sm:col-span-2" placeholder="House / flat, building, street" />
        <Field name="line2" label="Landmark / area (optional)" autoComplete="address-line2" defaultValue={v('line2')} className="sm:col-span-2" />
        <Field name="pincode" label="Pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" required defaultValue={v('pincode')} error={e['ship.pincode']} />
        <Field name="city" label="City" autoComplete="address-level2" required defaultValue={v('city')} error={e['ship.city']} />
        <Select name="state" label="State" options={INDIAN_STATES} placeholder="Choose" required defaultValue={v('state')} error={e['ship.state']} className="sm:col-span-2" autoComplete="address-level1" />
        <div className="sm:col-span-2 space-y-3">
          <div className="flex items-start gap-3"><input id="sameBilling" name="sameBilling" type="checkbox" className="check" checked={same} onChange={ev => setSame(ev.target.checked)} /><label htmlFor="sameBilling" className="font-sans text-[14px] text-muted">Billing address is the same</label></div>
          <div className="flex items-start gap-3"><input id="wantGst" type="checkbox" className="check" checked={gst} onChange={ev => setGst(ev.target.checked)} /><label htmlFor="wantGst" className="font-sans text-[14px] text-muted">I need a GST invoice for my business</label></div>
        </div>
        {gst && <Field name="gstin" label="GSTIN" defaultValue={v('gstin')} error={e.gstin} className="sm:col-span-2" placeholder="22AAAAA0000A1Z5" />}
      </fieldset>

      {!same && (
        <fieldset className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <legend className="px-1 font-sans text-lg font-semibold">Billing address</legend>
          <Field name="billName" label="Name / business name" required defaultValue={v('billName')} error={e['bill.name']} className="sm:col-span-2" />
          <Field name="billLine1" label="Address" required defaultValue={v('billLine1')} error={e['bill.line1']} className="sm:col-span-2" />
          <Field name="billLine2" label="Landmark / area (optional)" defaultValue={v('billLine2')} className="sm:col-span-2" />
          <Field name="billPincode" label="Pincode" inputMode="numeric" maxLength={6} required defaultValue={v('billPincode')} error={e['bill.pincode']} />
          <Field name="billCity" label="City" required defaultValue={v('billCity')} error={e['bill.city']} />
          <Select name="billState" label="State" options={INDIAN_STATES} placeholder="Choose" required defaultValue={v('billState')} error={e['bill.state']} className="sm:col-span-2" />
        </fieldset>
      )}

      <fieldset className="card grid gap-4 p-5 sm:p-6">
        <legend className="px-1 font-sans text-lg font-semibold">Delivery option</legend>
        <label className="flex items-center gap-3 rounded-2xl border-2 border-deep-current bg-deep-current/5 p-4 font-sans">
          <input type="radio" name="delivery" value="standard" defaultChecked className="check" />
          <span className="flex-1"><b>Standard delivery</b><span className="block text-sm text-muted">Tracked shipping. Installation is scheduled after delivery where it applies.</span></span>
          <b>Free</b>
        </label>
        <TextArea name="note" label="Note for our team (optional)" rows={2} defaultValue={v('note')} placeholder="Delivery instructions, preferred installation time…" />
      </fieldset>

      <div className="card grid gap-4 p-5 sm:p-6">
        <Check name="consent" label={<ConsentText />} error={e.consent} defaultChecked={state?.data?.consent === 'on'} />
        <Check name="marketing" label="Send me product care tips and occasional offers." defaultChecked={state?.data?.marketing === 'on'} />
        <FormMessage state={state} />
        <SubmitButton className="btn btn-primary w-full sm:w-auto sm:self-start" pendingLabel="Placing order…">Continue to payment · {total}</SubmitButton>
      </div>
    </form>
  );
}

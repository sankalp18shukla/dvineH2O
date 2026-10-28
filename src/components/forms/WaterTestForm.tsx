'use client';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { bookWaterTest } from '@/app/actions/forms';
import { checkPincode } from '@/app/actions/cart';
import type { FormState } from '@/lib/validators';
import { formatINR } from '@/lib/money';
import { Field, Select, Check, FormMessage, TextArea } from './Field';
import { SubmitButton } from './SubmitButton';
import { ConsentText } from './ConsentText';

type Opt = { id: number; name: string; summary: string | null; parameters: string[]; collectionMethod: string; turnaround: string; price: number };

export function WaterTestForm({ options, slots, sources, initialPin = '' }: { options: Opt[]; slots: string[]; sources: string[]; initialPin?: string }) {
  const [state, action] = useActionState<FormState, FormData>(bookWaterTest, undefined);
  const [pin, setPin] = useState(String(state?.data?.pincode ?? initialPin));
  const [avail, setAvail] = useState<null | { ok: boolean; msg: string }>(null);
  const [opt, setOpt] = useState<number>(Number(state?.data?.optionId) || options[0]?.id);
  const [pending, start] = useTransition();
  const e = state?.errors ?? {};
  const v = (k: string) => (state?.data?.[k] as string) ?? '';
  const minDate = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
  const selected = options.find(o => o.id === opt);

  const check = (code = pin) => start(async () => {
    const r = await checkPincode(code);
    setAvail(r.ok ? (r.waterTesting ? { ok: true, msg: `Water testing is available in ${r.city}.` } : { ok: false, msg: `We deliver to ${r.city}, but home water testing isn’t available there yet. You can upload an existing report instead.` }) : { ok: false, msg: r.message });
  });

  // postcode entered in the page hero arrives as ?pin=…: check it straight away
  useEffect(() => { if (/^\d{6}$/.test(initialPin)) check(initialPin); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [initialPin]);

  return (
    <form action={action} className="grid gap-8" noValidate>
      <fieldset className="card p-5 sm:p-6">
        <legend className="px-1 font-sans text-lg font-semibold">1. Where is the sample?</legend>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field name="pincode" label="Pincode" inputMode="numeric" maxLength={6} required value={pin} onChange={ev => { setPin(ev.target.value.replace(/\D/g, '').slice(0, 6)); setAvail(null); }} error={e.pincode} className="sm:w-56" />
          <button type="button" className="btn btn-outline" onClick={() => check()} disabled={pin.length !== 6 || pending}>{pending ? 'Checking…' : 'Check availability'}</button>
        </div>
        {avail && <p role="status" className={`mt-3 font-sans text-sm ${avail.ok ? 'text-[#14532D]' : 'text-[#8A0E18]'}`}>{avail.msg}</p>}
      </fieldset>

      <fieldset className="card p-5 sm:p-6">
        <legend className="px-1 font-sans text-lg font-semibold">2. Choose your test</legend>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {options.map(o => (
            <label key={o.id} className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-5 transition ${opt === o.id ? 'border-deep-current bg-deep-current/5' : 'border-line hover:border-deep-current/40'}`}>
              <input type="radio" name="optionId" value={o.id} checked={opt === o.id} onChange={() => setOpt(o.id)} className="sr-only" />
              <span className="font-sans text-[17px] font-semibold">{o.name}</span>
              <span className="mt-1 font-sans text-2xl font-bold">{o.price ? formatINR(o.price) : 'Free'}</span>
              {o.summary && <span className="mt-2 text-[15px] text-muted">{o.summary}</span>}
              <span className="mt-3 font-sans text-[13px] text-muted"><b className="text-ink">Measures:</b> {o.parameters.join(', ')}</span>
              <span className="mt-1 font-sans text-[13px] text-muted"><b className="text-ink">Collection:</b> {o.collectionMethod}</span>
              <span className="mt-1 font-sans text-[13px] text-muted"><b className="text-ink">Report:</b> {o.turnaround}</span>
              {opt === o.id && <span className="absolute top-4 right-4 badge bg-deep-current text-white">Selected</span>}
            </label>
          ))}
        </div>
        {e.optionId && <p className="error-text mt-2">{e.optionId}</p>}
      </fieldset>

      <fieldset className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <legend className="px-1 font-sans text-lg font-semibold">3. Your details and slot</legend>
        {selected && <p className="sm:col-span-2 -mt-1 rounded-xl bg-paper px-4 py-3 font-sans text-[14px] text-muted">Selected: <b className="text-ink">{selected.name}</b> · {selected.collectionMethod} · report {selected.turnaround.toLowerCase()} · {selected.price ? formatINR(selected.price) : 'Free'}</p>}
        <Field name="name" label="Name" autoComplete="name" required defaultValue={v('name')} error={e.name} />
        <Field name="phone" label="Phone" type="tel" autoComplete="tel" required defaultValue={v('phone')} error={e.phone} />
        <Field name="email" label="Email" type="email" autoComplete="email" defaultValue={v('email')} error={e.email} hint="We’ll send your report here." />
        <Field name="city" label="City" autoComplete="address-level2" required defaultValue={v('city')} error={e.city} />
        <TextArea name="address" label="Collection address" autoComplete="street-address" required rows={2} defaultValue={v('address')} error={e.address} className="sm:col-span-2" />
        <Select name="waterSource" label="Water source" options={sources} placeholder="Choose" defaultValue={v('waterSource')} />
        <Select name="sampleType" label="What should we test?" options={[{ value: 'source', label: 'Source supply (before any purifier)' }, { value: 'treated', label: 'Water from my current purifier / system' }]} defaultValue={v('sampleType') || 'source'} />
        <Field name="preferredDate" label="Preferred date" type="date" min={minDate} required defaultValue={v('preferredDate')} error={e.preferredDate} />
        <Select name="slot" label="Time slot" options={slots} placeholder="Choose" required defaultValue={v('slot')} error={e.slot} />
        <Select name="interest" label="Interested in a DVINE product?" options={[{ value: 'not_sure', label: 'Not sure yet' }, { value: 'crystal', label: 'Crystal' }, { value: 'hyper', label: 'Hyper' }, { value: 'titan', label: 'Titan 111' }]} defaultValue={v('interest') || 'not_sure'} className="sm:col-span-2" />
      </fieldset>

      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="space-y-3"><Check name="consent" label={<ConsentText />} error={e.consent} /></div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <p className="font-sans text-sm text-muted">Total <b className="text-xl text-ink">{selected ? (selected.price ? formatINR(selected.price) : 'Free') : '—'}</b></p>
          <SubmitButton pendingLabel="Booking…">{selected?.price ? 'Confirm and Pay' : 'Confirm Booking'}</SubmitButton>
          <p className="font-sans text-[12.5px] text-muted">You can review the booking and cancellation terms before paying.</p>
        </div>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

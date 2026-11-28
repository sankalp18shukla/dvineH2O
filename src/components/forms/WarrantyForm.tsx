'use client';
import { useActionState } from 'react';
import { checkWarranty, type WarrantyCheck } from '@/app/actions/forms';
import { Field } from './Field';
import { SubmitButton } from './SubmitButton';
import { Icon } from '../ui/Icon';

const left = (m: number, d: number) => [m ? `${m} month${m === 1 ? '' : 's'}` : null, d || !m ? `${d} day${d === 1 ? '' : 's'}` : null].filter(Boolean).join(', ');

/** Order or serial number + the buyer's phone or email → how long each unit's warranty has left. Nothing else. */
export function WarrantyForm() {
  const [state, action] = useActionState<WarrantyCheck | undefined, FormData>(checkWarranty, undefined);
  const e = state?.errors ?? {};
  return (
    <div className="grid gap-5">
      <form action={action} className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
        <Field name="query" label="Order number or serial number" placeholder="DV-26-000123" required defaultValue={state?.data?.query ?? ''} error={e.query} className="uppercase" />
        <Field name="contact" label="Phone or email used to buy" required defaultValue={state?.data?.contact ?? ''} error={e.contact} />
        <SubmitButton pendingLabel="Checking…">Check Warranty</SubmitButton>
        {state?.message && <p role="alert" className="font-sans text-sm text-[#B4231B] sm:col-span-3">{state.message}</p>}
      </form>
      {state?.results && (
        <ul className="grid gap-4 sm:grid-cols-2" aria-live="polite">
          {state.results.map((r, i) => (
            <li key={i} className={`card flex items-center gap-4 p-6 ${r.state === 'active' ? '' : 'opacity-90'}`}>
              <span className={`grid size-12 shrink-0 place-items-center rounded-full ${r.state === 'active' ? 'bg-[#DFF5E3] text-[#1B6B2C]' : 'bg-[#F1F2F5] text-muted'}`}><Icon name="shield" className="size-6" /></span>
              <span className="font-sans">
                <span className="block text-sm text-muted">{r.product}</span>
                {r.state === 'active'
                  ? <><b className="block text-2xl leading-tight">{left(r.months, r.days)}</b><span className="text-sm">of warranty left</span></>
                  : <b className="block text-lg">{r.state === 'ended' ? 'Warranty has ended' : 'No active warranty'}</b>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

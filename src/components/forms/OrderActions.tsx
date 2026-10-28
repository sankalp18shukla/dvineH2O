'use client';
import { useActionState, useState } from 'react';
import { cancelMyOrder, requestReturn, submitReview, preferInstallation } from '@/app/actions/account';
import type { FormState } from '@/lib/validators';
import { Field, Select, TextArea, FormMessage } from './Field';
import { SubmitButton } from './SubmitButton';

export function CancelOrder({ number }: { number: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(cancelMyOrder, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  if (!open) return <button className="btn btn-outline btn-sm self-start" onClick={() => setOpen(true)}>Cancel order</button>;
  return (
    <form action={action} className="card grid gap-3 p-5">
      <input type="hidden" name="number" value={number} />
      <Select name="reason" label="Why are you cancelling?" options={['Changed my mind', 'Ordered by mistake', 'Found a better option', 'Delivery takes too long', 'Other']} />
      <FormMessage state={state} />
      <div className="flex gap-2"><SubmitButton className="btn btn-red btn-sm" pendingLabel="Cancelling…">Confirm cancellation</SubmitButton><button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Keep order</button></div>
    </form>
  );
}

export function ReturnRequest({ number, items }: { number: string; items: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(requestReturn, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  if (!open) return <button className="btn btn-outline btn-sm self-start" onClick={() => setOpen(true)}>Request a return</button>;
  return (
    <form action={action} className="card grid gap-3 p-5">
      <input type="hidden" name="number" value={number} />
      {items.length > 1 && <Select name="itemId" label="Item" options={items.map(i => ({ value: String(i.id), label: i.name }))} />}
      {items.length === 1 && <input type="hidden" name="itemId" value={items[0].id} />}
      <TextArea name="reason" label="What’s wrong?" rows={3} error={state?.errors?.reason} required />
      <FormMessage state={state} />
      <div className="flex gap-2"><SubmitButton className="btn btn-primary btn-sm">Request return</SubmitButton><button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  );
}

export function ReviewForm({ number, productId, name }: { number: string; productId: number; name: string }) {
  const [state, action] = useActionState<FormState, FormData>(submitReview, undefined);
  const [rating, setRating] = useState(0);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="number" value={number} /><input type="hidden" name="productId" value={productId} /><input type="hidden" name="rating" value={rating} />
      <fieldset><legend className="label">How would you rate {name}?</legend>
        <div className="mt-1.5 flex gap-1">{[1, 2, 3, 4, 5].map(i => <button key={i} type="button" aria-label={`${i} star${i > 1 ? 's' : ''}`} aria-pressed={rating === i} onClick={() => setRating(i)} className={`grid size-10 place-items-center rounded-full text-2xl ${i <= rating ? 'text-[#E8A600]' : 'text-line'}`}>★</button>)}</div>
        {state?.errors?.rating && <p className="error-text">{state.errors.rating}</p>}
      </fieldset>
      <Field name="title" label="Headline (optional)" maxLength={80} />
      <TextArea name="body" label="Your review" rows={3} error={state?.errors?.body} required />
      <div className="field"><label htmlFor={`ph-${productId}`} className="label">Photos (optional, up to 4)</label><input id={`ph-${productId}`} name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="font-sans text-sm" />{state?.errors?.photos && <p className="error-text">{state.errors.photos}</p>}</div>
      <FormMessage state={state} />
      <div><SubmitButton className="btn btn-primary btn-sm" pendingLabel="Submitting…">Submit review</SubmitButton></div>
    </form>
  );
}

export function InstallationPreference({ number, slots }: { number: string; slots: string[] }) {
  const [state, action] = useActionState<FormState, FormData>(preferInstallation, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  const min = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="number" value={number} />
      <Field name="date" label="Preferred date" type="date" min={min} required error={state?.errors?.date} />
      <Select name="slot" label="Time" options={slots} />
      <SubmitButton className="btn btn-primary btn-sm min-h-12">Send preference</SubmitButton>
      <div className="sm:col-span-3"><FormMessage state={state} /></div>
    </form>
  );
}

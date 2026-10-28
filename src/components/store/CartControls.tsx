'use client';
import { useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCartQty, applyCode, removeCode } from '@/app/actions/cart';
import { Icon } from '../ui/Icon';

export function QtyControl({ productId, qty, max }: { productId: number; qty: number; max: number }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (n: number) => start(async () => { await updateCartQty(productId, n); router.refresh(); });
  return (
    <div className="flex items-center gap-3 font-sans">
      <div className="flex h-10 items-center rounded-full border border-line bg-white" role="group" aria-label="Quantity">
        <button className="grid size-10 place-items-center disabled:opacity-40" aria-label="Decrease quantity" disabled={pending || qty <= 1} onClick={() => set(qty - 1)}><Icon name="minus" className="size-4" /></button>
        <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
        <button className="grid size-10 place-items-center disabled:opacity-40" aria-label="Increase quantity" disabled={pending || qty >= max} onClick={() => set(qty + 1)}><Icon name="plus" className="size-4" /></button>
      </div>
      <button className="text-sm font-semibold text-muted underline-offset-4 hover:text-[#C2001B] hover:underline" disabled={pending} onClick={() => set(0)}>Remove</button>
    </div>
  );
}

export function CodeForm({ applied, error, isReferral }: { applied: string | null; error?: string; isReferral?: boolean }) {
  const [state, action, pending] = useActionState(applyCode, undefined);
  const [rp, start] = useTransition();
  const router = useRouter();
  if (applied && !error) return (
    <div className="flex items-center justify-between rounded-xl bg-[#DFF5E3] px-4 py-3 font-sans text-sm text-[#14532D]">
      <span><b>{applied}</b> {isReferral ? 'referral' : 'code'} applied</span>
      <button className="font-semibold underline" disabled={rp} onClick={() => start(async () => { await removeCode(); router.refresh(); })}>Remove</button>
    </div>
  );
  return (
    <form action={action} className="font-sans">
      <label htmlFor="code" className="label">Coupon or referral code</label>
      <div className="mt-1.5 flex gap-2">
        <input id="code" name="code" className="input uppercase" defaultValue={applied ?? ''} autoComplete="off" aria-invalid={!!error} aria-describedby={error ? 'code-e' : undefined} />
        <button className="btn btn-outline min-h-12" disabled={pending}>Apply</button>
      </div>
      {(error || state?.error) && <p id="code-e" className="error-text mt-1.5">{error ?? state?.error}</p>}
    </form>
  );
}

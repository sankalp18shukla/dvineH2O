'use client';
import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCartQty, applyCode, applyPromoCode, removeCode } from '@/app/actions/cart';
import { formatINR } from '@/lib/money';
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
      <span><b>{applied}</b> code applied</span>
      <button className="font-semibold underline" disabled={rp} onClick={() => start(async () => { await removeCode(); router.refresh(); })}>Remove</button>
    </div>
  );
  return (
    <form action={action} className="font-sans">
      <label htmlFor="code" className="label">Coupon code</label>
      <div className="mt-1.5 flex gap-2">
        <input id="code" name="code" className="input uppercase" defaultValue={applied ?? ''} autoComplete="off" aria-invalid={!!error} aria-describedby={error ? 'code-e' : undefined} />
        <button className="btn btn-outline min-h-12" disabled={pending}>Apply</button>
      </div>
      {(error || state?.error) && <p id="code-e" className="error-text mt-1.5">{error ?? state?.error}</p>}
    </form>
  );
}

/** Offers running on the site today (CartOffer from promo-codes.ts), each with what it saves on this cart. */
export function OfferList({ offers, applied }: { offers: { code: string; text: string; saving: number; reason?: string }[]; applied: string | null }) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ code: string; text: string } | null>(null);
  const router = useRouter();
  if (!offers.length) return null;
  const apply = (code: string) => { setBusy(code); setError(null); start(async () => {
    const r = await applyPromoCode(code);
    if (!r.ok) setError({ code, text: r.error });
    router.refresh(); setBusy(null);
  }); };
  return (
    <div className="mt-5 border-t border-line pt-5 font-sans">
      <p className="label">Offers running now</p>
      <ul className="mt-2 grid gap-2">
        {offers.map(o => {
          const on = applied === o.code;
          return (
            <li key={o.code} className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${on ? 'border-[#1B6B2C]/40 bg-[#DFF5E3]' : 'border-dashed border-line'}`}>
              <Icon name="tag" className={`size-[18px] shrink-0 ${on ? 'text-[#1B6B2C]' : 'text-deep-current'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold tracking-wide">{o.code}{o.saving > 0 && <span className="ml-2 font-semibold tracking-normal text-[#1B6B2C]">Save {formatINR(o.saving)}</span>}</p>
                <p className="text-[12.5px] leading-snug text-muted">{error?.code === o.code ? error.text : o.saving ? o.text : (o.reason ?? o.text)}</p>
              </div>
              {on ? <span className="flex items-center gap-1 text-[13px] font-semibold text-[#14532D]"><Icon name="check" className="size-4" />Applied</span>
                : <button type="button" disabled={pending || !o.saving} onClick={() => apply(o.code)} className="btn btn-outline btn-sm min-h-9 shrink-0 disabled:opacity-40">{busy === o.code ? 'Applying…' : 'Apply'}</button>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

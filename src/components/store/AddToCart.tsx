'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/app/actions/cart';
import { Icon } from '../ui/Icon';
import { openCartDrawer } from './CartDrawer';

/**
 * Quantity + Add to Cart + Buy Now. A successful add opens the cart drawer.
 * `compact` drops the quantity stepper (purchase reminders lower on the page, sticky bar).
 */
export function AddToCart({ productId, max, label = 'Add to Cart', buyNow = true, dark = false, compact = false, primary = false }: {
  productId: number; max: number; label?: string; buyNow?: boolean; dark?: boolean; compact?: boolean; primary?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (max <= 0) return <p className={`font-sans text-[15px] font-semibold ${dark ? 'text-[#FFB3B3]' : 'text-[#8A0E18]'}`}>Out of stock right now. Send us an enquiry and we’ll tell you when it’s back.</p>;
  const go = (thenCheckout: boolean) => start(async () => {
    setErr(null);
    const r = await addToCart(productId, compact ? 1 : qty);
    if ('error' in r && r.error) { setErr(r.error); return; }
    if (thenCheckout) router.push('/checkout'); else { openCartDrawer(); router.refresh(); }
  });
  return (
    <div className="font-sans">
      <div className="flex flex-wrap items-center gap-3">
        {!compact && (
          <div className={`flex h-12 items-center rounded-full border ${dark ? 'border-white/30' : 'border-line bg-white'}`} role="group" aria-label="Quantity">
            <button type="button" className="grid size-12 place-items-center disabled:opacity-40" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}><Icon name="minus" className="size-4" /></button>
            <span className="w-6 text-center font-semibold" aria-live="polite">{qty}</span>
            <button type="button" className="grid size-12 place-items-center disabled:opacity-40" aria-label="Increase quantity" disabled={qty >= max} onClick={() => setQty(q => Math.min(max, q + 1))}><Icon name="plus" className="size-4" /></button>
          </div>
        )}
        <button type="button" onClick={() => go(false)} disabled={pending} className={`btn ${primary ? (dark ? 'btn-volt' : 'btn-primary') : 'btn-outline'}`}>{label}</button>
        {buyNow && <button type="button" onClick={() => go(true)} disabled={pending} className={`btn ${dark ? 'btn-volt' : 'btn-primary'}`}>Buy Now <Icon name="arrow" className="size-4" /></button>}
      </div>
      {err && <p role="alert" className="mt-3 text-[14px] text-[#C2001B]">{err}</p>}
    </div>
  );
}

'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCartSummary, type CartSummary } from '@/app/actions/cart';
import { formatINR } from '@/lib/money';
import { Icon } from '../ui/Icon';

export const CART_EVENT = 'dvine:cart-added';
/** Opens the drawer from anywhere (AddToCart, sticky action bar). */
export const openCartDrawer = () => window.dispatchEvent(new Event(CART_EVENT));

/** Slides in from the right after an item is added: thumbnail, quantity, price, subtotal. */
export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const close = useRef<HTMLButtonElement>(null);
  const path = usePathname();

  useEffect(() => {
    const on = async () => { setOpen(true); setCart(await getCartSummary()); };
    window.addEventListener(CART_EVENT, on);
    return () => window.removeEventListener(CART_EVENT, on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k); };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] font-sans" role="dialog" aria-modal="true" aria-labelledby="cd-title">
      <div className="absolute inset-0 bg-stage-deep/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="absolute inset-y-0 right-0 flex w-full flex-col bg-paper shadow-2xl sm:w-[420px]" style={{ animation: 'drawerIn .45s var(--ease-out-soft)' }}>
        <div className="flex items-center gap-3 border-b border-line bg-white px-5 py-4">
          <span className="grid size-8 place-items-center rounded-full bg-[#DFF5E3] text-[#14532D]"><Icon name="check" className="size-4" /></span>
          <h2 id="cd-title" className="flex-1 text-lg font-semibold">Added to your cart.</h2>
          <button ref={close} onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-paper" aria-label="Close cart"><Icon name="close" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {!cart ? <p className="text-muted">Loading your cart…</p> : (
            <ul className="grid gap-3">
              {cart.items.map(i => (
                <li key={i.id} className="card flex items-center gap-4 p-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-stage">{i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{i.name}</p><p className="text-sm text-muted">Qty {i.qty} · {formatINR(i.price)} each</p></div>
                  <p className="font-semibold">{formatINR(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cart && (
          <div className="border-t border-line bg-white p-5">
            {cart.discount > 0 && <p className="flex justify-between text-sm text-muted"><span>Discount</span><span>−{formatINR(cart.discount)}</span></p>}
            <p className="flex justify-between text-lg font-semibold"><span>Subtotal ({cart.count} item{cart.count === 1 ? '' : 's'})</span><span>{formatINR(cart.subtotal - cart.discount)}</span></p>
            <p className="mt-1 text-[13px] text-muted">Inclusive of GST. Delivery and installation confirmed at checkout.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link href="/cart" className="btn btn-primary">View Cart</Link>
              <button onClick={() => setOpen(false)} className="btn btn-outline">Continue Shopping</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

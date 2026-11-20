'use client';
import Link from 'next/link';
import { createContext, useContext, useId } from 'react';
import { Icon } from '@/components/admin/AdminIcon';
import { COUPON_PRODUCTS, COUPON_STATE_LABEL, couponState, describeCoupon, type CouponInfo } from '@/lib/coupon-info';
import { Label } from './fields';

/** The coupons from Admin › Marketing, handed to every promotion's code picker. */
export const CouponsContext = createContext<CouponInfo[]>([]);

const fmt = (d: string) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

/**
 * Pick the coupon a promotion advertises. Visitors see the code with an Apply button, and only while the coupon
 * works in the cart; the notes below say when that is not the case, so nothing is advertised that would fail.
 * `product`: the product page this promotion is on, to warn when the coupon does not cover that product.
 */
export function CouponField({ value, onChange, schedule, product, hint = 'Visitors apply it with one tap' }: {
  value: string; onChange: (v: string) => void; schedule?: { from: string; to: string }; product?: 'crystal' | 'hyper'; hint?: string;
}) {
  const coupons = useContext(CouponsContext);
  const id = useId();
  const code = value.trim().toUpperCase();
  const c = coupons.find(x => x.code === code);
  const notes: { warn: boolean; text: string }[] = [];
  if (code && !c) notes.push({ warn: true, text: `There is no coupon ${code} in Marketing, so the code is not shown. Pick one from the list.` });
  if (c) {
    const st = couponState(c);
    notes.push({ warn: false, text: describeCoupon(c) });
    if (st !== 'live') notes.push({ warn: true, text: `${COUPON_STATE_LABEL[st](c)}. The code stays hidden until the coupon is live.` });
    if (st === 'live' && c.endsAt && (!schedule?.to || new Date(`${schedule.to}T23:59:59+05:30`) > new Date(c.endsAt)))
      notes.push({ warn: true, text: `The coupon ends on ${fmt(c.endsAt.slice(0, 10))}${schedule?.to ? `, before this promotion (${fmt(schedule.to)})` : ''}. After that the promotion shows without its code.` });
    const name = COUPON_PRODUCTS.find(p => p.slug === product)?.name;
    if (name && c.appliesTo?.length && !c.appliesTo.includes(product!)) notes.push({ warn: true, text: `This coupon does not cover ${name}, so it will not work for visitors buying from this page.` });
  }
  const opts = coupons.filter(x => couponState(x) !== 'ended' && couponState(x) !== 'used' || x.code === code);
  return (
    <div>
      <Label htmlFor={id} hint={hint}>Coupon code (optional)</Label>
      <div className="flex gap-2">
        <select id={id} value={c ? c.code : code ? '__missing' : ''} onChange={e => onChange(e.target.value === '__missing' ? code : e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 font-sans text-[14.5px] text-ink focus:border-deep-current focus:ring-4 focus:ring-deep-current/12 focus:outline-none">
          <option value="">No code</option>
          {code && !c && <option value="__missing">{code} (not found)</option>}
          {opts.map(x => <option key={x.code} value={x.code}>{x.code} · {describeCoupon(x)}{couponState(x) === 'live' ? '' : ` (${COUPON_STATE_LABEL[couponState(x)](x).toLowerCase()})`}</option>)}
        </select>
        <Link href="/admin/marketing" target="_blank" className="btn btn-outline btn-sm min-h-11 shrink-0" title="Create or edit coupons in Marketing"><Icon name="plus" className="size-4" />New</Link>
      </div>
      {notes.length > 0 && (
        <ul className="mt-2 grid gap-1 font-sans text-[12.5px]">
          {notes.map(n => <li key={n.text} className={`flex gap-1.5 ${n.warn ? 'text-[#8A5A00]' : 'text-muted'}`}><Icon name={n.warn ? 'alert' : 'tag'} className="mt-px size-3.5 shrink-0" />{n.text}</li>)}
        </ul>
      )}
      {!coupons.length && <p className="mt-2 font-sans text-[12.5px] text-muted">No coupons yet. Create one in <Link href="/admin/marketing" className="font-semibold text-deep-current hover:underline">Marketing</Link>, then pick it here.</p>}
    </div>
  );
}

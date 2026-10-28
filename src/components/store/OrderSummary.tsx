import type { orders, orderItems } from '@/lib/db/schema';
import { formatINR } from '@/lib/money';

type O = typeof orders.$inferSelect & { items: (typeof orderItems.$inferSelect)[] };

export function OrderSummary({ order: o, compact = false }: { order: O; compact?: boolean }) {
  return (
    <div className="card p-6">
      <h2 className="font-sans text-lg font-semibold">Order summary</h2>
      <ul className="mt-4 divide-y divide-line">
        {o.items.map(i => (
          <li key={i.id} className="flex justify-between gap-4 py-3 font-sans text-[15px]">
            <span>{i.name} <span className="text-muted">× {i.qty}</span></span><span className="font-medium">{formatINR(i.unitPrice * i.qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-2 space-y-2 border-t border-line pt-4 font-sans text-[15px]">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(o.subtotal)}</dd></div>
        {o.discount > 0 && <div className="flex justify-between text-[#1B6B2C]"><dt>Discount{o.couponCode ? ` (${o.couponCode})` : o.referralCode ? ` (referral ${o.referralCode})` : ''}</dt><dd>−{formatINR(o.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{o.shipping ? formatINR(o.shipping) : 'Free'}</dd></div>
        <div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd>{formatINR(o.total)}</dd></div>
        <div className="flex justify-between text-[13px] text-muted"><dt>Includes GST</dt><dd>{formatINR(o.taxTotal, true)}</dd></div>
      </dl>
      {!compact && (
        <div className="mt-5 grid gap-4 border-t border-line pt-4 font-sans text-[14px] sm:grid-cols-2">
          <div><p className="font-semibold">Delivering to</p><p className="mt-1 text-muted">{o.shippingAddress.name}<br />{o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}<br />{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.pincode}</p></div>
          <div><p className="font-semibold">Contact</p><p className="mt-1 text-muted">{o.contactEmail}<br />{o.contactPhone}</p></div>
        </div>
      )}
    </div>
  );
}

import type { Totals as T } from '@/lib/pricing';
import { formatINR } from '@/lib/money';

export function Totals({ t }: { t: T }) {
  return (
    <dl className="space-y-2 font-sans text-[15px]">
      <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(t.subtotal)}</dd></div>
      {t.discount > 0 && <div className="flex justify-between text-[#1B6B2C]"><dt>Discount ({t.couponCode})</dt><dd>−{formatINR(t.discount)}</dd></div>}
      <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{t.shipping ? formatINR(t.shipping) : 'Free'}</dd></div>
      <div className="flex justify-between border-t border-line pt-3 text-xl font-bold"><dt>Total</dt><dd>{formatINR(t.total)}</dd></div>
      <div className="flex justify-between text-[13px] text-muted"><dt>Includes GST</dt><dd>{formatINR(t.tax, true)}</dd></div>
    </dl>
  );
}

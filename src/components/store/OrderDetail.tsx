import Link from 'next/link';
import type { FullOrder } from '@/lib/order-view';
import { STEPS } from '@/lib/order-view';
import { formatINR } from '@/lib/money';
import { Status } from '../ui/Status';
import { Icon } from '../ui/Icon';
import { OrderSummary } from './OrderSummary';

const LABEL: Record<string, string> = { confirmed: 'Confirmed', processing: 'Processing', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered' };
const fmt = (d: Date) => d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function OrderDetail({ o, invoiceHref, retryHref, children }: { o: FullOrder; invoiceHref?: string; retryHref?: string; children?: React.ReactNode }) {
  const reached = STEPS.indexOf(o.status as typeof STEPS[number]);
  const ship = o.shipments[0];
  const inv = o.invoices.find(i => i.kind === 'invoice');
  const inst = o.installations[0];
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-6">
        <div className="card p-6">
          <div className="flex flex-wrap items-center gap-2"><Status value={o.status} /><Status value={o.paymentStatus} /></div>
          {['cancelled', 'returned', 'pending_payment'].includes(o.status) ? (
            <p className="mt-4 font-sans text-[15px] text-muted">
              {o.status === 'pending_payment' && (o.paymentStatus === 'failed' ? 'Your last payment attempt didn’t go through. You can try again.' : 'We’re waiting for your payment.')}
              {o.status === 'cancelled' && `Cancelled${o.cancelReason ? `: ${o.cancelReason}` : ''}.`}
              {o.status === 'returned' && 'This order was returned.'}
            </p>
          ) : (
            <ol className="mt-6 grid grid-cols-5 gap-1" aria-label="Order progress">
              {STEPS.map((s, i) => (
                <li key={s} className="flex flex-col items-center gap-2 text-center" aria-current={i === reached ? 'step' : undefined}>
                  <span className={`grid size-9 place-items-center rounded-full ${i <= reached ? 'bg-deep-current text-white' : 'bg-paper text-muted'}`}>{i < reached ? <Icon name="check" className="size-4" /> : <span className="font-sans text-xs font-semibold">{i + 1}</span>}</span>
                  <span className={`font-sans text-[10.5px] leading-tight sm:text-[13px] ${i <= reached ? 'font-semibold' : 'text-muted'}`}>{LABEL[s]}</span>
                </li>
              ))}
            </ol>
          )}
          {retryHref && o.status === 'pending_payment' && <Link href={retryHref} className="btn btn-primary mt-5">Complete payment <Icon name="arrow" className="size-4" /></Link>}
        </div>

        {ship && (
          <div className="card p-6 font-sans">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Icon name="truck" /> Shipment</h2>
            <dl className="mt-4 grid gap-3 text-[15px] sm:grid-cols-3">
              <div><dt className="text-sm text-muted">Courier</dt><dd className="font-medium">{ship.courier ?? 'Assigning'}</dd></div>
              <div><dt className="text-sm text-muted">AWB</dt><dd className="font-medium">{ship.awb ?? '—'}</dd></div>
              <div><dt className="text-sm text-muted">Status</dt><dd><Status value={ship.status} /></dd></div>
            </dl>
            {ship.trackingUrl && <a href={ship.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-4">Live tracking <Icon name="external" className="size-4" /></a>}
            {!!ship.events?.length && <ol className="mt-5 space-y-3 border-l-2 border-line pl-4">{ship.events.slice().reverse().map((e, i) => <li key={i} className="text-sm"><b>{e.status}</b>{e.location ? ` · ${e.location}` : ''}<span className="block text-muted">{new Date(e.at).toLocaleString('en-IN')}</span></li>)}</ol>}
          </div>
        )}

        {inst && (
          <div className="card p-6 font-sans">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Icon name="wrench" /> Installation</h2>
            <p className="mt-3 text-[15px] text-muted">{inst.status === 'completed' ? `Installed on ${inst.completedAt?.toLocaleDateString('en-IN')}.` : inst.status === 'scheduled' && inst.scheduledAt ? `Scheduled for ${fmt(inst.scheduledAt)}${inst.technician ? ` with ${inst.technician}` : ''}.` : 'Our team will contact you after delivery to schedule installation.'}</p>
          </div>
        )}

        {children}

        <div className="card p-6 font-sans">
          <h2 className="text-lg font-semibold">History</h2>
          <ol className="mt-4 space-y-3">{o.events.map(e => <li key={e.id} className="flex flex-col text-[14px] sm:flex-row sm:gap-4"><span className="w-44 shrink-0 text-muted">{fmt(e.createdAt)}</span><span><b className="font-semibold">{e.status.replace(/_/g, ' ')}</b>{e.note ? ` — ${e.note}` : ''}</span></li>)}</ol>
        </div>
      </div>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <OrderSummary order={o} />
        {inv && invoiceHref && <a href={invoiceHref} target="_blank" className="btn btn-outline"><Icon name="doc" className="size-4" /> GST invoice {inv.number}</a>}
        {o.refunds.length > 0 && <div className="card p-5 font-sans text-sm"><p className="font-semibold">Refunds</p>{o.refunds.map(r => <p key={r.id} className="mt-2 flex justify-between"><span>{formatINR(r.amount)}</span><Status value={r.status} /></p>)}</div>}
      </aside>
    </div>
  );
}

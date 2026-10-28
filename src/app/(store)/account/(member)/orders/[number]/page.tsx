import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reviews } from '@/lib/db/schema';
import { requireCustomer } from '@/lib/auth';
import { loadOrder } from '@/lib/order-view';
import { getCommerce } from '@/lib/settings';
import { OrderDetail } from '@/components/store/OrderDetail';
import { CancelOrder, ReturnRequest, ReviewForm, InstallationPreference } from '@/components/forms/OrderActions';
import { Status } from '@/components/ui/Status';
import { WATER_TESTING } from '@/lib/content';

export default async function MyOrder({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const c = await requireCustomer(`/account/orders/${number}`);
  const o = await loadOrder(number);
  if (!o || o.customerId !== c.id) notFound();
  const commerce = await getCommerce();
  const blocked = commerce.cancelBefore === 'packed' ? ['packed', 'shipped', 'delivered', 'cancelled', 'returned'] : ['shipped', 'delivered', 'cancelled', 'returned'];
  const canCancel = !blocked.includes(o.status);
  const mine = await db.query.reviews.findMany({ where: and(eq(reviews.customerId, c.id), eq(reviews.orderId, o.id)) });
  const uniqueProducts = [...new Map(o.items.map(i => [i.productId, i])).values()];
  const inst = o.installations[0];
  const creditNotes = o.invoices.filter(i => i.kind === 'credit_note');
  return (
    <div>
      <h2 className="mb-6 font-sans text-2xl font-bold">{o.number}</h2>
      <OrderDetail o={o} invoiceHref={`/invoice/${o.number}`} retryHref={o.status === 'pending_payment' ? `/checkout/pay/${o.number}?t=${o.accessToken}` : undefined}>
        <div className="flex flex-col gap-3">
          {canCancel && <CancelOrder number={o.number} />}
          {o.status === 'delivered' && <ReturnRequest number={o.number} items={o.items.map(i => ({ id: i.id, name: i.name }))} />}
          {o.returns.map(r => <p key={r.id} className="flex items-center gap-2 font-sans text-sm">Return request: <Status value={r.status} /></p>)}
          {creditNotes.map(cn => <a key={cn.id} href={`/invoice/${o.number}?cn=${encodeURIComponent(cn.number)}`} target="_blank" className="link font-sans text-sm">Credit note {cn.number}</a>)}
        </div>
        {inst && inst.status === 'pending' && o.paymentStatus === 'paid' && (
          <div className="card p-6"><h3 className="mb-4 font-sans text-lg font-semibold">Choose an installation slot</h3><InstallationPreference number={o.number} slots={WATER_TESTING.slots} /></div>
        )}
        {o.status === 'delivered' && uniqueProducts.map(i => {
          const r = mine.find(x => x.productId === i.productId);
          return (
            <div key={i.productId} className="card p-6">
              <h3 className="mb-4 font-sans text-lg font-semibold">Review {i.name}</h3>
              {r ? <p className="font-sans text-sm text-muted">You rated it {r.rating}/5. <Status value={r.status} label={r.status === 'pending' ? 'Awaiting moderation' : undefined} /></p> : <ReviewForm number={o.number} productId={i.productId} name={i.name} />}
            </div>
          );
        })}
      </OrderDetail>
    </div>
  );
}

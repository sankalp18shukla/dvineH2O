import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { OrderDetail } from '@/components/store/OrderDetail';
import { Icon } from '@/components/ui/Icon';
import { loadOrder } from '@/lib/order-view';
import { getCustomer } from '@/lib/auth';

export const metadata: Metadata = { title: 'Your order', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; paid?: string }> }) {
  const { number } = await params; const { t, paid } = await searchParams;
  const o = await loadOrder(number);
  const c = await getCustomer();
  if (!o || (o.accessToken !== t && o.customerId !== c?.id)) notFound();
  const justPaid = paid && o.paymentStatus === 'paid';
  return (
    <>
      <Header framed />
      <main id="main" className="container-x py-12">
        {justPaid ? (
          <div className="surface-blue on-dark relative mb-10 overflow-hidden p-8 sm:p-12">
            <div className="relative">
              <span className="grid size-14 place-items-center rounded-full bg-glacier text-ink"><Icon name="check" className="size-7" strokeWidth={2.4} /></span>
              <Lockup as="h1" title={`*Thank you,* ${o.contactName.split(' ')[0]}.`} tone="glacier" size="sm" className="mt-8" />
              <p className="lede mt-8">Your order <b className="text-white">{o.number}</b> is confirmed. We’ve sent the details to {o.contactEmail}.</p>
              {!c && <p className="mt-6 font-sans text-sm text-white/75">Create an account with {o.contactEmail} to see this order, your invoice and warranty any time. <Link href={`/account/register?next=/account/orders/${o.number}`} className="text-white underline">Create account</Link></p>}
            </div>
          </div>
        ) : (
          <>
            <Lockup as="h1" title={`*Order* ${o.number}`} tone="glacier" size="sm" />
            <p className="mt-6 font-sans text-muted">Placed {o.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <div className="h-8" />
          </>
        )}
        <OrderDetail o={o} invoiceHref={`/invoice/${o.number}?t=${o.accessToken}`} retryHref={o.status === 'pending_payment' ? `/checkout/pay/${o.number}?t=${o.accessToken}` : undefined}>
          {c?.id === o.customerId && <Link href={`/account/orders/${o.number}`} className="btn btn-outline self-start">Manage this order in your account</Link>}
        </OrderDetail>
      </main>
    </>
  );
}

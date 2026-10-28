import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { PayPanel } from '@/components/store/PayPanel';
import { OrderSummary } from '@/components/store/OrderSummary';
import { CheckoutSteps } from '@/components/store/CheckoutSteps';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { testPaymentsAllowed } from '@/lib/payments-mode';

export const metadata: Metadata = { title: 'Payment', robots: { index: false } };

export default async function PayPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params; const { t } = await searchParams;
  const o = await db.query.orders.findFirst({ where: eq(orders.number, number), with: { items: true } });
  if (!o || o.accessToken !== t) notFound();
  if (o.paymentStatus === 'paid') redirect(`/order/${o.number}?t=${o.accessToken}`);
  const expired = o.status === 'cancelled';
  const mins = o.reservationExpiresAt ? Math.max(0, Math.round((o.reservationExpiresAt.getTime() - Date.now()) / 60000)) : null;
  return (
    <>
      <Header framed />
      <main id="main" className="container-x py-12">
        <CheckoutSteps current={3} />
        <Lockup as="h1" title="*Complete* your payment." tone="glacier" size="sm" />
        <p className="lede mt-8">Order <b className="text-ink">{o.number}</b>{mins != null && !expired && <> · items held for {mins} more minute{mins === 1 ? '' : 's'}</>}</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <OrderSummary order={o} />
          <div>
            {expired
              ? <div className="card p-6"><p className="font-sans font-semibold">This order expired because payment wasn’t completed in time.</p><Link href="/cart" className="btn btn-primary mt-4">Return to cart</Link></div>
              : <PayPanel kind="order" ref_={o.number} token={o.accessToken} amount={o.total} prefill={{ name: o.contactName, email: o.contactEmail, phone: o.contactPhone }} successHref={`/order/${o.number}?t=${o.accessToken}&paid=1`} testAllowed={testPaymentsAllowed()} />}
          </div>
        </div>
      </main>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { CheckoutForm } from '@/components/forms/CheckoutForm';
import { Totals } from '@/components/store/Totals';
import { CheckoutSteps } from '@/components/store/CheckoutSteps';
import { loadCart } from '@/lib/cart';
import { getCustomer } from '@/lib/auth';
import { db } from '@/lib/db';
import { addresses } from '@/lib/db/schema';
import { formatINR } from '@/lib/money';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const { items, totals } = await loadCart();
  if (!items.length) redirect('/cart');
  if (items.some(i => i.qty > i.available)) redirect('/cart');
  const c = await getCustomer();
  const addr = c ? await db.query.addresses.findFirst({ where: eq(addresses.customerId, c.id), orderBy: [desc(addresses.isDefault), desc(addresses.createdAt)] }) : null;
  const prefill = { name: addr?.name ?? c?.name ?? '', email: c?.email ?? '', phone: addr?.phone ?? c?.phone ?? '', line1: addr?.line1 ?? '', line2: addr?.line2 ?? '', city: addr?.city ?? c?.city ?? '', state: addr?.state ?? c?.state ?? '', pincode: addr?.pincode ?? c?.pincode ?? '' };
  return (
    <>
      <Header framed />
      <main id="main" className="container-x py-12 pb-28 lg:pb-12">
        <CheckoutSteps current={1} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Lockup as="h1" title="*Check*out." tone="glacier" size="sm" />
          {!c && <p className="font-sans text-sm text-muted">Have an account? <Link href="/account/login?next=/checkout" className="link">Sign in</Link> · or continue as a guest</p>}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
          <CheckoutForm prefill={prefill} total={formatINR(totals.total)} />
          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            <h2 className="font-sans text-lg font-semibold">In your order</h2>
            <ul className="mt-4 divide-y divide-line">{items.map(i => <li key={i.id} className="flex justify-between gap-3 py-3 font-sans text-[15px]"><span>{i.product.name} <span className="text-muted">× {i.qty}</span></span><span>{formatINR(i.product.price * i.qty)}</span></li>)}</ul>
            <div className="mt-4 border-t border-line pt-4"><Totals t={totals} /></div>
            <Link href="/cart" className="mt-4 inline-block font-sans text-sm text-muted hover:text-ink">Edit cart or add a code</Link>
          </aside>
        </div>
      </main>
      {/* mobile: total stays visible at checkout */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] font-sans backdrop-blur-xl lg:hidden">
        <div className="flex-1"><p className="text-[12.5px] text-muted">Total, inclusive of GST</p><p className="text-lg font-bold">{formatINR(totals.total)}</p></div>
        <button form="checkout-form" className="btn btn-primary btn-sm">Continue to payment</button>
      </div>
    </>
  );
}

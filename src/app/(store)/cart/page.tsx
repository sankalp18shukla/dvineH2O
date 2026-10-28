import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { QtyControl, CodeForm } from '@/components/store/CartControls';
import { Totals } from '@/components/store/Totals';
import { Icon } from '@/components/ui/Icon';
import { loadCart } from '@/lib/cart';
import { formatINR } from '@/lib/money';

export const metadata: Metadata = { title: 'Your cart', robots: { index: false } };
export const dynamic = 'force-dynamic';
const HREF: Record<string, string> = { hyper: '/hydrogen-bottles', crystal: '/home-water-systems' };

export default async function CartPage() {
  const { items, totals } = await loadCart();
  return (
    <>
      <Header framed />
      <main id="main" className="container-x min-h-[60vh] py-12">
        <Lockup as="h1" title="*Your* cart." tone="glacier" size="sm" />
        {items.length === 0 ? (
          <div className="mt-10 border-t-2 border-ink bg-white p-10 text-center">
            <p className="lede">Your cart is empty.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/home-water-systems" className="btn btn-primary">Shop Crystal</Link><Link href="/hydrogen-bottles" className="btn btn-outline">Shop Hyper</Link></div>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
            <ul className="card divide-y divide-line">
              {items.map(i => (
                <li key={i.id} className="flex gap-5 p-5">
                  <Link href={HREF[i.product.slug] ?? '/'} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-stage sm:size-28"><Image src={i.product.images?.[0] ?? '/images/collection.webp'} alt="" fill sizes="112px" className="object-cover" /></Link>
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-between">
                    <div>
                      <Link href={HREF[i.product.slug] ?? '/'} className="font-sans text-lg font-semibold hover:underline">{i.product.name}</Link>
                      <p className="font-sans text-sm text-muted">{formatINR(i.product.price)} each · GST inclusive</p>
                      {i.qty > i.available && <p className="mt-1 font-sans text-sm font-semibold text-[#8A0E18]">Only {i.available} available. Reduce the quantity to continue.</p>}
                      <div className="mt-3"><QtyControl productId={i.product.id} qty={i.qty} max={Math.min(i.available, i.product.maxPerOrder)} /></div>
                    </div>
                    <p className="font-sans text-lg font-semibold">{formatINR(i.product.price * i.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
              <div className="card p-6">
                <CodeForm applied={totals.couponCode ?? null} error={totals.couponError} isReferral={'isReferral' in totals && !!totals.isReferral} />
                <div className="mt-6"><Totals t={totals} /></div>
                <Link href="/checkout" className={`btn btn-primary mt-6 w-full ${items.some(i => i.qty > i.available) ? 'pointer-events-none opacity-50' : ''}`} aria-disabled={items.some(i => i.qty > i.available)}>Checkout <Icon name="arrow" className="size-4" /></Link>
                <p className="mt-3 text-center font-sans text-[13px] text-muted">Guest checkout available. No account needed.</p>
              </div>
              <Link href="/for-business#bulk" className="font-sans text-sm text-muted hover:text-ink">Ordering for a team or as gifts? <span className="link">Ask about bulk orders</span></Link>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { PayPanel } from '@/components/store/PayPanel';
import { Status } from '@/components/ui/Status';
import { db } from '@/lib/db';
import { waterTests } from '@/lib/db/schema';
import { formatINR } from '@/lib/money';
import { testPaymentsAllowed } from '@/lib/payments-mode';

export const metadata: Metadata = { title: 'Your water test', robots: { index: false } };

export default async function BookingPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ t?: string }> }) {
  const { ref } = await params; const { t } = await searchParams;
  const w = await db.query.waterTests.findFirst({ where: eq(waterTests.ref, ref), with: { option: true } });
  if (!w || w.accessToken !== t) notFound();
  const needsPay = w.paymentStatus === 'pending' && w.price > 0 && w.status !== 'cancelled';
  return (
    <>
      <Header framed />
      <main id="main" className="container-x py-12">
        <p className="eyebrow">Water test · {w.ref}</p>
        <Lockup as="h1" title={needsPay ? '*One step left:* payment.' : '*Your water test* is requested.'} tone="glacier" size="sm" className="mt-8" />
        <p className="lede mt-8">{needsPay ? 'Complete payment to confirm your booking. We’ll then confirm your collection slot.' : 'We’ll confirm your collection slot by phone or message. Keep this reference handy.'}</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="card p-6 font-sans">
            <div className="flex flex-wrap gap-2"><Status value={w.status} /><Status value={w.paymentStatus} /></div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-sm text-muted">Test</dt><dd className="font-semibold">{w.option?.name}</dd></div>
              <div><dt className="text-sm text-muted">Price</dt><dd className="font-semibold">{w.price ? formatINR(w.price) : 'Free'}</dd></div>
              <div><dt className="text-sm text-muted">Preferred slot</dt><dd className="font-semibold">{w.preferredDate} · {w.slot}</dd></div>
              <div><dt className="text-sm text-muted">Report in</dt><dd className="font-semibold">{w.option?.turnaround}</dd></div>
              <div className="sm:col-span-2"><dt className="text-sm text-muted">Collection address</dt><dd>{w.address}, {w.city} {w.pincode}</dd></div>
              {w.option && <div className="sm:col-span-2"><dt className="text-sm text-muted">Measures</dt><dd>{w.option.parameters.join(', ')}</dd></div>}
            </dl>
            <p className="mt-6 text-sm text-muted">Need to change something? <Link href="/support#contact" className="link">Contact us</Link> with reference {w.ref}.</p>
          </div>
          {needsPay && <PayPanel kind="water_test" ref_={w.ref} token={w.accessToken} amount={w.price} prefill={{ name: w.name, email: w.email, phone: w.phone }} successHref={`/water-testing/booking/${w.ref}?t=${w.accessToken}`} testAllowed={testPaymentsAllowed()} />}
        </div>
      </main>
    </>
  );
}

import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { enquiries, waterTests } from '@/lib/db/schema';
import { requireCustomer } from '@/lib/auth';
import { Status } from '@/components/ui/Status';
import { ENQUIRY_LABEL } from '@/lib/enquiries';

export const metadata = { title: 'Tests and enquiries' };

export default async function MyBookings() {
  const c = await requireCustomer('/account/bookings');
  const [tests, enq] = await Promise.all([
    db.query.waterTests.findMany({ where: eq(waterTests.customerId, c.id), orderBy: desc(waterTests.createdAt), with: { option: true } }),
    db.query.enquiries.findMany({ where: eq(enquiries.customerId, c.id), orderBy: desc(enquiries.createdAt), limit: 30 }),
  ]);
  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <div className="flex items-center justify-between"><h2 className="font-sans text-lg font-semibold">Water tests</h2><Link href="/water-testing#book" className="btn btn-outline btn-sm">Book a test</Link></div>
        {tests.length === 0 ? <p className="mt-3 text-muted">No water tests booked.</p> : (
          <ul className="mt-4 divide-y divide-line">{tests.map(t => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-4 font-sans">
              <span><Link href={`/water-testing/booking/${t.ref}?t=${t.accessToken}`} className="link">{t.ref}</Link> · {t.option?.name}<span className="block text-sm text-muted">{t.preferredDate} · {t.slot}</span>{t.recommendedProduct && <span className="block text-sm">Recommended: <b>{t.recommendedProduct}</b></span>}</span>
              <span className="flex gap-2"><Status value={t.status} /><Status value={t.paymentStatus} /></span>
            </li>
          ))}</ul>
        )}
      </section>
      <section className="card p-6">
        <h2 className="font-sans text-lg font-semibold">Enquiries and demos</h2>
        {enq.length === 0 ? <p className="mt-3 text-muted">Nothing here yet.</p> : (
          <ul className="mt-4 divide-y divide-line">{enq.map(e => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-4 font-sans"><span><b>{e.ref}</b> · {ENQUIRY_LABEL[e.type]}<span className="block text-sm text-muted">{e.createdAt.toLocaleDateString('en-IN')}{e.message ? ` · ${e.message.slice(0, 80)}` : ''}</span></span><Status value={e.status} /></li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}

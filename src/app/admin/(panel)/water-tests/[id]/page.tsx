import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { waterTests, orders } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { PageHead, Panel, dt } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status, humanize } from '@/components/ui/Status';
import { updateWaterTest } from '@/app/actions/admin';
import { WATER_TESTING } from '@/lib/content';

export default async function WaterTest({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('enquiries');
  const w = await db.query.waterTests.findFirst({ where: eq(waterTests.id, Number((await params).id)), with: { option: true } });
  if (!w) notFound();
  const conv = w.convertedOrderId ? await db.query.orders.findFirst({ where: eq(orders.id, w.convertedOrderId) }) : null;
  const sel = 'input min-h-10 text-sm';
  return (
    <>
      <PageHead back={{ href: '/admin/water-tests', label: 'Water tests' }} title={w.ref} sub={`Requested ${dt(w.createdAt)}`} actions={w.reportPath ? <a href={`/api/admin/files/wt-${w.ref}`} target="_blank" className="btn btn-outline btn-sm">Open lab report</a> : undefined} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Booking">
          <div className="mb-4 flex gap-2"><Status value={w.status} /><Status value={w.paymentStatus} /></div>
          <dl className="grid gap-4 font-sans text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Name</dt><dd className="font-semibold">{w.customerId ? <Link href={`/admin/customers/${w.customerId}`} className="link">{w.name}</Link> : w.name}</dd></div>
            <div><dt className="text-muted">Contact</dt><dd>{w.phone}<br />{w.email}</dd></div>
            <div className="sm:col-span-2"><dt className="text-muted">Address</dt><dd>{w.address}, {w.city} {w.pincode}</dd></div>
            <div><dt className="text-muted">Test</dt><dd>{w.option?.name} · {w.price ? formatINR(w.price) : 'Free'}</dd></div>
            <div><dt className="text-muted">Water source / sample</dt><dd>{w.waterSource ?? '—'} · {w.sampleType === 'treated' ? 'Treated water' : 'Source supply'}</dd></div>
            <div><dt className="text-muted">Interest</dt><dd>{w.productInterest ? humanize(w.productInterest) : '—'}</dd></div>
            {conv && <div><dt className="text-muted">Converted to</dt><dd><Link href={`/admin/orders/${conv.id}`} className="link">{conv.number}</Link></dd></div>}
          </dl>
        </Panel>
        <Panel title="Update">
          <AdminForm action={updateWaterTest} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={w.id} />
            <div className="field"><label className="label text-[12px]" htmlFor="s">Status</label><select id="s" name="status" defaultValue={w.status} className={sel}>{['requested', 'confirmed', 'collected', 'report_ready', 'completed', 'cancelled'].map(x => <option key={x} value={x}>{humanize(x)}</option>)}</select></div>
            <div className="field"><label className="label text-[12px]" htmlFor="p">Payment</label><select id="p" name="paymentStatus" defaultValue={w.paymentStatus} className={sel}>{['not_required', 'pending', 'paid', 'refunded'].map(x => <option key={x} value={x}>{humanize(x)}</option>)}</select></div>
            <div className="field"><label className="label text-[12px]" htmlFor="d">Collection date</label><input id="d" type="date" name="preferredDate" defaultValue={w.preferredDate ?? ''} className={sel} /></div>
            <div className="field"><label className="label text-[12px]" htmlFor="sl">Slot</label><select id="sl" name="slot" defaultValue={w.slot ?? ''} className={sel}>{WATER_TESTING.slots.map(x => <option key={x}>{x}</option>)}</select></div>
            <div className="field"><label className="label text-[12px]" htmlFor="r">Recommended product</label><select id="r" name="recommendedProduct" defaultValue={w.recommendedProduct ?? ''} className={sel}><option value="">—</option><option>Crystal</option><option>Hyper</option><option>Titan 111</option></select></div>
            <div className="field"><label className="label text-[12px]" htmlFor="c">Converted order no.</label><input id="c" name="convertedOrder" defaultValue={conv?.number ?? ''} placeholder="DV-26-000123" className={sel} /><AdminError name="convertedOrder" /></div>
            <div className="field sm:col-span-2"><label className="label text-[12px]" htmlFor="rep">Upload lab report (PDF)</label><input id="rep" type="file" name="report" accept="application/pdf" className="font-sans text-sm" /><AdminError name="report" /><p className="hint">Uploading marks the test “Report ready” and notifies the customer.</p></div>
            <SubmitButton className="btn btn-primary btn-sm justify-self-start">Save</SubmitButton>
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}

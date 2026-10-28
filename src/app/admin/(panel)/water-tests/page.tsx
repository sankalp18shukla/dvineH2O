import Link from 'next/link';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { waterTests, testOptions } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { can } from '@/lib/session';
import { formatINR } from '@/lib/money';
import { PageHead, Panel, TableWrap, Filters, Empty, dt } from '@/components/admin/ui';
import { AdminForm } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status, humanize } from '@/components/ui/Status';
import { saveTestOption } from '@/app/actions/admin';

export const metadata = { title: 'Water tests' };
const STATUSES = ['requested', 'confirmed', 'collected', 'report_ready', 'completed', 'cancelled'] as const;

export default async function WaterTests({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const s = await requireStaff('enquiries');
  const { status } = await searchParams;
  const where = status && (STATUSES as readonly string[]).includes(status) ? eq(waterTests.status, status as typeof STATUSES[number]) : undefined;
  const [list, opts] = await Promise.all([db.query.waterTests.findMany({ where, orderBy: desc(waterTests.createdAt), limit: 200, with: { option: true } }), db.query.testOptions.findMany({ orderBy: asc(testOptions.sort) })]);
  const sel = 'input min-h-10 text-sm';
  return (
    <>
      <PageHead title="Water tests" sub="Bookings, sample collection, reports and conversion." actions={<a href="/api/admin/export?type=water_tests&range=30d" className="btn btn-outline btn-sm">Export CSV</a>} />
      <Filters><div className="field"><label className="label" htmlFor="st">Status</label><select id="st" name="status" defaultValue={status ?? ''} className="input w-44"><option value="">All</option>{STATUSES.map(x => <option key={x} value={x}>{humanize(x)}</option>)}</select></div></Filters>
      <Panel>
        {list.length === 0 ? <Empty>No water tests yet.</Empty> : (
          <TableWrap>
            <thead><tr><th>Ref</th><th>Requested</th><th>Name</th><th>Test</th><th>Slot</th><th>Area</th><th>Status</th><th>Payment</th><th>Outcome</th></tr></thead>
            <tbody>{list.map(w => <tr key={w.id}><td><Link href={`/admin/water-tests/${w.id}`} className="link">{w.ref}</Link></td><td className="whitespace-nowrap">{dt(w.createdAt)}</td><td>{w.name}<span className="block text-[12px] text-muted">{w.phone}</span></td><td>{w.option?.name}</td><td>{w.preferredDate}<span className="block text-[12px] text-muted">{w.slot}</span></td><td>{w.city} {w.pincode}</td><td><Status value={w.status} /></td><td><Status value={w.paymentStatus} />{w.price ? <span className="block text-[12px] text-muted">{formatINR(w.price)}</span> : null}</td><td>{w.convertedOrderId ? <Status value="converted" /> : w.recommendedProduct ?? '—'}</td></tr>)}</tbody>
          </TableWrap>
        )}
      </Panel>
      {can(s.role, 'settings') && (
        <Panel title="Test options shown on the website" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {[...opts, null].map((o, i) => (
              <AdminForm key={o?.id ?? `new${i}`} action={saveTestOption} className="grid gap-2 rounded-xl border border-line p-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={o?.id ?? ''} />
                <p className="font-sans text-sm font-semibold sm:col-span-2">{o ? o.name : 'Add a test option'}</p>
                <input name="name" defaultValue={o?.name} placeholder="Name" className={`${sel} sm:col-span-2`} aria-label="Name" />
                <input name="summary" defaultValue={o?.summary ?? ''} placeholder="Summary" className={`${sel} sm:col-span-2`} aria-label="Summary" />
                <input name="parameters" defaultValue={o?.parameters.join(', ')} placeholder="Parameters, comma separated" className={`${sel} sm:col-span-2`} aria-label="Parameters" />
                <input name="collectionMethod" defaultValue={o?.collectionMethod} placeholder="Collection method" className={sel} aria-label="Collection method" />
                <input name="turnaround" defaultValue={o?.turnaround} placeholder="Turnaround" className={sel} aria-label="Turnaround" />
                <input name="price" defaultValue={o ? (o.price / 100).toFixed(0) : ''} placeholder="Price ₹ (0 = free)" className={sel} aria-label="Price" />
                <input name="sort" defaultValue={o?.sort ?? 9} placeholder="Order" className={sel} aria-label="Sort order" />
                <label className="flex items-center gap-2 font-sans text-sm"><input type="checkbox" name="active" defaultChecked={o?.active ?? true} className="check mt-0" />Shown on website</label>
                <SubmitButton className="btn btn-outline btn-sm justify-self-start">Save</SubmitButton>
              </AdminForm>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

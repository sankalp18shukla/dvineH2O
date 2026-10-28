import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, orders, enquiries, warranties, serviceTickets, waterTests, addresses, referrals } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { ENQUIRY_LABEL } from '@/lib/enquiries';
import { PageHead, Panel, TableWrap, Kpi, Empty, day, dt } from '@/components/admin/ui';
import { AdminForm } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status } from '@/components/ui/Status';
import { addCustomerNote } from '@/app/actions/admin';

export default async function Customer({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('customers');
  const id = Number((await params).id);
  const c = await db.query.customers.findFirst({ where: eq(customers.id, id) });
  if (!c) notFound();
  const [os, es, ws, ts, wts, as, refs] = await Promise.all([
    db.query.orders.findMany({ where: eq(orders.customerId, id), orderBy: desc(orders.createdAt), with: { items: true } }),
    db.query.enquiries.findMany({ where: eq(enquiries.customerId, id), orderBy: desc(enquiries.createdAt) }),
    db.query.warranties.findMany({ where: eq(warranties.customerId, id), with: { product: true } }),
    db.query.serviceTickets.findMany({ where: eq(serviceTickets.customerId, id), orderBy: desc(serviceTickets.createdAt) }),
    db.query.waterTests.findMany({ where: eq(waterTests.customerId, id), orderBy: desc(waterTests.createdAt) }),
    db.query.addresses.findMany({ where: eq(addresses.customerId, id) }),
    db.query.referrals.findMany({ where: eq(referrals.referrerId, id) }),
  ]);
  const paid = os.filter(o => ['paid', 'partially_refunded'].includes(o.paymentStatus));
  return (
    <>
      <PageHead back={{ href: '/admin/customers', label: 'Customers' }} title={c.name} sub={<>{c.email} · {c.phone} · {c.passwordHash ? 'Registered account' : 'Guest'} · since {day(c.createdAt)}</>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Orders" value={paid.length} /><Kpi label="Total spend" value={formatINR(paid.reduce((t, o) => t + o.total, 0))} /><Kpi label="Latest order" value={paid[0] ? day(paid[0].placedAt) : '—'} /><Kpi label="Enquiries" value={es.length} /><Kpi label="Referrals" value={refs.length} sub={c.referralCode ?? ''} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Orders">{os.length === 0 ? <Empty>No orders.</Empty> : <TableWrap><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th className="text-right">Total</th></tr></thead><tbody>{os.map(o => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`} className="link">{o.number}</Link></td><td>{day(o.createdAt)}</td><td>{o.items.map(i => `${i.name.split(' ')[0]} × ${i.qty}`).join(', ')}</td><td><Status value={o.status} /></td><td className="text-right">{formatINR(o.total)}</td></tr>)}</tbody></TableWrap>}</Panel>
        <Panel title="Enquiries and conversations">{es.length === 0 ? <Empty>No enquiries.</Empty> : <ul className="divide-y divide-line font-sans text-sm">{es.map(e => <li key={e.id} className="flex justify-between gap-3 py-2.5"><span><Link href={`/admin/enquiries/${e.id}`} className="link">{e.ref}</Link> · {ENQUIRY_LABEL[e.type]}<span className="block text-muted">{dt(e.createdAt)} · {e.message?.slice(0, 90)}</span></span><Status value={e.status} /></li>)}</ul>}</Panel>
        <Panel title="Warranties and service">
          {ws.length === 0 && ts.length === 0 ? <Empty>None.</Empty> : <ul className="divide-y divide-line font-sans text-sm">
            {ws.map(w => <li key={`w${w.id}`} className="flex justify-between py-2.5"><span>{w.product.shortName}{w.serial ? ` · ${w.serial}` : ''} · until {day(w.expiresAt)}</span><Status value={w.status} /></li>)}
            {ts.map(t => <li key={`t${t.id}`} className="flex justify-between py-2.5"><span><Link href={`/admin/service?ticket=${t.id}`} className="link">{t.number}</Link> · {t.issue.slice(0, 70)}</span><Status value={t.status} /></li>)}
          </ul>}
        </Panel>
        <Panel title="Water tests">{wts.length === 0 ? <Empty>None.</Empty> : <ul className="divide-y divide-line font-sans text-sm">{wts.map(w => <li key={w.id} className="flex justify-between py-2.5"><span><Link href={`/admin/water-tests/${w.id}`} className="link">{w.ref}</Link> · {w.preferredDate}</span><Status value={w.status} /></li>)}</ul>}</Panel>
        <Panel title="Profile">
          <dl className="grid grid-cols-2 gap-3 font-sans text-sm">
            <div><dt className="text-muted">City / state</dt><dd>{[c.city, c.state, c.pincode].filter(Boolean).join(', ') || '—'}</dd></div>
            <div><dt className="text-muted">Consent</dt><dd>Terms/privacy {c.consentPrivacyAt ? day(c.consentPrivacyAt) : 'not recorded'} · marketing {c.consentMarketing ? 'yes' : 'no'}</dd></div>
          </dl>
          {as.length > 0 && <ul className="mt-4 grid gap-2 font-sans text-sm">{as.map(a => <li key={a.id} className="rounded-lg bg-paper px-3 py-2">{a.name} · {a.line1}, {a.city} {a.pincode}</li>)}</ul>}
        </Panel>
        <Panel title="Add a note">
          <AdminForm action={addCustomerNote} reset><input type="hidden" name="customerId" value={c.id} /><textarea name="note" rows={3} className="input text-sm" aria-label="Note" placeholder="Call summary, preferences…" /><SubmitButton className="btn btn-outline btn-sm justify-self-start">Save note</SubmitButton></AdminForm>
        </Panel>
      </div>
    </>
  );
}

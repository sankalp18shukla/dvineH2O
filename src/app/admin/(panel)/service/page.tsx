import Link from 'next/link';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { serviceTickets, warranties, installations, staff } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { PageHead, Panel, TableWrap, Empty, dt, day } from '@/components/admin/ui';
import { AdminForm } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status, humanize } from '@/components/ui/Status';
import { updateTicket, createAdminTicket } from '@/app/actions/admin';

export const metadata = { title: 'Warranty & service' };

export default async function Service({ searchParams }: { searchParams: Promise<{ tab?: string; ticket?: string; all?: string }> }) {
  await requireStaff('service');
  const { tab = 'tickets', ticket, all } = await searchParams;
  const sel = 'input min-h-9 text-[13px]';
  const [team, prods] = await Promise.all([db.query.staff.findMany({ where: eq(staff.active, true) }), db.query.products.findMany()]);
  const tabCls = (t: string) => `rounded-full px-4 py-2 font-sans text-sm ${tab === t ? 'bg-ink font-semibold text-white' : 'bg-white hover:bg-paper'}`;
  let body: React.ReactNode = null;

  if (tab === 'tickets') {
    const list = await db.query.serviceTickets.findMany({ where: all ? undefined : inArray(serviceTickets.status, ['open', 'assigned', 'in_progress']), orderBy: desc(serviceTickets.createdAt), limit: 100, with: { product: true, customer: true } });
    body = (
      <div className="grid gap-4">
        <div className="flex gap-3 font-sans text-sm"><Link href="/admin/service" className={!all ? 'font-semibold' : 'link'}>Open</Link><Link href="/admin/service?all=1" className={all ? 'font-semibold' : 'link'}>All tickets</Link></div>
        {list.length === 0 && <Panel><Empty>No open tickets.</Empty></Panel>}
        {list.map(t => (
          <Panel key={t.id} className={String(t.id) === ticket ? 'ring-2 ring-deep-current' : ''} title={<span className="flex flex-wrap items-center gap-2">{t.number} · {t.product?.shortName ?? 'General'} <Status value={t.status} /><Status value={t.priority === 'urgent' || t.priority === 'high' ? 'failed' : 'none'} label={humanize(t.priority)} /></span>} actions={<span className="font-sans text-[12px] text-muted">{dt(t.createdAt)}</span>}>
            <p className="font-sans text-sm"><b>{t.customerId ? <Link href={`/admin/customers/${t.customerId}`} className="link">{t.name}</Link> : t.name}</b> · {t.phone} {t.email}</p>
            <p className="mt-2 rounded-xl bg-paper p-3 font-sans text-sm whitespace-pre-line">{t.issue}</p>
            <AdminForm action={updateTicket} className="mt-3 grid gap-2 sm:grid-cols-4">
              <input type="hidden" name="id" value={t.id} />
              <select name="status" defaultValue={t.status} className={sel} aria-label="Status">{['open', 'assigned', 'in_progress', 'resolved', 'closed'].map(x => <option key={x} value={x}>{humanize(x)}</option>)}</select>
              <select name="priority" defaultValue={t.priority} className={sel} aria-label="Priority">{['low', 'normal', 'high', 'urgent'].map(x => <option key={x}>{x}</option>)}</select>
              <select name="assignedTo" defaultValue={t.assignedTo ?? ''} className={sel} aria-label="Assigned to"><option value="">Unassigned</option>{team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
              <input name="partsUsed" defaultValue={t.partsUsed ?? ''} placeholder="Parts used" className={sel} aria-label="Parts used" />
              <input name="actionTaken" defaultValue={t.actionTaken ?? ''} placeholder="Action taken / resolution" className={`${sel} sm:col-span-3`} aria-label="Action taken" />
              <SubmitButton className="btn btn-outline btn-sm min-h-9">Save</SubmitButton>
            </AdminForm>
            {t.rating && <p className="mt-2 font-sans text-sm">Customer rating: <b>{t.rating}/5</b>{t.feedback ? ` · “${t.feedback}”` : ''}</p>}
          </Panel>
        ))}
        <Panel title="Log a service request (phone / walk-in)">
          <AdminForm action={createAdminTicket} className="grid gap-2 sm:grid-cols-3" reset>
            <input name="name" placeholder="Customer name" className={sel} aria-label="Name" required /><input name="phone" placeholder="Phone" className={sel} aria-label="Phone" /><input name="email" placeholder="Email" className={sel} aria-label="Email" />
            <select name="productId" className={sel} aria-label="Product"><option value="">Product</option>{prods.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}</select>
            <select name="priority" className={sel} defaultValue="normal" aria-label="Priority">{['low', 'normal', 'high', 'urgent'].map(x => <option key={x}>{x}</option>)}</select>
            <input name="issue" placeholder="Issue" className={sel} aria-label="Issue" required />
            <SubmitButton className="btn btn-primary btn-sm justify-self-start">Create ticket</SubmitButton>
          </AdminForm>
        </Panel>
      </div>
    );
  } else if (tab === 'installations') {
    const list = await db.query.installations.findMany({ orderBy: desc(installations.createdAt), limit: 100, with: { order: true } });
    body = <Panel>{list.length === 0 ? <Empty>No installations.</Empty> : <TableWrap><thead><tr><th>Order</th><th>Customer</th><th>City</th><th>Status</th><th>Scheduled</th><th>Technician</th><th>Notes</th></tr></thead><tbody>{list.map(i => <tr key={i.id}><td><Link href={`/admin/orders/${i.orderId}`} className="link">{i.order.number}</Link></td><td>{i.order.contactName}<span className="block text-[12px] text-muted">{i.order.contactPhone}</span></td><td>{i.order.shippingAddress.city}</td><td><Status value={i.status} /></td><td>{dt(i.scheduledAt)}</td><td>{i.technician ?? '—'}</td><td className="max-w-64 text-[12px] whitespace-pre-line">{i.notes}</td></tr>)}</tbody></TableWrap>}</Panel>;
  } else {
    const list = await db.query.warranties.findMany({ orderBy: desc(warranties.createdAt), limit: 200, with: { product: true, customer: true, order: true } });
    body = <Panel>{list.length === 0 ? <Empty>No warranties yet.</Empty> : <TableWrap><thead><tr><th>Product</th><th>Serial</th><th>Customer</th><th>Order</th><th>Purchased</th><th>Installed</th><th>Expires</th><th>Status</th></tr></thead><tbody>{list.map(w => <tr key={w.id}><td>{w.product.shortName}</td><td>{w.serial ?? <span className="text-muted">not assigned</span>}</td><td><Link href={`/admin/customers/${w.customerId}`} className="link">{w.customer.name}</Link></td><td><Link href={`/admin/orders/${w.orderId}`} className="link">{w.order.number}</Link></td><td>{day(w.purchaseDate)}</td><td>{day(w.installationDate)}</td><td>{day(w.expiresAt)}</td><td><Status value={w.status === 'active' && w.expiresAt < new Date() ? 'expired' : w.status} /></td></tr>)}</tbody></TableWrap>}</Panel>;
  }
  return (
    <>
      <PageHead title="Warranty & service" actions={<><a href="/api/admin/export?type=service&range=30d" className="btn btn-outline btn-sm">Export tickets</a><a href="/api/admin/export?type=warranties" className="btn btn-outline btn-sm">Export warranties</a></>} />
      <div className="mb-4 flex gap-2"><Link href="/admin/service" className={tabCls('tickets')}>Service tickets</Link><Link href="/admin/service?tab=installations" className={tabCls('installations')}>Installations</Link><Link href="/admin/service?tab=warranties" className={tabCls('warranties')}>Warranties</Link></div>
      {body}
    </>
  );
}

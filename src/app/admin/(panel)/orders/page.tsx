import Link from 'next/link';
import { and, desc, eq, like, or, inArray, exists, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, returns, orderExceptions, ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { STATUS_LABEL } from '@/lib/orders';
import { PageHead, Panel, TableWrap, Filters, Empty, dt } from '@/components/admin/ui';
import { Status } from '@/components/ui/Status';

export const metadata = { title: 'Orders' };
const PAGE = 50;

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; payment?: string; q?: string; page?: string; returns?: string; exceptions?: string }> }) {
  await requireStaff('orders');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const conds = [
    sp.status && (ORDER_STATUSES as readonly string[]).includes(sp.status) ? eq(orders.status, sp.status as typeof ORDER_STATUSES[number]) : undefined,
    sp.payment && (PAYMENT_STATUSES as readonly string[]).includes(sp.payment) ? eq(orders.paymentStatus, sp.payment as typeof PAYMENT_STATUSES[number]) : undefined,
    sp.q ? or(like(orders.number, `%${sp.q.toUpperCase()}%`), like(orders.contactName, `%${sp.q}%`), like(orders.contactEmail, `%${sp.q.toLowerCase()}%`), like(orders.contactPhone, `%${sp.q}%`)) : undefined,
    sp.returns ? exists(db.select({ x: sql`1` }).from(returns).where(and(eq(returns.orderId, orders.id), inArray(returns.status, ['requested', 'approved', 'received'])))) : undefined,
    sp.exceptions ? exists(db.select({ x: sql`1` }).from(orderExceptions).where(and(eq(orderExceptions.orderId, orders.id), eq(orderExceptions.status, 'open')))) : undefined,
  ].filter(Boolean);
  const where = conds.length ? and(...(conds as NonNullable<typeof conds[number]>[])) : undefined;
  const [list, total] = await Promise.all([
    db.query.orders.findMany({ where, orderBy: desc(orders.createdAt), limit: PAGE, offset: (page - 1) * PAGE, with: { items: true, shipments: true } }),
    db.$count(orders, where),
  ]);
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp as Record<string, string>), page: String(p) })}`;
  return (
    <>
      <PageHead title="Orders" sub={`${total} order${total === 1 ? '' : 's'}`} actions={<a href="/api/admin/export?type=orders&range=30d" className="btn btn-outline btn-sm">Export CSV</a>} />
      <Filters>
        <div className="field"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Order no., name, email, phone" className="input w-64" /></div>
        <div className="field"><label className="label" htmlFor="st">Status</label><select id="st" name="status" defaultValue={sp.status ?? ''} className="input w-44"><option value="">All</option>{ORDER_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="pm">Payment</label><select id="pm" name="payment" defaultValue={sp.payment ?? ''} className="input w-40"><option value="">All</option>{PAYMENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
      </Filters>
      <Panel>
        {list.length === 0 ? <Empty>No orders match.</Empty> : (
          <TableWrap>
            <thead><tr><th>Order</th><th>Created</th><th>Customer</th><th>Items</th><th>Status</th><th>Payment</th><th>Shipment</th><th className="text-right">Total</th></tr></thead>
            <tbody>{list.map(o => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`} className="link">{o.number}</Link></td><td className="whitespace-nowrap">{dt(o.createdAt)}</td>
                <td>{o.contactName}<span className="block text-[12px] text-muted">{o.shippingAddress.city}</span></td>
                <td>{o.items.map(i => `${i.sku.split('-')[1]} × ${i.qty}`).join(', ')}</td>
                <td><Status value={o.status} /></td><td><Status value={o.paymentStatus} /></td>
                <td>{o.shipments[0] ? <><Status value={o.shipments[0].status} /><span className="block text-[12px] text-muted">{o.shipments[0].awb ?? ''}</span></> : '—'}</td>
                <td className="text-right font-semibold">{formatINR(o.total)}</td>
              </tr>
            ))}</tbody>
          </TableWrap>
        )}
      </Panel>
      {total > PAGE && <div className="mt-4 flex justify-between font-sans text-sm">{page > 1 ? <Link href={qs(page - 1)} className="link">← Newer</Link> : <span />}{page * PAGE < total && <Link href={qs(page + 1)} className="link">Older →</Link>}</div>}
    </>
  );
}

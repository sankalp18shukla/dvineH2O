import Link from 'next/link';
import { desc, like, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { PageHead, Panel, TableWrap, Filters, Empty, day } from '@/components/admin/ui';

export const metadata = { title: 'Customers' };

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff('customers');
  const { q } = await searchParams;
  const where = q ? or(like(customers.name, `%${q}%`), like(customers.email, `%${q.toLowerCase()}%`), like(customers.phone, `%${q}%`), like(customers.city, `%${q}%`)) : undefined;
  const rows = await db.select({
    c: customers,
    orders: sql<number>`(select count(*) from ${orders} where ${orders.customerId} = ${customers.id} and ${orders.paymentStatus} != 'pending')`,
    spend: sql<number>`(select coalesce(sum(${orders.total}),0) from ${orders} where ${orders.customerId} = ${customers.id} and ${orders.paymentStatus} in ('paid','partially_refunded'))`,
    enquiries: sql<number>`(select count(*) from enquiries e where e.customer_id = ${customers.id})`,
    last: sql<number>`(select max(${orders.placedAt}) from ${orders} where ${orders.customerId} = ${customers.id})`,
  }).from(customers).where(where).orderBy(desc(customers.createdAt)).limit(200);
  return (
    <>
      <PageHead title="Customers" sub="One record per person across orders, enquiries, tests and service." actions={<a href="/api/admin/export?type=customers" className="btn btn-outline btn-sm">Export CSV</a>} />
      <Filters><div className="field"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={q} placeholder="Name, email, phone, city" className="input w-72" /></div></Filters>
      <Panel>
        {rows.length === 0 ? <Empty>No customers yet.</Empty> : (
          <TableWrap>
            <thead><tr><th>Name</th><th>Contact</th><th>City</th><th>Account</th><th className="text-right">Orders</th><th className="text-right">Spend</th><th className="text-right">Enquiries</th><th>Last order</th><th>Since</th></tr></thead>
            <tbody>{rows.map(({ c, ...r }) => (
              <tr key={c.id}><td><Link href={`/admin/customers/${c.id}`} className="link">{c.name}</Link></td><td>{c.email}<span className="block text-[12px] text-muted">{c.phone}</span></td><td>{c.city ?? '—'}</td><td>{c.passwordHash ? 'Registered' : 'Guest'}</td><td className="text-right">{Number(r.orders)}</td><td className="text-right font-semibold">{formatINR(Number(r.spend))}</td><td className="text-right">{Number(r.enquiries)}</td><td>{r.last ? day(new Date(Number(r.last))) : '—'}</td><td>{day(c.createdAt)}</td></tr>
            ))}</tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}

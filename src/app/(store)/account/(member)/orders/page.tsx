import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { requireCustomer } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { Status } from '@/components/ui/Status';

export const metadata = { title: 'My orders' };

export default async function MyOrders() {
  const c = await requireCustomer('/account/orders');
  const list = await db.query.orders.findMany({ where: eq(orders.customerId, c.id), orderBy: desc(orders.createdAt), with: { items: true } });
  return (
    <section className="card overflow-hidden">
      <h2 className="px-6 pt-6 font-sans text-lg font-semibold">Orders</h2>
      {list.length === 0 ? <p className="p-6 text-muted">You haven’t placed an order yet.</p> : (
        <div className="overflow-x-auto"><table className="table mt-3">
          <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th className="text-right">Total</th></tr></thead>
          <tbody>{list.map(o => (
            <tr key={o.id}><td><Link href={`/account/orders/${o.number}`} className="link">{o.number}</Link></td><td>{o.createdAt.toLocaleDateString('en-IN')}</td><td>{o.items.map(i => `${i.name.split(' ')[0]} × ${i.qty}`).join(', ')}</td><td><Status value={o.status} /></td><td className="text-right font-semibold">{formatINR(o.total)}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </section>
  );
}

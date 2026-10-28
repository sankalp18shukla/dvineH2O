import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { warranties } from '@/lib/db/schema';
import { requireCustomer } from '@/lib/auth';
import { Status } from '@/components/ui/Status';

export const metadata = { title: 'My warranties' };

export default async function MyWarranties() {
  const c = await requireCustomer('/account/warranties');
  const list = await db.query.warranties.findMany({ where: eq(warranties.customerId, c.id), orderBy: desc(warranties.purchaseDate), with: { product: true, order: true } });
  return (
    <section className="grid gap-4">
      {list.length === 0 && <div className="card p-6 text-muted">Warranties appear here automatically after you buy a DVINE product.</div>}
      {list.map(w => {
        const status = w.status === 'active' && w.expiresAt < new Date() ? 'expired' : w.status;
        return (
          <article key={w.id} className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-sans">
              <p className="text-lg font-semibold">{w.product.name}</p>
              <p className="text-sm text-muted">Order <Link href={`/account/orders/${w.order.number}`} className="link">{w.order.number}</Link>{w.serial ? ` · S/N ${w.serial}` : ''}</p>
              <p className="mt-2 text-sm">Purchased {w.purchaseDate.toLocaleDateString('en-IN')}{w.installationDate ? ` · installed ${w.installationDate.toLocaleDateString('en-IN')}` : ''} · valid until <b>{w.expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</b></p>
            </div>
            <div className="flex items-center gap-3"><Status value={status} />{status === 'active' && <Link href="/account/service" className="btn btn-outline btn-sm">Request service</Link>}</div>
          </article>
        );
      })}
    </section>
  );
}

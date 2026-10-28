import Link from 'next/link';
import { desc, eq, and, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, warranties, serviceTickets } from '@/lib/db/schema';
import { requireCustomer } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { Status } from '@/components/ui/Status';
import { ensureReferralCode } from '@/lib/referrals';

export default async function AccountHome() {
  const c = await requireCustomer();
  const [recent, w, open, code] = await Promise.all([
    db.query.orders.findMany({ where: eq(orders.customerId, c.id), orderBy: desc(orders.createdAt), limit: 3, with: { items: true } }),
    db.$count(warranties, and(eq(warranties.customerId, c.id), eq(warranties.status, 'active'))),
    db.$count(serviceTickets, and(eq(serviceTickets.customerId, c.id), inArray(serviceTickets.status, ['open', 'assigned', 'in_progress']))),
    ensureReferralCode(c.id),
  ]);
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/account/orders" className="card p-5 hover:border-deep-current"><p className="font-sans text-sm text-muted">Orders</p><p className="mt-1 font-sans text-3xl font-bold">{recent.length ? recent.length : 0}{recent.length === 3 ? '+' : ''}</p></Link>
        <Link href="/account/warranties" className="card p-5 hover:border-deep-current"><p className="font-sans text-sm text-muted">Active warranties</p><p className="mt-1 font-sans text-3xl font-bold">{w}</p></Link>
        <Link href="/account/service" className="card p-5 hover:border-deep-current"><p className="font-sans text-sm text-muted">Open service requests</p><p className="mt-1 font-sans text-3xl font-bold">{open}</p></Link>
      </div>
      <section className="card p-6">
        <div className="flex items-center justify-between"><h2 className="font-sans text-lg font-semibold">Recent orders</h2><Link href="/account/orders" className="link text-sm">All orders</Link></div>
        {recent.length === 0 ? <p className="mt-4 text-muted">No orders yet. <Link href="/home-water-systems" className="link">Explore Crystal</Link> or <Link href="/hydrogen-bottles" className="link">Hyper</Link>.</p> : (
          <ul className="mt-4 divide-y divide-line">
            {recent.map(o => (
              <li key={o.id}><Link href={`/account/orders/${o.number}`} className="flex flex-wrap items-center justify-between gap-3 py-4 font-sans hover:text-deep-current">
                <span><b>{o.number}</b><span className="block text-sm text-muted">{o.items.map(i => `${i.name} × ${i.qty}`).join(', ')}</span></span>
                <span className="flex items-center gap-3"><Status value={o.status} /><b>{formatINR(o.total)}</b></span>
              </Link></li>
            ))}
          </ul>
        )}
      </section>
      {code && <section className="stage on-dark rounded-[var(--radius-card)] p-6"><p className="font-sans text-sm text-white/70">Your referral code</p><p className="mt-1 font-sans text-3xl font-bold tracking-wide">{code}</p><Link href="/account/referrals" className="btn btn-volt btn-sm mt-4">Share and earn</Link></section>}
    </div>
  );
}

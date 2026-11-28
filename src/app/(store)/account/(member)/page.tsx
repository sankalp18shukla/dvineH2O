import Link from 'next/link';
import { desc, eq, and, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, warranties, serviceTickets } from '@/lib/db/schema';
import { requireCustomer } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { Status } from '@/components/ui/Status';
import { Icon } from '@/components/ui/Icon';
import { referralCodeIfBought, getReferralSettings } from '@/lib/referrals';

export default async function AccountHome() {
  const c = await requireCustomer();
  const [recent, w, open, s, code] = await Promise.all([
    db.query.orders.findMany({ where: eq(orders.customerId, c.id), orderBy: desc(orders.createdAt), limit: 3, with: { items: true } }),
    db.$count(warranties, and(eq(warranties.customerId, c.id), eq(warranties.status, 'active'))),
    db.$count(serviceTickets, and(eq(serviceTickets.customerId, c.id), inArray(serviceTickets.status, ['open', 'assigned', 'in_progress']))),
    getReferralSettings(), referralCodeIfBought(c.id),
  ]);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/account/orders" className="card p-5 hover:border-deep-current"><p className="font-sans text-sm text-muted">Orders</p><p className="mt-1 font-sans text-3xl font-bold">{recent.length ? recent.length : 0}{recent.length === 3 ? '+' : ''}</p></Link>
        <Link href="/account/warranties" className="card p-5 hover:border-deep-current"><p className="font-sans text-sm text-muted">Active warranties</p><p className="mt-1 font-sans text-3xl font-bold">{w}</p></Link>
        <Link href="/account/service" className="card p-5 hover:border-deep-current"><p className="font-sans text-sm text-muted">Open service requests</p><p className="mt-1 font-sans text-3xl font-bold">{open}</p></Link>
      </div>
      {s.enabled && code && (
        <Link href="/account/referrals" className="stage on-dark group flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] p-5 sm:p-6">
          <span className="flex items-center gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-voltage"><Icon name="gift" className="size-5" /></span>
            <span className="font-sans"><b className="block text-[17px]">Give {s.friendPercent}% off, get {formatINR(s.rewardFlat)} back</b><span className="text-sm text-white/75">Share your code <b className="tracking-wide text-white">{code}</b> with friends.</span></span></span>
          <span className="btn btn-volt btn-sm">Share and earn</span>
        </Link>
      )}
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
    </div>
  );
}

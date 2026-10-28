import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { payments, refunds, orders, waterTests } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { razorpayEnabled } from '@/lib/razorpay';
import { formatINR } from '@/lib/money';
import { PageHead, Panel, TableWrap, Empty, dt } from '@/components/admin/ui';
import { Status } from '@/components/ui/Status';

export const metadata = { title: 'Payments' };

export default async function Payments({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> }) {
  await requireStaff('payments');
  const { tab = 'payments', status } = await searchParams;
  const pays = tab === 'payments' ? await db.select({ p: payments, o: orders, w: waterTests }).from(payments).leftJoin(orders, eq(orders.id, payments.orderId)).leftJoin(waterTests, eq(waterTests.id, payments.waterTestId))
    .where(status ? eq(payments.status, status as 'success') : undefined).orderBy(desc(payments.createdAt)).limit(200) : [];
  const rfs = tab === 'refunds' ? await db.select({ r: refunds, o: orders }).from(refunds).innerJoin(orders, eq(orders.id, refunds.orderId)).orderBy(desc(refunds.initiatedAt)).limit(200) : [];
  const tabCls = (t: string) => `rounded-full px-4 py-2 font-sans text-sm ${tab === t ? 'bg-ink font-semibold text-white' : 'bg-white hover:bg-paper'}`;
  return (
    <>
      <PageHead title="Payments & refunds" sub={razorpayEnabled() ? 'Razorpay live connection. Card, UPI and bank details never touch DVINE’s servers.' : 'Test gateway active. Add Razorpay keys for live payments.'} actions={<><a href={`/api/admin/export?type=${tab === 'refunds' ? 'refunds' : 'payments'}&range=30d`} className="btn btn-outline btn-sm">Export CSV</a></>} />
      <div className="mb-4 flex gap-2"><Link href="/admin/payments" className={tabCls('payments')}>Payment attempts</Link><Link href="/admin/payments?tab=refunds" className={tabCls('refunds')}>Refunds</Link>{tab === 'payments' && ['success', 'failed', 'created'].map(s => <Link key={s} href={`/admin/payments?status=${s}`} className={`rounded-full px-3 py-2 font-sans text-[13px] ${status === s ? 'bg-fog font-semibold' : 'text-muted hover:bg-white'}`}>{s}</Link>)}</div>
      <Panel>
        {tab === 'payments' ? (pays.length === 0 ? <Empty>No payment attempts.</Empty> : (
          <TableWrap>
            <thead><tr><th>When</th><th>For</th><th>Gateway</th><th>Reference</th><th>Method</th><th>Attempt</th><th>Status</th><th>Failure</th><th className="text-right">Amount</th></tr></thead>
            <tbody>{pays.map(({ p, o, w }) => <tr key={p.id}><td className="whitespace-nowrap">{dt(p.createdAt)}</td><td>{o ? <Link href={`/admin/orders/${o.id}`} className="link">{o.number}</Link> : w ? <Link href={`/admin/water-tests/${w.id}`} className="link">{w.ref}</Link> : '—'}</td><td>{p.gateway}</td><td className="font-mono text-[12px]">{p.gatewayPaymentId ?? p.gatewayOrderId}</td><td>{p.method ?? '—'}</td><td>{p.attempt}</td><td><Status value={p.status} /></td><td className="max-w-56 text-[12px]">{p.errorDescription ? `${p.errorDescription}${p.failureStage ? ` (${p.failureStage})` : ''}` : '—'}</td><td className="text-right font-semibold">{formatINR(p.amount)}</td></tr>)}</tbody>
          </TableWrap>
        )) : (rfs.length === 0 ? <Empty>No refunds.</Empty> : (
          <TableWrap>
            <thead><tr><th>Initiated</th><th>Order</th><th>Gateway ref</th><th>Reason</th><th>Status</th><th>Completed</th><th className="text-right">Amount</th></tr></thead>
            <tbody>{rfs.map(({ r, o }) => <tr key={r.id}><td>{dt(r.initiatedAt)}</td><td><Link href={`/admin/orders/${o.id}`} className="link">{o.number}</Link></td><td className="font-mono text-[12px]">{r.gatewayRefundId}</td><td>{r.reason}</td><td><Status value={r.status} /></td><td>{dt(r.completedAt)}</td><td className="text-right font-semibold">{formatINR(r.amount)}</td></tr>)}</tbody>
          </TableWrap>
        ))}
      </Panel>
    </>
  );
}

import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { referrals } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { getReferralSettings, referralDiscount, releaseDueReferrals, rewardDueAt } from '@/lib/referrals';
import { formatINR } from '@/lib/money';
import { PageHead, Panel, Empty, Kpi, TableWrap, day } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status } from '@/components/ui/Status';
import { saveReferralSettings, issueReferralReward, cancelReferral } from '@/app/actions/admin';

export const metadata = { title: 'Referrals' };
const rup = (p: number) => (p / 100).toFixed(0);
const sel = 'input min-h-10 text-[13.5px]';

const STEP: Record<string, { tone: string; label: string }> = {
  pending: { tone: 'pending', label: 'Paid, awaiting delivery' },
  qualified: { tone: 'scheduled', label: 'Delivered, in hold' },
  rewarded: { tone: 'active', label: 'Rewarded' },
  void: { tone: 'void', label: 'Cancelled' },
};

export default async function Referrals() {
  await requireStaff('marketing');
  await releaseDueReferrals().catch(e => console.error('referral release', e));
  const [s, list] = await Promise.all([
    getReferralSettings(),
    db.query.referrals.findMany({ orderBy: desc(referrals.createdAt), limit: 300, with: { referrer: true, order: true } }),
  ]);
  const live = list.filter(r => r.status !== 'void');
  const rows = await Promise.all(list.map(async r => ({ r, due: r.status === 'qualified' ? await rewardDueAt(r, s) : null })));
  const top = Object.values(live.reduce<Record<number, { id: number; name: string; code: string; n: number; sales: number }>>((m, r) => {
    const t = (m[r.referrerId] ??= { id: r.referrerId, name: r.referrer.name, code: r.code, n: 0, sales: 0 });
    t.n++; t.sales += r.order?.total ?? 0; return m;
  }, {})).sort((a, b) => b.n - a.n || b.sales - a.sales).slice(0, 8);

  const F = ({ name, label, value, hint }: { name: string; label: string; value: string | number; hint?: string }) => (
    <label className="field grid gap-1 font-sans text-[12px] font-semibold text-muted">{label}<input name={name} defaultValue={value} inputMode="numeric" className={sel} />{hint && <span className="font-normal">{hint}</span>}<AdminError name={name} /></label>
  );

  return (
    <>
      <PageHead title="Referrals" sub="Customers share a personal code. Friends save on their first order; the customer gets a ₹ reward code once the friend’s order is delivered and the hold has passed. Cancelled or returned orders never pay out." />
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi label="Referred orders" value={live.length} />
          <Kpi label="Sales from referrals" value={formatINR(live.reduce((t, r) => t + (r.order?.total ?? 0), 0))} tone="good" />
          <Kpi label="Friend discounts" value={formatINR(live.reduce((t, r) => t + r.discount, 0))} />
          <Kpi label="Rewards sent" value={live.filter(r => r.status === 'rewarded').length} sub={formatINR(live.filter(r => r.status === 'rewarded').length * s.rewardFlat)} />
          <Kpi label="Rewards waiting" value={live.filter(r => r.status === 'pending' || r.status === 'qualified').length} />
        </div>

        <Panel title="Programme" actions={<Status value={s.enabled ? 'active' : 'void'} label={s.enabled ? 'Live' : 'Paused'} />}>
          <AdminForm action={saveReferralSettings} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex items-center gap-2 font-sans text-[14px] font-semibold sm:col-span-2 lg:col-span-4"><input type="checkbox" name="enabled" defaultChecked={s.enabled} className="check mt-0" />Referral programme is on</label>
            <F name="friendPercent" label="Friend’s discount (%)" value={s.friendPercent} hint="On their first order" />
            <F name="friendMax" label="Friend’s discount cap (₹)" value={rup(s.friendMax)} hint="0 = no cap" />
            <F name="rewardFlat" label="Customer’s reward (₹)" value={rup(s.rewardFlat)} hint="A one-time code" />
            <F name="rewardMinOrder" label="Reward needs an order of (₹)" value={rup(s.rewardMinOrder)} hint="0 = any order" />
            <F name="holdDays" label="Hold after delivery (days)" value={s.holdDays} hint="Your return window; 0 = on delivery" />
            <F name="rewardValidDays" label="Reward valid for (days)" value={s.rewardValidDays} />
            <F name="maxRewards" label="Most rewards per customer" value={s.maxRewards} hint="0 = no limit" />
            <div className="flex items-end justify-end"><SubmitButton className="btn btn-primary btn-sm min-h-10" pendingLabel="Saving…">Save programme</SubmitButton></div>
          </AdminForm>
          <p className="mt-4 font-sans text-[12.5px] text-muted">Example with these values: a friend buying Hyper at ₹14,999 saves {formatINR(referralDiscount(s, 1499900))}; the customer who referred them gets a {formatINR(s.rewardFlat)} code {s.holdDays ? `${s.holdDays} days after delivery` : 'on delivery'}, valid {s.rewardValidDays} days.</p>
        </Panel>

        {top.length > 0 && (
          <Panel title="Top referrers">
            <TableWrap><thead><tr><th>Customer</th><th>Code</th><th className="text-right">Friends</th><th className="text-right">Their orders</th></tr></thead>
              <tbody>{top.map(t => <tr key={t.id}><td><Link href={`/admin/customers/${t.id}`} className="link">{t.name}</Link></td><td className="tracking-wide">{t.code}</td><td className="text-right">{t.n}</td><td className="text-right">{formatINR(t.sales)}</td></tr>)}</tbody>
            </TableWrap>
          </Panel>
        )}

        <Panel title="All referrals">
          {rows.length === 0 ? <Empty>No referred orders yet. Customers find their code under My account › Refer a friend.</Empty> : (
            <TableWrap>
              <thead><tr><th>Date</th><th>Referred by</th><th>Friend’s order</th><th className="text-right">Friend saved</th><th>Status</th><th>Reward</th><th /></tr></thead>
              <tbody>{rows.map(({ r, due }) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{day(r.createdAt)}</td>
                  <td><Link href={`/admin/customers/${r.referrerId}`} className="link">{r.referrer.name}</Link><span className="block text-[12px] text-muted">{r.code}</span></td>
                  <td>{r.order ? <Link href={`/admin/orders/${r.order.id}`} className="link">{r.order.number}</Link> : '—'}<span className="block text-[12px] text-muted">{r.order?.contactName} · {r.order ? formatINR(r.order.total) : ''}</span></td>
                  <td className="text-right">{formatINR(r.discount)}</td>
                  <td><Status value={STEP[r.status].tone} label={STEP[r.status].label} />{due && <span className="block text-[12px] text-muted">Reward due {day(due)}</span>}</td>
                  <td className="tracking-wide">{r.rewardCouponCode ?? '—'}</td>
                  <td className="whitespace-nowrap text-right">
                    {(r.status === 'pending' || r.status === 'qualified') && (
                      <AdminForm action={issueReferralReward} className="inline-block" confirm={`Send ${r.referrer.name} a ${formatINR(s.rewardFlat)} reward now, without waiting?`}>
                        <input type="hidden" name="id" value={r.id} /><SubmitButton className="btn btn-outline btn-sm min-h-8" pendingLabel="Sending…">Reward now</SubmitButton>
                      </AdminForm>
                    )}
                    {r.status !== 'void' && (
                      <AdminForm action={cancelReferral} className="ml-2 inline-block" confirm="Cancel this referral? An unused reward code is switched off.">
                        <input type="hidden" name="id" value={r.id} /><SubmitButton className="btn btn-ghost btn-sm min-h-8 text-[#B4231B]" pendingLabel="…">Cancel</SubmitButton>
                      </AdminForm>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </TableWrap>
          )}
        </Panel>
      </div>
    </>
  );
}

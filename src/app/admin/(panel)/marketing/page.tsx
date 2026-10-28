import { desc, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { coupons, referrals } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { getReferralSettings } from '@/lib/referrals';
import { formatINR } from '@/lib/money';
import { PageHead, Panel, TableWrap, Kpi, Empty, day } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status } from '@/components/ui/Status';
import { saveCoupon, saveReferralSettings } from '@/app/actions/admin';

export const metadata = { title: 'Coupons & referrals' };
const rup = (p: number | null) => (p == null ? '' : (p / 100).toFixed(0));

export default async function Marketing() {
  await requireStaff('marketing');
  const [list, refs, s] = await Promise.all([
    db.query.coupons.findMany({ where: isNull(coupons.ownerCustomerId), orderBy: desc(coupons.createdAt) }),
    db.query.referrals.findMany({ orderBy: desc(referrals.createdAt), limit: 100, with: { referrer: true, order: true } }),
    getReferralSettings(),
  ]);
  const sel = 'input min-h-9 text-[13px]';
  const prods = [['hyper', 'Hyper'], ['crystal', 'Crystal']];
  const CouponForm = ({ c }: { c?: typeof list[number] }) => (
    <AdminForm action={saveCoupon} className="grid gap-2 sm:grid-cols-4">
      <input type="hidden" name="id" value={c?.id ?? ''} />
      <div className="field"><input name="code" defaultValue={c?.code} placeholder="CODE" className={`${sel} uppercase`} aria-label="Code" /><AdminError name="code" /></div>
      <select name="type" defaultValue={c?.type ?? 'percent'} className={sel} aria-label="Type"><option value="percent">% off</option><option value="flat">₹ off</option></select>
      <div className="field"><input name="value" defaultValue={c ? (c.type === 'percent' ? c.value : rup(c.value)) : ''} placeholder="Value" className={sel} aria-label="Value" /><AdminError name="value" /></div>
      <input name="maxDiscount" defaultValue={rup(c?.maxDiscount ?? null)} placeholder="Max ₹ off" className={sel} aria-label="Max discount" />
      <input name="minOrder" defaultValue={c?.minOrder ? rup(c.minOrder) : ''} placeholder="Min order ₹" className={sel} aria-label="Minimum order" />
      <input name="usageLimit" defaultValue={c?.usageLimit ?? ''} placeholder="Usage limit" className={sel} aria-label="Usage limit" />
      <input type="date" name="startsAt" defaultValue={c?.startsAt?.toISOString().slice(0, 10)} className={sel} aria-label="Starts" />
      <input type="date" name="endsAt" defaultValue={c?.endsAt?.toISOString().slice(0, 10)} className={sel} aria-label="Ends" />
      <fieldset className="flex items-center gap-3 font-sans text-[13px] sm:col-span-2"><legend className="sr-only">Applies to</legend>Applies to:{prods.map(([v, l]) => <label key={v} className="flex items-center gap-1"><input type="checkbox" name="appliesTo" value={v} defaultChecked={!c?.appliesTo?.length || c.appliesTo.includes(v)} className="check mt-0" />{l}</label>)}</fieldset>
      <label className="flex items-center gap-2 font-sans text-[13px]"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} className="check mt-0" />Active</label>
      <SubmitButton className="btn btn-outline btn-sm min-h-9">{c ? 'Save' : 'Create coupon'}</SubmitButton>
    </AdminForm>
  );
  return (
    <>
      <PageHead title="Coupons & referrals" />
      <div className="grid gap-6">
        <Panel title="Coupons">
          {list.length === 0 && <Empty>No coupons yet.</Empty>}
          <ul className="grid gap-4">{list.map(c => <li key={c.id} className="rounded-xl border border-line p-3"><p className="mb-2 flex items-center gap-2 font-sans text-sm"><b>{c.code}</b> · used {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''} <Status value={c.active ? 'active' : 'void'} label={c.active ? 'Active' : 'Inactive'} /></p><CouponForm c={c} /></li>)}</ul>
          <div className="mt-5 border-t border-line pt-4"><p className="mb-2 font-sans text-sm font-semibold">New coupon</p><CouponForm /></div>
        </Panel>
        <Panel title="Referral programme">
          <AdminForm action={saveReferralSettings} className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 font-sans text-sm sm:col-span-3"><input type="checkbox" name="enabled" defaultChecked={s.enabled} className="check mt-0" />Referral programme is on</label>
            {[['friendPercent', 'Friend gets (% off)', s.friendPercent], ['friendMax', 'Friend max discount (₹)', rup(s.friendMax)], ['rewardFlat', 'Referrer reward (₹ coupon)', rup(s.rewardFlat)], ['rewardMinOrder', 'Reward min order (₹)', rup(s.rewardMinOrder)], ['rewardValidDays', 'Reward valid for (days)', s.rewardValidDays]].map(([n, l, v]) => <div key={n as string} className="field"><label className="label text-[12px]" htmlFor={`r-${n}`}>{l}</label><input id={`r-${n}`} name={n as string} defaultValue={v as string} className={sel} inputMode="decimal" /></div>)}
            <SubmitButton className="btn btn-primary btn-sm self-end justify-self-start">Save settings</SubmitButton>
          </AdminForm>
          <div className="mt-6 grid grid-cols-3 gap-3"><Kpi label="Referred orders" value={refs.filter(r => r.status !== 'void').length} /><Kpi label="Friend discounts given" value={formatINR(refs.filter(r => r.status !== 'void').reduce((t, r) => t + r.discount, 0))} /><Kpi label="Rewards issued" value={refs.filter(r => r.rewardCouponCode && r.status !== 'void').length} /></div>
          {refs.length > 0 && <div className="mt-5"><TableWrap><thead><tr><th>Date</th><th>Referrer</th><th>Code</th><th>Order</th><th className="text-right">Friend saved</th><th>Reward</th><th>Status</th></tr></thead><tbody>{refs.map(r => <tr key={r.id}><td>{day(r.createdAt)}</td><td>{r.referrer.name}</td><td>{r.code}</td><td>{r.order?.number}</td><td className="text-right">{formatINR(r.discount)}</td><td>{r.rewardCouponCode}</td><td><Status value={r.status} /></td></tr>)}</tbody></TableWrap></div>}
        </Panel>
      </div>
    </>
  );
}

import Link from 'next/link';
import { desc, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { PageHead, Panel, Empty } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { Icon } from '@/components/admin/AdminIcon';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status } from '@/components/ui/Status';
import { CopyButton } from '@/components/CopyButton';
import { saveCoupon } from '@/app/actions/admin';
import { COUPON_PRODUCTS, COUPON_STATE_LABEL, couponInfo, couponState, describeCoupon, type CouponState } from '@/lib/coupon-info';
import { getEditorContent } from '@/lib/site-content.server';
import { codeSpots } from '@/lib/promo-codes';

export const metadata = { title: 'Coupons' };
const rup = (p: number | null) => (p == null ? '' : (p / 100).toFixed(0));
/** Dates are entered and shown as India dates (the action stores the start and end of that day, IST). */
const ist = (d: Date | null) => d?.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const TONE: Record<CouponState, string> = { live: 'active', scheduled: 'scheduled', ended: 'expired', used: 'expired', off: 'void' };

type Row = typeof coupons.$inferSelect;
const sel = 'input min-h-10 text-[13.5px]';
const F = ({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) => (
  <label className="field grid gap-1 font-sans text-[12px] font-semibold text-muted">{label}{children}{error && <AdminError name={error} />}</label>
);

function CouponForm({ c }: { c?: Row }) {
  return (
    <AdminForm action={saveCoupon} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input type="hidden" name="id" value={c?.id ?? ''} />
      <F label="Code" error="code"><input name="code" defaultValue={c?.code} placeholder="DIWALI10" className={`${sel} uppercase`} required /></F>
      <div className="field grid gap-1 font-sans text-[12px] font-semibold text-muted">
        <span>Discount</span>
        <span className="flex gap-2">
          <select name="type" defaultValue={c?.type ?? 'percent'} className={`${sel} w-24 shrink-0`} aria-label="Discount type"><option value="percent">% off</option><option value="flat">₹ off</option></select>
          <input name="value" defaultValue={c ? (c.type === 'percent' ? c.value : rup(c.value)) : ''} placeholder="10" inputMode="decimal" className={sel} aria-label="Discount amount" required />
        </span>
        <AdminError name="value" />
      </div>
      <F label="Most it can take off (₹, for % codes)"><input name="maxDiscount" defaultValue={rup(c?.maxDiscount ?? null)} placeholder="No limit" inputMode="numeric" className={sel} /></F>
      <F label="Minimum order (₹)"><input name="minOrder" defaultValue={c?.minOrder ? rup(c.minOrder) : ''} placeholder="None" inputMode="numeric" className={sel} /></F>
      <F label="Starts (optional)"><input type="date" name="startsAt" defaultValue={ist(c?.startsAt ?? null)} className={sel} /></F>
      <F label="Ends (optional, inclusive)"><input type="date" name="endsAt" defaultValue={ist(c?.endsAt ?? null)} className={sel} /></F>
      <F label="Times it can be used in all"><input name="usageLimit" defaultValue={c?.usageLimit ?? ''} placeholder="No limit" inputMode="numeric" className={sel} /></F>
      <F label="Internal note"><input name="note" defaultValue={c?.note ?? ''} placeholder="e.g. Diwali Instagram campaign" className={sel} maxLength={200} /></F>
      <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-[13.5px] sm:col-span-2">
        <legend className="sr-only">Works on</legend>
        <span className="font-semibold text-muted">Works on</span>
        {COUPON_PRODUCTS.map(p => <label key={p.slug} className="flex items-center gap-1.5"><input type="checkbox" name="appliesTo" value={p.slug} defaultChecked={!c?.appliesTo?.length || c.appliesTo.includes(p.slug)} className="check mt-0" />{p.name}</label>)}
      </fieldset>
      <label className="flex items-center gap-2 font-sans text-[13.5px]"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} className="check mt-0" />Switched on</label>
      <div className="flex justify-end"><SubmitButton className="btn btn-primary btn-sm min-h-10">{c ? 'Save changes' : 'Create coupon'}</SubmitButton></div>
    </AdminForm>
  );
}

export default async function Marketing() {
  await requireStaff('marketing');
  const [list, content] = await Promise.all([
    db.query.coupons.findMany({ where: isNull(coupons.ownerCustomerId), orderBy: desc(coupons.createdAt) }),
    getEditorContent().catch(() => null),
  ]);
  // where each code is promoted on the published site
  const spots = content ? codeSpots(content.live) : [];
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const rows = list.map(c => ({ c, info: couponInfo(c), state: couponState(couponInfo(c)), where: spots.filter(s => s.holder.code.toUpperCase() === c.code) }));
  const current = rows.filter(r => r.state === 'live' || r.state === 'scheduled');
  const past = rows.filter(r => r.state !== 'live' && r.state !== 'scheduled');

  const Item = ({ r }: { r: typeof rows[number] }) => {
    const link = `${site}/offer/${r.c.code}`;
    return (
      <li className="rounded-2xl border border-line bg-white">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2 p-4">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 font-sans"><b className="text-[16px] tracking-wide">{r.c.code}</b><Status value={TONE[r.state]} label={COUPON_STATE_LABEL[r.state](r.info)} /></p>
            <p className="mt-1 font-sans text-[13.5px]">{describeCoupon(r.info)}</p>
            <p className="mt-1 font-sans text-[12.5px] text-muted">
              Used {r.c.usedCount}{r.c.usageLimit ? ` of ${r.c.usageLimit}` : ''} time{r.c.usedCount === 1 && !r.c.usageLimit ? '' : 's'}
              {r.c.note && <> · {r.c.note}</>}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-1.5 font-sans text-[12.5px]">
              {r.where.length
                ? <>{r.where.map(w => <span key={w.where} className={`rounded-full px-2.5 py-0.5 ${w.showing && r.state === 'live' ? 'bg-[#DFF5E3] text-[#14532D]' : 'bg-[#F1F2F5] text-muted'}`}>{w.where}</span>)}</>
                : <span className="text-muted">Not on the website. <Link href="/admin/content" className="font-semibold text-deep-current hover:underline">Add it to a promotion</Link>.</span>}
            </p>
          </div>
          {r.state !== 'off' && r.state !== 'ended' && site && (
            <div className="flex items-center gap-2 font-sans text-[12.5px]">
              <code className="hidden max-w-[260px] truncate rounded-lg bg-paper px-2.5 py-2 text-muted sm:block" title="Opening this link applies the code to the visitor’s cart">{link.replace(/^https?:\/\//, '')}</code>
              <CopyButton text={link} label="Copy link" />
            </div>
          )}
        </div>
        <details className="group border-t border-line">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 font-sans text-[13px] font-semibold text-muted hover:text-ink"><Icon name="settings" className="size-4" />Edit<Icon name="chevron" className="ml-auto size-4 transition group-open:rotate-90" /></summary>
          <div className="px-4 pb-4"><CouponForm c={r.c} /></div>
        </details>
      </li>
    );
  };

  return (
    <>
      <PageHead title="Coupons" sub="Codes customers apply in the cart. To advertise one, pick it on a ribbon, hero slide, card or offer ticket in Homepage & promotions: the site shows the code only while it is live." />
      <div className="grid gap-6">
        <Panel title="New coupon"><CouponForm /></Panel>
        <Panel title="Live and upcoming">
          {current.length === 0 ? <Empty>No live coupons.</Empty> : <ul className="grid gap-3">{current.map(r => <Item key={r.c.id} r={r} />)}</ul>}
          {current.length > 0 && site && <p className="mt-3 font-sans text-[12.5px] text-muted">A coupon’s link applies the code to the visitor’s cart. Add <code>?to=/hydrogen-bottles</code> to land them on a page instead of the cart.</p>}
        </Panel>
        {past.length > 0 && (
          <Panel title="Ended, used up or switched off">
            <ul className="grid gap-3">{past.map(r => <Item key={r.c.id} r={r} />)}</ul>
          </Panel>
        )}
      </div>
    </>
  );
}

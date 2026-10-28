import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { referrals, coupons } from '@/lib/db/schema';
import { requireCustomer } from '@/lib/auth';
import { ensureReferralCode, getReferralSettings } from '@/lib/referrals';
import { formatINR } from '@/lib/money';
import { Status } from '@/components/ui/Status';
import { CopyButton } from '@/components/CopyButton';

export const metadata = { title: 'Refer a friend' };

export default async function MyReferrals() {
  const c = await requireCustomer('/account/referrals');
  const [code, s, list, rewards] = await Promise.all([
    ensureReferralCode(c.id), getReferralSettings(),
    db.query.referrals.findMany({ where: eq(referrals.referrerId, c.id), orderBy: desc(referrals.createdAt) }),
    db.query.coupons.findMany({ where: and(eq(coupons.ownerCustomerId, c.id)), orderBy: desc(coupons.createdAt) }),
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return (
    <div className="grid gap-6">
      <section className="stage on-dark rounded-[var(--radius-card)] p-6 sm:p-8">
        <h2 className="font-sans text-2xl font-bold">Share DVINE, get {formatINR(s.rewardFlat)} off.</h2>
        <p className="mt-2 text-white/80">Friends get {s.friendPercent}% off their first order (up to {formatINR(s.friendMax)}) with your code. When their order is paid, you get a {formatINR(s.rewardFlat)} code for your next purchase.</p>
        {!s.enabled && <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">The referral programme is paused right now.</p>}
        <div className="mt-6 flex flex-wrap items-center gap-3"><span className="rounded-xl bg-white/10 px-5 py-3 font-sans text-2xl font-bold tracking-wider">{code}</span><CopyButton text={code ?? ''} label="Copy code" /><CopyButton text={`Try DVINE H2O with my code ${code} for ${s.friendPercent}% off: ${site}`} label="Copy message" /></div>
      </section>
      <section className="card p-6">
        <h2 className="font-sans text-lg font-semibold">Your rewards</h2>
        {rewards.length === 0 ? <p className="mt-3 text-muted">No rewards yet.</p> : <ul className="mt-3 divide-y divide-line">{rewards.map(r => <li key={r.id} className="flex flex-wrap justify-between gap-2 py-3 font-sans"><span><b>{r.code}</b> · {formatINR(r.value)} off{r.endsAt ? ` · use by ${r.endsAt.toLocaleDateString('en-IN')}` : ''}</span><Status value={!r.active ? 'void' : r.usedCount >= (r.usageLimit ?? 1) ? 'completed' : 'active'} label={!r.active ? 'Void' : r.usedCount >= (r.usageLimit ?? 1) ? 'Used' : 'Available'} /></li>)}</ul>}
      </section>
      <section className="card p-6"><h2 className="font-sans text-lg font-semibold">Friends who ordered</h2><p className="mt-2 font-sans text-3xl font-bold">{list.filter(r => r.status !== 'void').length}</p></section>
    </div>
  );
}

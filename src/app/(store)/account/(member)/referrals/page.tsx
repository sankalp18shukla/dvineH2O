import Link from 'next/link';
import { requireCustomer } from '@/lib/auth';
import { referralCodeIfBought, friendOfferText, referralSummary } from '@/lib/referrals';
import { formatINR } from '@/lib/money';
import { links } from '@/lib/notify';
import { Status } from '@/components/ui/Status';
import { CopyButton } from '@/components/CopyButton';
import { ReferralShare } from '@/components/store/ReferralShare';

export const metadata = { title: 'Refer a friend' };

const day = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

export default async function MyReferrals() {
  const c = await requireCustomer('/account/referrals');
  const [code, { settings: s, rows, rewards }] = await Promise.all([referralCodeIfBought(c.id), referralSummary(c.id)]);
  const now = new Date();
  const rewardState = (r: typeof rewards[number]) =>
    !r.active ? { tone: 'void', label: 'Cancelled' }
    : r.usedCount >= (r.usageLimit ?? 1) ? { tone: 'completed', label: 'Used' }
    : r.endsAt && r.endsAt < now ? { tone: 'expired', label: 'Expired' }
    : { tone: 'active', label: 'Ready to use' };
  const ready = rewards.filter(r => rewardState(r).label === 'Ready to use');
  const waiting = rows.filter(r => r.status === 'pending' || r.status === 'qualified');
  const earned = rows.filter(r => r.status === 'rewarded').length;
  const stepLabel = (r: typeof rows[number]) =>
    r.status === 'pending' ? 'Ordered. Your reward follows delivery.'
    : r.status === 'qualified' ? (r.dueAt ? `Delivered. Your reward arrives ${day(r.dueAt)}.` : 'Delivered. Your reward is on its way.')
    : r.status === 'rewarded' ? `Reward sent${r.rewardCode ? `: ${r.rewardCode}` : ''}`
    : 'Order cancelled or returned, so no reward.';
  const message = `I use DVINE H2O and think you’ll like it. Use my code ${code} for ${s.friendPercent}% off your first order:`;

  return (
    <div className="grid gap-6">
      <section className="stage on-dark overflow-hidden rounded-[var(--radius-card)] p-6 sm:p-8">
        <p className="eyebrow">Refer a friend</p>
        <h2 className="mt-4 max-w-xl font-sans text-2xl leading-tight font-bold sm:text-[28px]">Give {s.friendPercent}% off. Get {formatINR(s.rewardFlat)} back.</h2>
        <p className="mt-3 max-w-xl text-white/80">Friends get {friendOfferText(s)}. When their order has been delivered{s.holdDays ? ` and kept for ${s.holdDays} days` : ''}, we send you a {formatINR(s.rewardFlat)} code for your next DVINE purchase.</p>
        {!s.enabled ? <p className="mt-6 rounded-xl bg-white/10 px-4 py-3 font-sans text-sm">The referral programme is paused right now. Rewards you have already earned still work.</p>
          : code ? <div className="mt-7"><ReferralShare code={code} link={links.referralShare(code)} message={message} /></div>
          : <p className="mt-6 rounded-xl bg-white/10 px-4 py-3 font-sans text-sm">Your referral code is created after your first purchase, and appears here once your payment is confirmed. <Link href="/hydrogen-bottles" className="underline">Shop Hyper</Link> or <Link href="/home-water-systems" className="underline">Crystal</Link>.</p>}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="font-sans text-sm text-muted">Friends who ordered</p><p className="mt-1 font-sans text-3xl font-bold">{rows.filter(r => r.status !== 'void').length}</p></div>
        <div className="card p-5"><p className="font-sans text-sm text-muted">Rewards on the way</p><p className="mt-1 font-sans text-3xl font-bold">{waiting.length}</p></div>
        <div className="card p-5"><p className="font-sans text-sm text-muted">Earned so far</p><p className="mt-1 font-sans text-3xl font-bold">{formatINR(earned * s.rewardFlat)}</p></div>
      </div>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-sans text-lg font-semibold">Your rewards</h2>{ready.length > 0 && <Link href="/cart" className="btn btn-outline btn-sm">Go to cart</Link>}</div>
        {rewards.length === 0 ? <p className="mt-3 text-muted">No rewards yet. They appear here, and on WhatsApp, once a friend’s order has been delivered.</p> : (
          <ul className="mt-3 divide-y divide-line">{rewards.map(r => {
            const st = rewardState(r);
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 font-sans">
                <span><b className="tracking-wide">{r.code}</b> · {formatINR(r.value)} off{r.minOrder ? ` orders of ${formatINR(r.minOrder)}+` : ''}<span className="block text-sm text-muted">{r.endsAt ? `${st.label === 'Expired' ? 'Expired' : 'Use by'} ${day(r.endsAt)}` : ''}{st.label === 'Ready to use' ? ' · enter it in your cart while signed in' : ''}</span></span>
                <span className="flex items-center gap-2">{st.label === 'Ready to use' && <CopyButton text={r.code} label="Copy code" />}<Status value={st.tone} label={st.label} /></span>
              </li>
            );
          })}</ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-sans text-lg font-semibold">Friends you referred</h2>
        {rows.length === 0 ? <p className="mt-3 text-muted">When a friend orders with your code, you’ll see it here and we’ll message you.</p> : (
          <ul className="mt-3 divide-y divide-line">{rows.map(r => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 font-sans">
              <span><b>{r.friend}</b><span className="block text-sm text-muted">{day(r.at)} · saved {formatINR(r.saved)}</span></span>
              <span className="text-sm">{stepLabel(r)}</span>
            </li>
          ))}</ul>
        )}
      </section>

      <section className="card p-6 font-sans text-sm text-muted">
        <h2 className="text-base font-semibold text-ink">How it works</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-3">
          <li><b className="text-ink">1. Share</b> your code or link with friends and family.</li>
          <li><b className="text-ink">2. They save</b> {s.friendPercent}% on their first DVINE order with it.</li>
          <li><b className="text-ink">3. You get {formatINR(s.rewardFlat)}</b> off your next order once theirs is delivered{s.holdDays ? ` and kept ${s.holdDays} days` : ''}.</li>
        </ol>
        <p className="mt-4">Codes work on Crystal and Hyper bought on this website, for a friend’s first order only, and not on your own orders. A reward is cancelled if the friend’s order is cancelled or returned.{s.maxRewards ? ` You can earn up to ${s.maxRewards} rewards.` : ''} Rewards are valid for {s.rewardValidDays} days.</p>
      </section>
    </div>
  );
}

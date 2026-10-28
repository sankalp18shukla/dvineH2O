import Image from 'next/image';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reviews } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { PageHead, Panel, Empty, day } from '@/components/admin/ui';
import { AdminForm } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status } from '@/components/ui/Status';
import { moderateReview } from '@/app/actions/admin';

export const metadata = { title: 'Reviews' };

export default async function Reviews({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff('marketing');
  const status = ((await searchParams).status ?? 'pending') as 'pending' | 'approved' | 'rejected';
  const list = await db.query.reviews.findMany({ where: eq(reviews.status, status), orderBy: desc(reviews.createdAt), with: { product: true, customer: true } });
  return (
    <>
      <PageHead title="Reviews" sub="Verified-purchase reviews appear on product pages once approved." />
      <div className="mb-4 flex gap-2 font-sans text-sm">{(['pending', 'approved', 'rejected'] as const).map(s => <Link key={s} href={`/admin/reviews?status=${s}`} className={`rounded-full px-4 py-2 ${status === s ? 'bg-ink font-semibold text-white' : 'bg-white'}`}>{s[0].toUpperCase() + s.slice(1)}</Link>)}</div>
      {list.length === 0 ? <Panel><Empty>Nothing here.</Empty></Panel> : (
        <div className="grid gap-4 lg:grid-cols-2">{list.map(r => (
          <Panel key={r.id} title={<span className="flex items-center gap-2">{r.product.shortName} · {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} {r.verified && <Status value="approved" label="Verified purchase" />}</span>} actions={<span className="font-sans text-[12px] text-muted">{day(r.createdAt)}</span>}>
            {r.title && <p className="font-sans font-semibold">{r.title}</p>}
            <p className="mt-1 font-sans text-sm">{r.body}</p>
            {!!r.media?.length && <div className="mt-3 flex gap-2">{r.media.map(m => <a key={m} href={m} target="_blank" className="relative block size-20 overflow-hidden rounded-lg"><Image src={m} alt="Review photo" fill sizes="80px" className="object-cover" /></a>)}</div>}
            <p className="mt-3 font-sans text-[13px] text-muted">by <Link href={`/admin/customers/${r.customerId}`} className="link">{r.customer.name}</Link></p>
            <div className="mt-3 flex gap-2">
              {r.status !== 'approved' && <AdminForm action={moderateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="approved" /><SubmitButton className="btn btn-primary btn-sm">Approve</SubmitButton></AdminForm>}
              {r.status !== 'rejected' && <AdminForm action={moderateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="rejected" /><SubmitButton className="btn btn-outline btn-sm">Reject</SubmitButton></AdminForm>}
            </div>
          </Panel>
        ))}</div>
      )}
    </>
  );
}

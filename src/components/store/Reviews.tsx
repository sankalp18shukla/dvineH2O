import Image from 'next/image';
import { getReviews } from '@/lib/catalog';
import { Icon } from '../ui/Icon';
import { Lockup } from '../ui/Brand';

export function Stars({ value, size = 'size-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex text-[#E8A600]" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= Math.round(value) ? '' : 'opacity-25'}><Icon name="star" className={`${size} fill-current`} /></span>)}
    </span>
  );
}

export async function Reviews({ productId, name }: { productId: number; name: string }) {
  const list = await getReviews(productId);
  return (
    <section id="reviews" className="section" aria-labelledby="reviews-title">
      <div className="container-x">
        <Lockup id="reviews-title" title="*What owners* say." tone="glacier" size="md" className="mb-12" />
        {list.length === 0 ? (
          <p className="lede">No reviews of {name} yet. Reviews come from verified buyers after delivery.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.map(r => (
              <article key={r.id} className="border-t-2 border-ink pt-5">
                <div className="flex items-center justify-between"><Stars value={r.rating} />{r.verified && <span className="badge bg-[#DFF5E3] text-[#1B6B2C]">Verified purchase</span>}</div>
                {r.title && <h3 className="mt-3 font-sans text-lg font-semibold">{r.title}</h3>}
                <p className="mt-2 text-muted">{r.body}</p>
                {!!r.media?.length && <div className="mt-3 flex gap-2">{r.media.map(m => <div key={m} className="relative size-16 overflow-hidden rounded-lg"><Image src={m} alt="Photo from the reviewer" fill sizes="64px" className="object-cover" /></div>)}</div>}
                <p className="mt-4 font-sans text-[13px] text-muted">{r.name.split(' ')[0]} · {r.createdAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

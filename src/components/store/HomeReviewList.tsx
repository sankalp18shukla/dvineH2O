'use client';
import { useId, useState } from 'react';
import { Lockup } from '../ui/Brand';
import { Icon } from '../ui/Icon';
import { ReviewSlider } from './ReviewSlider';
import css from './HomeReviews.module.css';

export type HomeReview = { id: string | number; rating: number; body: string; verified: boolean; product: 'crystal' | 'hyper' | 'titan'; who: string; when: string };

const PRODUCTS = [
  { key: 'all', label: 'All', c: 'var(--color-ink)' },
  { key: 'crystal', label: 'Crystal', c: 'var(--color-glacier)' },
  { key: 'hyper', label: 'Hyper', c: 'var(--color-flash)' },
  { key: 'titan', label: 'Titan', c: 'var(--color-voltage)' },
] as const;
const colour = (k: string) => PRODUCTS.find(p => p.key === k)!.c;

function Stars({ value, size = 'size-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex text-[#E8A600]" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= Math.round(value) ? '' : 'opacity-25'}><Icon name="star" className={`${size} fill-current`} /></span>)}
    </span>
  );
}

/**
 * The score with its source, product tabs underlined in each product's colour, and the three-card slider of ruled
 * quote cards: a Garamond quote, the reviewer's first name and city, the product as a square in its colour, the
 * date, and "Verified buyer" where the order matched. A product with no reviews yet keeps its tab and says so.
 */
export function HomeReviewList({ title, reviews, avg, children }: { title: string; reviews: HomeReview[]; avg: number; children?: React.ReactNode }) {
  const [pick, setPick] = useState<(typeof PRODUCTS)[number]['key']>('all');
  const uid = useId();
  const shown = pick === 'all' ? reviews : reviews.filter(r => r.product === pick);
  return (
    <section id="reviews" className="section" aria-labelledby={`${uid}-t`}>
      <div className="container-x">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16" data-reveal>
          <Lockup id={`${uid}-t`} title={title} tone="glacier" />
          <div className={css.score}>
            <span className={css.num}>{avg.toFixed(1)}</span>
            <span className="flex flex-col gap-1.5">
              <span className="font-serif text-[22px] leading-none italic text-deep-current">out of 5</span>
              <Stars value={avg} />
              <span className="font-sans text-[13.5px] text-muted">{reviews.length} reviews from DVINE buyers, collected after delivery</span>
            </span>
          </div>
        </div>

        <div className={css.tabs} role="group" aria-label="Show reviews of">
          {PRODUCTS.map(p => (
            <button key={p.key} type="button" aria-pressed={pick === p.key} onClick={() => setPick(p.key)} className={css.tab} style={{ ['--c' as string]: p.c }}>
              {p.label}<span className={css.count}>{p.key === 'all' ? reviews.length : reviews.filter(r => r.product === p.key).length}</span>
            </button>
          ))}
        </div>

        <div className="mt-10">
          {shown.length === 0
            ? <p className="lede">No reviews of {PRODUCTS.find(p => p.key === pick)!.label} yet.</p>
            : (
              <ReviewSlider key={pick} label={`Reviews${pick === 'all' ? '' : ` of ${PRODUCTS.find(p => p.key === pick)!.label}`}`}>
                {shown.map(r => (
                  <article key={r.id} className={css.card}>
                    <span className={css.quote} aria-hidden="true">“</span>
                    <Stars value={r.rating} />
                    <p className={css.text}>{r.body}</p>
                    <footer className={css.foot}>
                      <span className={css.sq} style={{ ['--c' as string]: colour(r.product) }} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block font-sans text-[15px] font-bold tracking-[-0.01em]">{r.who}</span>
                        <span className="block font-sans text-[13px] text-muted">{PRODUCTS.find(p => p.key === r.product)!.label} · {r.when}</span>
                      </span>
                      {r.verified && <span className={css.verified}><Icon name="check" className="size-3.5" />Verified buyer</span>}
                    </footer>
                  </article>
                ))}
              </ReviewSlider>
            )}
        </div>
        {children}
      </div>
    </section>
  );
}

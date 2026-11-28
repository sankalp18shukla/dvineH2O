import { getHomeReviews } from '@/lib/catalog';
import { DEMO } from './Reviews';
import { HomeReviewList, type HomeReview } from './HomeReviewList';
import { VideoStories } from './VideoStories';
import { Lockup } from '../ui/Brand';

const SLUG: Record<string, HomeReview['product']> = { Crystal: 'crystal', Hyper: 'hyper', Titan: 'titan' };
const words = (t: string, max = 60) => { const w = t.trim().split(/\s+/); return w.length > max ? `${w.slice(0, max).join(' ')}…` : t.trim(); };

/**
 * Homepage reviews (website update brief): a row with the overall rating, count and source, filter chips (All,
 * Crystal, Hyper, Titan) and a three-card slider. Real, approved reviews only, and the block stays off the live
 * site until `minimum` of them exist. The sample set (Reviews.tsx DEMO) fills it on a local dev server, and on the
 * live site only through the shareable preview link `/?preview=reviews` (so the client can see the design); the
 * public homepage never shows it. Once `minimum` real reviews are approved they replace the samples everywhere.
 * The customer video stories show under the cards, and stand alone until the written reviews reach `minimum`,
 * so the section is never empty.
 */
export async function HomeReviews({ title, minimum, preview = false }: { title: string; minimum: number; preview?: boolean }) {
  const rows = await getHomeReviews();
  let list: HomeReview[] = rows.map(r => ({
    id: r.id, rating: r.rating, body: words(r.body), verified: r.verified, product: r.product as HomeReview['product'],
    who: [r.name.split(' ')[0], r.city].filter(Boolean).join(', '),
    when: r.createdAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }),
  }));
  if (list.length < minimum) {
    if (process.env.NODE_ENV === 'production' && !preview) return (
      <section id="reviews" className="section" aria-labelledby="reviews-t">
        <div className="container-x">
          <Lockup id="reviews-t" title={title} tone="glacier" />
          <VideoStories className="mt-12 sm:mt-16" />
        </div>
      </section>
    );
    list = Object.entries(DEMO).flatMap(([name, rs]) => rs.map((r, k) => ({
      id: `${name}-${k}`, rating: r.rating, body: words(r.body), verified: false, product: SLUG[name],
      who: r.who.replace(/ [A-Z]\.,/, ','), when: r.when,
    })));
  }
  const avg = list.reduce((a, r) => a + r.rating, 0) / list.length;
  return <HomeReviewList title={title} reviews={list} avg={avg}><VideoStories className="mt-16 border-t border-line pt-16" /></HomeReviewList>;
}

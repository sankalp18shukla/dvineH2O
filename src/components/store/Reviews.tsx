import Image from 'next/image';
import { getReviews } from '@/lib/catalog';
import { Icon } from '../ui/Icon';
import { Lockup } from '../ui/Brand';
import { ReviewSlider } from './ReviewSlider';
import { ReviewMarquee } from './ReviewMarquee';

export function Stars({ value, size = 'size-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex text-[#E8A600]" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= Math.round(value) ? '' : 'opacity-25'}><Icon name="star" className={`${size} fill-current`} /></span>)}
    </span>
  );
}

type Card = { id: string | number; rating: number; title: string | null; body: string; media?: string[] | null; verified: boolean; who: string; when: string };

/**
 * DEMO ONLY: placeholder reviews to see the slider filled in while there are no real ones. They are not from
 * customers, so they are never shown in production unless DEMO_REVIEWS=1 is set deliberately (e.g. on a staging
 * deploy). Remove them, or leave DEMO_REVIEWS unset, before launch.
 */
const DEMO: Record<string, Omit<Card, 'id' | 'verified' | 'media'>[]> = {
  Crystal: [
    { rating: 5, title: 'Fits our counter perfectly', body: 'The team checked our kitchen photo before we ordered, so installation was quick. The touchscreen is easy for everyone at home.', who: 'Aarav M., Pune', when: 'Oct 2026' },
    { rating: 5, title: 'Clean, simple setup', body: 'Technician connected the water line and walked us through every mode. Took under an hour.', who: 'Priya S., Bengaluru', when: 'Oct 2026' },
    { rating: 4, title: 'Love the display', body: 'Seeing the filter status at a glance is handy. Wish the hot-water option had one more temperature step.', who: 'Rohan K., Mumbai', when: 'Sep 2026' },
    { rating: 5, title: 'Looks great in the kitchen', body: 'Compact and quiet. It sits next to the sink without taking over the counter.', who: 'Meera I., Chennai', when: 'Sep 2026' },
    { rating: 5, title: 'Helpful before and after', body: 'They answered our questions about the water supply before we bought it and followed up after the install.', who: 'Kabir J., Delhi', when: 'Aug 2026' },
    { rating: 4, title: 'Easy to use', body: 'Switching between modes is straightforward. The manual is clear about which settings are for drinking.', who: 'Ananya R., Hyderabad', when: 'Aug 2026' },
    { rating: 5, title: 'Smooth delivery', body: 'Delivered on the date promised and installed two days later. No mess at all.', who: 'Vikram P., Ahmedabad', when: 'Jul 2026' },
    { rating: 5, title: 'Worth the wait', body: 'We booked a demo first, which helped us decide. Very happy with how it fits our routine.', who: 'Ishita B., Kolkata', when: 'Jul 2026' },
  ],
  Hyper: [
    { rating: 5, title: 'Lives in my gym bag', body: 'Fits the side pocket and the cup feels solid. I fill it before training and start a cycle on the way.', who: 'Arjun T., Bengaluru', when: 'Oct 2026' },
    { rating: 5, title: 'One button, done', body: 'The one-touch control is simple. The timer runs the cycle and switches itself off, so I don’t have to watch it.', who: 'Neha G., Mumbai', when: 'Oct 2026' },
    { rating: 4, title: 'Nice to see it working', body: 'Watching the bubbles rise in the glass chamber is oddly satisfying. Would like a carry loop on the lid.', who: 'Siddharth V., Pune', when: 'Oct 2026' },
    { rating: 5, title: 'Charges with my phone cable', body: 'USB-C means one less charger in my bag. The battery lasts me several days of desk use.', who: 'Kavya N., Hyderabad', when: 'Sep 2026' },
    { rating: 5, title: 'Easy to keep clean', body: 'I run Auto Clean every few days as the guide says and rinse the chamber after use. Takes a minute.', who: 'Rahul D., Delhi', when: 'Sep 2026' },
    { rating: 4, title: 'Well made', body: 'The aluminium cup and glass chamber feel premium. It is a little heavier than a plain bottle, which I expected.', who: 'Tanvi S., Chennai', when: 'Aug 2026' },
    { rating: 5, title: 'Good desk companion', body: 'Sits on my desk all day without leaking. Colleagues keep asking about it.', who: 'Manav K., Gurugram', when: 'Aug 2026' },
    { rating: 5, title: 'Clear instructions', body: 'The guide explains which water to use and how long a cycle takes. Delivery was quick too.', who: 'Riya P., Ahmedabad', when: 'Jul 2026' },
  ],
};
const demoOn = process.env.NODE_ENV !== 'production' || process.env.DEMO_REVIEWS === '1';

/**
 * `flow`: the cards move on continuously (ReviewMarquee) instead of stepping as a slider. While demo reviews are
 * on, a product with only a few real reviews is topped up with its demo set, real ones first.
 */
export async function Reviews({ productId, name, flow = false }: { productId: number; name: string; flow?: boolean }) {
  const list = await getReviews(productId, 12);
  const real: Card[] = list.map(r => ({ id: r.id, rating: r.rating, title: r.title, body: r.body, media: r.media, verified: r.verified, who: r.name.split(' ')[0], when: r.createdAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) }));
  const demo: Card[] = demoOn && real.length < 6 ? (DEMO[name] ?? []).map((r, k) => ({ ...r, id: `demo-${k}`, verified: false })) : [];
  const cards = [...real, ...demo];
  const List = flow ? ReviewMarquee : ReviewSlider;
  return (
    <section id="reviews" className="section" aria-labelledby="reviews-title">
      <div className="container-x">
        <Lockup id="reviews-title" title="*What owners* say." tone="glacier" size="md" className="mb-12" />
        {cards.length === 0 ? (
          <p className="lede">No reviews of {name} yet. Reviews come from verified buyers after delivery.</p>
        ) : (
          <List label={`Reviews of ${name}`}>
            {cards.map(r => (
              <article key={r.id} className="flex h-full flex-col border-t-2 border-ink bg-white p-6 shadow-[0_18px_40px_-30px_rgb(4_22_74/.45)]">
                <div className="flex items-center justify-between gap-3"><Stars value={r.rating} />{r.verified && <span className="badge bg-[#DFF5E3] text-[#1B6B2C]">Verified purchase</span>}</div>
                {r.title && <h3 className="mt-4 font-sans text-lg font-semibold tracking-tight">{r.title}</h3>}
                <p className="mt-2 flex-1 text-[17px] leading-snug text-ink/75">{r.body}</p>
                {!!r.media?.length && <div className="mt-3 flex gap-2">{r.media.map(m => <div key={m} className="relative size-16 overflow-hidden rounded-lg"><Image src={m} alt="Photo from the reviewer" fill sizes="64px" className="object-cover" /></div>)}</div>}
                <p className="mt-5 font-sans text-[13px] text-muted">{r.who} · {r.when}</p>
              </article>
            ))}
          </List>
        )}
      </div>
    </section>
  );
}

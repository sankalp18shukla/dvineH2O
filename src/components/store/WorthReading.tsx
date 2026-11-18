import Link from 'next/link';
import { SectionHead } from '../ui/Section';
import { Icon } from '../ui/Icon';
import { categoryLabel, readMinutes, type Post } from '@/lib/blog';
import css from './WorthReading.module.css';

type Tone = 'glacier' | 'flash' | 'volt';

/** The small "Why this price?" button under a product's price. Opens the post that explains what the price covers. */
export function PriceStory({ slug, label = 'Why this price?', className = '' }: { slug: string; label?: string; className?: string }) {
  return (
    <Link href={`/blog/${slug}`} className={`${css.why} ${className}`}>
      <Icon name="info" className="size-4" /><span>{label}</span><Icon name="arrow" className={`${css.whyArrow} size-3.5`} />
    </Link>
  );
}

/**
 * A short strip on a product page: up to three blog posts about that product (its benefits, what its price
 * covers, case studies), as ruled rows, with a way through to the whole blog. Renders nothing without posts.
 */
export function WorthReading({ posts, tone = 'glacier', id = 'reads-title' }: { posts: Post[]; tone?: Tone; id?: string }) {
  if (!posts.length) return null;
  return (
    <section className="section" aria-labelledby={id}>
      <div className="container-x">
        <SectionHead id={id} tone={tone} size="md" title="*Worth reading* before you choose." body="What it does, what the research says and what the price covers. Plainly written, with the limits left in." />
        <ul className={`${css.list} is-${tone}`} data-reveal>
          {posts.map((p, i) => (
            <li key={p.id}>
              <Link href={`/blog/${p.slug}`} className={`${css.row} group`}>
                <span className={css.n} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span className="block font-sans text-[12px] font-semibold tracking-[0.14em] text-muted uppercase">{categoryLabel(p.category)} · {readMinutes(p.body)} min read</span>
                  <span className="mt-1.5 block font-sans text-[21px] leading-[1.15] font-bold tracking-[-0.025em] text-balance sm:text-[26px]">{p.title}</span>
                  <span className="mt-2 line-clamp-2 block max-w-3xl text-[17px] leading-snug text-muted">{p.excerpt}</span>
                </span>
                <span className={css.go} aria-hidden="true"><Icon name="arrow" className="size-4" /></span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8"><Link href="/blog" className="link inline-flex items-center gap-2">All articles <Icon name="arrow" className="size-4" /></Link></p>
      </div>
    </section>
  );
}

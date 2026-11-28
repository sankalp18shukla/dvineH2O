import Image from 'next/image';
import Link from 'next/link';
import { Lockup } from '../ui/Brand';
import { Icon } from '../ui/Icon';
import { Cta } from '../ui/Cta';
import { categoryLabel, postHref, readMinutes, type Post } from '@/lib/blog';
import css from './HomeBlog.module.css';

/**
 * Homepage blog strip, set like a magazine page: the first article large in a pin frame with its topic on a
 * Garamond tag, the next three as ruled rows beside it (photo, topic and read time, title, arrow chip). On wide
 * screens the three rows share out the height of the lead photo exactly, and "All Articles" sits level with the
 * lead's title underneath. All photos are 16:9. Staff choose the four and their order in Admin › Blog ("Featured
 * on the homepage"); with fewer chosen, the newest articles fill in. Phones and tablets stack the rows under the lead.
 */
export function HomeBlog({ title, posts }: { title: string; posts: Post[] }) {
  if (!posts.length) return null;
  const [lead, ...rest] = posts;
  return (
    <section id="blog" className="section" aria-labelledby="home-blog-title">
      <div className="container-x">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 sm:mb-16" data-reveal>
          <Lockup id="home-blog-title" title={title} tone="flash" />
          <p className="lede max-w-md">Plain answers on pH, TDS, testing and choosing a system, with the limits left in.</p>
        </div>
        <div className={css.grid}>
          <Link href={postHref(lead)} className={`${css.lead} group`} data-reveal>
            <span className="pin-frame relative block aspect-video w-full" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
              <span className="absolute inset-0 overflow-hidden">
                {lead.coverImage && <Image src={lead.coverImage} alt={lead.coverAlt ?? ''} fill sizes="(min-width:1024px) 720px, 92vw" className={css.photo} />}
              </span>
            </span>
            <span className={css.leadText}>
              <span className={css.tag}><span className="tag-box no-pins">{categoryLabel(lead.category)}</span></span>
              <span className={css.meta}>{readMinutes(lead.body)} min read</span>
              <span className={css.leadTitle}>{lead.title}</span>
              {lead.excerpt && <span className={css.excerpt}>{lead.excerpt}</span>}
            </span>
          </Link>
          <div>
            <ul className={css.rows} data-rise>
              {rest.map(p => (
                <li key={p.id}>
                  <Link href={postHref(p)} className={`${css.row} group`}>
                    <span className={css.thumb}>
                      {p.coverImage && <Image src={p.coverImage} alt={p.coverAlt ?? ''} fill sizes="(min-width:1024px) 220px, 36vw" className={css.photo} />}
                    </span>
                    <span className="min-w-0">
                      <span className={css.meta}>{categoryLabel(p.category)} · {readMinutes(p.body)} min read</span>
                      <span className={css.rowTitle}>{p.title}</span>
                    </span>
                    <span className={css.go} aria-hidden="true"><Icon name="arrow" className="size-4" /></span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className={css.more} data-reveal><Cta href="/blog" kind="ink">All Articles</Cta></div>
          </div>
        </div>
      </div>
    </section>
  );
}

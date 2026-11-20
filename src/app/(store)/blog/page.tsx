import type { Metadata } from 'next';
import { seo } from '@/lib/seo-keywords';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import { CATEGORIES, categoryLabel, postDate, readMinutes, type Post } from '@/lib/blog';
import { getPublishedPosts } from '@/lib/blog.server';
import css from './blog.module.css';

/** Rendered per request: posts are published from Admin › Blog and should appear at once. */
export const dynamic = 'force-dynamic';

const LEDE = 'What our products do to water, what the research says, what a price covers and how to drink well every day. Written plainly, with the limits left in.';
export const metadata: Metadata = seo('/blog', { title: 'Blog', description: LEDE });

function Meta({ p }: { p: Post }) {
  return <p className="font-sans text-[13px] text-muted">{postDate(p.publishedAt)} · {readMinutes(p.body)} min read</p>;
}

function Card({ p, i }: { p: Post; i: number }) {
  return (
    <Link href={`/blog/${p.slug}`} className={`${css.card} group flex flex-col`} data-reveal style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
      <div className="relative aspect-[4/3] overflow-hidden bg-fog">
        {p.coverImage && <Image src={p.coverImage} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 ease-out group-hover:scale-105" />}
        <span className={`${css.kind} label-box is-blue`}><span className="lb-txt">{categoryLabel(p.category)}</span></span>
      </div>
      <h3 className="mt-5 font-sans text-[23px] leading-[1.12] font-bold tracking-[-0.03em] text-balance">{p.title}</h3>
      <p className="mt-2.5 line-clamp-3 text-[17px] leading-snug text-muted">{p.excerpt}</p>
      <div className="mt-auto flex items-center justify-between pt-4"><Meta p={p} /><span className={css.go} aria-hidden="true"><Icon name="arrow" className="size-4" /></span></div>
    </Link>
  );
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const [all, sp] = await Promise.all([getPublishedPosts(), searchParams]);
  // posts that link out to other sites are no longer shown anywhere
  const ours = all.filter(p => !p.externalUrl);
  const used = CATEGORIES.filter(c => ours.some(p => p.category === c.key));
  const topic = used.find(c => c.key === sp.topic);
  const list = topic ? ours.filter(p => p.category === topic.key) : ours;
  const lead = topic ? null : (ours.find(p => p.featured) ?? ours[0] ?? null);
  const rest = list.filter(p => p.id !== lead?.id);

  return (
    <>
      <Header framed page="blog" />
      <main id="main" data-still-tags>
        <section className="section pb-10 sm:pb-14" aria-labelledby="blog-title">
          <div className="container-x">
            <Lockup id="blog-title" as="h1" title="*Worth knowing* about water." tone="glacier" />
            <p className="mt-10 max-w-2xl font-serif text-[21px] leading-snug text-ink italic sm:text-[24px]">{LEDE}</p>
            {used.length > 1 && (
              <nav aria-label="Topics" className={`${css.topics} mt-9`}>
                <Link href="/blog" scroll={false} className={`pill ${!topic ? css.on : ''}`} aria-current={!topic ? 'page' : undefined}>All</Link>
                {used.map(c => <Link key={c.key} href={`/blog?topic=${c.key}`} scroll={false} className={`pill ${topic?.key === c.key ? css.on : ''}`} aria-current={topic?.key === c.key ? 'page' : undefined}>{c.label}</Link>)}
              </nav>
            )}
            {topic && <p className="mt-5 max-w-2xl font-sans text-[15px] text-muted">{topic.blurb}</p>}
          </div>
        </section>

        {lead && (
          <section className="pb-16 sm:pb-20" aria-label="Featured article">
            <div className="container-x">
              <Link href={`/blog/${lead.slug}`} className="group grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16" data-reveal>
                <div className="pin-frame relative aspect-[16/11]" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
                  <div className="absolute inset-0 overflow-hidden bg-fog">{lead.coverImage && <Image src={lead.coverImage} alt={lead.coverAlt ?? ''} fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-cover transition duration-[1.2s] ease-out group-hover:scale-105" />}</div>
                </div>
                <div>
                  <span className="label-box is-glacier"><span className="pin" aria-hidden="true" /><span className="lb-txt">{categoryLabel(lead.category)}</span><span className="pin-end" aria-hidden="true" /></span>
                  <h2 className="mt-7 font-sans text-[clamp(30px,3.6vw,48px)] leading-[1.02] font-bold tracking-[-0.035em] text-balance">{lead.title}</h2>
                  <p className="lede mt-5">{lead.excerpt}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3"><span className="link inline-flex items-center gap-2">Read the article <Icon name="arrow" className="size-4 transition group-hover:translate-x-1" /></span><Meta p={lead} /></div>
                </div>
              </Link>
            </div>
          </section>
        )}

        <section className="pb-16 sm:pb-24" aria-label={topic ? topic.label : 'All articles'}>
          <div className="container-x">
            {rest.length > 0
              ? <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p, i) => <Card key={p.id} p={p} i={i} />)}</div>
              : !lead && <p className="border-t-2 border-ink pt-6 font-sans text-muted">New articles are on their way. In the meantime, <Link href="/support#contact" className="link">ask us anything</Link>.</p>}
          </div>
        </section>

      </main>
    </>
  );
}

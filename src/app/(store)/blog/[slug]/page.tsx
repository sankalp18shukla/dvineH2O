import type { Metadata } from 'next';
import { PAGE_KEYWORDS, seo } from '@/lib/seo-keywords';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { ActionBar } from '@/components/store/ActionBar';
import { Markdown } from '@/components/ui/Markdown';
import { Cta } from '@/components/ui/Cta';
import { Icon } from '@/components/ui/Icon';
import { POST_PRODUCTS, categoryLabel, postDate, readMinutes } from '@/lib/blog';
import { getPost, getRelated } from '@/lib/blog.server';
import { jsonLd } from '@/lib/seo';
import css from '../blog.module.css';

export const dynamic = 'force-dynamic';
const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return { title: 'Blog' };
  const description = p.seoDescription || p.excerpt;
  return {
    ...seo(`/blog/${p.slug}`, {}, [...(PAGE_KEYWORDS['/blog'] ?? []), p.title]),
    title: p.title, description, alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: 'article', title: p.title, description, publishedTime: p.publishedAt?.toISOString(), images: p.coverImage ? [p.coverImage] : undefined },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPost((await params).slug);
  if (!p) notFound();
  const related = await getRelated(p);
  const product = POST_PRODUCTS.find(x => x.key === p.product);
  const abs = (u: string) => (u.startsWith('/') ? site() + u : u);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.seoDescription || p.excerpt,
    datePublished: p.publishedAt?.toISOString(), dateModified: p.updatedAt.toISOString(), mainEntityOfPage: `${site()}/blog/${p.slug}`,
    author: { '@type': 'Organization', name: p.author }, publisher: { '@type': 'Organization', name: 'DVINE H2O' },
    ...(p.coverImage ? { image: [abs(p.coverImage)] } : {}),
  };
  return (
    <>
      <Header framed page="blog" />
      <main id="main" data-still data-still-tags>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
        <article className="container-x pt-10 pb-16 sm:pt-14 sm:pb-24">
          <header id="post-head" className="mx-auto max-w-[60rem]">
            <Link href="/blog" className={css.back}><Icon name="arrowLeft" className="size-4" />Blog</Link>
            <div className="mt-6"><span className="label-box is-glacier"><span className="pin" aria-hidden="true" /><span className="lb-txt">{categoryLabel(p.category)}</span><span className="pin-end" aria-hidden="true" /></span></div>
            <h1 className={`${css.title} mt-8`}>{p.title}</h1>
            {p.excerpt && <p className="mt-6 max-w-3xl font-serif text-[22px] leading-snug text-ink italic sm:text-[26px]">{p.excerpt}</p>}
            <p className="mt-6 font-sans text-[14px] text-muted">{p.author} · {postDate(p.publishedAt)} · {readMinutes(p.body)} min read</p>
          </header>

          {p.coverImage && (
            <div className="mx-auto mt-10 max-w-[72rem] sm:mt-14">
              <div className="pin-frame relative aspect-[16/9]" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
                <div className="absolute inset-0 overflow-hidden bg-fog"><Image src={p.coverImage} alt={p.coverAlt ?? ''} fill priority sizes="(min-width:1200px) 1150px, 100vw" className="object-cover" /></div>
              </div>
            </div>
          )}

          <div className="mx-auto mt-12 max-w-[44rem] sm:mt-16">
            <Markdown text={p.body} />

            <div className="mt-14 border-t-2 border-ink pt-8">
              {product ? (
                <>
                  <p className="font-sans text-[22px] leading-tight font-bold tracking-[-0.03em]">Ready to look at {product.label}?</p>
                  <div className="cta-row mt-6"><Cta href={product.page} tone={product.tone}>{product.key === 'titan' ? 'Explore Titan' : `See ${product.label}`}</Cta><Cta href={product.key === 'titan' ? '/for-business#enquiry' : `/book-demo?product=${product.key}`} kind="glass">{product.key === 'titan' ? 'Request a Quote' : 'Book a Demo'}</Cta></div>
                </>
              ) : (
                <>
                  <p className="font-sans text-[22px] leading-tight font-bold tracking-[-0.03em]">Curious about your own water?</p>
                  <div className="cta-row mt-6"><Cta href="/water-testing#book">Book a Water Test</Cta><Cta href="/support#ask" kind="glass">Ask Us a Question</Cta></div>
                </>
              )}
            </div>
            <p className={`${css.note} mt-10`}>This article is general information, not medical advice. DVINE H2O products are not intended to diagnose, treat, cure or prevent any disease. If you have a health condition or have been told to limit fluids, follow your doctor’s advice.</p>
          </div>
        </article>

        {related.length > 0 && (
          <section className="border-t border-line pt-14 pb-20 sm:pt-20 sm:pb-28" aria-labelledby="more-title">
            <div className="container-x">
              <div className="mx-auto max-w-[60rem]">
                <h2 id="more-title" className="eyebrow">Keep reading</h2>
                <ul className="mt-5 border-t-2 border-ink">
                  {related.map(r => (
                    <li key={r.id}>
                      <Link href={`/blog/${r.slug}`} className={`${css.next} group`}>
                        <span><span className="block font-sans text-[12px] font-semibold tracking-[0.14em] text-muted uppercase">{categoryLabel(r.category)}</span><span className="mt-1 block font-sans text-[20px] leading-snug font-bold tracking-[-0.02em] sm:text-[23px]">{r.title}</span></span>
                        <span className={css.go} aria-hidden="true"><Icon name="arrow" className="size-4" /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
      <ActionBar watch="post-head" tone={product?.tone ?? 'glacier'} title={product ? product.label : 'DVINE H2O'} sub={product ? (product.key === 'titan' ? 'Priced on quotation' : 'See the product') : 'Free on-site water check'}
        action={product ? { label: product.key === 'titan' ? 'Request a Quote' : `See ${product.label}`, href: product.key === 'titan' ? '/for-business#enquiry' : product.page } : { label: 'Book a Water Test', href: '/water-testing#book' }} />
    </>
  );
}

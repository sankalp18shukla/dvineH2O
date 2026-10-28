import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { ProductHero } from '@/components/store/ProductHero';
import { BuyBox } from '@/components/store/BuyBox';
import { Specs, BoxContents } from '@/components/store/Specs';
import { Reviews } from '@/components/store/Reviews';
import { AddToCart } from '@/components/store/AddToCart';
import { ActionBar } from '@/components/store/ActionBar';
import { SectionHead } from '@/components/ui/Section';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { HYPER } from '@/lib/content';
import { getProduct } from '@/lib/catalog';
import { formatINR } from '@/lib/money';
import { productJsonLd } from '@/lib/seo';
import { Facts, Lockup, Squiggle, Steps } from '@/components/ui/Brand';
import { WaveBand } from '@/components/store/WaveBand';

/** Rendered per request: reads the catalog, which needs a live database. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Hyper hydrogen water bottle', description: HYPER.hero.body, alternates: { canonical: '/hydrogen-bottles' } };

export default async function HyperPage() {
  const p = await getProduct('hyper');
  if (!p) notFound();
  const guide = p.manualUrl ?? '/support/hyper';
  return (
    <>
      <Header framed />
      <main id="main">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p, '/hydrogen-bottles')) }} />

        {/* 01 · Hero: gallery + purchase */}
        <ProductHero title="Meet Hyper. *A hydrogen water bottle to take along.*" tone="flash" sticker="Sip Check." body={HYPER.hero.body} images={p.images ?? HYPER.hero.gallery} alt="Hyper hydrogen water bottle">
          <BuyBox p={p} />
        </ProductHero>

        {/* 02 · Everyday use */}
        <section className="section" aria-labelledby="day-title">
          <div className="container-x">
            <SectionHead id="day-title" tone="flash" title={HYPER.everyday.title} body={HYPER.everyday.body} />
            <div className="grid gap-6 md:grid-cols-3">
              {HYPER.everyday.cards.map((c, i) => (
                <figure key={c.title} className="group relative flex aspect-[4/5] flex-col items-start justify-end overflow-hidden p-6 text-white" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                  <Image src={c.image} alt={`Hyper ${c.title.toLowerCase()}`} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-stage-deep/90 via-stage-deep/15 to-transparent" aria-hidden="true" />
                  <figcaption className="relative"><h3 className="tag-box text-[28px] sm:text-[32px]">{c.title}</h3><p className="mt-4 font-sans text-sm text-white/85">{c.body}</p></figcaption>
                </figure>
              ))}
            </div>
            <div className="mt-12"><a href="#how-it-works" className="btn btn-primary">See How It Works</a></div>
          </div>
        </section>

        {/* 03 · How it works */}
        <section id="how-it-works" className="section" aria-labelledby="how-title">
          <div className="container-x grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <div id="hyper-video" className="pin-frame relative aspect-video scroll-mt-32 bg-stage" style={{ ['--pin' as string]: 'var(--color-flash)' }} data-reveal>
              {p.videoUrl
                ? <video src={p.videoUrl} controls preload="metadata" playsInline className="size-full object-cover" poster="/images/hyper-water.webp" aria-label="How to use Hyper" />
                : <>
                    <Image src="/images/bubbles.webp" alt="Hydrogen micro-bubbles rising in water" fill sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" />
                    <div className="absolute inset-0 grid place-items-center bg-stage-deep/35 text-center text-white">
                      <div className="flex flex-col items-center gap-3"><span className="grid size-16 place-items-center rounded-full bg-white/15 backdrop-blur"><Icon name="play" className="size-7" /></span><p className="rounded-full bg-stage-deep/75 px-4 py-2 font-sans text-sm backdrop-blur">Demonstration video coming soon</p></div>
                    </div>
                  </>}
            </div>
            <div data-reveal>
              <Lockup id="how-title" title={HYPER.how.title} tone="flash" size="md" />
              <Steps className="mt-10" items={HYPER.how.steps.map(s => ({ title: s }))} />
              <div className="mt-8"><a href={p.videoUrl ? '#hyper-video' : guide} className="btn btn-primary"><Icon name="play" className="size-4" /> Watch How to Use Hyper</a></div>
            </div>
          </div>
        </section>

        {/* 04 · Product technology */}
        <section id="technology" className="on-dark section relative overflow-hidden py-28 text-white sm:py-40" aria-labelledby="tech-title">
          <WaveBand />
          <div className="container-x relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div className="pin-frame relative aspect-[16/10]" style={{ ['--pin' as string]: 'var(--color-voltage)' }} data-reveal>
              <Image src="/images/hyper-exploded.webp" alt="Hyper taken apart: cup, glass chamber, electrodes, membrane and control base" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div data-reveal>
              <Lockup id="tech-title" title={HYPER.tech.title} tone="flash" size="md" />
              <p className="lede mt-9">{HYPER.tech.body}</p>
              <Steps className="mt-8 grid-cols-2 gap-y-4" items={HYPER.tech.parts.map(x => ({ title: x }))} />
              <div className="mt-9"><a href="#specs" className="btn btn-volt">View Specifications</a></div>
            </div>
          </div>
        </section>
        <section id="specs" className="section" aria-labelledby="spec-title">
          <div className="container-x"><SectionHead id="spec-title" tone="volt" title="*The* specifications." /><Specs p={p} box={false} /></div>
        </section>

        {/* 05 · Care and box contents */}
        <section id="care" className="surface-glacier section" aria-labelledby="care-title">
          <div className="container-x grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <Lockup id="care-title" title={HYPER.care.title} tone="blue" size="md" />
              <p className="lede mt-9">{HYPER.care.body}</p>
              <Facts cols={3} className="mt-10 text-ink" items={HYPER.care.steps.map((s, i) => ({ title: `0${i + 1} · ${s.title}`, body: <span className="text-ink/75">{s.body}</span> }))} />
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={guide} className="btn btn-primary">Read the Care Guide</a>
                <Link href="/support#contact" className="btn btn-outline">Contact Support</Link>
              </div>
            </div>
            <div className="relative grid gap-12" data-reveal>
              <Squiggle className="pointer-events-none absolute -top-16 -right-10 z-[3] hidden w-48 text-deep-current lg:block" />
              <div className="pin-frame relative aspect-[16/10]" style={{ ['--pin' as string]: 'var(--color-deep-current)' }}><Image src="/images/brand-handover.webp" alt="Hyper handed from one person to another" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /></div>
              <BoxContents p={p} />
            </div>
          </div>
        </section>

        <Reviews productId={p.id} name="Hyper" />

        {/* 06 · Questions and purchase reminder */}
        <section id="faq" className="section" aria-labelledby="faq-title">
          <div className="container-x">
            <SectionHead id="faq-title" tone="glacier" title={HYPER.faq.title} />
            <Faq items={HYPER.faq.items} />
            <div className="mt-12 flex flex-wrap items-center gap-3">
              <AddToCart productId={p.id} max={Math.min(p.available, p.maxPerOrder)} compact buyNow={false} primary />
              <Link href="/support#contact" className="btn btn-outline">Ask a Question</Link>
            </div>
          </div>
        </section>
      </main>
      <ActionBar watch="buy" title="Hyper" sub={`${formatINR(p.price)} · inclusive of GST`} action={p.available > 0 ? { label: 'Add to Cart', productId: p.id } : { label: 'Ask a Question', href: '/support#contact' }} />
    </>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { SmoothScroll } from '@/components/store/SmoothScroll';
import { ProductHero } from '@/components/store/ProductHero';
import { BuyBox } from '@/components/store/BuyBox';
import { Specs, BoxContents } from '@/components/store/Specs';
import { Reviews } from '@/components/store/Reviews';
import { AddToCart } from '@/components/store/AddToCart';
import { ActionBar } from '@/components/store/ActionBar';
import { GrowVideo } from '@/components/store/GrowVideo';
import { SectionHead } from '@/components/ui/Section';
import { Faq } from '@/components/ui/Faq';
import { Cta, Words } from '@/components/ui/Cta';
import { HYPER } from '@/lib/content';
import { getProduct } from '@/lib/catalog';
import { getProductPromos } from '@/lib/site-content.server';
import { PromoCards } from '@/components/store/PromoCards';
import { formatINR } from '@/lib/money';
import { productJsonLd } from '@/lib/seo';
import { Lockup } from '@/components/ui/Brand';
import { FrameTuckSquiggle } from '@/components/store/FrameTuckSquiggle';
import { HyperAssembly } from '@/components/store/HyperAssembly';
import { WaveBand } from '@/components/store/WaveBand';
import { LightUp } from '@/components/store/LightUp';
import { FinishPicker, FinishProvider } from '@/components/store/BottleFinish';
import css from './hyper.module.css';

/** Rendered per request: reads the catalog, which needs a live database, and the dated promotions (?preview=1 shows staff the draft). */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Hyper hydrogen water bottle', description: HYPER.hero.body, alternates: { canonical: '/hydrogen-bottles' } };

export default async function HyperPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const [p, promo] = await Promise.all([getProduct('hyper'), searchParams.then(q => getProductPromos('hyper', q.preview))]);
  if (!p) notFound();
  // optional promotion cards (Admin › Homepage & promotions › Product pages), after the hero or before the questions
  const banner = promo.banner && <PromoCards promo={promo.banner} cards={promo.banner.cards} id="offers-title" tone="flash" wrap="container-x" />;
  const guide = p.manualUrl ?? '/support/hyper';
  return (
    <>
      <Header framed shop ribbon={promo.ribbon} />
      <SmoothScroll />
      <main id="main">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p, '/hydrogen-bottles')) }} />

        {/* 01 · Hero: gallery left, purchase right. Picking a finish repaints the bottle on the stage in place: a wavy
            fill line runs up the metal in the new colour (BottleFinish.tsx); the glass, logo and drops stay the photo's. */}
        <FinishProvider finishes={HYPER.finishes}>
          <ProductHero name="Hyper" title="Hydrogen water bottle" tone="flash" sticker="Sip Check." body={HYPER.hero.body}
            cutout="/images/hyper_product.png" shell="/images/hyper_shell.png" axis={-41} images={p.images ?? HYPER.hero.gallery} alt="Hyper hydrogen water bottle">
            <FinishPicker />
            <BuyBox p={p} tone="flash" offer={promo.offer} />
          </ProductHero>
        </FinishProvider>

        {promo.banner?.placement === 'hero' && banner}

        {/* 02 · Everyday use: three tall photos, staggered, drifting at their own pace */}
        <section className="section overflow-hidden" aria-labelledby="day-title">
          <div className="container-x">
            <SectionHead id="day-title" tone="flash" title={HYPER.everyday.title} body={HYPER.everyday.body} />
            <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
              {HYPER.everyday.cards.map((c, i) => (
                <figure key={c.title} className={`${css.card} relative ${i === 1 ? 'md:mt-24' : i === 2 ? 'md:mt-10' : ''}`} data-speed={['.25', '-.2', '.1'][i]}>
                  <div className="pin-frame relative aspect-[3/4]" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
                    <div className="group absolute inset-0 overflow-hidden">
                      <Image src={c.image} alt={c.alt} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-[1.2s] ease-out group-hover:scale-105" />
                    </div>
                  </div>
                  <figcaption className="relative z-[3] -mt-7 ml-5"><span className={css.tag}><h3 className="tag-box no-pins text-[30px] sm:text-[36px]">{c.title}</h3></span></figcaption>
                </figure>
              ))}
            </div>
            <div className="mt-16" data-rise><Cta href="#how-it-works" tone="flash">See How It Works</Cta></div>
          </div>
        </section>

        {/* 03 · How it works, on the Glacier wave band: its lines gather into the brand pattern's crossing knot, which
            follows the pointer. The film stays beside the three steps, which light up as you read down. */}
        <section id="how-it-works" className={`on-glacier relative overflow-clip text-ink ${css.bandTop}`} aria-labelledby="how-title">
          <WaveBand tone="glacier" interactive knot />
          <div className="container-x relative grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <GrowVideo id="hyper-video" src={p.videoUrl} poster="/images/hyper-water.webp" alt="Hyper filled with water" label="Watch How to Use Hyper" pending="The demonstration film is on its way." />
            </div>
            <div>
              <Lockup id="how-title" title={HYPER.how.title} tone="blue" size="md" />
              <ol className="relative mt-14">
                {HYPER.how.steps.map((s, i) => (
                  <li key={s} className="relative grid grid-cols-[56px_1fr] gap-6 pb-14 last:pb-0 lg:min-h-[28svh] lg:last:min-h-0">
                    {i < HYPER.how.steps.length - 1 && <span className="absolute top-14 bottom-0 left-[27px] w-[2px] bg-ink/15" aria-hidden="true"><span className="block size-full bg-ink" data-draw /></span>}
                    <h3 className="grid size-14 place-items-center rounded-full bg-ink font-serif text-[30px] text-glacier italic ring-8 ring-glacier" data-pop>{i + 1}</h3>
                    <p className="pt-2 font-serif text-[23px] leading-snug italic sm:text-[27px]" data-words><Words text={s} /></p>
                  </li>
                ))}
              </ol>
              <div className="mt-10" data-rise><Cta href="#hyper-video" kind="ink" icon="play">Watch How to Use Hyper</Cta></div>
            </div>
          </div>
        </section>

        {/* 04 · Product technology: Hyper builds itself from its parts as you scroll */}
        <section id="technology" className="relative" aria-labelledby="tech-title">
          <HyperAssembly steps={HYPER.tech.parts} after={<div className="mt-10" data-rise><Cta href="#specs" tone="flash">View Specifications</Cta></div>}>
            <Lockup id="tech-title" title={HYPER.tech.title} tone="flash" size="md" />
            <p className="lede mt-9" data-words><Words text={HYPER.tech.body} /></p>
          </HyperAssembly>
        </section>
        <section id="specs" className="section" aria-labelledby="spec-title">
          <div className="container-x"><SectionHead id="spec-title" tone="volt" title="*Built to these* specifications." /><div data-reveal><Specs p={p} box={false} /></div></div>
        </section>

        {/* 05 · Care and box contents, on a second Glacier wave band with its own knot */}
        <section id="care" className={`on-glacier relative overflow-clip text-ink ${css.glacierCopy} ${css.bandPad}`} aria-labelledby="care-title">
          <WaveBand tone="glacier" interactive knot />
          <div className="container-x relative grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Lockup id="care-title" title={HYPER.care.title} tone="blue" size="md" />
              <p className="lede mt-9" data-words><Words text={HYPER.care.body} /></p>
              <ol className="mt-10 grid gap-4 sm:grid-cols-3" data-rise>
                {HYPER.care.steps.map((s, i) => (
                  <li key={s.title} className={css.care}>
                    <span className={`${css.careN} font-serif text-[40px] leading-none text-deep-current italic`}>{i + 1}</span>
                    <h3 className="mt-3 font-sans text-lg font-bold tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-[16px] leading-snug text-ink/75">{s.body}</p>
                  </li>
                ))}
              </ol>
              <div className="cta-row mt-10" data-rise>
                <Cta href={guide} kind="ink" icon="doc">Read the Care Guide</Cta>
                <Cta href="/support#contact" kind="glass">Contact Support</Cta>
              </div>
            </div>
            <div className="relative grid gap-12">
              <FrameTuckSquiggle className="-top-16 -right-11 z-[3] hidden w-48 text-deep-current lg:block" />
              <div className="pin-frame relative aspect-[16/10]" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
                <div className="absolute inset-0 overflow-hidden"><Image src="/images/brand-hand-bottle.webp" alt="Hyper held in one hand" fill sizes="(min-width:1024px) 50vw, 100vw" className="scale-[1.14] object-cover" data-speed=".3" /></div>
              </div>
              <div data-reveal><BoxContents p={p} /></div>
            </div>
          </div>
        </section>

        <Reviews productId={p.id} name="Hyper" flow />

        {promo.banner?.placement === 'faq' && banner}

        {/* 06 · Questions and purchase reminder */}
        <section id="faq" className="section" aria-labelledby="faq-title">
          <div className="container-x">
            <SectionHead id="faq-title" tone="glacier" title={HYPER.faq.title} />
            <div data-reveal><Faq items={HYPER.faq.items} /></div>
            <div className="cta-row mt-12" data-rise>
              <AddToCart productId={p.id} max={Math.min(p.available, p.maxPerOrder)} compact buyNow={false} primary tone="flash" />
              <Cta href="/support#contact" kind="glass">Ask a Question</Cta>
            </div>
          </div>
        </section>
      </main>
      <ActionBar tone="flash" watch="buy" title="Hyper" badge={promo.offer?.tag ? { text: promo.offer.tag, theme: promo.offer.theme } : undefined} sub={`${formatINR(p.price)} · incl. GST`} action={p.available > 0 ? { label: 'Add to Cart', productId: p.id } : { label: 'Ask a Question', href: '/support#contact' }} />
    </>
  );
}

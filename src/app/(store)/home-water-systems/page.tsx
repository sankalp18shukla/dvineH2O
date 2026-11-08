import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { SmoothScroll } from '@/components/store/SmoothScroll';
import { ProductHero } from '@/components/store/ProductHero';
import { BuyBox } from '@/components/store/BuyBox';
import { Specs, BoxContents } from '@/components/store/Specs';
import { Reviews } from '@/components/store/Reviews';
import { ModeDial } from '@/components/store/ModeDial';
import { GrowVideo } from '@/components/store/GrowVideo';
import { AddToCart } from '@/components/store/AddToCart';
import { ActionBar } from '@/components/store/ActionBar';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { SectionHead } from '@/components/ui/Section';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { Cta, Words } from '@/components/ui/Cta';
import { CRYSTAL } from '@/lib/content';
import { getProduct } from '@/lib/catalog';
import { formatINR } from '@/lib/money';
import { productJsonLd } from '@/lib/seo';
import { Facts, Lockup, Squiggle } from '@/components/ui/Brand';
import { WaveBand } from '@/components/store/WaveBand';
import { LightUp } from '@/components/store/LightUp';
import css from './crystal.module.css';

/** Rendered per request: reads the catalog, which needs a live database. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Crystal home water system', description: CRYSTAL.hero.body, alternates: { canonical: '/home-water-systems' } };

/** Labelled path through Crystal, drawn under the demo film (section 04, "labelled filtration and plate illustration"). */
const FLOW = [
  { icon: 'drop', label: 'Incoming water', body: 'From your kitchen supply' },
  { icon: 'filter', label: 'PureCore filtration', body: 'Multi-stage filtration' },
  { icon: 'plates5', label: 'Five-plate ionisation', body: 'Platinum-coated titanium plates' },
  { icon: 'screen', label: 'Touchscreen', body: 'Mode, pH, ORP and filter status' },
];

/** One feature callout on the Crystal diagram: an animated icon chip, title and line. `n` is its turn to light up. */
function Callout({ c, n, side }: { c: (typeof CRYSTAL.features.cards)[number]; n: number; side: 'l' | 'r' }) {
  return (
    <div className={`${css.callout} relative flex flex-col ${side === 'l' ? 'lg:items-end lg:text-right' : 'lg:items-start'}`} data-light={n} data-rise>
      <span className={css.chip} style={{ ['--d' as string]: `${n * -1.2}s` }}><Icon name={c.icon} className="size-6" strokeWidth={1.4} /></span>
      <h3 className="mt-5 font-sans text-[22px] font-bold tracking-[-0.03em] sm:text-[26px]">{c.title}</h3>
      <p className="mt-2 max-w-[19rem] text-[17px] leading-snug text-ink/75">{c.body}</p>
    </div>
  );
}

export default async function CrystalPage() {
  const p = await getProduct('crystal');
  if (!p) notFound();
  const guide = p.manualUrl ?? '/support/crystal';
  const f = CRYSTAL.features.cards;
  return (
    <>
      <Header framed />
      <SmoothScroll />
      <main id="main">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p, '/home-water-systems')) }} />

        {/* 01 · Hero: gallery left, purchase right */}
        <ProductHero name="Crystal" title="Home water system" tone="glacier" sticker={'Soft Launching\n“My Water Era.”'} body={CRYSTAL.hero.body}
          cutout="/images/crystal_product.png" images={p.images ?? CRYSTAL.hero.gallery} alt="Crystal home water system">
          <BuyBox p={p} tone="glacier" secondary={{ href: '/book-demo?product=crystal', label: 'Book a Demo' }} />
        </ProductHero>

        {/* 02 · Key features: Crystal in the middle, the four details around it, over the Glacier wave band (its edges
            are wave lines that drift with the scroll and part around the pointer, as on the home page's Meet DVINE) */}
        <section id="features" className={`on-glacier relative overflow-clip pt-32 pb-[clamp(200px,22vw,320px)] text-ink sm:pt-44`} aria-labelledby="feat-title">
          <WaveBand tone="glacier" interactive />
          <div className="container-x relative">
            <SectionHead id="feat-title" tone="blue" title={CRYSTAL.features.title} align="center" />
            {/* the four light up one by one with the scroll, row by row: top left, top right, bottom left, bottom right */}
            <LightUp armClass={css.armed} litClass={css.lit} className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(260px,400px)_1fr] lg:gap-[clamp(64px,7vw,128px)]">
              <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-1 lg:gap-20"><Callout c={f[0]} n={0} side="l" /><Callout c={f[1]} n={2} side="l" /></div>
              <div className="relative order-first mx-auto aspect-[4/5] w-full max-w-[400px] lg:order-none" data-speed="-.4">
                <span className={`${css.ring} absolute inset-x-[4%] top-[12%] aspect-square rounded-full`} aria-hidden="true" />
                <span className={`${css.disc} absolute inset-x-[4%] top-[12%] aspect-square rounded-full bg-white/70 shadow-[inset_0_-30px_60px_-30px_rgb(4_22_74/.18)]`} aria-hidden="true" />
                <Squiggle className="pointer-events-none absolute -top-4 -right-10 w-36 text-deep-current" />
                <Image src="/images/crystal_product.png" alt="Crystal, front view" fill sizes="400px" className="object-contain object-bottom drop-shadow-[0_30px_30px_rgb(4_22_74/.3)]" />
              </div>
              <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-1 lg:gap-20"><Callout c={f[2]} n={1} side="r" /><Callout c={f[3]} n={3} side="r" /></div>
            </LightUp>
            <div className="mt-16 flex justify-center" data-rise><Cta href="#specs" kind="ink">See Specifications</Cta></div>
          </div>
        </section>

        {/* 03 · Water modes: a dial that turns with the scroll */}
        <ModeDial overlap title={CRYSTAL.modes.title} items={CRYSTAL.modes.items} note={CRYSTAL.modes.note}>
          <Cta href={guide} tone="glacier" icon="doc">View Operating Guide</Cta>
        </ModeDial>

        {/* 04 · Technology and demonstration: the film opens out with the scroll, the path through the machine draws in under it */}
        <section id="technology" className="section" aria-labelledby="demo-title">
          <div className="container-x">
            <div className="mb-14 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <Lockup id="demo-title" title={CRYSTAL.demo.title} tone="blue" size="md" />
                <p className="lede mt-9 max-w-2xl" data-words><Words text={CRYSTAL.demo.body} /></p>
              </div>
              <div className="cta-row" data-rise>
                <Cta href="#demo" tone="glacier" icon="play">Watch Crystal Demo</Cta>
                <Cta href="/book-demo?product=crystal" kind="glass">Request a Demo</Cta>
              </div>
            </div>
            <GrowVideo id="demo" src={p.videoUrl} poster="/videos/inside-poster.jpg" alt="Inside Crystal: filter cartridges and ionisation chamber" label="Watch Crystal Demo" pending="The demonstration film is on its way. Request a live demo in the meantime." />
            <div className="relative mt-16" role="group" aria-label="How water moves through Crystal">
              <span className="absolute top-6 right-[12%] left-[12%] hidden h-[2px] bg-ink lg:block" data-draw="x" aria-hidden="true" />
              <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4" data-rise>
                {FLOW.map((s, i) => (
                  <li key={s.label} className="flex flex-col items-start lg:items-center lg:text-center">
                    <span className="grid size-12 place-items-center rounded-full bg-glacier text-ink ring-8 ring-paper"><Icon name={s.icon} className="size-6" strokeWidth={1.4} /></span>
                    <p className="mt-5 font-serif text-[18px] italic text-deep-current">0{i + 1}</p>
                    <h3 className="font-sans text-[19px] font-bold tracking-tight">{s.label}</h3>
                    <p className="mt-1 text-muted">{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 05 · Fit, specifications and box contents */}
        <section id="specs" className="section pt-0" aria-labelledby="spec-title">
          <div className="container-x">
            <SectionHead id="spec-title" tone="glacier" title={CRYSTAL.fit.title} body={CRYSTAL.fit.body}>
              <div className="cta-row" data-rise><Cta href="#setup" kind="ink">Check My Setup</Cta></div>
            </SectionHead>
            <div className="grid gap-14 lg:grid-cols-[1fr_1.25fr]">
              <div data-reveal>
                <h3 className="eyebrow mb-4">What your kitchen needs</h3>
                <Facts cols={2} items={CRYSTAL.fit.needs.map(n => ({ title: n.title, body: n.body, icon: <Icon name={n.icon} className="fact-icon" strokeWidth={1.4} /> }))} />
                <BoxContents p={p} className="mt-12" />
              </div>
              <div data-reveal><h3 className="eyebrow mb-4">Specifications</h3><Specs p={p} initial={5} box={false} /></div>
            </div>
            <div id="setup" className="pin-frame relative mt-24 scroll-mt-32" style={{ ['--pin' as string]: 'var(--color-glacier)' }}>
              <div className="relative grid gap-10 bg-white p-6 sm:p-12 lg:grid-cols-[1fr_1.3fr]">
                <div className="flex flex-col">
                  <Lockup title={CRYSTAL.fit.setup.title} tone="glacier" size="sm" />
                  <p className="lede mt-8" data-words><Words text={CRYSTAL.fit.setup.body} /></p>
                  {/* fills the column down to the foot of the form */}
                  <div className="relative mt-10 aspect-[4/5] overflow-hidden lg:aspect-auto lg:min-h-[320px] lg:flex-1" data-reveal>
                    <Image src="/images/crystal_sec.png" alt="Crystal on a kitchen counter beside the window" fill sizes="(min-width:1024px) 38vw, 100vw" className="object-cover object-[50%_35%]" />
                  </div>
                </div>
                <EnquiryForm variant="product" source="/home-water-systems#setup" defaultInterest="crystal" submitLabel="Check My Setup" photos />
              </div>
            </div>
          </div>
        </section>

        {/* 06 · Delivery and care */}
        <section id="delivery" className={`${css.glacierCopy} relative overflow-clip py-32 text-ink sm:py-44`} aria-labelledby="del-title">
          <WaveBand tone="glacier" interactive />
          <div className="container-x relative grid items-start gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div>
              <Lockup id="del-title" title={CRYSTAL.delivery.title} tone="volt" size="md" />
              <p className="lede mt-9" data-words><Words text={CRYSTAL.delivery.body} /></p>
              <div className="mt-8" data-reveal><Faq items={CRYSTAL.delivery.items} single /></div>
              <div className="cta-row mt-9" data-rise>
                <Cta href="#buy" kind="ink" icon="truck">Check Delivery</Cta>
                <Cta href="/policies/warranty" kind="glass">Read Warranty</Cta>
                <Cta href="/support/crystal" kind="glass">Product Care</Cta>
              </div>
            </div>
            <div className="relative lg:sticky lg:top-36">
              <Squiggle className="pointer-events-none absolute -top-14 -right-10 z-[3] hidden w-44 text-deep-current lg:block" />
              <div className="pin-frame relative aspect-[4/5]" style={{ ['--pin' as string]: 'var(--color-flash)' }}><div className="relative size-full overflow-hidden">
                <Image src="/images/crystal.webp" alt="Crystal installed on a kitchen counter" fill sizes="(min-width:1024px) 40vw, 100vw" className="scale-[1.14] object-cover" data-speed=".3" />
              </div></div>
            </div>
          </div>
        </section>

        <Reviews productId={p.id} name="Crystal" />

        {/* 07 · Questions and purchase reminder */}
        <section id="faq" className="section" aria-labelledby="faq-title">
          <div className="container-x">
            <SectionHead id="faq-title" tone="flash" title={CRYSTAL.faq.title} />
            <div data-reveal><Faq items={CRYSTAL.faq.items} /></div>
            <div className="cta-row mt-12" data-rise>
              <AddToCart productId={p.id} max={Math.min(p.available, p.maxPerOrder)} compact buyNow={false} primary tone="glacier" />
              <Cta href="/support#contact" kind="glass">Talk to DVINE</Cta>
            </div>
          </div>
        </section>
      </main>
      <ActionBar watch="buy" title="Crystal" sub={`${formatINR(p.price)} · inclusive of GST`} action={p.available > 0 ? { label: 'Add to Cart', productId: p.id } : { label: 'Talk to DVINE', href: '/support#contact' }} />
    </>
  );
}

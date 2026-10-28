import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { ProductHero } from '@/components/store/ProductHero';
import { BuyBox } from '@/components/store/BuyBox';
import { Specs, BoxContents } from '@/components/store/Specs';
import { Reviews } from '@/components/store/Reviews';
import { ModeExplorer } from '@/components/store/ModeExplorer';
import { AddToCart } from '@/components/store/AddToCart';
import { ActionBar } from '@/components/store/ActionBar';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { SectionHead } from '@/components/ui/Section';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { CRYSTAL } from '@/lib/content';
import { getProduct } from '@/lib/catalog';
import { formatINR } from '@/lib/money';
import { productJsonLd } from '@/lib/seo';
import { Facts, Lockup, Squiggle } from '@/components/ui/Brand';

/** Rendered per request: reads the catalog, which needs a live database. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Crystal home water system', description: CRYSTAL.hero.body, alternates: { canonical: '/home-water-systems' } };

/** Labelled path through Crystal, shown under the demo video (section 04). */
const FLOW = [
  { icon: 'drop', label: 'Incoming water', body: 'From your kitchen supply' },
  { icon: 'filter', label: 'PureCore filtration', body: 'Sediment, nano and post-carbon stages' },
  { icon: 'plates5', label: 'Five-plate ionisation', body: 'Platinum-coated titanium plates' },
  { icon: 'screen', label: 'Touchscreen', body: 'Mode, pH, ORP and filter status' },
];

export default async function CrystalPage() {
  const p = await getProduct('crystal');
  if (!p) notFound();
  const guide = p.manualUrl ?? '/support/crystal';
  return (
    <>
      <Header framed />
      <main id="main">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p, '/home-water-systems')) }} />

        {/* 01 · Hero: gallery + purchase */}
        <ProductHero title="Crystal. *Made for your kitchen.*" tone="glacier" sticker={'Soft Launching\n“My Water Era.”'} body={CRYSTAL.hero.body} images={p.images ?? CRYSTAL.hero.gallery} alt="Crystal home water system">
          <BuyBox p={p} secondary={{ href: '/book-demo?product=crystal', label: 'Book a Demo' }} />
        </ProductHero>

        {/* 02 · Key features */}
        <section id="features" className="surface-glacier section" aria-labelledby="feat-title">
          <div className="container-x">
            <SectionHead id="feat-title" tone="blue" title={CRYSTAL.features.title} />
            <Facts cols={4} className="text-ink" items={CRYSTAL.features.cards.map(c => ({ title: c.title, body: <span className="text-ink/75">{c.body}</span>, icon: <Icon name={c.icon} className="fact-icon" strokeWidth={1.4} /> }))} />
            <div className="mt-12" data-reveal><a href="#specs" className="btn btn-primary">See Specifications</a></div>
          </div>
        </section>

        {/* 03 · Water modes */}
        <ModeExplorer title={CRYSTAL.modes.title} items={CRYSTAL.modes.items} note={CRYSTAL.modes.note}>
          <a href={guide} className="btn btn-glacier">View Operating Guide</a>
        </ModeExplorer>

        {/* 04 · Technology and demonstration */}
        <section id="technology" className="section" aria-labelledby="demo-title">
          <div className="container-x">
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]" data-reveal>
              <div>
                <Lockup id="demo-title" title={CRYSTAL.demo.title} tone="blue" size="md" />
                <p className="lede mt-9 max-w-2xl">{CRYSTAL.demo.body}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#demo" className="btn btn-primary"><Icon name="play" className="size-4" /> Watch Crystal Demo</a>
                <Link href="/book-demo?product=crystal" className="btn btn-outline">Request a Demo</Link>
              </div>
            </div>
            <div id="demo" className="pin-frame relative mt-14 aspect-video scroll-mt-32 bg-stage" data-reveal>
              {p.videoUrl
                ? <video src={p.videoUrl} controls preload="metadata" playsInline className="size-full object-cover" poster="/images/crystal.webp" aria-label="Crystal demonstration video" />
                : <>
                    <Image src="/images/crystal-inside.webp" alt="Inside Crystal: filter cartridges and ionisation chamber" fill sizes="(min-width:1320px) 1240px, 100vw" className="object-cover" />
                    <div className="absolute inset-0 grid place-items-center bg-stage-deep/30">
                      <div className="flex flex-col items-center gap-3 text-center text-white">
                        <span className="grid size-16 place-items-center rounded-full bg-white/15 backdrop-blur"><Icon name="play" className="size-7" /></span>
                        <p className="rounded-full bg-stage-deep/75 px-4 py-2 font-sans text-sm backdrop-blur">The demo video is on its way. <Link href="/book-demo?product=crystal" className="underline">Book a live demo</Link> in the meantime.</p>
                      </div>
                    </div>
                  </>}
            </div>
            <div className="mt-12" aria-label="How water moves through Crystal" role="group" data-reveal>
              <Facts cols={4} items={FLOW.map((f, i) => ({ title: `0${i + 1} · ${f.label}`, body: f.body, icon: <Icon name={f.icon} className="fact-icon" strokeWidth={1.4} /> }))} />
            </div>
          </div>
        </section>

        {/* 05 · Fit, specifications and box contents */}
        <section id="specs" className="section" aria-labelledby="spec-title">
          <div className="container-x">
            <SectionHead id="spec-title" tone="glacier" title={CRYSTAL.fit.title} body={CRYSTAL.fit.body}>
              <div className="flex flex-wrap gap-3"><a href="#setup" className="btn btn-primary">Check My Setup</a><a href="#full-specs" className="btn btn-outline">View Full Specifications</a></div>
            </SectionHead>
            <div className="grid gap-14 lg:grid-cols-[1fr_1.25fr]">
              <div data-reveal>
                <h3 className="eyebrow mb-4">What your kitchen needs</h3>
                <Facts cols={2} items={CRYSTAL.fit.needs.map(n => ({ title: n.title, body: n.body, icon: <Icon name={n.icon} className="fact-icon" strokeWidth={1.4} /> }))} />
                <BoxContents p={p} className="mt-12" />
              </div>
              <div data-reveal><h3 className="eyebrow mb-4">Specifications</h3><Specs p={p} initial={5} box={false} /></div>
            </div>
            <div id="setup" className="pin-frame relative mt-24 scroll-mt-32" style={{ ['--pin' as string]: 'var(--color-glacier)' }} data-reveal>
              <div className="relative grid gap-10 bg-white p-6 sm:p-12 lg:grid-cols-[1fr_1.3fr]">
                <div><Lockup title={CRYSTAL.fit.setup.title} tone="glacier" size="sm" /><p className="lede mt-8">{CRYSTAL.fit.setup.body}</p></div>
                <EnquiryForm variant="product" source="/home-water-systems#setup" defaultInterest="crystal" submitLabel="Check My Setup" photos />
              </div>
            </div>
          </div>
        </section>

        {/* 06 · Delivery and care */}
        <section id="delivery" className="surface-glacier section" aria-labelledby="del-title">
          <div className="container-x grid items-start gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div data-reveal>
              <Lockup id="del-title" title={CRYSTAL.delivery.title} tone="volt" size="md" />
              <p className="lede mt-9">{CRYSTAL.delivery.body}</p>
              <div className="mt-8"><Faq items={CRYSTAL.delivery.items} single /></div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#buy" className="btn btn-primary">Check Delivery</a>
                <Link href="/policies/warranty" className="btn btn-outline">Read Warranty</Link>
                <Link href="/support/crystal" className="btn btn-outline">Product Care</Link>
              </div>
            </div>
            <div className="relative lg:sticky lg:top-36" data-reveal>
              <Squiggle className="pointer-events-none absolute -top-14 -right-10 z-[3] hidden w-44 text-deep-current lg:block" />
              <div className="pin-frame relative aspect-[4/5]" style={{ ['--pin' as string]: 'var(--color-flash)' }}><div className="relative size-full overflow-hidden">
                <Image src="/images/crystal.webp" alt="Crystal installed on a kitchen counter" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
              </div></div>
            </div>
          </div>
        </section>

        <Reviews productId={p.id} name="Crystal" />

        {/* 07 · Questions and purchase reminder */}
        <section id="faq" className="section" aria-labelledby="faq-title">
          <div className="container-x">
            <SectionHead id="faq-title" tone="flash" title={CRYSTAL.faq.title} />
            <Faq items={CRYSTAL.faq.items} />
            <div className="mt-12 flex flex-wrap items-center gap-3">
              <AddToCart productId={p.id} max={Math.min(p.available, p.maxPerOrder)} compact buyNow={false} primary />
              <Link href="/support#contact" className="btn btn-outline">Talk to DVINE</Link>
            </div>
          </div>
        </section>
      </main>
      <ActionBar watch="buy" title="Crystal" sub={`${formatINR(p.price)} · inclusive of GST`} action={p.available > 0 ? { label: 'Add to Cart', productId: p.id } : { label: 'Talk to DVINE', href: '/support#contact' }} />
    </>
  );
}

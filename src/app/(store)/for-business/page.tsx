import type { Metadata } from 'next';
import Image from 'next/image';
import { Header } from '@/components/store/Header';
import { SmoothScroll } from '@/components/store/SmoothScroll';
import { ProductHero } from '@/components/store/ProductHero';
import { Specs } from '@/components/store/Specs';
import { ActionBar } from '@/components/store/ActionBar';
import { WaveBand } from '@/components/store/WaveBand';
import { LightUp } from '@/components/store/LightUp';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { SectionHead } from '@/components/ui/Section';
import { Icon } from '@/components/ui/Icon';
import { Cta, Words } from '@/components/ui/Cta';
import { Lockup } from '@/components/ui/Brand';
import { TuckedSquiggle } from '@/components/store/TuckedSquiggle';
import { FrameTuckSquiggle } from '@/components/store/FrameTuckSquiggle';
import { BUSINESS, SITE } from '@/lib/content';
import { getProduct } from '@/lib/catalog';
import { getProductPromos } from '@/lib/site-content.server';
import { PromoCards } from '@/components/store/PromoCards';
import { OfferTicket } from '@/components/store/OfferTicket';
import { productJsonLd } from '@/lib/seo';
import css from '@/components/store/Bands.module.css';

/** Rendered per request: reads the catalog, which needs a live database. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Titan 111 for business', description: BUSINESS.hero.body, alternates: { canonical: '/for-business' } };

/** One detail on the Titan diagram, as Crystal's key features: an animated icon chip, title and line. `n` is its turn to light up. */
function Callout({ c, n, side }: { c: (typeof BUSINESS.titan.features)[number]; n: number; side: 'l' | 'r' }) {
  return (
    <div className={`${css.callout} relative flex flex-col ${side === 'l' ? 'lg:items-end lg:text-right' : 'lg:items-start'}`} data-light={n} data-rise>
      <span className={css.chip} style={{ ['--d' as string]: `${n * -1.2}s` }}><Icon name={c.icon} className="size-6" strokeWidth={1.4} /></span>
      <h3 className="mt-5 font-sans text-[22px] font-bold tracking-[-0.03em] sm:text-[26px]">{c.title}</h3>
      <p className="mt-2 max-w-[19rem] text-[17px] leading-snug text-ink/75">{c.body}</p>
    </div>
  );
}

export default async function BusinessPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const [titan, promo] = await Promise.all([getProduct('titan'), searchParams.then(q => getProductPromos('titan', q.preview))]);
  // optional promotion cards (Admin › Homepage & promotions › Product pages), after the hero or near the end
  const banner = promo.banner && <PromoCards promo={promo.banner} cards={promo.banner.cards} id="offers-title" tone="volt" wrap="container-x" />;
  const f = BUSINESS.titan.features;
  const tel = `tel:${SITE.phone.replace(/\s/g, '')}`;
  const years = titan && titan.warrantyMonths >= 12 ? `${titan.warrantyMonths / 12}-year` : '5-year';
  return (
    <>
      <Header framed shop ribbon={promo.ribbon} />
      <SmoothScroll />
      <main id="main">
        {titan && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(titan, '/for-business')) }} />}

        {/* 01 · Hero: Titan on its Voltage disc left, the quotation panel right, as the product pages */}
        <ProductHero name="Titan" title="Water for shared spaces" tone="volt" sticker={'Main Character\nHydration.'} body={BUSINESS.hero.body}
          cutout="/images/titan_product.png" images={titan?.images ?? BUSINESS.titan.views.map(v => v.image)} alt="TitanForce 111 floor-standing water system">
          <div id="hero-actions" className="flex scroll-mt-32 flex-col gap-6" data-rise>
            <div className="border-t-2 border-ink pt-5 font-sans">
              <p className="text-[44px] leading-none font-bold tracking-[-0.04em]">Priced on quotation</p>
              <p className="mt-3 text-[13.5px] text-muted">{titan?.quoteNote ?? 'Priced on quotation after a site discussion.'}</p>
            </div>
            {promo.offer && <OfferTicket offer={promo.offer} codeHint="Quote it when you enquire" />}
            <div className="cta-row">
              <Cta href="#enquiry" tone="volt">Request a Quote</Cta>
              <Cta href="/book-demo?product=titan" kind="glass">Book a Demo</Cta>
            </div>
            <ul className="grid gap-2 border-t border-line pt-5 font-sans text-[14px] text-muted sm:grid-cols-3 sm:gap-4">
              <li className="flex items-center gap-2"><Icon name="shield" className="size-4 shrink-0 text-deep-current" /> {years} warranty</li>
              <li className="flex items-center gap-2"><Icon name="wrench" className="size-4 shrink-0 text-deep-current" /> Installed by DVINE</li>
              <li className="flex items-center gap-2"><Icon name="doc" className="size-4 shrink-0 text-deep-current" /> GST invoice</li>
            </ul>
          </div>
        </ProductHero>

        {promo.banner?.placement === 'hero' && banner}

        {/* 02 · Meet Titan: the machine in the middle, its four details around it lighting up one by one, over the
            Glacier wave band, as Crystal's key features */}
        <section id="titan" className="on-glacier relative overflow-clip pt-32 pb-[clamp(200px,22vw,320px)] text-ink sm:pt-44" aria-labelledby="t-title">
          <WaveBand tone="glacier" interactive />
          <div className="container-x relative">
            <SectionHead id="t-title" tone="blue" title="*Meet the eleven-plate* TitanForce 111." align="center" body={<span className="text-ink/75">{BUSINESS.titan.body}</span>} />
            <LightUp armClass={css.armed} litClass={css.lit} className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(260px,400px)_1fr] lg:gap-[clamp(64px,7vw,128px)]">
              <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-1 lg:gap-20"><Callout c={f[0]} n={0} side="l" /><Callout c={f[2]} n={2} side="l" /></div>
              <div className="relative order-first mx-auto aspect-[3/5] w-full max-w-[360px] lg:order-none" data-speed="-.4">
                <span className={`${css.ring} absolute inset-x-[2%] top-[22%] aspect-square rounded-full`} aria-hidden="true" />
                <span className={`${css.disc} absolute z-[1] inset-x-[2%] top-[22%] aspect-square rounded-full shadow-[inset_0_-30px_60px_-30px_rgb(4_22_74/.18)]`} aria-hidden="true" data-tuck-disc />
                <TuckedSquiggle className="top-[20%] -right-12 w-36 text-deep-current" />
                <Image src="/images/titan_product.png" alt="TitanForce 111, front view" fill sizes="360px" data-tuck-product className="z-[3] object-contain object-bottom drop-shadow-[0_30px_30px_rgb(4_22_74/.3)]" />
              </div>
              <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-1 lg:gap-20"><Callout c={f[1]} n={1} side="r" /><Callout c={f[3]} n={3} side="r" /></div>
            </LightUp>
            <div className="mt-16 flex flex-wrap justify-center gap-3" data-rise>
              <Cta href="#specifications" kind="ink">See Specifications</Cta>
              {titan?.brochureUrl && <Cta href={titan.brochureUrl} kind="glass" icon="doc">Download Brochure</Cta>}
            </div>
          </div>
        </section>

        {/* 03 · Business settings: three tall photos, staggered, drifting at their own pace, as Hyper's everyday use */}
        <section className="section overflow-hidden" aria-labelledby="s-title">
          <div className="container-x">
            <SectionHead id="s-title" tone="volt" title={BUSINESS.settings.title} />
            <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
              {BUSINESS.settings.items.map((c, i) => (
                <figure key={c.title} className={`${css.card} relative ${i === 1 ? 'md:mt-24' : i === 2 ? 'md:mt-10' : ''}`} data-speed={['.25', '-.2', '.1'][i]}>
                  <div className="pin-frame relative aspect-[3/4]" style={{ ['--pin' as string]: 'var(--color-voltage)' }}>
                    <div className="group absolute inset-0 overflow-hidden">
                      <Image src={c.image} alt={c.alt} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-[1.2s] ease-out group-hover:scale-105" style={"pos" in c ? { objectPosition: c.pos } : undefined} />
                    </div>
                  </div>
                  <figcaption className="relative z-[3] -mt-7 ml-5">
                    <span className={css.tag}><h3 className="tag-box no-pins text-[30px] sm:text-[36px]">{c.title}</h3></span>
                    <p className="mt-4 max-w-xs text-[17px] leading-snug text-ink/75">{c.body}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="mt-16" data-rise><Cta href="#enquiry" tone="volt">Discuss My Space</Cta></div>
          </div>
        </section>

        {/* 04 · Installation, on the Glacier wave band: the controls photo stays beside four steps that draw down
            with the scroll, as Hyper's how it works */}
        <section id="setup" className={`on-glacier relative overflow-clip text-ink ${css.bandTop} ${css.glacierCopy}`} aria-labelledby="setup-title">
          <WaveBand tone="glacier" interactive knot />
          <div className="container-x relative grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="relative lg:sticky lg:top-32 lg:self-start">
              <FrameTuckSquiggle className="-top-14 -right-10 z-[3] hidden w-44 text-deep-current lg:block" />
              <div className="pin-frame relative aspect-[4/5]" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
                <div className="absolute inset-0 overflow-hidden"><Image src="/images/titan-display.webp" alt="The SmartFlow multi-mode display on TitanForce 111" fill sizes="(min-width:1024px) 45vw, 100vw" className="scale-[1.14] object-cover" data-speed=".3" /></div>
              </div>
            </div>
            <div>
              <Lockup id="setup-title" title={BUSINESS.setup.title} tone="blue" size="md" />
              <p className="lede mt-9" data-words><Words text={BUSINESS.setup.body} /></p>
              <ol className="relative mt-14">
                {BUSINESS.setup.steps.map((s, i) => (
                  <li key={s.title} className="relative grid grid-cols-[56px_1fr] gap-6 pb-12 last:pb-0">
                    {i < BUSINESS.setup.steps.length - 1 && <span className="absolute top-14 bottom-0 left-[27px] w-[2px] bg-ink/15" aria-hidden="true"><span className="block size-full bg-ink" data-draw /></span>}
                    <span className="grid size-14 place-items-center rounded-full bg-ink font-serif text-[30px] text-glacier italic ring-8 ring-glacier" data-pop>{i + 1}</span>
                    <div className="pt-2">
                      <h3 className="font-sans text-[22px] font-bold tracking-[-0.03em]">{s.title}</h3>
                      <p className="mt-1 font-serif text-[20px] leading-snug italic text-ink/80" data-words><Words text={s.body} /></p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-10" data-rise><Cta href="#enquiry" kind="ink">Send Site Details</Cta></div>
            </div>
          </div>
        </section>

        {/* 05 · Business enquiry: the deep wave band laps over the Glacier one above, its lines knot and follow the pointer */}
        <section id="enquiry" className={`on-dark relative overflow-clip text-white ${css.overlap} ${css.bandUnder}`} aria-labelledby="enq-title">
          <WaveBand interactive knot />
          <span className={css.scrim} aria-hidden="true" />
          <div className="container-x relative grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Lockup id="enq-title" title={BUSINESS.enquiry.title} tone="volt" size="md" />
              <p className="lede mt-9" data-words><Words text={BUSINESS.enquiry.body} /></p>
              <LightUp armClass={css.armed} litClass={css.lit} className="mt-9">
                <ol className="grid">
                  {['Number of locations and daily users', 'Your busiest hours', 'Source water at the site', 'When you would like to install'].map((x, i) => (
                    <li key={x} className={css.part} data-light={i}><span className={css.num}>{String(i + 1).padStart(2, '0')}</span>{x}</li>
                  ))}
                </ol>
              </LightUp>
              <p className="mt-8 font-sans text-sm text-white/70">Prefer to talk? Call <a href={tel} className="text-white underline">{SITE.phone}</a></p>
            </div>
            <EnquiryForm variant="consultation" source="/for-business#enquiry" submitLabel="Request My Quote" dark settings={BUSINESS.enquiry.settings} timelines={BUSINESS.enquiry.timelines} photos />
          </div>
        </section>

        {/* 06 · Specifications */}
        {titan && (
          <section id="specifications" className="section" aria-labelledby="spec-title">
            <div className="container-x">
              <SectionHead id="spec-title" tone="glacier" title="*Built to these* specifications." body={titan.quoteNote ?? undefined} />
              <div data-reveal><Specs p={titan} box={false} /></div>
              <div className="cta-row mt-12" data-rise>
                <Cta href="#enquiry" kind="ink">Request a Quote</Cta>
                {titan.brochureUrl && <Cta href={titan.brochureUrl} kind="glass">Download Brochure</Cta>}
              </div>
            </div>
          </section>
        )}

        {/* 07 · Bulk and gifting, on a Glacier wave band with its own knot: the copy and photo left, the form right */}
        <section id="bulk" className={`on-glacier relative overflow-clip text-ink ${css.bandPad} ${css.glacierCopy}`} aria-labelledby="bulk-title">
          <WaveBand tone="glacier" interactive knot />
          <div className="container-x relative grid items-start gap-14 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div>
              <Lockup id="bulk-title" title={BUSINESS.bulk.title} tone="flash" size="md" />
              <p className="lede mt-9" data-words><Words text={BUSINESS.bulk.body} /></p>
              <div className="relative mt-12">
                <FrameTuckSquiggle className="-top-14 -right-9 z-[3] hidden w-40 text-deep-current lg:block" />
                <div className="pin-frame relative aspect-[16/11]" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
                  <div className="absolute inset-0 overflow-hidden"><Image src="/images/collection.webp" alt="Crystal, Titan and Hyper together" fill sizes="(min-width:1024px) 40vw, 100vw" className="scale-[1.14] object-cover" data-speed=".3" /></div>
                </div>
              </div>
            </div>
            <div className="pin-frame relative" style={{ ['--pin' as string]: 'var(--color-deep-current)' }}>
              <div className="bg-white p-6 sm:p-10"><EnquiryForm idPrefix="bulk-" variant="bulk" source="/for-business#bulk" submitLabel="Enquire About Bulk Orders" /></div>
            </div>
          </div>
        </section>

        {promo.banner?.placement === 'faq' && banner}

        {/* 08 · Dealers and distributors: pointed to the partner page, which takes the enquiry */}
        <section id="distributors" className="section" aria-labelledby="dist-title">
          <div className="container-x grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <Lockup id="dist-title" title="*Represent us in* your city." tone="glacier" size="md" />
              <p className="lede mt-9 max-w-2xl" data-words><Words text="Interested in representing DVINE H2O in your city or region? Tell us about your business and territory on the partner page." /></p>
            </div>
            <div className="cta-row" data-rise>
              <Cta href="/become-a-partner" kind="ink">Become a Partner</Cta>
              <Cta href={tel} kind="glass">Call {SITE.phone}</Cta>
            </div>
          </div>
        </section>
      </main>
      <ActionBar tone="volt" watch="hero-actions" title="TitanForce 111" badge={promo.offer?.tag ? { text: promo.offer.tag, theme: promo.offer.theme } : undefined} sub="Priced on quotation" action={{ label: 'Request a Quote', href: '#enquiry' }} />
    </>
  );
}

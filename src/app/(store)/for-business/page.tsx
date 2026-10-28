import type { Metadata } from 'next';
import Image from 'next/image';
import { Header } from '@/components/store/Header';
import { ActionBar } from '@/components/store/ActionBar';
import { WaveBand } from '@/components/store/WaveBand';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { SectionHead } from '@/components/ui/Section';
import { Icon } from '@/components/ui/Icon';
import { BUSINESS } from '@/lib/content';
import { getProduct } from '@/lib/catalog';
import { productJsonLd } from '@/lib/seo';
import { DieCut, Facts, Lockup, Squiggle, Steps } from '@/components/ui/Brand';

/** Rendered per request: reads the catalog, which needs a live database. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Titan 111 for business', description: BUSINESS.hero.body, alternates: { canonical: '/for-business' } };

export default async function BusinessPage() {
  const titan = await getProduct('titan');
  const specs = titan?.specs ?? [];
  return (
    <>
      <Header framed />
      <main id="main">
        {titan && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(titan, '/for-business')) }} />}

        {/* 01 · Hero: inset card, framed like the home cards */}
        <section className="frame-card stage on-dark" aria-labelledby="b-title">
          <div className="wave-lines pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="container-x relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div>
              <Lockup id="b-title" as="h1" title={BUSINESS.hero.title} tone="volt" />
              <p className="lede mt-10 max-w-xl">{BUSINESS.hero.body}</p>
              <div id="hero-actions" className="mt-9 flex flex-wrap gap-3"><a href="#enquiry" className="btn btn-volt">Request a Quote <Icon name="arrow" className="size-4" /></a><a href="#titan" className="btn btn-outline">Explore Titan</a></div>
            </div>
            <div className="relative" style={{ ['--pin' as string]: 'var(--color-voltage)' }}>
              <div className="pin-frame relative aspect-[4/3]"><div className="absolute inset-0 overflow-hidden"><Image src="/images/titan.webp" alt="TitanForce 111 floor-standing water system" fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" /></div></div>
              <DieCut text={'Main Character\nHydration.'} tone="red" className="absolute -bottom-7 -left-3 z-[4] text-[22px] sm:-left-8 sm:text-[28px]" />
            </div>
          </div>
        </section>

        {/* 02 · Titan features */}
        <section id="titan" className="section" aria-labelledby="t-title">
          <div className="container-x">
            <SectionHead id="t-title" tone="volt" title={BUSINESS.titan.title} body={BUSINESS.titan.body} />
            <div className="grid gap-6 md:grid-cols-3">
              {BUSINESS.titan.views.map((v, i) => (
                <figure key={v.title} className="group relative flex aspect-[4/5] flex-col items-start justify-end overflow-hidden bg-stage p-6 text-white" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                  <Image src={v.image} alt={`TitanForce 111, ${v.title.toLowerCase()}`} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-stage-deep/90 via-stage-deep/15 to-transparent" aria-hidden="true" />
                  <figcaption className="relative"><h3 className="tag-box text-[28px] sm:text-[32px]">{v.title}</h3><p className="mt-4 font-sans text-sm text-white/85">{v.body}</p></figcaption>
                </figure>
              ))}
              <div className="surface-blue relative flex aspect-[4/5] flex-col justify-end overflow-hidden p-6" data-reveal style={{ transitionDelay: '180ms' }}>
                <Squiggle className="pointer-events-none absolute -top-10 -right-12 w-48 text-voltage" />
                <Icon name="plates11" className="relative size-14 text-voltage" strokeWidth={1.2} />
                <h3 className="relative mt-6 font-sans text-2xl font-bold">Eleven plates</h3>
                <p className="relative mt-1 text-white/80">Platinum-coated titanium, HydroCore ionisation for higher demand.</p>
              </div>
            </div>
            <div className="mt-12 flex flex-wrap gap-3"><a href="#specifications" className="btn btn-primary">View Specifications</a>{titan?.brochureUrl && <a href={titan.brochureUrl} className="btn btn-outline"><Icon name="doc" className="size-4" /> Download Brochure</a>}</div>
          </div>
        </section>

        {/* 03 · Business settings */}
        <section className="surface-glacier section" aria-labelledby="s-title">
          <div className="container-x">
            <SectionHead id="s-title" tone="blue" title={BUSINESS.settings.title} />
            <Facts cols={3} className="text-ink" items={BUSINESS.settings.items.map((s, i) => ({ title: s.title, body: <span className="text-ink/75">{s.body}</span>, icon: <Icon name={['building', 'bag', 'home'][i]} className="fact-icon" /> }))} />
            <div className="mt-12"><a href="#enquiry" className="btn btn-primary">Discuss My Space</a></div>
          </div>
        </section>

        {/* 04 · Installation and specifications */}
        <section id="specifications" className="section" aria-labelledby="setup-title">
          <div className="container-x grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
            <div data-reveal>
              <Lockup id="setup-title" title={BUSINESS.setup.title} tone="glacier" size="md" />
              <p className="lede mt-9">{BUSINESS.setup.body}</p>
              <Steps className="mt-9" items={['Site assessment', 'Configuration and connections', 'Installation and handover', 'Service arrangements'].map(title => ({ title }))} />
              <div className="mt-9"><a href="#enquiry" className="btn btn-primary">Send Site Details</a></div>
            </div>
            <div data-reveal>
              <h3 className="eyebrow mb-4">TitanForce 111 specifications</h3>
              <dl className="divide-y divide-line border-t-2 border-ink">
                {specs.map(s => <div key={s.label} className="grid grid-cols-[minmax(110px,0.8fr)_1.6fr] gap-4 py-4 pr-2 font-sans text-[15px]"><dt className="text-muted">{s.label}</dt><dd className="font-medium">{s.value}</dd></div>)}
              </dl>
              {titan?.quoteNote && <p className="mt-4 font-sans text-sm text-muted">{titan.quoteNote}</p>}
            </div>
          </div>
        </section>

        {/* 05 · Business enquiry */}
        <section id="enquiry" className="on-dark section relative overflow-hidden py-28 text-white sm:py-40" aria-labelledby="enq-title">
          <WaveBand />
          <div className="container-x relative grid gap-14 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <Lockup id="enq-title" title={BUSINESS.enquiry.title} tone="volt" size="md" />
              <p className="lede mt-9">{BUSINESS.enquiry.body}</p>
              <p className="mt-8 font-sans text-sm text-white/70">Prefer to talk? Call <a href="tel:18002024504" className="text-white underline">1800 202 4504</a></p>
            </div>
            <EnquiryForm variant="consultation" source="/for-business#enquiry" submitLabel="Request My Quote" dark settings={BUSINESS.enquiry.settings} timelines={BUSINESS.enquiry.timelines} photos />
          </div>
        </section>

        {/* 06 · Bulk and gifting */}
        <section id="bulk" className="section" aria-labelledby="bulk-title">
          <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <Lockup id="bulk-title" title={BUSINESS.bulk.title} tone="flash" size="md" />
              <p className="lede mt-9">{BUSINESS.bulk.body}</p>
              <div className="pin-frame relative mt-12 aspect-[16/10]" style={{ ['--pin' as string]: 'var(--color-deep-current)' }}><div className="absolute inset-0 overflow-hidden"><Image src="/images/collection.webp" alt="Crystal, Titan and Hyper together" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" /></div></div>
            </div>
            <EnquiryForm idPrefix="bulk-" variant="bulk" source="/for-business#bulk" submitLabel="Enquire About Bulk Orders" />
          </div>
        </section>

        {/* Dealer / distributor path (brief: channel enquiries into the same CRM): set in a framed Deep Current panel, as the home assistance block */}
        <section id="distributors" className="section" aria-labelledby="dist-title">
          <div className="container-x">
            <div className="pin-frame relative" style={{ ['--pin' as string]: 'var(--color-glacier)' }}>
              <div className="surface-blue relative grid gap-12 overflow-hidden px-6 py-14 sm:px-14 sm:py-16 lg:grid-cols-[1fr_1.4fr]">
                <div>
                  <Lockup id="dist-title" title="*Partner with* DVINE." tone="glacier" size="md" />
                  <p className="mt-9 text-[19px] leading-relaxed text-white/85">Interested in representing DVINE H2O in your city or region? Tell us about your business and territory.</p>
                </div>
                <div className="bg-white p-6 text-ink sm:p-8"><EnquiryForm idPrefix="dist-" variant="distributorship" source="/for-business#distributors" submitLabel="Send Partner Enquiry" /></div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <ActionBar watch="hero-actions" title="TitanForce 111" sub="Priced on quotation" action={{ label: 'Request a Quote', href: '#enquiry' }} />
    </>
  );
}

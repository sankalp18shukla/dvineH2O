import type { Metadata } from 'next';
import Image from 'next/image';
import { Header } from '@/components/store/Header';
import { SmoothScroll } from '@/components/store/SmoothScroll';
import { ActionBar } from '@/components/store/ActionBar';
import { GrowVideo } from '@/components/store/GrowVideo';
import { ReportScan } from '@/components/store/ReportScan';
import { WaterTestForm } from '@/components/forms/WaterTestForm';
import { ReportUploadForm } from '@/components/forms/ReportUploadForm';
import { SectionHead } from '@/components/ui/Section';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { Cta, CtaChip, Words } from '@/components/ui/Cta';
import { WATER_TESTING } from '@/lib/content';
import { formatINR } from '@/lib/money';
import { getTestOptions } from '@/lib/catalog';
import { Lockup, Tape, WaterSticker } from '@/components/ui/Brand';
import { WaveBand } from '@/components/store/WaveBand';

/** Rendered per request: reads the catalog, which needs a live database. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Water testing', description: WATER_TESTING.hero.body, alternates: { canonical: '/water-testing' } };

export default async function WaterTestingPage({ searchParams }: { searchParams: Promise<{ pin?: string }> }) {
  const { pin = '' } = await searchParams;
  const options = await getTestOptions();
  return (
    <>
      <Header framed />
      <SmoothScroll />
      <main id="main">
        {/* 01 · Hero: headline, body and two actions left, sample collection photo (W01) right, in an inset card */}
        <section className="frame-card stage on-dark" aria-labelledby="wt-title">
          <div className="wave-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="container-x relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <div>
              <Lockup id="wt-title" as="h1" title={WATER_TESTING.hero.title} tone="glacier" />
              <p className="mt-10 max-w-xl font-serif text-[21px] leading-snug text-white/90 italic sm:text-[24px]" data-words><Words text={WATER_TESTING.hero.body} /></p>
              <form id="hero-actions" action="/water-testing#book" className="mt-9 flex max-w-xl flex-col gap-3 sm:flex-row" data-rise>
                <label htmlFor="hero-pin" className="sr-only">Enter your postcode</label>
                <div className="relative flex-1">
                  <Icon name="pin" className="absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-white/60" />
                  <input id="hero-pin" name="pin" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="postal-code" placeholder="Enter your postcode" defaultValue={pin} className="input min-h-[52px] rounded-full border-white/25 bg-white/10 pl-11 text-white placeholder:text-white/55" />
                </div>
                <button className="cta cta-pill" style={{ ['--accent' as string]: 'var(--color-glacier)' }}><CtaChip /><span>Book a Water Test</span></button>
              </form>
              <div className="mt-3" data-rise><Cta href="#upload" kind="glass">Upload My Report</Cta></div>
            </div>
            <div className="relative" style={{ ['--pin' as string]: 'var(--color-glacier)' }}>
              <div className="pin-frame relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
                <div className="absolute inset-0 overflow-hidden"><Image src="/images/hands-water.webp" alt="Hands collecting a water sample at a tap" fill priority sizes="(min-width:1024px) 42vw, 100vw" className="scale-[1.12] object-cover" data-speed=".25" /></div>
              </div>
              <span className="absolute -bottom-10 -left-8 z-[4] block w-28 sm:w-36" data-pop><WaterSticker /></span>
            </div>
          </div>
        </section>

        {/* 02 · Availability and test scope */}
        <section id="tests" className="section" aria-labelledby="scope-title">
          <div className="container-x">
            <SectionHead id="scope-title" tone="blue" title={WATER_TESTING.scope.title} body={WATER_TESTING.scope.body} />
            <div className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3" data-rise>
              {options.map((o, i) => (
                <article key={o.id} className="group flex flex-col border-t-2 border-ink pt-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-full bg-glacier text-ink transition duration-500 group-hover:-rotate-12"><Icon name="drop" className="size-6" strokeWidth={1.4} /></span>
                    <span className="font-serif text-[22px] text-deep-current italic">Test 0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-sans text-2xl font-bold tracking-tight">{o.name}</h3>
                  {o.summary && <p className="mt-2 text-muted">{o.summary}</p>}
                  <dl className="mt-5 grid gap-3 border-t border-line pt-5 font-sans text-[14px]">
                    <div><dt className="text-muted">Parameters measured</dt><dd className="mt-1.5 flex flex-wrap gap-1.5">{o.parameters.map(x => <span key={x} className="pill py-0.5 text-[12.5px]">{x}</span>)}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted">Collection method</dt><dd className="text-right font-medium">{o.collectionMethod}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted">Report turnaround</dt><dd className="text-right font-medium">{o.turnaround}</dd></div>
                    <div className="flex items-center justify-between gap-4 border-t border-line pt-3"><dt className="font-semibold text-ink">Total fee</dt><dd className="bg-voltage px-2.5 py-0.5 text-xl font-bold">{o.price ? formatINR(o.price) : 'Free'}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
            <p className="mt-10 max-w-2xl font-sans text-sm text-muted">Each test covers only the parameters it lists. A basic panel does not check for every possible contaminant.</p>
            <div className="mt-8" data-rise><Cta href="#book" kind="ink">Check Availability</Cta></div>
          </div>
        </section>

        {/* 03 · How testing works: explainer film left (W03), four steps right on a line that draws down with the scroll */}
        <section className="surface-glacier section" aria-labelledby="how-title">
          <div className="container-x grid items-start gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="lg:sticky lg:top-32">
              <GrowVideo id="wt-video" poster="/images/water-rings.webp" alt="Rings spreading across still water" label="Watch how testing works" pending="The explainer film is on its way." />
            </div>
            <div>
              <Lockup id="how-title" title={WATER_TESTING.how.title} tone="blue" size="md" />
              <ol className="relative mt-12">
                <span className="absolute top-4 bottom-8 left-[19px] w-[2px] bg-ink/15" aria-hidden="true"><span className="block size-full bg-ink" data-draw /></span>
                {WATER_TESTING.how.steps.map((s, i) => (
                  <li key={s.title} className="relative grid grid-cols-[40px_1fr] gap-5 pb-10 last:pb-0">
                    <span className="grid size-10 place-items-center bg-voltage font-sans text-sm font-bold text-ink ring-8 ring-glacier" data-pop>{String(i + 1).padStart(2, '0')}</span>
                    <div><h3 className="font-sans text-[21px] font-bold tracking-tight">{s.title}</h3><p className="mt-1 text-[17px] text-ink/75" data-words><Words text={s.body} /></p></div>
                  </li>
                ))}
              </ol>
              <div className="mt-10" data-rise><Cta href="#book" kind="ink">Book a Test</Cta></div>
            </div>
          </div>
        </section>

        {/* 04 · Booking form */}
        <section id="book" className="section" aria-labelledby="book-title">
          <div className="container-x">
            <SectionHead id="book-title" tone="glacier" title={WATER_TESTING.booking.title} body={WATER_TESTING.booking.body} />
            <WaterTestForm initialPin={/^\d{6}$/.test(pin) ? pin : ''} options={options.map(o => ({ id: o.id, name: o.name, summary: o.summary, parameters: o.parameters, collectionMethod: o.collectionMethod, turnaround: o.turnaround, price: o.price }))} slots={WATER_TESTING.slots} sources={WATER_TESTING.sources} />
          </div>
        </section>

        {/* 05 · Existing report upload: a redacted sample report (W04) taped beside the copy, the upload form right */}
        <section id="upload" className="surface-glacier section" aria-labelledby="up-title">
          <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.3fr]">
            <div className="relative">
              <Lockup id="up-title" title={WATER_TESTING.upload.title} tone="flash" size="md" />
              <p className="lede mt-9" data-words><Words text={WATER_TESTING.upload.body} /></p>
              <div className="relative mx-auto mt-12 w-[78%] max-w-xs lg:mx-0" data-speed=".35" aria-hidden="true">
                <Tape className="-top-4 left-1/2 -translate-x-1/2 -rotate-3" />
                <div className="-rotate-3 bg-white p-5 shadow-[0_30px_60px_-30px_rgb(4_22_74/.5)]">
                  <div className="flex items-center justify-between border-b border-line pb-3"><span className="h-2.5 w-24 bg-ink/80" /><span className="h-2 w-10 rounded-full bg-glacier" /></div>
                  <div className="mt-3 grid grid-cols-3 gap-2">{[0, 1, 2].map(k => <span key={k} className="h-2 bg-ink/15" />)}</div>
                  <div className="mt-4 grid gap-2.5">{[70, 55, 82, 64, 48].map((w, k) => <div key={k} className="flex items-center gap-3"><span className="h-2 bg-ink/25" style={{ width: `${w * .5}%` }} /><span className="ml-auto h-2 w-10 bg-ink blur-[3px]" /></div>)}</div>
                  <p className="mt-4 font-sans text-[11px] text-muted">Sample report · details redacted</p>
                </div>
              </div>
              <ul className="mt-12 grid gap-3 font-sans text-[15px]" data-rise>
                {['Every page of the report', 'The sample and test date', 'Readable results and units'].map(x => <li key={x} className="flex items-center gap-3"><Icon name="check" className="size-5 text-deep-current" />{x}</li>)}
              </ul>
              <p className="mt-6 flex items-start gap-2 font-sans text-sm text-ink/70"><Icon name="shield" className="mt-0.5 size-4 shrink-0" />Reports are private. Only the DVINE team reviewing your enquiry can open them.</p>
            </div>
            <div className="pin-frame relative self-start" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
              <div className="bg-white p-6 sm:p-10"><ReportUploadForm /></div>
            </div>
          </div>
        </section>

        {/* 06 · Report explanation: the report reads itself, column by column, as you scroll */}
        <section className="on-dark section relative overflow-hidden py-28 text-white sm:py-40" aria-labelledby="ex-title">
          <WaveBand />
          <div className="container-x relative">
            <ReportScan sample={WATER_TESTING.explain.sample}>
              <Lockup id="ex-title" title={WATER_TESTING.explain.title} tone="glacier" size="md" />
              <p className="lede mt-9" data-words><Words text={WATER_TESTING.explain.body} /></p>
              <div className="mt-9" data-rise><Cta href="/support#contact" tone="glacier">Ask About My Report</Cta></div>
            </ReportScan>
          </div>
        </section>

        {/* 07 · Testing questions */}
        <section id="faq" className="section" aria-labelledby="faq-title">
          <div className="container-x">
            <SectionHead id="faq-title" tone="volt" title={WATER_TESTING.faq.title} />
            <div data-reveal><Faq items={WATER_TESTING.faq.items} /></div>
            <div className="cta-row mt-12" data-rise><Cta href="#book" kind="ink">Book a Water Test</Cta><Cta href="/support#contact" kind="glass">Contact the Team</Cta></div>
          </div>
        </section>
      </main>
      <ActionBar watch="hero-actions" title="Water testing" sub="Check availability for your postcode" action={{ label: 'Book a Water Test', href: '#book' }} />
    </>
  );
}

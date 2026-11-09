/* eslint-disable @next/next/no-img-element -- the hero photos are plain prints in FanHero */
import type { Metadata } from 'next';
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
import { Lockup, Squiggle, Tape, WaterSticker } from '@/components/ui/Brand';
import { WaveBand } from '@/components/store/WaveBand';
import { FanHero } from '@/components/store/FanHero';
import css from '@/components/store/Bands.module.css';

/** Rendered per request: reads the catalog, which needs a live database. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Water testing', description: WATER_TESTING.hero.body, alternates: { canonical: '/water-testing' } };

export default async function WaterTestingPage({ searchParams }: { searchParams: Promise<{ pin?: string }> }) {
  const { pin = '' } = await searchParams;
  const options = await getTestOptions();
  const from = options.length ? Math.min(...options.map(o => o.price ?? 0)) : 0;
  return (
    <>
      <Header framed />
      <SmoothScroll />
      <main id="main">
        {/* 01 · Hero: copy and the postcode check left, a hand of three photos right (FanHero) */}
        <FanHero id="wt-title" title={WATER_TESTING.hero.title} tone="glacier" body={WATER_TESTING.hero.body}
          front={<img src="/images/hands-water.webp" alt="Hands collecting a water sample at a tap" />}
          back={[{ src: '/images/2_2ndsec.png', alt: 'A water sample held up in a laboratory' }, { src: '/images/4_2ndsec.png', alt: 'A drop landing on still water' }]}
          sticker={<WaterSticker />}>
          <div className="flex flex-col gap-6" data-rise>
            <form id="hero-actions" action="/water-testing#book" className="flex flex-col gap-3 border-t-2 border-ink pt-6 sm:flex-row">
              <label htmlFor="hero-pin" className="sr-only">Enter your postcode</label>
              <div className="relative flex-1">
                <Icon name="pin" className="absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" />
                <input id="hero-pin" name="pin" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="postal-code" placeholder="Enter your postcode" defaultValue={pin} className="input min-h-[52px] rounded-full pl-11" />
              </div>
              <button className="cta cta-pill" style={{ ['--accent' as string]: 'var(--color-glacier)' }}><CtaChip /><span>Book a Water Test</span></button>
            </form>
            <div><Cta href="#upload" kind="glass">Upload My Report</Cta></div>
            <ul className="grid gap-2 border-t border-line pt-5 font-sans text-[14px] text-muted sm:grid-cols-3 sm:gap-4">
              <li className="flex items-center gap-2"><Icon name="drop" className="size-4 shrink-0 text-deep-current" /> {from === 0 ? 'Essential test free' : `From ${formatINR(from)}`}</li>
              <li className="flex items-center gap-2"><Icon name="calendar" className="size-4 shrink-0 text-deep-current" /> Pick your slot</li>
              <li className="flex items-center gap-2"><Icon name="shield" className="size-4 shrink-0 text-deep-current" /> Private reports</li>
            </ul>
          </div>
        </FanHero>

        {/* 02 · Availability and test scope */}
        <section id="tests" className="section" aria-labelledby="scope-title">
          <div className="container-x">
            <SectionHead id="scope-title" tone="blue" title={WATER_TESTING.scope.title} body={WATER_TESTING.scope.body} />
            <div className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3" data-rise>
              {options.map((o, i) => (
                <article key={o.id} className={`${css.tile} ${css.callout} group flex flex-col`}>
                  <div className="flex items-center justify-between">
                    <span className={`${css.chip} ${css.chipTone}`} style={{ ['--d' as string]: `${i * -1.6}s` }}><Icon name="drop" className="size-6" strokeWidth={1.4} /></span>
                    <span className={`${css.tileN} font-serif text-[26px] text-deep-current italic`}>Test 0{i + 1}</span>
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

        {/* 03 · How testing works, on the Glacier wave band: its lines knot and follow the pointer. The film stays
            beside the four steps, which draw down as you read, as Hyper's how it works */}
        <section className={`on-glacier relative overflow-clip text-ink ${css.bandTop} ${css.glacierCopy}`} aria-labelledby="how-title">
          <WaveBand tone="glacier" interactive knot />
          <div className="container-x relative grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <GrowVideo id="wt-video" poster="/images/water-rings.webp" alt="Rings spreading across still water" label="Watch how testing works" pending="The explainer film is on its way." />
            </div>
            <div>
              <Lockup id="how-title" title={WATER_TESTING.how.title} tone="blue" size="md" />
              <ol className="relative mt-14">
                {WATER_TESTING.how.steps.map((s, i) => (
                  <li key={s.title} className="relative grid grid-cols-[56px_1fr] gap-6 pb-12 last:pb-0 lg:min-h-[22svh] lg:last:min-h-0">
                    {i < WATER_TESTING.how.steps.length - 1 && <span className="absolute top-14 bottom-0 left-[27px] w-[2px] bg-ink/15" aria-hidden="true"><span className="block size-full bg-ink" data-draw /></span>}
                    <span className="grid size-14 place-items-center rounded-full bg-ink font-serif text-[30px] text-glacier italic ring-8 ring-glacier" data-pop>{i + 1}</span>
                    <div className="pt-2">
                      <h3 className="font-sans text-[22px] font-bold tracking-[-0.03em]">{s.title}</h3>
                      <p className="mt-1 font-serif text-[20px] leading-snug italic text-ink/80" data-words><Words text={s.body} /></p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-10" data-rise><Cta href="#book" kind="ink" icon="calendar">Book a Test</Cta></div>
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
        <section id="upload" className={`on-glacier relative overflow-clip text-ink ${css.bandPad} ${css.glacierCopy}`} aria-labelledby="up-title">
          <WaveBand tone="glacier" interactive knot />
          <div className="container-x relative grid gap-14 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div className="relative">
              <Lockup id="up-title" title={WATER_TESTING.upload.title} tone="flash" size="md" />
              <p className="lede mt-9" data-words><Words text={WATER_TESTING.upload.body} /></p>
              <div className="relative mx-auto mt-14 mb-12 w-[78%] max-w-xs lg:mx-0" aria-hidden="true">
                <Tape className="-top-4 left-1/2 -translate-x-1/2 -rotate-3" />
                <div className="-rotate-3 bg-white p-5 shadow-[0_30px_60px_-30px_rgb(4_22_74/.5)]">
                  <div className="flex items-center justify-between border-b border-line pb-3"><span className="h-2.5 w-24 bg-ink/80" /><span className="h-2 w-10 rounded-full bg-glacier" /></div>
                  <div className="mt-3 grid grid-cols-3 gap-2">{[0, 1, 2].map(k => <span key={k} className="h-2 bg-ink/15" />)}</div>
                  <div className="mt-4 grid gap-2.5">{[70, 55, 82, 64, 48].map((w, k) => <div key={k} className="flex items-center gap-3"><span className="h-2 bg-ink/25" style={{ width: `${w * .5}%` }} /><span className="ml-auto h-2 w-10 bg-ink blur-[3px]" /></div>)}</div>
                  <p className="mt-4 font-sans text-[11px] text-muted">Sample report · details redacted</p>
                </div>
              </div>
              <ul className="grid gap-3 font-sans text-[15px]" data-rise>
                {['Every page of the report', 'The sample and test date', 'Readable results and units'].map(x => <li key={x} className="flex items-center gap-3"><Icon name="check" className="size-5 text-deep-current" />{x}</li>)}
              </ul>
              <p className="mt-6 flex items-start gap-2 font-sans text-sm text-ink/70"><Icon name="shield" className="mt-0.5 size-4 shrink-0" />Reports are private. Only the DVINE team reviewing your enquiry can open them.</p>
            </div>
            <div className="relative self-start">
              <Squiggle className="pointer-events-none absolute -top-14 -right-10 z-[3] hidden w-40 text-deep-current lg:block" />
              <div className="pin-frame relative" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
                <div className="bg-white p-6 sm:p-10"><ReportUploadForm /></div>
              </div>
            </div>
          </div>
        </section>

        {/* 06 · Report explanation: the report reads itself, column by column, as you scroll */}
        <section className={`on-dark relative overflow-clip text-white ${css.overlap} ${css.bandUnder}`} aria-labelledby="ex-title">
          <WaveBand interactive knot />
          <span className={css.scrim} aria-hidden="true" />
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

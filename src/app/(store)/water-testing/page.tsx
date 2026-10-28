import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { asc, eq } from 'drizzle-orm';
import { Header } from '@/components/store/Header';
import { ActionBar } from '@/components/store/ActionBar';
import { WaterTestForm } from '@/components/forms/WaterTestForm';
import { ReportUploadForm } from '@/components/forms/ReportUploadForm';
import { SectionHead } from '@/components/ui/Section';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { WATER_TESTING } from '@/lib/content';
import { formatINR } from '@/lib/money';
import { db } from '@/lib/db';
import { testOptions } from '@/lib/db/schema';
import { Lockup, Squiggle, Steps } from '@/components/ui/Brand';
import { WaveBand } from '@/components/store/WaveBand';

export const metadata: Metadata = { title: 'Water testing', description: WATER_TESTING.hero.body, alternates: { canonical: '/water-testing' } };

export default async function WaterTestingPage({ searchParams }: { searchParams: Promise<{ pin?: string }> }) {
  const { pin = '' } = await searchParams;
  const options = await db.query.testOptions.findMany({ where: eq(testOptions.active, true), orderBy: asc(testOptions.sort) });
  const report = WATER_TESTING.explain.sample;
  return (
    <>
      <Header framed />
      <main id="main">
        {/* 01 · Hero */}
        <section className="frame-card stage on-dark" aria-labelledby="wt-title">
          <Image src="/images/water-rings.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-35 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-r from-stage-deep via-stage/80 to-transparent" aria-hidden="true" />
          <div className="container-x relative py-20 sm:py-28">
            <Lockup id="wt-title" as="h1" title={WATER_TESTING.hero.title} tone="glacier" />
            <p className="mt-10 max-w-xl font-serif text-[21px] leading-snug text-white/90 italic sm:text-[24px]">{WATER_TESTING.hero.body}</p>
            <form id="hero-actions" action="/water-testing#book" className="mt-9 flex max-w-xl flex-col gap-3 sm:flex-row">
              <label htmlFor="hero-pin" className="sr-only">Enter your postcode</label>
              <div className="relative flex-1">
                <Icon name="pin" className="absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-white/60" />
                <input id="hero-pin" name="pin" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="postal-code" placeholder="Enter your postcode" defaultValue={pin} className="input border-white/25 bg-white/10 pl-11 text-white placeholder:text-white/55" />
              </div>
              <button className="btn btn-glacier">Book a Water Test</button>
            </form>
            <a href="#upload" className="btn btn-outline mt-3">Upload My Report</a>
          </div>
        </section>

        {/* 02 · Availability and test scope */}
        <section id="tests" className="section" aria-labelledby="scope-title">
          <div className="container-x">
            <SectionHead id="scope-title" tone="blue" title={WATER_TESTING.scope.title} body={WATER_TESTING.scope.body} />
            <div className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {options.map(o => (
                <article key={o.id} className="flex flex-col border-t-2 border-ink pt-6" data-reveal>
                  <Icon name="drop" className="size-7 text-deep-current" strokeWidth={1.4} />
                  <h3 className="mt-4 font-sans text-2xl font-bold tracking-tight">{o.name}</h3>
                  {o.summary && <p className="mt-2 text-muted">{o.summary}</p>}
                  <dl className="mt-5 grid gap-3 border-t border-line pt-5 font-sans text-[14px]">
                    <div><dt className="text-muted">Parameters measured</dt><dd className="mt-1 flex flex-wrap gap-1.5">{o.parameters.map(x => <span key={x} className="pill py-0.5 text-[12.5px]">{x}</span>)}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted">Collection method</dt><dd className="text-right font-medium">{o.collectionMethod}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted">Report turnaround</dt><dd className="text-right font-medium">{o.turnaround}</dd></div>
                    <div className="flex items-center justify-between gap-4 border-t border-line pt-3"><dt className="font-semibold text-ink">Total fee</dt><dd className="bg-voltage px-2.5 py-0.5 text-xl font-bold">{o.price ? formatINR(o.price) : 'Free'}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
            <p className="mt-10 max-w-2xl font-sans text-sm text-muted">Each test covers only the parameters it lists. A basic panel does not check for every possible contaminant.</p>
            <div className="mt-8"><a href="#book" className="btn btn-primary">Check Availability</a></div>
          </div>
        </section>

        {/* 03 · How testing works */}
        <section className="surface-glacier section" aria-labelledby="how-title">
          <div className="container-x grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="pin-frame relative aspect-video bg-stage" style={{ ['--pin' as string]: 'var(--color-deep-current)' }} data-reveal>
              <Image src="/images/hands-water.webp" alt="Hands collecting a water sample" fill sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 grid place-items-center bg-stage-deep/30 text-white">
                <div className="flex flex-col items-center gap-3"><span className="grid size-16 place-items-center rounded-full bg-white/15 backdrop-blur"><Icon name="play" className="size-7" /></span><p className="rounded-full bg-stage-deep/75 px-4 py-2 font-sans text-sm backdrop-blur">Explainer video coming soon</p></div>
              </div>
            </div>
            <div data-reveal>
              <Lockup id="how-title" title={WATER_TESTING.how.title} tone="blue" size="md" />
              <Steps className="mt-10" items={WATER_TESTING.how.steps} />
              <div className="mt-9"><a href="#book" className="btn btn-primary">Book a Test</a></div>
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

        {/* 05 · Existing report upload */}
        <section id="upload" className="section" aria-labelledby="up-title">
          <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.4fr]">
            <div className="relative">
              <Lockup id="up-title" title={WATER_TESTING.upload.title} tone="flash" size="md" />
              <p className="lede mt-9">{WATER_TESTING.upload.body}</p>
              <ul className="mt-8 grid gap-3 font-sans text-[15px]">
                {['Every page of the report', 'The sample and test date', 'Readable results and units'].map(x => <li key={x} className="flex items-center gap-3"><Icon name="check" className="size-5 text-deep-current" />{x}</li>)}
              </ul>
              <p className="mt-6 flex items-start gap-2 font-sans text-sm text-muted"><Icon name="shield" className="mt-0.5 size-4 shrink-0" />Reports are private. Only the DVINE team reviewing your enquiry can open them.</p>
            </div>
            <ReportUploadForm />
          </div>
        </section>

        {/* 06 · Report explanation */}
        <section className="on-dark section relative overflow-hidden py-28 text-white sm:py-40" aria-labelledby="ex-title">
          <WaveBand />
          <div className="container-x relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div data-reveal>
              <Lockup id="ex-title" title={WATER_TESTING.explain.title} tone="glacier" size="md" />
              <p className="lede mt-9">{WATER_TESTING.explain.body}</p>
              <div className="mt-9"><Link href="/support#contact" className="btn btn-volt">Ask About My Report</Link></div>
            </div>
            <div className="relative" data-reveal>
            <Squiggle className="pointer-events-none absolute -top-16 -left-14 hidden w-48 text-voltage lg:block" />
            <figure className="pin-frame relative bg-white p-5 text-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)] sm:p-7" style={{ ['--pin' as string]: 'var(--color-voltage)' }}>
              <div className="flex items-center justify-between border-b border-line pb-4">
                <p className="font-sans text-sm font-semibold">Water test report</p>
                <span className="badge bg-paper text-muted">Anonymised example</span>
              </div>
              <dl className="grid grid-cols-3 gap-3 py-4 font-sans text-[12.5px]">
                {report.meta.map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>)}
              </dl>
              <div className="overflow-x-auto">
                <table className="table text-[13px]">
                  <thead><tr>{report.cols.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
                  <tbody>{report.rows.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i === 2 ? 'font-semibold tracking-widest text-muted' : i === 3 ? 'text-muted' : ''}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <figcaption className="mt-4 font-sans text-[12.5px] text-muted">Read each result with its unit and the reference range printed on your own report.</figcaption>
            </figure>
            </div>
          </div>
        </section>

        {/* 07 · Testing questions */}
        <section id="faq" className="section" aria-labelledby="faq-title">
          <div className="container-x">
            <SectionHead id="faq-title" tone="volt" title={WATER_TESTING.faq.title} />
            <Faq items={WATER_TESTING.faq.items} />
            <div className="mt-12 flex flex-wrap gap-3"><a href="#book" className="btn btn-primary">Book a Water Test</a><Link href="/support#contact" className="btn btn-outline">Contact the Team</Link></div>
          </div>
        </section>
      </main>
      <ActionBar watch="hero-actions" title="Water testing" sub="Check availability for your postcode" action={{ label: 'Book a Water Test', href: '#book' }} />
    </>
  );
}

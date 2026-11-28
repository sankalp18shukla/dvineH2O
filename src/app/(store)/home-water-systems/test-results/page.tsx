import type { Metadata } from 'next';
import Link from 'next/link';
import { PAGE_KEYWORDS, seo } from '@/lib/seo-keywords';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { SectionHead } from '@/components/ui/Section';
import { Cta } from '@/components/ui/Cta';
import { Icon } from '@/components/ui/Icon';
import { REPORT, type Row } from '@/lib/performance-report';

export const metadata: Metadata = seo('/home-water-systems/test-results', {
  title: 'Crystal test results',
  description: 'DVINE R&D’s performance report on Crystal DC-5114: turbidity, TDS, hardness, chlorine, iron, pH by mode, minerals kept, filter life, and four kinds of problem water from Odisha.',
}, PAGE_KEYWORDS['/home-water-systems']);

/** "▼ 92.9%" in green for a reduction, "▲ 20.1%" in blue for a rise. */
const Change = ({ r }: { r: Row }) => (
  <span className={`inline-flex items-center gap-1 font-sans text-[14px] font-bold ${r.down ? 'text-[#1B6B2C]' : 'text-deep-current'}`}>
    <span aria-hidden="true">{r.down ? '▼' : '▲'}</span><span className="sr-only">{r.down ? 'down' : 'up'}</span>{r.change}
  </span>
);

/** Raw against treated, one row per parameter. A table from tablet width; on phones each row stacks. */
function Results({ rows, label }: { rows: Row[]; label: string }) {
  return (
    <table className="w-full border-t-2 border-ink font-sans text-[15px]">
      <caption className="sr-only">{label}</caption>
      <thead className="hidden sm:table-header-group">
        <tr className="border-b border-line text-left text-[13px] text-muted">
          <th scope="col" className="py-3 pr-4 font-medium">Parameter</th><th scope="col" className="py-3 pr-4 font-medium">Before</th>
          <th scope="col" className="py-3 pr-4 font-medium">After Crystal</th><th scope="col" className="py-3 pr-4 font-medium">Change</th>
          <th scope="col" className="py-3 font-medium">IS 10500 limit</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map(r => (
          <tr key={r.label} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 sm:table-row sm:py-0">
            <th scope="row" className="text-left font-semibold sm:py-4 sm:pr-4">{r.label}{r.unit && <span className="ml-1.5 text-[13px] font-normal text-muted">{r.unit}</span>}</th>
            <td className="row-start-2 text-muted sm:py-4 sm:pr-4"><span className="sm:hidden">From </span>{r.before}</td>
            <td className="row-start-2 font-semibold sm:py-4 sm:pr-4"><span className="font-normal text-muted sm:hidden">to </span>{r.after}</td>
            <td className="col-start-2 row-start-1 text-right sm:py-4 sm:pr-4 sm:text-left"><Change r={r} /></td>
            <td className="col-span-2 text-[13px] text-muted sm:col-auto sm:py-4">{r.limit ? <><span className="sm:hidden">IS 10500: </span>{r.limit}</> : <span aria-hidden="true" className="hidden sm:inline">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A heading for a half-width column: the lockup with its line underneath (SectionHead sets them side by side). */
const ColHead = ({ id, title, body }: { id: string; title: string; body: string }) => (
  <div className="mb-10 grid gap-6" data-reveal>
    <Lockup id={id} title={title} tone="glacier" size="md" />
    <p className="lede max-w-[36rem]">{body}</p>
  </div>
);

/** Crystal's performance report as a page: the findings, pH by mode, minerals, stability, filter life and four case studies. */
export default function CrystalTestResultsPage() {
  const meta = [['Report', REPORT.ref], ['Model', REPORT.model], ['Tested', REPORT.tested], ['Tested by', REPORT.lab], ['Compared with', REPORT.standard]];
  return (
    <>
      <Header framed shop page="crystal" />
      <main id="main">
        <section className="section pb-10 sm:pb-14" aria-labelledby="tr-title">
          <div className="container-x">
            <p className="mb-8 font-sans text-[14px]"><Link href="/home-water-systems" className="inline-flex items-center gap-2 text-muted hover:text-ink"><Icon name="arrow" className="size-4 rotate-180" /> Crystal</Link></p>
            <Lockup id="tr-title" as="h1" title="*Crystal, tested* on real water." tone="glacier" size="md" />
            <p className="lede mt-8 max-w-[44rem]">DVINE R&amp;D ran Crystal on tap water and on four kinds of problem water found across Odisha, then compared what went in with what came out of the tap.</p>
            <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-line pt-6 font-sans text-[14px] sm:grid-cols-2 lg:grid-cols-5">
              {meta.map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>)}
            </dl>
          </div>
        </section>

        <section className="section pt-6 sm:pt-10" aria-labelledby="tr-glance">
          <div className="container-x">
            <SectionHead id="tr-glance" tone="glacier" title="*What changed,* at a glance." body="Tap water before and after Crystal, in alkaline mode. Chlorine and iron were measured on a separate challenge batch after 500 litres of use." />
            <Results rows={REPORT.findings} label="Key findings: before and after Crystal" />
          </div>
        </section>

        <section className="section bg-mist" aria-labelledby="tr-ph">
          <div className="container-x">
            <SectionHead id="tr-ph" tone="glacier" title="*Three pH levels,* measured." />
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {REPORT.modes.map(m => (
                <li key={m.mode} className="card p-6 sm:p-8">
                  <p className="font-serif text-[22px] italic text-deep-current">{m.mode}</p>
                  <p className="mt-3 font-sans text-[56px] leading-none font-bold tracking-[-0.04em]">{m.measured}</p>
                  <p className="mt-3 font-sans text-[14px] text-muted">Measured pH · design target {m.target.replace('Up to pH', 'up to')}</p>
                  <p className="mt-4 border-t border-line pt-4 font-sans text-[15px]">{m.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" aria-labelledby="tr-min">
          <div className="container-x grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <ColHead id="tr-min" title="*Minerals,* mostly kept." body="How much of each mineral in the tap water was still there at Crystal’s outlet. The nano filter reduces some calcium and magnesium; the alkaline stage restores buffering." />
              <ul className="grid gap-5">
                {REPORT.minerals.map(m => (
                  <li key={m.label} className="font-sans">
                    <div className="flex justify-between text-[15px]"><span className="font-semibold">{m.label}</span><span>{m.kept}% kept</span></div>
                    <div className="mt-2 h-2.5 bg-mist" aria-hidden="true"><div className="h-full bg-deep-current" style={{ width: `${m.kept}%` }} /></div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ColHead id="tr-stab" title="*How long* it stays alkaline." body="Alk++ water in a sealed glass bottle at about 24–25 °C. pH holds above 8.5 for two days; hydrogen and negative ORP fade sooner, so drink it fresh." />
              <table className="w-full border-t-2 border-ink font-sans text-[15px]">
                <caption className="sr-only">pH, ORP and dissolved hydrogen over 48 hours</caption>
                <thead><tr className="border-b border-line text-left text-[13px] text-muted"><th scope="col" className="py-3 pr-3 font-medium">After</th><th scope="col" className="py-3 pr-3 font-medium">pH</th><th scope="col" className="py-3 pr-3 font-medium">ORP, mV</th><th scope="col" className="py-3 font-medium">H₂, mg/L</th></tr></thead>
                <tbody className="divide-y divide-line">{REPORT.stability.map(s => <tr key={s.at}><th scope="row" className="py-3.5 pr-3 text-left font-semibold">{s.at}</th><td className="py-3.5 pr-3">{s.ph}</td><td className="py-3.5 pr-3">{s.orp}</td><td className="py-3.5">{s.h2}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="section bg-mist" aria-labelledby="tr-life">
          <div className="container-x grid grid-cols-1 gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
            <div>
              <ColHead id="tr-life" title="*6,000 litres* on one filter set." body="Tap water spiked to 350 mg/L TDS and 1.5 mg/L chlorine, run through one filter set. None of the end-of-life marks was reached: flow fell 18.9% against a 40% limit, and chlorine stayed under 0.1 mg/L." />
              <table className="w-full border-t-2 border-ink font-sans text-[15px]">
                <caption className="sr-only">Flow and chlorine against litres treated</caption>
                <thead><tr className="border-b border-line text-left text-[13px] text-muted"><th scope="col" className="py-3 pr-3 font-medium">Litres treated</th><th scope="col" className="py-3 pr-3 font-medium">Flow, L/min</th><th scope="col" className="py-3 font-medium">Chlorine out, mg/L</th></tr></thead>
                <tbody className="divide-y divide-line">{REPORT.endurance.map(e => <tr key={e.litres}><th scope="row" className="py-3.5 pr-3 text-left font-semibold">{e.litres}</th><td className="py-3.5 pr-3">{e.flow}</td><td className="py-3.5">{e.chlorine}</td></tr>)}</tbody>
              </table>
            </div>
            <dl className="grid content-start gap-0 divide-y divide-line self-end border-t-2 border-ink font-sans">
              {REPORT.system.map(s => <div key={s.label} className="py-5"><dt className="text-[14px] text-muted">{s.label}</dt><dd className="mt-1 text-[20px] font-bold tracking-[-0.02em]">{s.value}</dd></div>)}
            </dl>
          </div>
        </section>

        <section className="section" aria-labelledby="tr-cases">
          <div className="container-x">
            <SectionHead id="tr-cases" tone="glacier" title="*Four kinds* of problem water." body="Case studies on water collected in Odisha. Each is one sample, and your water will differ: a water test tells you which of these is yours." />
            <div className="grid grid-cols-1 gap-x-16 gap-y-16 lg:grid-cols-2">
              {REPORT.cases.map(c => (
                <article key={c.key} aria-labelledby={`case-${c.key}`}>
                  <p className="font-serif text-[20px] italic text-deep-current">Case study {c.n}</p>
                  <h3 id={`case-${c.key}`} className="mt-1 font-sans text-[26px] font-bold tracking-[-0.03em]">{c.title}</h3>
                  <p className="mt-1 font-sans text-[14px] text-muted">{c.where}</p>
                  <p className="mt-4 mb-6 max-w-xl text-[17px] leading-snug text-ink/75">{c.problem}</p>
                  <Results rows={c.rows} label={`${c.title}: before and after Crystal`} />
                  <p className="mt-5 flex gap-3 font-sans text-[15px]"><span className="mt-1.5 size-2 shrink-0 bg-deep-current" aria-hidden="true" />{c.read}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section pt-0" aria-labelledby="tr-limits">
          <div className="container-x grid grid-cols-1 gap-12 border-t border-line pt-16 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 id="tr-limits" className="font-sans text-[22px] font-bold tracking-[-0.02em]">Reading these results</h2>
              <ul className="mt-5 grid gap-3">
                {REPORT.limits.map(l => <li key={l} className="flex gap-3 text-[16px] leading-snug text-ink/80"><Icon name="info" className="mt-0.5 size-4 shrink-0 text-deep-current" />{l}</li>)}
              </ul>
            </div>
            <div className="grid content-start gap-4">
              <p className="font-sans text-[15px] text-muted">Find out what is in your own water before you choose.</p>
              <div className="cta-row">
                <Cta href="/water-testing#book" tone="glacier">Book a Water Test</Cta>
                <Cta href="/home-water-systems#buy" kind="glass">Shop Crystal</Cta>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

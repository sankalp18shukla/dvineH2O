'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Squiggle } from '@/components/ui/Brand';

gsap.registerPlugin(ScrollTrigger);

type Sample = { meta: string[][]; cols: string[]; rows: string[][] };
/** What to read on a report, in reading order: the sample details, then each column. */
const STOPS = ['Sample details and test date', 'Parameter tested', 'Unit of measurement', 'Measured result', 'Reference range used'];

/**
 * Water testing 06 · Report explanation. An anonymised report (W05) that reads itself as you scroll: a Glacier
 * highlight moves over the sample details, then down each column in turn (parameter, unit, result, reference
 * range), while the matching line of the legend lights up. Scrubbed straight to the scroll. Reduced motion
 * shows the report and the full legend at rest.
 */
export function ReportScan({ sample, children }: { sample: Sample; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(-1);

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const paper = el.querySelector<HTMLElement>('[data-paper]')!, hl = el.querySelector<HTMLElement>('[data-hl]')!;
      const table = paper.querySelector('table')!;
      // the highlight's box for stop i, relative to the paper: the meta strip, or a whole column of the table
      const box = (i: number) => {
        const p = paper.getBoundingClientRect();
        const r = i === 0 ? paper.querySelector('[data-meta]')!.getBoundingClientRect() : (() => {
          const th = table.querySelectorAll('th')[i - 1].getBoundingClientRect(), t = table.getBoundingClientRect();
          return { left: th.left, top: t.top, width: th.width, height: t.height };
        })();
        return { x: r.left - p.left - 6, y: r.top - p.top - 6, width: r.width + 12, height: r.height + 12 };
      };
      gsap.set(hl, { opacity: 0, ...box(0) });
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } }).to(hl, { opacity: 1, duration: .4 }, 0);
      STOPS.forEach((_, i) => { if (i) tl.to(hl, { x: () => box(i).x, y: () => box(i).y, width: () => box(i).width, height: () => box(i).height, duration: 1 }, '+=.5'); });
      tl.to({}, { duration: .6 });
      const n = STOPS.length;
      ScrollTrigger.create({
        animation: tl, trigger: el, start: 'top 65%', end: 'bottom 35%', scrub: .8, invalidateOnRefresh: true,
        onUpdate: ({ progress }) => setK(progress < .02 ? -1 : Math.min(n - 1, Math.floor(progress * n))),
      });
      return () => setK(-1);
    });
    mm.add('(prefers-reduced-motion: reduce)', () => setK(STOPS.length));
    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className="relative grid items-center gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
      <div>
        {children}
        <ol className="mt-10 grid font-sans" aria-label="What to read on your report">
          {STOPS.map((t, i) => (
            <li key={t} className={`flex items-center gap-4 border-t border-white/15 py-3 text-[15.5px] transition duration-500 ${k === i ? 'text-white' : k > i || k >= STOPS.length ? 'text-white/70' : 'text-white/40'}`}>
              <span className={`grid size-8 shrink-0 place-items-center text-[13px] font-bold transition duration-500 ${k === i ? 'scale-110 bg-glacier text-ink shadow-[0_0_24px_rgb(37_255_232/.6)]' : 'bg-white/10'}`}>{String(i + 1).padStart(2, '0')}</span>{t}
            </li>
          ))}
        </ol>
      </div>
      <div className="relative">
        <Squiggle className="pointer-events-none absolute -top-16 -left-14 hidden w-48 text-voltage lg:block" />
        <figure data-paper className="pin-frame relative bg-white p-5 text-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)] sm:p-8" style={{ ['--pin' as string]: 'var(--color-voltage)' }}>
          <span data-hl className="pointer-events-none absolute top-0 left-0 rounded-lg bg-glacier/30 opacity-0 ring-2 ring-glacier" aria-hidden="true" />
          <div className="relative flex items-center justify-between border-b border-line pb-4">
            <p className="font-sans text-sm font-semibold">Water test report</p>
            <span className="badge bg-paper text-muted">Anonymised example</span>
          </div>
          <dl data-meta className="relative grid grid-cols-3 gap-3 py-4 font-sans text-[12.5px]">
            {sample.meta.map(([a, b]) => <div key={a}><dt className="text-muted">{a}</dt><dd className="mt-0.5 font-medium">{b}</dd></div>)}
          </dl>
          <div className="relative overflow-x-auto">
            <table className="table text-[13px]">
              <thead><tr>{sample.cols.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
              <tbody>{sample.rows.map(r => <tr key={r[0]} className="hover:[&>td]:bg-transparent">{r.map((c, i) => <td key={i} className={i === 2 ? 'font-semibold tracking-widest text-muted' : i === 3 ? 'text-muted' : ''}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <figcaption className="relative mt-4 font-sans text-[12.5px] text-muted">Read each result with its unit and the reference range printed on your own report.</figcaption>
        </figure>
      </div>
    </div>
  );
}

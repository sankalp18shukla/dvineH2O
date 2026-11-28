'use client';
import Image from 'next/image';
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hyper builds itself in the middle of the screen as you scroll, each part named as it arrives:
 * 1 · the control base rises from below; 2 · the electrolysis cell's four parts (sealing ring, threaded collar,
 * platinum-titanium electrodes, membrane plate) rise out of the base and spread apart, each named 01–04 on a leader
 * line from its own edge, hold while they are read, close up into one stack (their labels step aside), then sink
 * back into the base, where 05 control base and 06 battery are named; 3 · the glass chamber with its aluminium sleeve
 * comes down from above, fading in (07); 4 · the cup comes down on top (08). From the product shoot: the cup, chamber
 * and base cut from the Rose exploded photograph, the electrolysis parts from the internal-parts photograph. Desktop
 * holds the section on screen for the build and each label carries its line of copy; phones scrub it as the stage
 * passes, name the parts beside the bottle and list all eight with their copy under it. Reduced motion, or no
 * script, shows the finished bottle with 05–08 and the full list of eight.
 *
 * Geometry is in stage units (the shoot's pixels): the stage is 560 × 1700, every solid part placed at its assembled
 * position.
 */
const W = 560, H = 1700;
type Part = { id: string; x: number; y: number; w: number; h: number; z: number };
const SOLID: Part[] = [
  { id: 'chamber', x: 18, y: 204, w: 528, h: 1102, z: 1 },
  { id: 'base', x: 13, y: 1208, w: 524, h: 481, z: 3 },
  { id: 'cap', x: 15, y: 9, w: 528, h: 286, z: 4 },
];
// The electrolysis chamber, top to bottom, placed spread apart above the base (y); `tight` is each part's y once the
// stack closes up on the base's top. They live in a box clipped at CLIP, behind the base, so whatever has sunk past
// the base's top edge (HIDE) is out of sight: they rise out of it and sink back into it.
type Cell = Part & { tight: number };
const CELLS: Cell[] = [
  { id: 'ring', x: 19, y: 171, w: 505, h: 140, z: 4, tight: 862 },
  { id: 'collar', x: 64, y: 411, w: 411, h: 213, z: 3, tight: 887 },
  { id: 'electrode', x: 122, y: 724, w: 277, h: 154, z: 2, tight: 956 },
  { id: 'plate', x: 89, y: 978, w: 396, h: 172, z: 1, tight: 1050 },
];
const HIDE = 1240, CLIP = 1500;
// where each label's leader line starts: x is the dot, on the part's right edge (the cell's parts are narrower than
// the bottle, so theirs run out to LEAD_X first); y is the part's middle. 01–04 the cell, spread apart; 05 control
// base, 06 battery and USB-C port, 07 glass chamber, 08 cup on the finished bottle.
const LEAD_X = 520;
const ANCHOR: { x: number; y: number }[] = [
  { x: 500, y: 241 }, { x: 455, y: 517 }, { x: 380, y: 801 }, { x: 465, y: 1064 },
  { x: LEAD_X, y: 1290 }, { x: LEAD_X, y: 1600 }, { x: LEAD_X, y: 780 }, { x: LEAD_X, y: 152 },
];
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export type HyperPart = { name: string; body: string };

export function HyperAssembly({ parts, children, after }: { parts: HyperPart[]; children?: ReactNode; after?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    const build = (pinned: boolean) => {
      const stage = el.querySelector<HTMLElement>('[data-stage]')!;
      const part = (id: string) => el.querySelector<HTMLElement>(`[data-part="${id}"]`)!;
      const labels = Array.from(el.querySelectorAll<HTMLElement>('[data-step]'));
      const u = (n: number) => () => (n * stage.clientHeight) / H;
      const label = (i: number, at: number) => {
        const li = labels[i]; if (!li) return;
        const ext = el.querySelector(`[data-ext="${i}"]`);
        if (ext) { // a part of the cell: the label fades in as a whole, its line first runs out from the part's edge
          tl.fromTo([li, ext], { opacity: 0 }, { opacity: 1, duration: .2, ease: 'none' }, at);
          tl.fromTo(ext, { scaleX: 0 }, { scaleX: 1, duration: .35, ease: 'power2.in' }, at);
          at += .3;
        }
        tl.fromTo(li.querySelector('[data-lead]'), { scaleX: 0 }, { scaleX: 1, duration: .5, ease: 'power2.inOut' }, at);
        tl.fromTo(li.querySelector('[data-say]'), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: .6 }, at + .25);
      };
      // a cell label steps aside as its part closes up and sinks out of sight
      const unlabel = (i: number, at: number) => {
        const li = labels[i]; if (!li) return;
        tl.to(li, { opacity: 0, x: 12, duration: .5, ease: 'power1.in' }, at);
        tl.to(el.querySelector(`[data-ext="${i}"]`), { opacity: 0, duration: .4, ease: 'power1.in' }, at);
      };

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      // 1 · the control base, up from below (named once the cell has gone back into it)
      tl.fromTo(part('base'), { opacity: 0, y: u(220) }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0);
      // 2 · the electrolysis parts rise out of the base, the top one first, and spread apart, named 01–04 …
      const cells = CELLS.map(c => part(c.id));
      const fan = 1.2;
      tl.set(cells, { opacity: 1 }, fan);
      CELLS.forEach((c, i) => {
        tl.fromTo(cells[i], { y: u(HIDE - c.y) }, { y: 0, duration: 1.3, ease: 'power3.out' }, fan + i * .16);
        label(i, fan + .8 + i * .3);
      });
      // … hold while they are read, close up into one stack on the base …
      const join = fan + 4.4; // long enough to read all four
      CELLS.forEach((c, i) => {
        unlabel(i, join - .2 + i * .06);
        tl.to(cells[i], { y: u(c.tight - c.y), duration: .9, ease: 'power2.inOut' }, join);
      });
      // … and sink back into the base together: 05 the control base, 06 its battery
      const sink = join + 1.2, drop = HIDE - CELLS[0].tight;
      CELLS.forEach((c, i) => {
        tl.to(cells[i], { y: u(c.tight - c.y + drop), duration: 1, ease: 'power2.in' }, sink);
      });
      tl.set(cells, { opacity: 0 }, sink + 1);
      label(4, sink + .6);
      label(5, sink + .9);
      // 3 · the glass chamber comes down onto the base (07), 4 · the cup comes down onto it (08)
      const glass = sink + 1.1;
      // (the chamber comes down from the top only, fading in as it comes; it is fully in before it closes on the base)
      tl.fromTo(part('chamber'), { y: u(-340) }, { y: 0, duration: 1.5, ease: 'power3.out' }, glass);
      tl.fromTo(part('chamber'), { opacity: 0 }, { opacity: 1, duration: .9, ease: 'power1.out', immediateRender: true }, glass);
      label(6, glass + .5);
      const cup = glass + 1.7;
      tl.fromTo(part('cap'), { opacity: 0, y: u(-320) }, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' }, cup);
      label(7, cup + .5);
      tl.fromTo(el.querySelector('[data-shadow]'), { opacity: .35, scaleX: .8 }, { opacity: 1, scaleX: 1, duration: 1.2, ease: 'none' }, cup);
      tl.to({}, { duration: .8 }); // hold the finished bottle a moment before the page moves on

      ScrollTrigger.create(pinned
        ? { animation: tl, trigger: el, start: 'top top', end: 'bottom bottom', scrub: .8, invalidateOnRefresh: true }
        : { animation: tl, trigger: stage, start: 'top 85%', end: 'bottom 40%', scrub: .8, invalidateOnRefresh: true });
    };
    mm.add({ lg: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)', sm: '(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)' }, ctx => {
      build(Boolean(ctx.conditions?.lg));
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className="relative motion-safe:lg:h-[540svh]">
      <div className="motion-safe:lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center">
        <div className="container-x grid grid-cols-1 w-full items-center gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-10 lg:py-0">
          <div className="lg:max-w-[30rem]">
            {children}
            {after}
          </div>
          {/* the bottle, centred; its labels hang off its right side into the third column */}
          <div className="relative h-[min(62svh,560px)] lg:mt-16 lg:h-[min(72svh,760px)]" style={{ aspectRatio: `${W} / ${H}` }} data-stage data-own-motion>
            <span data-shadow className="absolute bottom-[0.6%] left-1/2 h-[3%] w-[95%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(48_10_6/.38),transparent)] blur-[2px]" aria-hidden="true" />
            {SOLID.map(p => (
              <div key={p.id} data-part={p.id} className="absolute will-change-transform"
                style={{ left: pct(p.x, W), top: pct(p.y, H), width: pct(p.w, W), height: pct(p.h, H), zIndex: p.z }}>
                <Image src={`/images/hyper/parts/${p.id}.webp`} alt="" fill sizes="(min-width:1024px) 300px, 220px" loading="eager" className="object-contain" />
              </div>
            ))}
            {/* the electrolysis parts, behind the base and clipped below its top; hidden at rest (the finished bottle),
                so they only show while the build runs */}
            <div className="absolute inset-x-0 top-0 z-[2] overflow-hidden" style={{ height: pct(CLIP, H) }} aria-hidden="true">
              {CELLS.map(c => (
                <div key={c.id} data-part={c.id} className="absolute opacity-0 will-change-transform"
                  style={{ left: pct(c.x, W), top: pct(c.y, CLIP), width: pct(c.w, W), height: pct(c.h, CLIP), zIndex: c.z }}>
                  <Image src={`/images/hyper/parts/cell-${c.id}.webp`} alt="" fill sizes="(min-width:1024px) 280px, 200px" loading="eager" className="object-contain" />
                </div>
              ))}
            </div>
            {/* a cell part's line runs out from its own edge to where the other labels start */}
            {ANCHOR.slice(0, Math.min(CELLS.length, parts.length)).map((a, i) => (
              <span key={i} data-ext={i} className="absolute z-[5] h-px origin-left bg-ink/45 opacity-0" style={{ left: pct(a.x, W), width: pct(LEAD_X - a.x, W), top: pct(a.y, H) }} aria-hidden="true">
                <span className="absolute top-1/2 left-0 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
              </span>
            ))}
            <ol className="contents" aria-label="Hyper’s parts">
              {parts.map((p, i) => {
                const a = ANCHOR[i] ?? ANCHOR[ANCHOR.length - 1];
                const cell = i < CELLS.length;
                return (
                  <li key={p.name} data-step className={`absolute left-[93%] z-[5] flex w-[min(380px,calc(100vw_-_2rem_-_93%))] -translate-y-[14px] items-start lg:-translate-y-4 ${cell ? 'opacity-0' : ''}`} style={{ top: pct(a.y, H) }}>
                    <span data-lead className="relative mt-[14px] h-px w-[clamp(18px,4vw,64px)] shrink-0 origin-left bg-ink/45 lg:mt-4" aria-hidden="true">
                      {!cell && <span className="absolute top-1/2 left-0 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />}
                    </span>
                    <span data-say className="flex items-start gap-2.5 pl-2.5 lg:gap-3 lg:pl-3">
                      <span className="grid size-7 shrink-0 place-items-center bg-flash font-sans text-[12px] font-bold text-voltage lg:size-8 lg:text-[13px]">{String(i + 1).padStart(2, '0')}</span>
                      <span className="pt-[5px] lg:pt-[6px]">
                        <span className="block font-sans text-[13px] leading-snug font-medium text-ink lg:text-[15px]">{p.name}</span>
                        <span className="mt-1 hidden font-sans text-[13px] leading-[1.38] text-ink/70 lg:block">{p.body}</span>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </div>
      {/* all eight with their copy: under the bottle on phones, and on desktop when the build does not run */}
      <ol className="container-x grid grid-cols-1 gap-x-10 gap-y-7 pb-4 sm:grid-cols-2 lg:hidden motion-reduce:lg:grid motion-reduce:lg:grid-cols-4 motion-reduce:lg:pb-0" aria-hidden="true">
        {parts.map((p, i) => (
          <li key={p.name} className="flex items-start gap-3 border-t-2 border-ink pt-4">
            <span className="grid size-8 shrink-0 place-items-center bg-flash font-sans text-[13px] font-bold text-voltage">{String(i + 1).padStart(2, '0')}</span>
            <span>
              <span className="block font-sans text-[17px] leading-snug font-bold tracking-[-0.01em] text-ink">{p.name}</span>
              <span className="mt-1 block font-sans text-[15px] leading-snug text-ink/75">{p.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

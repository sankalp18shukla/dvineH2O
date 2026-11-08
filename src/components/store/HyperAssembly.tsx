'use client';
import Image from 'next/image';
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hyper builds itself in the middle of the screen as you scroll, each part named as it arrives:
 * 1 · the control base rises from below; 2 · the electrolysis parts come in from above and below, alternately, into a
 * stack over it, then drop into it one by one; 3 · the glass chamber comes down from above, fading in; 4 · the cup comes
 * down on top. Each step's label slides out beside the bottle on a leader line as its part comes in. Cut from the
 * catalogue's exploded photograph (p. 11). Desktop holds the section on screen for the build; phones scrub it as the
 * stage passes. Reduced motion, or no script, shows the finished bottle with every label.
 *
 * Geometry is in stage units: the stage is 260 × 870, every part placed at its assembled position.
 */
const W = 260, H = 870;
type Part = { id: string; x: number; y: number; w: number; h: number; z: number; core?: boolean; seat?: number };
const SOLID: Part[] = [
  { id: 'chamber', x: 20, y: 216, w: 221.8, h: 476.9, z: 1 },
  { id: 'base', x: 18, y: 648, w: 224, h: 214.2, z: 3 },
  { id: 'cup', x: 20, y: 140, w: 221.8, h: 128.2, z: 4 },
];
// the electrolysis core, top to bottom, at its exploded slot; `seat` is how far it drops to disappear into the base
const CORE: Part[] = [
  { id: 'lid', x: 130 - 108.8, y: 271, w: 217.6, h: 52.9, z: 2, core: true },
  { id: 'ring', x: 130 - 87.2, y: 350, w: 174.4, h: 81, z: 2, core: true },
  { id: 'plate1', x: 130 - 57, y: 457, w: 113.9, h: 15.1, z: 2, core: true },
  { id: 'plate2', x: 130 - 51, y: 490, w: 102, h: 6.5, z: 2, core: true },
  { id: 'plate3', x: 130 - 57, y: 515, w: 113.9, h: 15.7, z: 2, core: true },
  { id: 'membrane', x: 130 - 85.8, y: 555, w: 171.7, h: 70.7, z: 2, core: true },
].map(p => ({ ...p, seat: 690 - (p.y + p.h) }));
const ALL = [...SOLID, ...CORE];
// where each step's leader line meets the bottle: base, the electrolysis chamber (seated in the base's rim), glass, cup
const LABEL_Y = [815, 655, 470, 205];
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function HyperAssembly({ steps, children, after }: { steps: string[]; children?: ReactNode; after?: ReactNode }) {
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
      const below = CORE.map(p => part(p.id)).reverse(); // the membrane goes in first, the lid last
      const label = (i: number, at: number) => {
        const li = labels[i]; if (!li) return;
        tl.fromTo(li.querySelector('[data-lead]'), { scaleX: 0 }, { scaleX: 1, duration: .5, ease: 'power2.inOut' }, at);
        tl.fromTo(li.querySelector('[data-say]'), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: .6 }, at + .25);
      };

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      // 1 · the control base, up from below
      tl.fromTo(part('base'), { opacity: 0, y: u(110) }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0);
      label(0, .45);
      // 2 · the core, from above and below in turn, into its stack (one tween per part at a fixed time: a staggered
      // fromTo only hid its first target before it started) … then down into the base, bottom part first
      const in0 = 1.2, inEnd = in0 + (below.length - 1) * .3 + 1;
      below.forEach((e, i) => tl.fromTo(e, { opacity: 0, y: u((i % 2 ? -1 : 1) * (90 + i * 12)) }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, in0 + i * .3));
      label(1, inEnd - .2);
      const seat0 = inEnd + .7;
      below.forEach((e, i) => {
        const p = CORE[CORE.length - 1 - i];
        tl.to(e, { y: u(p.seat!), duration: 1, ease: 'power2.in' }, seat0 + i * .26);
        tl.to(e, { opacity: 0, duration: .3, ease: 'none' }, seat0 + i * .26 + .7);
      });
      // 3 · the glass chamber comes down onto the base, 4 · the cup comes down onto it
      const glass = seat0 + (below.length - 1) * .26 + .9;
      // (the chamber comes down from the top only, fading in as it comes; it is fully in before it closes on the base)
      tl.fromTo(part('chamber'), { y: u(-170) }, { y: 0, duration: 1.5, ease: 'power3.out' }, glass);
      tl.fromTo(part('chamber'), { opacity: 0 }, { opacity: 1, duration: .9, ease: 'power1.out', immediateRender: true }, glass);
      label(2, glass + .5);
      const cup = glass + 1.7;
      tl.fromTo(part('cup'), { opacity: 0, y: u(-160) }, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' }, cup);
      label(3, cup + .5);
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
    <div ref={root} className="relative lg:h-[380svh]">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center">
        <div className="container-x grid w-full items-center gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-10 lg:py-0">
          <div className="lg:max-w-[30rem]">
            {children}
            {after}
          </div>
          {/* the bottle, centred; its labels hang off its right side into the third column */}
          <div className="relative h-[min(62svh,560px)] lg:h-[min(84svh,860px)]" style={{ aspectRatio: `${W} / ${H}` }} data-stage data-own-motion>
            <span data-shadow className="absolute bottom-[0.6%] left-1/2 h-[3%] w-[95%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(48_10_6/.38),transparent)] blur-[2px]" aria-hidden="true" />
            {ALL.map(p => (
              <div key={p.id} data-part={p.id} className="absolute will-change-transform"
                style={{ left: pct(p.x, W), top: pct(p.y, H), width: pct(p.w, W), height: pct(p.h, H), zIndex: p.z }}>
                <Image src={`/images/hyper-parts/${p.id}.webp`} alt="" fill sizes="(min-width:1024px) 260px, 200px" loading="eager" className="object-contain" />
              </div>
            ))}
            <ol className="contents" aria-label="Hyper’s parts, from the base up">
              {steps.map((x, i) => (
                <li key={x} data-step className="absolute left-[93%] z-[5] flex w-[min(360px,calc(100vw_-_2rem_-_93%))] -translate-y-1/2 items-center" style={{ top: pct(LABEL_Y[i] ?? 0, H) }}>
                  <span data-lead className="relative h-px w-[clamp(18px,4vw,64px)] shrink-0 origin-left bg-ink/45" aria-hidden="true">
                    <span className="absolute top-1/2 left-0 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
                  </span>
                  <span data-say className="flex items-center gap-2.5 pl-2.5 lg:gap-3 lg:pl-3">
                    <span className="grid size-7 shrink-0 place-items-center bg-flash font-sans text-[12px] font-bold text-voltage lg:size-8 lg:text-[13px]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-sans text-[13px] leading-snug font-medium text-ink lg:text-[15px]">{x}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

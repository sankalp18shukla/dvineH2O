'use client';
import { Fragment, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Icon } from '@/components/ui/Icon';

gsap.registerPlugin(ScrollTrigger);

/**
 * A Voltage band of words in the brand lockup's two voices (heavy sans and Garamond italic, alternating),
 * slid sideways by the scroll rather than on a timer: two rows moving in opposite directions as the band
 * crosses the screen. Reduced motion leaves the rows still. The list is read out once for screen readers.
 */
export function ScrollMarquee({ items, label }: { items: string[]; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const [a, b] = el.querySelectorAll('[data-row]');
      const st = { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .6 };
      gsap.fromTo(a, { xPercent: 0 }, { xPercent: -28, ease: 'none', scrollTrigger: st });
      gsap.fromTo(b, { xPercent: -28 }, { xPercent: 0, ease: 'none', scrollTrigger: st });
    });
    return () => mm.revert();
  }, []);
  const row = (k: number) => (
    <div data-row className="flex w-max items-center gap-[.45em] whitespace-nowrap" aria-hidden="true">
      {[...items, ...items, ...items].map((t, i) => (
        <Fragment key={i}>
          <span className={(i + k) % 2 ? 'font-serif font-normal italic tracking-[-0.02em]' : 'font-sans font-extrabold tracking-[-0.05em]'}>{t}</span>
          <Icon name="drop" className="size-[.42em] shrink-0 text-deep-current" strokeWidth={2} />
        </Fragment>
      ))}
    </div>
  );
  return (
    <div ref={root} className="relative overflow-hidden bg-voltage py-6 text-ink sm:py-8" data-own-motion>
      <p className="sr-only">{label}: {items.join(', ')}</p>
      <div className="grid gap-1 text-[clamp(38px,6.4vw,96px)] leading-[1.05]">{row(0)}{row(1)}</div>
    </div>
  );
}

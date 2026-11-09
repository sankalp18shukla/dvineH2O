'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Lights its [data-light="n"] children up one at a time as each comes up the screen. Every item eases its own
 * --lit from 0 to 1, scrubbed to the scroll over a short stretch as its top rises from 88% to 62% of the screen
 * (an item sharing a row with earlier ones a beat later, and never brighter than the item before it), so each lights as it arrives rather than waiting for the whole
 * block. `litClass` is on once an item is more than half lit (for its idle motion). Until the script runs, and
 * under reduced motion, everything shows lit: the dim state only applies once `armClass` is on the block.
 */
export function LightUp({ children, className = '', armClass, litClass }: { children: ReactNode; className?: string; armClass: string; litClass: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-light]'));
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      el.classList.add(armClass);
      // Items sharing a row (a grid) light left to right, a beat apart; a single column has no lag at all.
      const lagOf = (it: HTMLElement) => {
        const top = Math.round(it.getBoundingClientRect().top);
        return items.filter(o => o !== it && Math.abs(Math.round(o.getBoundingClientRect().top) - top) < 4 && items.indexOf(o) < items.indexOf(it)).length * 10;
      };
      // Each item's own progress, then capped by the one before it, so they always light strictly in order.
      const raw = items.map(() => 0);
      const paint = () => {
        let cap = 1;
        items.forEach((it, i) => {
          const v = Math.min(raw[i], cap); cap = v;
          it.style.setProperty('--lit', v.toFixed(3)); it.classList.toggle(litClass, v > .5);
        });
      };
      paint();
      const tweens = items.map((it, i) => {
        const o = { v: 0 };
        return gsap.to(o, { v: 1, ease: 'power1.inOut', onUpdate: () => { raw[i] = o.v; paint(); },
          scrollTrigger: { trigger: it, start: () => `top ${88 - lagOf(it)}%`, end: () => `top ${62 - lagOf(it)}%`, scrub: .8, invalidateOnRefresh: true } });
      });
      return () => {
        tweens.forEach(t => { t.scrollTrigger?.kill(); t.kill(); });
        el.classList.remove(armClass);
        items.forEach(it => { it.classList.remove(litClass); it.style.removeProperty('--lit'); });
      };
    });
    return () => mm.revert();
  }, [armClass, litClass]);
  return <div ref={ref} className={className}>{children}</div>;
}

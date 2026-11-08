'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Lights its [data-light="n"] children up one at a time as each comes up the screen. Every item eases its own
 * --lit from 0 to 1, scrubbed to the scroll over a short stretch as its top rises from 88% to 62% of the screen
 * (odd n, the second of a row, a beat later), so each lights as it arrives rather than waiting for the whole
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
      const tweens = items.map(it => {
        const lag = Number(it.dataset.light) % 2 ? 10 : 0, o = { v: 0 };
        const set = () => { it.style.setProperty('--lit', o.v.toFixed(3)); it.classList.toggle(litClass, o.v > .5); };
        set();
        return gsap.to(o, { v: 1, ease: 'power1.inOut', onUpdate: set,
          scrollTrigger: { trigger: it, start: `top ${88 - lag}%`, end: `top ${62 - lag}%`, scrub: .8 } });
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

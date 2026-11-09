'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Squiggle } from '@/components/ui/Brand';
import { tuck } from './squiggleTuck';

gsap.registerPlugin(ScrollTrigger);

/**
 * The brand squiggle laid over a product's circle with its tail tucked behind it (squiggleTuck.ts), for the
 * feature bands. The circle is the sibling marked `data-tuck-disc` and must sit at z-[1]; the back copy is at
 * z-0 under it, the front copy at z-[2] over it, so the product should stand at z-[3] or above. The circle
 * breathes (scale and lift), so the hand-over point keeps a little extra clearance from its rim.
 *
 * As it scrolls into view it plays the hero's load-in: the circle opens out, the line draws itself on, and the
 * product (the sibling marked `data-tuck-product`) rises into place. Reduced motion shows it all at rest.
 */
export function TuckedSquiggle({ className = '' }: { className?: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current!;
    const stage = el.parentElement;
    const disc = stage?.querySelector<HTMLElement>('[data-tuck-disc]');
    const product = stage?.querySelector<HTMLElement>('[data-tuck-product]');
    const [back, front] = el.querySelectorAll<SVGPathElement>('path');
    if (!stage || !disc || !back || !front) return;
    const line = tuck(back, front, disc, 16);
    line.draw(1);

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      line.draw(0);
      gsap.set(disc, { clipPath: 'circle(0% at 50% 55%)' });
      if (product) gsap.set(product, { yPercent: 22, scale: .88, opacity: 0 });
      const o = { p: 0 };
      const tl = gsap.timeline({ paused: true })
        .to(disc, { clipPath: 'circle(71% at 50% 55%)', duration: 1.1, ease: 'power3.inOut', clearProps: 'clipPath' }, 0)
        .to(o, { p: 1, duration: 2.2, ease: 'power1.inOut', onUpdate: () => line.draw(o.p) }, 0);
      if (product) tl.to(product, { yPercent: 0, scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out', clearProps: 'transform,translate,scale,rotate,opacity' }, .35);
      const st = ScrollTrigger.create({ trigger: stage, start: 'top 75%', once: true, onEnter: () => tl.play() });
      return () => { st.kill(); tl.kill(); gsap.set(disc, { clearProps: 'clipPath' }); if (product) gsap.set(product, { clearProps: 'transform,translate,scale,rotate,opacity' }); line.draw(1); };
    });
    return () => { mm.revert(); line.stop(); };
  }, []);

  return (
    <span ref={root} className="contents" aria-hidden="true">
      <Squiggle className={`pointer-events-none absolute z-0 overflow-visible ${className}`} />
      <Squiggle className={`pointer-events-none absolute z-[2] overflow-visible ${className}`} />
    </span>
  );
}

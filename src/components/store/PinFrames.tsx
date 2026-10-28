'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Opens every .pin-frame with the scroll: its four corner squares start together at the centre and slide
 * out to the corners, opening the photo between them (--open, 0 → 1, drives the CSS in globals.css).
 * Frames inside [data-own-motion] are opened by their section. Reduced motion keeps the frames open.
 */
export function PinFrames() {
  const path = usePathname();
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const frames = gsap.utils.toArray<HTMLElement>('.pin-frame').filter(f => !f.closest('[data-own-motion]'));
      // --open is written straight to the element (see setOpen in FitShowcase.tsx for why)
      const set = (f: HTMLElement, v: number) => {
        f.style.setProperty('--open', String(v));
        f.classList.toggle('is-opening', v < 1);
      };
      frames.forEach(f => {
        set(f, 0);
        const o = { v: 0 };
        gsap.to(o, { v: 1, ease: 'power3.inOut', onUpdate: () => set(f, o.v),
          scrollTrigger: { trigger: f, start: 'top 92%', end: 'top 38%', scrub: .8 } });
      });
      return () => frames.forEach(f => { f.style.removeProperty('--open'); f.classList.remove('is-opening'); });
    });
    return () => mm.revert();
  }, [path]);
  return null;
}

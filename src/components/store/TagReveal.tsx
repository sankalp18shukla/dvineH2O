'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Pinned text across the site: headline lockups, label boxes and the band lockup. Sections marked
 * [data-own-motion] run their own heading entrance and are left alone. */
const TAGS = '.lk, .label-box, .band-lk';

/**
 * Opens every pinned headline or label like "Find the right fit.": the two pins start together at the
 * centre and slide apart, opening the block and revealing the words (--open, 0 → 1, drives the CSS in
 * globals.css). Scrubbed with the scroll as the text reaches the middle of the screen; text already on
 * screen when the page loads plays in once. Reduced motion shows it all.
 */
export function TagReveal() {
  const path = usePathname();
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tags = gsap.utils.toArray<HTMLElement>(TAGS).filter(t => !t.closest('[data-own-motion]'));
      // --open is written straight to the element (see setOpen in FitShowcase.tsx for why)
      const set = (t: HTMLElement, v: number) => {
        t.style.setProperty('--open', String(v));
        t.classList.toggle('is-opening', v < 1);
        // the band's peel sticker is slapped on once its words are fully open (see .is-stuck in globals.css)
        if (t.classList.contains('band-lk')) t.classList.toggle('is-stuck', v >= 1);
      };
      tags.forEach(t => {
        set(t, 0);
        const o = { v: 0 }, onUpdate = () => set(t, o.v);
        if (t.getBoundingClientRect().top < innerHeight * .8) gsap.to(o, { v: 1, duration: 1, delay: .25, ease: 'power4.inOut', onUpdate });
        else gsap.to(o, { v: 1, ease: 'power4.inOut', onUpdate, scrollTrigger: { trigger: t, start: 'top 80%', end: 'top 45%', scrub: .8 } });
      });
      return () => tags.forEach(t => { t.style.removeProperty('--open'); t.classList.remove('is-opening', 'is-stuck'); });
    });
    return () => mm.revert();
  }, [path]);
  return null;
}

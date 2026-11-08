'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Pinned text across the site: headline lockups, label boxes and the band lockup. Sections marked
 * [data-own-motion] run their own heading entrance and are left alone. */
export const TAGS = '.lk, .label-box, .band-lk';

/**
 * A section's headline is its first pinned tag. Returns it when `e` comes after it in that section (and the
 * section runs the shared motion), else null. ScrollCopy uses this to start the section's copy only once the
 * headline is open.
 */
export function headlineOf(e: Element): HTMLElement | null {
  const sec = e.closest('section');
  const h = sec?.querySelector<HTMLElement>(TAGS);
  if (!h || h === e || h.contains(e) || e.contains(h) || h.closest('[data-own-motion]')) return null;
  return h.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING ? h : null;
}

/** Purely decorative layers (the wave bands' canvases) never wait for the headline. */
const decor = (x: HTMLElement) => x.matches('canvas, script, style, [data-no-hold]') || (!!x.querySelector('canvas') && !x.textContent?.trim());

/**
 * Everything that follows a section's headline in that section: the siblings after the headline, and after each
 * of its containers, up to the section. These wait faint until the headline opens, then fade up with it.
 */
function heldBy(t: HTMLElement): HTMLElement[] {
  const sec = t.closest('section');
  if (!sec || sec.querySelector(TAGS) !== t) return [];
  const out: HTMLElement[] = [];
  for (let n: HTMLElement = t; n !== sec && n.parentElement; n = n.parentElement) {
    let sib = n.nextElementSibling as HTMLElement | null;
    for (; sib; sib = sib.nextElementSibling as HTMLElement | null) if (!decor(sib)) out.push(sib);
  }
  return out;
}

/**
 * Opens every pinned headline or label like "Find the right fit.": the two pins start together at the
 * centre and slide apart, opening the block and revealing the words (--open, 0 → 1, drives the CSS in
 * globals.css). Scrubbed with the scroll as the text reaches the middle of the screen; text already on
 * screen when the page loads plays in once. Reduced motion shows it all.
 * Until a scrubbed headline is open, the rest of its section waits faint and a little low (.hl-hold in
 * globals.css), and fades up into place as the headline opens, scrubbed with it.
 */
export function TagReveal() {
  const path = usePathname();
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tags = gsap.utils.toArray<HTMLElement>(TAGS).filter(t => !t.closest('[data-own-motion]'));
      // --open is written straight to the element (see setOpen in FitShowcase.tsx for why)
      const holds = new Map<HTMLElement, HTMLElement[]>();
      const set = (t: HTMLElement, v: number) => {
        t.style.setProperty('--open', String(v));
        // the held copy fades up with the headline, a beat behind it: faint until the headline is a quarter open,
        // fully in place as it finishes
        const c = Math.min(1, Math.max(0, (v - .25) / .75));
        holds.get(t)?.forEach(x => {
          x.classList.toggle('hl-hold', c < 1);
          if (c < 1) x.style.setProperty('--hl', c.toFixed(3)); else x.style.removeProperty('--hl');
        });
        t.classList.toggle('is-opening', v < 1);
        // the band's peel sticker is slapped on once its words are fully open (see .is-stuck in globals.css)
        if (t.classList.contains('band-lk')) t.classList.toggle('is-stuck', v >= 1);
      };
      tags.forEach(t => {
        set(t, 0);
        t.classList.add('m-on'); // start state set: lift the first-paint gate (globals.css)
        const o = { v: 0 }, onUpdate = () => set(t, o.v);
        if (t.getBoundingClientRect().top < innerHeight * .8) gsap.to(o, { v: 1, duration: 1, delay: .25, ease: 'power4.inOut', onUpdate });
        else {
          const held = heldBy(t);
          held.forEach(x => { x.classList.add('hl-hold'); x.style.setProperty('--hl', '0'); });
          holds.set(t, held);
          gsap.to(o, { v: 1, ease: 'power4.inOut', onUpdate, scrollTrigger: { trigger: t, start: 'top 80%', end: 'top 45%', scrub: .8 } });
        }
      });
      return () => {
        tags.forEach(t => { t.style.removeProperty('--open'); t.classList.remove('is-opening', 'is-stuck'); });
        holds.forEach(l => l.forEach(x => { x.classList.remove('hl-hold'); x.style.removeProperty('--hl'); }));
      };
    });
    return () => mm.revert();
  }, [path]);
  return null;
}

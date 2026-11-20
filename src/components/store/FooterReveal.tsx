'use client';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Turns on the curtain-reveal footer: sets --footer-h (the page card's bottom margin) and adds
 * .footer-reveal to <html> while the footer fits the viewport. A taller footer (phones) can't sit fixed behind the
 * page without its top being cut off, so it rises out from under the card instead: it starts tucked up beneath it
 * and settles into place as the page scrolls to its end, scrubbed, so it reads as the same reveal.
 */
export function FooterReveal() {
  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer) return;
    const root = document.documentElement;
    const card = document.querySelector<HTMLElement>('.page-card');
    const motion = matchMedia('(prefers-reduced-motion: no-preference)');
    let lift: gsap.core.Tween | null = null;
    const visible = () => footer.offsetHeight - parseFloat(getComputedStyle(footer).paddingTop);
    const sync = () => {
      // leave out the top padding (it tucks the footer under the card's corners, so it needs no scroll room)
      const h = visible();
      root.style.setProperty('--footer-h', `${h}px`);
      const fits = h <= window.innerHeight;
      root.classList.toggle('footer-reveal', fits);
      const want = !fits && motion.matches && !!card;
      // never lifted by more than the footer's own height, so its bottom always meets the end of the page
      if (want && !lift) lift = gsap.fromTo(footer, { y: () => -Math.min(visible() * .4, innerHeight * .55) }, { y: 0, ease: 'none',
        scrollTrigger: { trigger: card, start: 'bottom bottom', end: 'max', scrub: true, invalidateOnRefresh: true } });
      else if (want && lift) lift.scrollTrigger?.refresh();
      else if (!want && lift) { lift.scrollTrigger?.kill(); lift.kill(); lift = null; gsap.set(footer, { clearProps: 'transform' }); }
    };
    sync();
    // While the page card covers the fixed footer, hide it outright: nothing underneath the card to composite,
    // so it can never flicker through the card's white during scroll. A 1px sentinel at the card's bottom edge
    // shows it again a little before it is uncovered.
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:1px;pointer-events:none;visibility:hidden';
    card?.appendChild(sentinel);
    const io = new IntersectionObserver(([e]) => root.classList.toggle('footer-covered', !e.isIntersecting), { rootMargin: '0px 0px 200px 0px' });
    if (card) io.observe(sentinel);
    const ro = new ResizeObserver(sync);
    // border-box so ActionBar padding changes are seen too
    ro.observe(footer, { box: 'border-box' });
    // the page under it changes height (another page, images arriving): the lift re-measures where it starts
    if (card) ro.observe(card);
    window.addEventListener('resize', sync);
    return () => { io.disconnect(); sentinel.remove(); root.classList.remove('footer-covered'); ro.disconnect(); window.removeEventListener('resize', sync); root.classList.remove('footer-reveal');
      lift?.scrollTrigger?.kill(); lift?.kill(); gsap.set(footer, { clearProps: 'transform' }); };
  }, []);
  return null;
}

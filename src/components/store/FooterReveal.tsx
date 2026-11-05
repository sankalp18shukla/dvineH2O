'use client';
import { useEffect } from 'react';

/**
 * Turns on the curtain-reveal footer: sets --footer-h (the page card's bottom margin) and adds
 * .footer-reveal to <html> while the footer fits the viewport. Taller footers stay static so nothing is cut off.
 */
export function FooterReveal() {
  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer) return;
    const root = document.documentElement;
    const sync = () => {
      // leave out the top padding (it tucks the footer under the card's corners, so it needs no scroll room)
      const h = footer.offsetHeight - parseFloat(getComputedStyle(footer).paddingTop);
      root.style.setProperty('--footer-h', `${h}px`);
      root.classList.toggle('footer-reveal', h <= window.innerHeight);
    };
    sync();
    // While the page card covers the fixed footer, hide it outright: nothing underneath the card to composite,
    // so it can never flicker through the card's white during scroll. A 1px sentinel at the card's bottom edge
    // shows it again a little before it is uncovered.
    const card = document.querySelector<HTMLElement>('.page-card');
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:1px;pointer-events:none;visibility:hidden';
    card?.appendChild(sentinel);
    const io = new IntersectionObserver(([e]) => root.classList.toggle('footer-covered', !e.isIntersecting), { rootMargin: '0px 0px 200px 0px' });
    if (card) io.observe(sentinel);
    const ro = new ResizeObserver(sync);
    // border-box so ActionBar padding changes are seen too
    ro.observe(footer, { box: 'border-box' });
    window.addEventListener('resize', sync);
    return () => { io.disconnect(); sentinel.remove(); root.classList.remove('footer-covered'); ro.disconnect(); window.removeEventListener('resize', sync); root.classList.remove('footer-reveal'); };
  }, []);
  return null;
}

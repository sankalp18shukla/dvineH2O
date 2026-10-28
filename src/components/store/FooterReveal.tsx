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
    const ro = new ResizeObserver(sync);
    // border-box so ActionBar padding changes are seen too
    ro.observe(footer, { box: 'border-box' });
    window.addEventListener('resize', sync);
    return () => { ro.disconnect(); window.removeEventListener('resize', sync); root.classList.remove('footer-reveal'); };
  }, []);
  return null;
}

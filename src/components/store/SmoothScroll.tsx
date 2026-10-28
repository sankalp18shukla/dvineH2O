'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

/** Fired by the Preloader once the page is ready and its curtain has lifted. */
export const READY = 'dvine:ready';
/** Set on <html> by the Preloader while it covers the page. */
export const LOADING = 'is-loading';

/**
 * Lenis smooth scrolling for the wheel and trackpad (touch keeps the phone's native scroll). Lenis runs on
 * GSAP's ticker and reports every frame to ScrollTrigger, so the scrubbed sections, sticky stages and video
 * seeks all read the same smoothed position in the same frame instead of fighting a second rAF loop.
 * The page holds still while the Preloader is up, or while a drawer or menu locks the body.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    const lenis = new Lenis({
      lerp: 0.09, wheelMultiplier: 0.9, touchMultiplier: 1, syncTouch: false, autoRaf: false,
      // in-page links (#collection) glide too, clearing the sticky header (matches scroll-padding-top)
      anchors: { offset: matchMedia('(min-width: 1024px)').matches ? -124 : -88, duration: 1.4 },
      // scrollable panels (cart, chat, menu) scroll natively
      prevent: node => !!node.closest?.('[role="dialog"], .overflow-y-auto, [data-lenis-prevent]'),
    });

    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const sync = () => (root.classList.contains(LOADING) || document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start());
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    // once the curtain lifts, measure against the final layout (fonts, images and video sizes are in)
    const ready = () => { sync(); lenis.resize(); ScrollTrigger.refresh(); };
    window.addEventListener(READY, ready);

    return () => {
      mo.disconnect(); window.removeEventListener(READY, ready);
      gsap.ticker.remove(raf); gsap.ticker.lagSmoothing(500, 33); lenis.destroy();
    };
  }, []);
  return null;
}

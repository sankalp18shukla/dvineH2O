'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { smooth } from './SmoothScroll';
import { hashTarget, land } from './landing';

/**
 * Links to a section land on it at rest (see landing.ts). Arriving at a page with a #hash jumps straight to that
 * section, with no glide down the page, and keeps it in place while late layout (fonts, images, pinned sections
 * measuring themselves) settles, until the visitor scrolls. A link to a section on the same page marks it before
 * the scroll there begins, so it is already at rest when it arrives.
 * Must mount before TagReveal, PinFrames, ScrollCopy and Reveal: they skip what it has marked.
 */
export function HashLanding() {
  const path = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const jump = (t: HTMLElement) => {
      const top = Math.max(0, t.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0));
      if (Math.abs(top - scrollY) < 2) return;
      if (smooth.lenis) { smooth.lenis.scrollTo(top, { immediate: true, force: true }); return; }
      const was = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      scrollTo(0, top);
      root.style.scrollBehavior = was;
    };

    const target = hashTarget();
    let hold = !!target;
    if (target) { land(target); jump(target); }
    const settle = () => { if (hold && target) jump(target); };
    const release = () => { hold = false; };
    const timer = window.setTimeout(release, 4000);
    const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    inputs.forEach(ev => addEventListener(ev, release, { passive: true }));
    ScrollTrigger.addEventListener('refresh', settle);
    addEventListener('load', settle);

    const click = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href*="#"]');
      if (!(a instanceof HTMLAnchorElement) || a.origin !== location.origin || a.pathname !== location.pathname) return;
      const t = hashTarget(a.hash);
      if (t) land(t);
    };
    const hash = () => { const t = hashTarget(); if (t) land(t); };
    document.addEventListener('click', click, true);
    addEventListener('hashchange', hash);

    return () => {
      window.clearTimeout(timer);
      inputs.forEach(ev => removeEventListener(ev, release));
      ScrollTrigger.removeEventListener('refresh', settle);
      removeEventListener('load', settle);
      document.removeEventListener('click', click, true);
      removeEventListener('hashchange', hash);
    };
  }, [path]);
  return null;
}

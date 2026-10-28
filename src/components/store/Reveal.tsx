'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Adds .in to [data-reveal] elements as they enter the viewport. */
export function Reveal() {
  const path = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)'));
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, [path]);
  // a link to #id of a <details> (e.g. "View Full Specifications") opens it
  useEffect(() => {
    const open = () => {
      const el = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (el instanceof HTMLDetailsElement) el.open = true;
    };
    open(); window.addEventListener('hashchange', open);
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]');
      const el = a && document.getElementById(a.getAttribute('href')!.slice(1));
      if (el instanceof HTMLDetailsElement) el.open = true;
    };
    document.addEventListener('click', click);
    return () => { window.removeEventListener('hashchange', open); document.removeEventListener('click', click); };
  }, [path]);
  return null;
}

'use client';
import { useEffect, useRef } from 'react';

/**
 * Instant feedback for page changes. Store pages render on the server (they read the session), and there is no
 * loading.tsx (it would make pages hydrate after the layout; see IntentPrefetch), so between a click and the new
 * page nothing used to move and a slow render read as a dead link. The moment Next takes over a link click, a
 * thin Flash line starts running across the top of the screen; it completes and fades once the address changes.
 */
export function NavProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current!;
    let watch = 0, safety = 0, fade = 0;
    const stop = () => {
      window.clearInterval(watch); window.clearTimeout(safety);
      if (!('on' in el.dataset)) return;
      delete el.dataset.on;
      el.dataset.done = '';
      fade = window.setTimeout(() => { delete el.dataset.done; }, 420);
    };
    const start = (target: string) => {
      window.clearInterval(watch); window.clearTimeout(safety); window.clearTimeout(fade);
      delete el.dataset.done;
      delete el.dataset.on;
      void el.offsetWidth; // restart the run from zero if a second link is clicked mid-way
      el.dataset.on = '';
      // Next updates the address when the new page commits; that is the moment to finish
      watch = window.setInterval(() => { if (location.pathname + location.search === target) stop(); }, 80);
      safety = window.setTimeout(stop, 20000);
    };
    // bubble phase on window runs after Next's <Link> handler: defaultPrevented means Next is doing a client navigation
    const click = (e: MouseEvent) => {
      if (!e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      const target = url.pathname + url.search;
      if (target === location.pathname + location.search) return; // same page (a #section jump)
      start(target);
    };
    window.addEventListener('click', click);
    window.addEventListener('popstate', stop);
    return () => {
      window.removeEventListener('click', click);
      window.removeEventListener('popstate', stop);
      window.clearInterval(watch); window.clearTimeout(safety); window.clearTimeout(fade);
    };
  }, []);
  return <div ref={bar} className="nav-progress no-print" aria-hidden="true" />;
}

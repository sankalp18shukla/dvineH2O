'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Fast page changes without a loading screen. Store pages read the session (cart count, account), so Next's
 * default link prefetch fetches nothing for them and a tap waits for the whole server render. This prefetches a
 * page in full the moment intent shows: a finger landing on a link (about 100ms before the tap completes), or a
 * mouse resting on one (often half a second before the click). One request per page; Next keeps the result for
 * five minutes, so going back and forth through the range is instant.
 * (A loading.tsx boundary was ruled out: it makes the page hydrate after the layout, and the layout's scroll
 * motion scripts would then touch it before React had taken it over.)
 */
export function IntentPrefetch() {
  const router = useRouter();
  useEffect(() => {
    const done = new Set<string>();
    const warm = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return; // same page: a hash jump
      if (/^\/(api|admin|media|invoice|checkout\/phonepe)\b/.test(url.pathname)) return; // route handlers, never pages
      const key = url.pathname + url.search;
      if (done.has(key)) return;
      done.add(key);
      router.prefetch(key);
    };
    const opts = { passive: true, capture: true } as const;
    document.addEventListener('touchstart', warm, opts);
    document.addEventListener('pointerover', warm, opts);
    document.addEventListener('focusin', warm, opts);
    return () => {
      document.removeEventListener('touchstart', warm, opts);
      document.removeEventListener('pointerover', warm, opts);
      document.removeEventListener('focusin', warm, opts);
    };
  }, [router]);
  return null;
}

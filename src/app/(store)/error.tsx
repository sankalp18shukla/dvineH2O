'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { DieCut, Lockup } from '@/components/ui/Brand';
import { Logo } from '@/components/ui/Logo';
import { SITE } from '@/lib/content';

/**
 * Shown when a page fails to load (for example the database is briefly unreachable). It keeps the store's
 * footer and chat, offers a retry, and gives the reference code so support can find the error in the logs.
 */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <>
      <div className="container-x flex items-center py-6"><Link href="/" aria-label={`${SITE.name} home`} className="text-ink"><Logo className="h-5 w-auto" /></Link></div>
      <main id="main" className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
        <div className="relative">
          <DieCut text={'Hold on,\nrefilling.'} className="absolute -top-16 right-0 text-[24px] sm:-right-16 sm:text-[30px]" />
          <Lockup as="h1" title="*Something went* wrong." tone="flash" className="is-center" />
          <p className="lede mx-auto mt-10">This page didn’t load properly. Please try again. If it keeps happening, call {SITE.phone} or WhatsApp us.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
            <Link href="/" className="btn btn-outline">Go home</Link>
            <a href={SITE.whatsappUrl} target="_blank" rel="noopener" className="btn btn-outline">WhatsApp us</a>
          </div>
          {error.digest && <p className="mt-6 text-[12px] text-muted">Reference: {error.digest}</p>}
        </div>
      </main>
    </>
  );
}

'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/content';
import { Icon } from '../ui/Icon';

export function MobileMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open]);
  return (
    <>
      <button className="grid size-11 place-items-center rounded-full hover:bg-current/10 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" /></button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-stage-deep/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="stage on-dark absolute inset-y-0 right-0 flex w-[min(380px,88vw)] flex-col gap-2 overflow-y-auto p-6">
            <button className="ml-auto grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close menu" onClick={() => setOpen(false)}><Icon name="close" /></button>
            <nav aria-label="Mobile" className="mt-4 flex flex-col">
              {NAV.main.map(l => <Link key={l.href} href={l.href} className="border-b border-white/12 py-4 font-sans text-2xl font-semibold">{l.label}</Link>)}
              {NAV.utility.map(l => <Link key={l.href} href={l.href} className="border-b border-white/12 py-3.5 font-sans text-lg text-white/80">{l.label}</Link>)}
              <Link href={signedIn ? '/account' : '/account/login'} className="border-b border-white/12 py-3.5 font-sans text-lg text-white/80">{signedIn ? 'My account' : 'Sign in'}</Link>
              <Link href="/track" className="border-b border-white/12 py-3.5 font-sans text-lg text-white/80">Track my order</Link>
            </nav>
            <Link href="/book-demo" className="btn btn-red mt-6">Book a Demo</Link>
          </div>
        </div>
      )}
    </>
  );
}

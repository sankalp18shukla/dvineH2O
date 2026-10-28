'use client';
import { useEffect, useState } from 'react';

/** Transparent over dark heroes, solid once the page scrolls. */
export function HeaderShell({ overlay, framed = false, children }: { overlay: boolean; framed?: boolean; children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const solid = !overlay || scrolled;
  if (framed) return (
    <header className={`no-print sticky top-0 z-40 w-full text-ink transition-[background-color] duration-300 ${scrolled ? 'bg-paper/85 backdrop-blur-xl' : 'bg-paper'}`}>
      {children}
    </header>
  );
  return (
    <header className={`no-print z-40 w-full transition-colors duration-300 ${overlay ? 'fixed top-0' : 'sticky top-0'} ${solid ? (overlay ? 'bg-stage-deep/80 text-white backdrop-blur-xl' : 'border-b border-line bg-white/90 text-ink backdrop-blur-xl') : 'text-white'} ${overlay ? 'on-dark' : ''}`}>
      {children}
    </header>
  );
}

'use client';
import { useEffect } from 'react';

/** Moves the glare of whichever .glare button is under the pointer (--mx/--my, see .glare in globals.css). */
export function Glare() {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>('.glare');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', move, { passive: true });
    return () => document.removeEventListener('pointermove', move);
  }, []);
  return null;
}

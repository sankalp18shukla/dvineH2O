'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';

/**
 * Reviews as a slider: one card per view on phones, two on tablets, three on desktop. It moves on by itself every
 * few seconds (paused while hovered or focused, and under reduced motion), with arrow buttons and swipe/drag.
 * The track slides by transform; there is no scroll snapping.
 */
export function ReviewSlider({ children, label }: { children: ReactNode[]; label: string }) {
  const n = children.length;
  const [per, setPer] = useState(1);
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const drag = useRef<{ x: number; dx: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const last = Math.max(0, n - per);

  useEffect(() => {
    const md = matchMedia('(min-width: 768px)'), lg = matchMedia('(min-width: 1024px)');
    const fit = () => setPer(lg.matches ? 3 : md.matches ? 2 : 1);
    fit(); md.addEventListener('change', fit); lg.addEventListener('change', fit);
    return () => { md.removeEventListener('change', fit); lg.removeEventListener('change', fit); };
  }, []);
  useEffect(() => { setI(k => Math.min(k, last)); }, [last]);

  const go = useCallback((k: number) => setI(k < 0 ? last : k > last ? 0 : k), [last]);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || last === 0) return;
    const t = setInterval(() => { if (!paused.current && !document.hidden) setI(k => (k >= last ? 0 : k + 1)); }, 5200);
    return () => clearInterval(t);
  }, [last]);

  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, dx: 0 }; };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    drag.current.dx = e.clientX - drag.current.x;
    if (track.current) track.current.style.translate = `${drag.current.dx}px 0`;
  };
  const onUp = () => {
    const d = drag.current; drag.current = null;
    if (track.current) track.current.style.translate = '';
    if (d && Math.abs(d.dx) > 50) go(i + (d.dx < 0 ? 1 : -1));
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}
      onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; onUp(); }}
      onFocus={() => { paused.current = true; }} onBlur={() => { paused.current = false; }}>
      <div className="-mx-2.5 overflow-hidden px-0.5 py-1 touch-pan-y select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div ref={track} className="flex transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${-(i * 100) / per}%)` }}>
          {children.map((c, k) => (
            <div key={k} className="shrink-0 px-2.5" style={{ width: `${100 / per}%` }} role="group" aria-roledescription="slide"
              aria-label={`${k + 1} of ${n}`} aria-hidden={k < i || k >= i + per} inert={k < i || k >= i + per ? true : undefined}>{c}</div>
          ))}
        </div>
      </div>
      {last > 0 && (
        <div className="mt-8 flex items-center gap-5">
          <div className="flex gap-2">
            <button type="button" onClick={() => go(i - 1)} aria-label="Previous reviews"
              className="grid size-12 place-items-center rounded-full border border-ink/20 bg-white text-ink transition hover:bg-ink hover:text-glacier"><Icon name="arrow" className="size-5 rotate-180" /></button>
            <button type="button" onClick={() => go(i + 1)} aria-label="Next reviews"
              className="grid size-12 place-items-center rounded-full bg-ink text-glacier transition hover:bg-deep-current"><Icon name="arrow" className="size-5" /></button>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: last + 1 }, (_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? 'w-6 bg-ink' : 'w-1.5 bg-ink/20'}`} />
            ))}
          </div>
          <p className="ml-auto font-sans text-[13px] text-muted" aria-live="polite">{Math.min(i + per, n)} of {n}</p>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useId, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Brand's Squiggle (viewBox 300 × 260, stroke 13) with a different tail: after the lower S it swings right, out past
 * x ≈ 232 (where the frame's right edge falls with the squiggle set -right-10 at w-44), then curls back in under it.
 */
const D = 'M146 18c-22-14-52 6-36 26 12 15 40-4 24-18-30-26-96-10-104 34-7 40 46 50 84 34 44-18 96-30 116 6 22 40-34 62-74 50-36-11-82 0-80 34 2 30 46 36 76 22 36-16 92-14 104 12 8 18-6 34-30 34-12 0-24-4-34-10';
const OUTER = 'M-2000 -2000H2300V2300H-2000Z';

/**
 * The brand squiggle laid over a framed photo, its tail slipping behind the frame. The line is drawn in front of
 * the photo up to the point where its tail last crosses into the frame (the sibling .pin-frame), then stops there
 * with a clean cut along the frame's edge, so the end reads as tucked behind the picture. Position it (className)
 * so the tail's last loop pokes out past an edge of the frame and dips back in. As it scrolls into view the line
 * draws itself on (as the hero's squiggle does); reduced motion shows it drawn.
 */
export function FrameTuckSquiggle({ className = '' }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const hole = useRef<SVGPathElement>(null);
  const clip = `ftuck-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    const el = svg.current!, line = path.current!, cut = hole.current!;
    const frame = el.parentElement?.querySelector<HTMLElement>('.pin-frame');
    if (!frame) return;
    const len = line.getTotalLength();
    // stop: how far the line is drawn at rest (to just past where its tail goes under the frame); p: draw-on 0–1
    let stop = len, p = 1;
    const paint = () => {
      const d = Math.min(p * len, stop);
      line.style.strokeDasharray = `${d} ${len + 1}`;
      line.style.visibility = d > .5 ? '' : 'hidden'; // a zero-length dash would still show its round cap as a dot
    };
    const measure = () => {
      const s = el.getBoundingClientRect(), f = frame.getBoundingClientRect();
      if (!s.width || !f.width) return;
      // the frame in viewBox units
      const k = 300 / s.width;
      const x0 = (f.left - s.left) * k, x1 = (f.right - s.left) * k, y0 = (f.top - s.top) * k, y1 = (f.bottom - s.top) * k;
      const inside = (l: number) => { const q = line.getPointAtLength(l); return q.x > x0 && q.x < x1 && q.y > y0 && q.y < y1; };
      // walk back from the tail to where it enters the frame
      let at = len;
      while (at > 0 && inside(at)) at -= 1;
      if (at === len || at <= 0) { stop = len; cut.setAttribute('d', OUTER); paint(); return; }
      const q = line.getPointAtLength(at), r = 22;
      // draw a little past the crossing, and hide what pokes into the frame there: a hole of the frame around it
      stop = at + 12;
      const hx0 = Math.max(x0, q.x - r), hx1 = Math.min(x1, q.x + r), hy0 = Math.max(y0, q.y - r), hy1 = Math.min(y1, q.y + r);
      cut.setAttribute('d', `${OUTER}M${hx0} ${hy0}V${hy1}H${hx1}V${hy0}Z`);
      paint();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(el);

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const o = { p: 0 };
      p = 0; paint();
      const tw = gsap.to(o, {
        p: 1, duration: 1.8, ease: 'power1.inOut', paused: true,
        onUpdate: () => { p = o.p; paint(); },
      });
      const st = ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tw.play() });
      return () => { st.kill(); tw.kill(); p = 1; paint(); };
    });
    return () => { ro.disconnect(); mm.revert(); };
  }, []);

  return (
    <svg ref={svg} viewBox="0 0 300 260" fill="none" className={`pointer-events-none absolute overflow-visible ${className}`} aria-hidden="true">
      <defs>
        <clipPath id={clip} clipPathUnits="userSpaceOnUse">
          <path ref={hole} d={OUTER} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path ref={path} d={D} clipPath={`url(#${clip})`} stroke="currentColor" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

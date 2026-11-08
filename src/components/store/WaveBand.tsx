'use client';
import { useEffect, useRef } from 'react';

const GAP = 17;      // px between neighbouring lines, roughly the brand pattern's spacing
const ALPHA = 0.16;  // pattern-light.svg's stroke opacity
const STEP = 12;     // px between sampled points along a line
const SIGMA = 110;   // px size of the swell around the pointer (interactive bands)
const SPREAD = 0.22; // how far lines part around the pointer; kept small so the mapping stays monotonic (no crossings)
const SCROLL = 0.001;  // wave phase per px the band moves on screen (interactive bands)

/**
 * The dark band behind a section, drawn as the brand wave pattern: a family of lines that never cross, whose first
 * and last lines are the band's top and bottom edges. The edges and every line in between drift slowly together, so
 * the border is part of the waves. Place inside a `relative` section with no background of its own. Until the
 * canvas draws (and without JS) a plain .stage fill stands in. Static under prefers-reduced-motion; paused off screen.
 * `tone="glacier"` fills the band flat Glacier with dark lines. `interactive` makes the waves travel as the page
 * scrolls and the lines (edges included) ease apart around the pointer, as the footer's waves do.
 * `knot` draws the brand pattern's crossing: the inner lines gather into a knot where they cross over one another
 * (each line is stroked on its own, so where they overlap the knot reads darker, as in pattern-blue.svg). The knot
 * drifts slowly along the band and, on an interactive band, follows the pointer; the edges never join it.
 */
export function WaveBand({ tone = 'deep', interactive = false, knot = false }: { tone?: 'deep' | 'glacier'; interactive?: boolean; knot?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, visible = false;
    // pointer: target from events, eased current, and a 0..1 strength that eases in on enter and out on leave;
    // scroll: the band's eased offset on screen, which drives the wave phase
    const ptr = { tx: 0, ty: 0, x: 0, y: 0, on: 0, target: 0 };
    let scroll = 0;
    // the knot: its x (px) and its place between the edges (0..1), eased toward the pointer or the slow drift
    const kn = { x: -1, f: .5 };

    const draw = (t: number) => {
      const amp = Math.min(56, Math.max(24, w * 0.035));
      const k = (2 * Math.PI) / (w * 1.15);
      if (interactive && !reduced) {
        ptr.x += (ptr.tx - ptr.x) * 0.05;
        ptr.y += (ptr.ty - ptr.y) * 0.05;
        ptr.on += (ptr.target - ptr.on) * 0.03;
        scroll += (canvas.getBoundingClientRect().top - scroll) * 0.06;
      }
      const s = reduced ? 0 : t * 0.00025 + scroll * SCROLL;
      const a = SPREAD * ptr.on, s2 = 2 * SIGMA * SIGMA;
      // smooth vertical stretch centred on the pointer: lines above rise, lines below sink, gaps widen
      const push = (x: number, y: number) => {
        if (a < 0.001) return y;
        const dx = x - ptr.x, dy = y - ptr.y;
        return y + a * dy * Math.exp(-(dx * dx + dy * dy) / s2);
      };
      const top = (x: number) => amp + amp * (0.65 * Math.sin(x * k + s + 0.3) + 0.35 * Math.sin(x * k * 2.1 - s * 1.4 + 1.7));
      const bot = (x: number) => h - amp - amp * (0.65 * Math.sin(x * k * 0.9 - s + 2.4) + 0.35 * Math.sin(x * k * 1.7 + s * 1.2 + 0.5));
      // a swell through the middle lines, eased to zero at both edges; kept small enough that lines never cross
      const bend = (h - 4 * amp) * 0.18;
      const mid = (x: number) => bend * Math.sin(x * k * 0.7 - s * 0.8 + 1.1);
      // nf is fractional, so the pattern follows the band's height continuously: when the section grows (an
      // accordion opening) the lines spread and a new one emerges from the bottom edge, instead of every line
      // jumping as a rounded line count ticks over. f is a line's place between the top (0) and bottom (1) edges.
      const nf = Math.max(2, (h - 2 * amp) / GAP);
      const xs: number[] = [];
      for (let x = 0; x < w + STEP; x += STEP) xs.push(Math.min(x, w));
      const T = xs.map(top), B = xs.map(bot), M = xs.map(mid);
      const base = (f: number, j: number) => T[j] + (B[j] - T[j]) * f + Math.sin(Math.PI * f) * M[j];
      // knot: around kn.x each inner line is drawn toward the knot's line, slightly past it near the middle, so the
      // lines cross over each other there; sin(πf) keeps the two edges (and the fill) out of it
      let G: number[] | null = null, S = 0;
      if (knot) {
        const ts = reduced ? 0 : t;
        const driftX = w * (.58 + .16 * Math.sin(ts * .00007)), driftF = .5 + .08 * Math.sin(ts * .00011 + 1.3);
        let px = driftX, pf = driftF;
        if (interactive && ptr.on > .001) {
          const pt = top(ptr.x), pb = bot(ptr.x);
          px = driftX + (ptr.x - driftX) * ptr.on;
          pf = driftF + (Math.min(.78, Math.max(.22, (ptr.y - pt) / Math.max(1, pb - pt))) - driftF) * ptr.on;
        }
        if (kn.x < 0) { kn.x = px; kn.f = pf; }
        kn.x += (px - kn.x) * .035; kn.f += (pf - kn.f) * .035;
        const KW = Math.max(160, w * .2);
        G = xs.map(x => Math.exp(-(((x - kn.x) / KW) ** 2)));
        S = 1.12 + .1 * Math.sin(ts * .0004); // just past 1: the middle lines cross
      }
      const y = (f: number, j: number) => {
        let v = base(f, j);
        if (G) { const c = base(kn.f, j); v = c + (v - c) * (1 - S * G[j] * Math.sin(Math.PI * f)); }
        return push(xs[j], v);
      };

      ctx.clearRect(0, 0, w, h);
      // fill between the edge lines (line 0 and line n) with Glacier or the .stage gradient
      ctx.beginPath();
      xs.forEach((x, j) => (j ? ctx.lineTo(x, y(0, j)) : ctx.moveTo(x, y(0, j))));
      for (let j = xs.length - 1; j >= 0; j--) ctx.lineTo(xs[j], y(1, j));
      ctx.closePath();
      if (tone === 'glacier') {
        ctx.fillStyle = '#25FFE8';
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(w * 0.7, h * 0.4);
        ctx.scale(w * 0.8, h * 0.9);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.25);
        g.addColorStop(0, '#0B3FA8'); g.addColorStop(0.4, '#082A7E'); g.addColorStop(0.72, '#06195A'); g.addColorStop(1, '#030E36');
        ctx.fillStyle = g;
        ctx.fill(); // the path was built before the transform, so only the gradient is stretched into an ellipse
        ctx.restore();
      }

      ctx.strokeStyle = tone === 'glacier' ? 'rgba(4,22,74,0.13)' : `rgba(255,255,255,${ALPHA})`;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      if (knot) {
        for (let i = 1; i < nf; i++) { const f = i / nf; ctx.beginPath(); xs.forEach((x, j) => (j ? ctx.lineTo(x, y(f, j)) : ctx.moveTo(x, y(f, j)))); ctx.stroke(); }
      } else {
        ctx.beginPath();
        for (let i = 1; i < nf; i++) { const f = i / nf; xs.forEach((x, j) => (j ? ctx.lineTo(x, y(f, j)) : ctx.moveTo(x, y(f, j)))); }
        ctx.stroke();
      }
      if (fallback.current) fallback.current.style.display = 'none';
    };

    const loop = (t: number) => {
      draw(t);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const start = () => { if (!reduced && !raf && visible) raf = requestAnimationFrame(loop); };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // resizing clears the canvas after this frame's draw has run: redraw now, or it paints blank for a frame
      draw(performance.now());
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top;
      if (inside && ptr.on < 0.01) { ptr.x = ptr.tx; ptr.y = ptr.ty; } // swell where the pointer is, not slide in
      ptr.target = inside ? 1 : 0;
    };
    const onLeave = () => { ptr.target = 0; };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });
    io.observe(canvas);
    if (interactive && !reduced) {
      scroll = canvas.getBoundingClientRect().top;
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [tone, interactive, knot]);

  return (
    <>
      <div ref={fallback} className={`${tone === 'glacier' ? 'bg-glacier' : 'stage'} pointer-events-none absolute inset-0`} aria-hidden="true" data-no-hold />
      <canvas ref={ref} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true" data-no-hold />
    </>
  );
}

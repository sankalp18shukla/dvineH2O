'use client';
import { useEffect, useRef } from 'react';

const VB_W = 1440, VB_H = 900; // pattern-light.svg viewBox, drawn with "slice" like the CSS background
const SWELL = 12;              // px (viewBox units) of the slow travelling swell
const SIGMA = 90;              // px size of the opening around the pointer, in screen space
const SPREAD = 0.35;           // how far lines part: peak shift is SPREAD * SIGMA * 0.6 (kept < 2.2 so lines never cross)
const ALPHA = 0.06;           // stroke opacity
// SWELL, SPREAD and ALPHA are the footer's; the `swell`, `spread` and `alpha` props override them (e.g. calmer, over a photo)

/**
 * The brand wave pattern (pattern-light.svg) on a canvas: it flows slowly, and around the pointer the lines ease
 * apart, so the gaps between them open up. Static under prefers-reduced-motion; paused while off screen.
 */
export function FooterWaves({ className = '', alpha = ALPHA, swell = SWELL, spread = SPREAD }: { className?: string; alpha?: number; swell?: number; spread?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lines: Float32Array[] = [];
    let w = 0, h = 0, scale = 1, ox = 0, oy = 0;
    let raf = 0, visible = false, dead = false;
    // pointer: target from events, eased current, and a 0..1 strength that eases in on enter and out on leave
    const ptr = { tx: 0, ty: 0, x: 0, y: 0, on: 0, target: 0 };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ptr.x += (ptr.tx - ptr.x) * 0.07;
      ptr.y += (ptr.ty - ptr.y) * 0.07;
      ptr.on += (ptr.target - ptr.on) * 0.03;
      const a = spread * ptr.on, s2 = 2 * SIGMA * SIGMA;
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1.6 * Math.max(scale, 0.6);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      lines.forEach((pts, i) => {
        for (let k = 0; k < pts.length; k += 2) {
          const sw = reduced ? 0 : swell * Math.sin(pts[k] * 0.004 - t * 0.0016 + i * 0.1);
          const sx = ox + pts[k] * scale;
          let sy = oy + (pts[k + 1] + sw) * scale;
          if (a > 0.001) {
            // smooth vertical stretch centred on the pointer: lines above rise, lines below sink, gaps widen
            const dx = sx - ptr.x, dy = sy - ptr.y;
            sy += a * dy * Math.exp(-(dx * dx + dy * dy) / s2);
          }
          if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
      });
      ctx.stroke();
    };

    const loop = (t: number) => {
      draw(t);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const start = () => { if (!reduced && !raf && visible && lines.length) raf = requestAnimationFrame(loop); };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.max(w / VB_W, h / VB_H);
      ox = (w - VB_W * scale) / 2; oy = (h - VB_H * scale) / 2;
      if (reduced || !raf) draw(performance.now());
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top;
      if (inside && ptr.on < 0.01) { ptr.x = ptr.tx; ptr.y = ptr.ty; } // open where the pointer is, not slide in
      ptr.target = inside ? 1 : 0;
    };
    const onLeave = () => { ptr.target = 0; };

    fetch('/brand/pattern-light.svg')
      .then(r => r.text())
      .then(svg => {
        if (dead) return;
        lines = [...svg.matchAll(/\bd="([^"]+)"/g)].map(m => Float32Array.from(m[1].match(/-?\d+(?:\.\d+)?/g) ?? [], Number));
        resize();
        start();
      })
      .catch(() => {});

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });
    io.observe(canvas);
    if (!reduced) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [alpha, swell, spread]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

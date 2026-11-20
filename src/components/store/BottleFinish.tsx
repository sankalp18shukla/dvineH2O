'use client';
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import s from './BottleFinish.module.css';

/** A colour the product is sold in: `cutout` is its transparent product photo, `photos` its gallery shots. */
export type Finish = { key: string; name: string; swatch: string; cutout: string; photos?: string[] };
type Ctx = { finishes: Finish[]; i: number; pick: (i: number) => void };
const FinishCtx = createContext<Ctx | null>(null);

/** The chosen finish, shared by the picker (beside the price) and the product on the stage. */
export function FinishProvider({ finishes, children }: { finishes: Finish[]; children: ReactNode }) {
  const [i, setI] = useState(0);
  return <FinishCtx.Provider value={{ finishes, i, pick: setI }}>{children}</FinishCtx.Provider>;
}
export const useFinish = () => useContext(FinishCtx);

/**
 * Finish picker: anodised-metal swatches as a radio group (arrow keys move between them), with the chosen name
 * rising in beside the label. Rises in with the purchase panel.
 */
export function FinishPicker({ label = 'Colour' }: { label?: string }) {
  const ctx = useFinish();
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  if (!ctx) return null;
  const { finishes, i, pick } = ctx;
  const key = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + finishes.length) % finishes.length;
    pick(n); btns.current[n]?.focus();
  };
  return (
    <div className={s.picker} data-rise>
      <p className={s.label}>
        <span>{label}</span>
        <span className={s.nameBox} aria-live="polite"><span key={finishes[i].key} className={s.name}>{finishes[i].name}</span></span>
      </p>
      <div className={s.swatches} role="radiogroup" aria-label={label} onKeyDown={key}>
        {finishes.map((f, k) => (
          <button key={f.key} ref={el => { btns.current[k] = el; }} type="button" role="radio" aria-checked={k === i} aria-label={f.name}
            tabIndex={k === i ? 0 : -1} className={s.swatch} style={{ ['--c' as string]: f.swatch }} onClick={() => pick(k)}>
            <span className={s.metal} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* The wipe: a wavy fill line travels up the product (along `axis`, degrees, in the image's own frame) and the new
   finish follows behind it, with a narrow sheen riding the front. Returns polygon() points in px. */
function front(w: number, h: number, ax: number, ay: number, at: number, amp: number, ph: number) {
  const R = Math.hypot(w, h) / 2, nx = -ay, ny = ax, cx = w / 2, cy = h / 2, N = 32, pts: [number, number][] = [];
  for (let k = 0; k <= N; k++) {
    const t = -R + (2 * R * k) / N, u = t / R;
    const off = at + amp * (Math.sin(u * 6.9 + ph) + .45 * Math.sin(u * 15.7 - ph * 1.7));
    pts.push([cx + ax * off + nx * t, cy + ay * off + ny * t]);
  }
  return { pts, R, nx, ny, cx, cy };
}
const poly = (pts: [number, number][]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
const HIDE = 'polygon(0 0, 0 0, 0 0)';

/**
 * The product in the chosen finish, one real photo per finish stacked in the same box. A new pick wipes the new
 * finish's photo up over the old one behind a wavy line, with a sheen riding the front, so the colour appears to
 * run up the product. Every finish's cut-out must share one canvas, so the photos line up. Place it where the
 * cut-out would go; `imgClass` sizes the images as the cut-out was (object-fit / object-position), and `position`
 * repeats that object-position for the sheen's mask. `tilt` sways the nearest [data-finish-tilt] as the colour runs.
 */
export function FinishLayers({ axis = -90, position = '50% 100%', imgClass, sizes, alt = '', priority, tilt = false }: {
  axis?: number; position?: string; imgClass?: string; sizes: string; alt?: string; priority?: boolean; tilt?: boolean;
}) {
  const ctx = useFinish();
  const root = useRef<HTMLSpanElement>(null), sheen = useRef<HTMLSpanElement>(null);
  const layers = useRef<(HTMLSpanElement | null)[]>([]);
  // the finish on first paint: the layers' states are React's only then (a constant, so later renders never touch
  // them); after that the wipe owns them
  const [first] = useState(ctx?.i ?? 0);
  const shown = useRef(first), tween = useRef<gsap.core.Tween | null>(null);
  const finishes = ctx?.finishes, i = ctx?.i ?? 0;

  useEffect(() => {
    const el = root.current, sh = sheen.current, ls = layers.current;
    if (!el || !sh || !finishes || i === shown.current) return;
    // a new pick mid-wipe: finish the old one where it was heading, then start from there
    if (tween.current) { tween.current.progress(1); tween.current.kill(); }
    const a = shown.current, b = i;
    shown.current = b;
    const set = (k: number, state: 'base' | 'next' | 'off') => { const l = ls[k]; if (l) l.dataset.state = state; };
    finishes.forEach((_, k) => set(k, k === a ? 'base' : k === b ? 'next' : 'off'));
    const nx = ls[b]!;
    const done = () => {
      finishes.forEach((_, k) => set(k, k === b ? 'base' : 'off'));
      nx.style.clipPath = ''; sh.style.clipPath = HIDE; sh.style.opacity = '0';
      tween.current = null;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return; }

    nx.style.clipPath = HIDE;
    sh.style.setProperty('--mask', `url(${finishes[b].cutout})`);
    const rad = (axis * Math.PI) / 180, ax = Math.cos(rad), ay = Math.sin(rad);
    const o = { p: 0 };
    tween.current = gsap.to(o, {
      p: 1, duration: 1.25, ease: 'power2.inOut',
      onUpdate() {
        const w = el.clientWidth, h = el.clientHeight, R = Math.hypot(w, h) / 2;
        const amp = R * .045 * (.35 + Math.sin(Math.PI * o.p)), ph = o.p * 9;
        // the front runs the product's length (about 0.8 R either side of the centre), not the whole box, so the
        // time is spent on the product
        const L = R * .8, at = -L - amp * 2 + (2 * L + amp * 4) * o.p, band = R * .09;
        const f = front(w, h, ax, ay, at, amp, ph);
        const back = (t: number) => [f.cx - ax * 2 * f.R + f.nx * t, f.cy - ay * 2 * f.R + f.ny * t] as [number, number];
        nx.style.clipPath = poly([...f.pts, back(f.R), back(-f.R)]);
        const g = front(w, h, ax, ay, at - band, amp, ph);
        sh.style.clipPath = poly([...f.pts, ...g.pts.reverse()]);
        sh.style.opacity = String(Math.sin(Math.PI * o.p));
      },
      onComplete: done,
    });
    // the product sways a touch as the colour runs up it, then settles
    const lean = tilt ? el.closest<HTMLElement>('[data-finish-tilt]') : null;
    if (lean) gsap.fromTo(lean, { rotate: 0 }, { keyframes: [{ rotate: 2.4, duration: .45, ease: 'power2.out' }, { rotate: -1, duration: .5, ease: 'sine.inOut' }, { rotate: 0, duration: .7, ease: 'sine.out' }] });
  }, [i, finishes, axis, tilt]);

  useEffect(() => () => { tween.current?.kill(); }, []);
  if (!ctx || !finishes) return null;
  return (
    <span ref={root} className={s.layers} style={{ ['--pos' as string]: position } as CSSProperties}>
      {finishes.map((f, k) => (
        <span key={f.key} ref={el => { layers.current[k] = el; }} className={s.layer} data-state={k === first ? 'base' : 'off'}>
          <Image src={f.cutout} alt={k === i ? alt : ''} fill sizes={sizes} priority={priority && k === 0} className={imgClass} />
        </span>
      ))}
      <span ref={sheen} className={s.sheen} style={{ clipPath: HIDE, opacity: 0 }} aria-hidden="true" />
    </span>
  );
}

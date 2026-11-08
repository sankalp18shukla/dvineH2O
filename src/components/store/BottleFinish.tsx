'use client';
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { gsap } from 'gsap';
import s from './BottleFinish.module.css';

export type Finish = { key: string; name: string; coat: string; swatch: string; gloss: number };
type Ctx = { finishes: Finish[]; i: number; pick: (i: number) => void };
const FinishCtx = createContext<Ctx | null>(null);

/** The chosen bottle finish, shared by the picker (beside the price) and the paint on the product stage. */
export function FinishProvider({ finishes, children }: { finishes: Finish[]; children: ReactNode }) {
  const [i, setI] = useState(0);
  return <FinishCtx.Provider value={{ finishes, i, pick: setI }}>{children}</FinishCtx.Provider>;
}
export const useFinish = () => useContext(FinishCtx);

/**
 * Finish picker: anodised-metal swatches as a radio group (arrow keys move between them), with the chosen name
 * rising in beside the label. Rises in with the purchase panel.
 */
export function FinishPicker() {
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
        <span>Finish</span>
        <span className={s.nameBox} aria-live="polite"><span key={finishes[i].key} className={s.name}>{finishes[i].name}</span></span>
      </p>
      <div className={s.swatches} role="radiogroup" aria-label="Bottle finish" onKeyDown={key}>
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

/* The wipe: a wavy fill line travels up the bottle (along `axis`, degrees, in the image's own frame) and the new
   paint follows behind it, with a narrow sheen riding the front. Returns polygon() points in px. */
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
 * Repaints the bottle's metal in the chosen finish, over the unchanged photo: `shell` is a map of the metal (grey
 * shading in RGB, coverage in alpha) made from the cutout, so the glass, the logo, the trims and the water drops
 * stay the photo's own. The paint is a flat coat × that shading, with the highlights lifted back on. Place it over
 * the cutout, in the same box, with the same object-position. The first finish is the photo itself, so the paint
 * fades away once the wipe brings the bottle back to it.
 */
export function FinishPaint({ shell, axis = -41, position = '50% 50%', tilt = false }: { shell: string; axis?: number; position?: string; tilt?: boolean }) {
  const ctx = useFinish();
  const root = useRef<HTMLSpanElement>(null), next = useRef<HTMLSpanElement>(null), sheen = useRef<HTMLSpanElement>(null);
  const shown = useRef(ctx?.i ?? 0), tween = useRef<gsap.core.Tween | null>(null);
  const finishes = ctx?.finishes, i = ctx?.i ?? 0;

  // the first paint: on unless the photo's own finish is chosen
  useEffect(() => {
    const el = root.current;
    if (!el || !finishes) return;
    el.style.setProperty('--from', finishes[shown.current].coat);
    el.style.setProperty('--gloss', String(finishes[shown.current].gloss));
    el.dataset.on = shown.current ? '1' : '0';
  }, [finishes]);

  useEffect(() => {
    const el = root.current, nx = next.current, sh = sheen.current;
    if (!el || !nx || !sh || !finishes || i === shown.current) return;
    // a new pick mid-wipe: finish the old one where it was heading, then start from there
    if (tween.current) { tween.current.progress(1); tween.current.kill(); }
    const a = finishes[shown.current], b = finishes[i];
    shown.current = i;
    el.style.setProperty('--from', a.coat);
    el.style.setProperty('--to', b.coat);
    el.dataset.on = '1';
    const done = () => {
      el.style.setProperty('--from', b.coat);
      el.style.setProperty('--gloss', String(b.gloss));
      nx.style.clipPath = HIDE; sh.style.clipPath = HIDE; sh.style.opacity = '0';
      el.dataset.on = i ? '1' : '0';
      tween.current = null;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return; }

    const rad = (axis * Math.PI) / 180, ax = Math.cos(rad), ay = Math.sin(rad);
    const o = { p: 0 };
    tween.current = gsap.to(o, {
      p: 1, duration: 1.25, ease: 'power2.inOut',
      onUpdate() {
        const w = el.clientWidth, h = el.clientHeight, R = Math.hypot(w, h) / 2;
        const amp = R * .045 * (.35 + Math.sin(Math.PI * o.p)), ph = o.p * 9;
        // the front runs the bottle's length (about 0.8 R either side of the centre), not the whole box, so the
        // time is spent on the metal
        const L = R * .8, at = -L - amp * 2 + (2 * L + amp * 4) * o.p, band = R * .09;
        const f = front(w, h, ax, ay, at, amp, ph);
        const back = (t: number) => [f.cx - ax * 2 * f.R + f.nx * t, f.cy - ay * 2 * f.R + f.ny * t] as [number, number];
        nx.style.clipPath = poly([...f.pts, back(f.R), back(-f.R)]);
        const g = front(w, h, ax, ay, at - band, amp, ph);
        sh.style.clipPath = poly([...f.pts, ...g.pts.reverse()]);
        sh.style.opacity = String(Math.sin(Math.PI * o.p));
        // the highlights cross over with the front
        el.style.setProperty('--gloss', String(a.gloss + (b.gloss - a.gloss) * o.p));
      },
      onComplete: done,
    });
    // the bottle sways a touch as the colour runs up it, then settles
    const lean = tilt ? el.closest<HTMLElement>('[data-finish-tilt]') : null;
    if (lean) gsap.fromTo(lean, { rotate: 0 }, { keyframes: [{ rotate: 2.4, duration: .45, ease: 'power2.out' }, { rotate: -1, duration: .5, ease: 'sine.inOut' }, { rotate: 0, duration: .7, ease: 'sine.out' }] });
  }, [i, finishes, axis, tilt]);

  useEffect(() => () => { tween.current?.kill(); }, []);
  if (!ctx) return null;
  const style = { ['--shell' as string]: `url(${shell})`, ['--pos' as string]: position } as CSSProperties;
  return (
    <span ref={root} className={s.paint} style={style} aria-hidden="true">
      <span className={s.coat} />
      <span ref={next} className={`${s.coat} ${s.next}`} style={{ clipPath: HIDE }} />
      <span className={s.shade} />
      <span className={s.gloss} />
      <span ref={sheen} className={s.sheen} style={{ clipPath: HIDE, opacity: 0 }} />
    </span>
  );
}

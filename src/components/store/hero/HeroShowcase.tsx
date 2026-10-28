'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { HERO_SLIDES } from '@/lib/content';
import { Icon } from '@/components/ui/Icon';
import { FeatIcon } from './FeatIcon';
import s from './Hero.module.css';

type Slide = typeof HERO_SLIDES[number];
const AUTOPLAY = 7000;

/** Where each product floats in the hero card (fractions of the card), its lean and resting turn, and its
    brand squiggle, tucked behind the product's upper-left edge so one loop shows beside it. All three lean
    the same way; the two water systems lean less than the bottle (SYSTEM_TILT). */
const TILT = -0.42, SYSTEM_TILT = -0.24;
const PLACEMENT = [
  { desk: { cx: .73, cy: .74, h: 1.3, w: .56 }, tilt: TILT, rest: 0.25, sway: 0.5, sq: { cx: .72, cy: .22, w: .16 } },
  { desk: { cx: .79, cy: .64, h: .88, w: .42 }, tilt: SYSTEM_TILT, rest: -0.62, sway: 0.2, sq: { cx: .635, cy: .22, w: .16 } },
  { desk: { cx: .78, cy: .78, h: 1.36, w: .32 }, tilt: SYSTEM_TILT, rest: -0.55, sway: 0.18, sq: { cx: .68, cy: .17, w: .16 } },
];

/** Looping brush line from the brand book's "Brand Elements" page. */
const SQUIGGLE = 'M150 22c22-14 44 2 36 22-9 22-48 18-70 4-26-16-60-14-80 8-24 26-8 62 26 64 34 2 52-26 82-26 40 0 66 30 58 62-7 30-46 40-70 22-20-15-6-44 22-42 34 2 58 40 48 92';

export function HeroShowcase({ slides }: { slides: Slide[] }) {
  const hero = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const stage = useRef<{ show: (i: number) => void; dragging: () => boolean; dispose: () => void } | null>(null);
  const state = useRef({ current: 0, timer: 0, paused: false });

  const goTo = (i: number) => {
    const n = (i + slides.length) % slides.length;
    if (n === state.current.current) return;
    const prev = state.current.current;
    state.current.current = n; state.current.timer = 0;
    setLeaving(prev);
    setCurrent(n);
    stage.current?.show(n);
    window.setTimeout(() => setLeaving(l => (l === prev ? null : l)), 900);
  };

  // autoplay + swipe + keys
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const d = Math.min(now - last, 100); last = now;
      if (reduce || state.current.paused || document.hidden || stage.current?.dragging()) return;
      state.current.timer += d;
      if (state.current.timer > AUTOPLAY) goTo(state.current.current + 1);
    };
    raf = requestAnimationFrame(tick);
    const el = hero.current!;
    let sx: number | null = null, sy = 0;
    const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const te = (e: TouchEvent) => {
      if (sx === null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) goTo(state.current.current + (dx < 0 ? 1 : -1)); sx = null;
    };
    const fin = (e: FocusEvent) => { if ((e.target as HTMLElement).closest('[data-slide]')) state.current.paused = true; };
    const fout = () => { state.current.paused = false; };
    el.addEventListener('touchstart', ts, { passive: true }); el.addEventListener('touchend', te, { passive: true });
    el.addEventListener('focusin', fin); el.addEventListener('focusout', fout);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('touchstart', ts); el.removeEventListener('touchend', te); el.removeEventListener('focusin', fin); el.removeEventListener('focusout', fout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // three.js stage
  useEffect(() => {
    let disposed = false;
    (async () => {
      const mod = await import('./stage');
      if (disposed || !canvas.current || !hero.current) return;
      try {
        stage.current = await mod.createStage({
          canvas: canvas.current, hero: hero.current, models: slides.map(x => x.model), accents: slides.map(x => x.accent), squiggle: SQUIGGLE,
          placement: PLACEMENT, copyFor: i => hero.current!.querySelectorAll<HTMLElement>('[data-copy]')[i],
          onFirstLoad: () => setLoaded(true), initial: state.current.current,
        });
      } catch { setLoaded(true); }
    })();
    return () => { disposed = true; stage.current?.dispose(); stage.current = null; };
  }, [slides]);

  return (
    <section ref={hero} className={`${s.hero} on-dark`} aria-roledescription="carousel" aria-label="DVINE H2O products">
      <canvas ref={canvas} className={s.canvas} aria-hidden="true" />
      <div className={`${s.loading} ${loaded ? s.done : ''}`} aria-hidden="true">Loading</div>
      <div className={s.slides}>
        {slides.map((sl, i) => {
          const cls = i === current ? s.active : i === leaving ? s.leaving : '';
          return (
            <article key={sl.key} data-slide className={`${s.slide} ${s[sl.key] ?? ''} ${cls}`} style={{ ['--accent' as string]: sl.accent }} aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}: ${sl.name}`} aria-hidden={i !== current}>
              <div className={s.copy} data-copy>
                <h2 className={s.head}>
                  <span className={`${s.desc} ${s.f}`} style={{ ['--i' as string]: 0 }}><i /><span className={s.tag}><span>{sl.desc[0]}</span><span>{sl.desc[1]}</span><em>{sl.desc[2]}</em></span><i /></span>
                  <span className={`${s.name} ${s.f}`} style={{ ['--i' as string]: 1 }}>{sl.name}</span>
                </h2>
                <div className={s.body}>
                  <p className={`${s.lede} ${s.f}`} style={{ ['--i' as string]: 2 }}>{sl.lede}</p>
                  <div className={`${s.ctas} ${s.f}`} style={{ ['--i' as string]: 3 }}>
                    {sl.ctas.map(c => (
                      <Link key={c.href} href={c.href} tabIndex={i === current ? 0 : -1} className={`${s.cta} ${c.primary ? s.primary : s.ghost}`}>
                        {c.primary && <span className={s.chip} aria-hidden="true"><Icon name="arrow" /></span>}
                        <span>{c.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <ul className={s.feats}>
                  {sl.feats.map((f, k) => (
                    <li key={f.title} className={`${s.feat} ${s.f}`} style={{ ['--i' as string]: 4 + k }}>
                      <FeatIcon name={f.icon} /><div><b>{f.title}</b><span>{f.sub}</span></div>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
      <div className={s.kb}>
        <button onClick={() => goTo(current - 1)}>Previous product</button>
        <button onClick={() => goTo(current + 1)}>Next product</button>
      </div>
    </section>
  );
}

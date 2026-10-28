'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { LOADING, READY } from './SmoothScroll';
import s from './Preloader.module.css';

/** Never hold the page longer than this, however slow the network; never flash for less than MIN. */
const MAX = 7000, MIN = 1100;
/** Shown once per visit: coming back to home from another page skips it. */
let shown = false;

/** Fetches a file to warm the HTTP cache, reporting 0–1 as its bytes arrive. */
async function warm(url: string, on: (p: number) => void) {
  const res = await fetch(url);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) { await res.arrayBuffer(); return on(1); }
  const reader = res.body.getReader();
  for (let got = 0; ;) {
    const { done, value } = await reader.read();
    if (done) break;
    got += value.length; on(Math.min(got / total, 1));
  }
  on(1);
}

/** Resolves once the first scroll-scrubbed clip on the page can play through (it is given its src on mount). */
const clipReady = () => new Promise<void>(done => {
  const v = document.querySelector<HTMLVideoElement>('#main video');
  if (!v || v.readyState >= 4) return done();
  v.addEventListener('canplaythrough', () => done(), { once: true });
  v.addEventListener('error', () => done(), { once: true });
});

/**
 * Home-page loading curtain. The DVINE wordmark fills with Glacier water as the hero's first 3D model,
 * the fonts, the page and the water-drop clip come in, with the count beside it. At 100 the water tops
 * out and the curtain lifts off the top of the screen on a curved edge, uncovering the hero. The page
 * starts at the top and holds still underneath (Lenis is stopped while <html> has .is-loading).
 */
export function Preloader({ model }: { model: string }) {
  const [on, setOn] = useState(() => !shown);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!on) return;
    shown = true;
    const el = root.current!, html = document.documentElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    html.classList.add(LOADING);
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0);

    // each part's share of the count, filled as it arrives
    const parts = { model: 0, fonts: 0, page: 0, clip: 0 };
    const weight = { model: 4, fonts: 1, page: 2, clip: 3 };
    const sum = Object.values(weight).reduce((a, b) => a + b, 0);
    const target = () => (Object.keys(parts) as (keyof typeof parts)[]).reduce((a, k) => a + parts[k] * weight[k], 0) / sum;

    // the shown level eases after the real one, so the water rises smoothly rather than in jumps
    const level = { v: 0 };
    const count = el.querySelector<HTMLElement>(`.${s.count}`)!;
    const paint = () => {
      el.style.setProperty('--fill', String(level.v));
      count.textContent = String(Math.round(level.v * 100)).padStart(3, '0');
    };
    const follow = () => { level.v += (target() - level.v) * 0.08; paint(); };
    gsap.ticker.add(follow);

    const t0 = performance.now();
    const all = Promise.all([
      warm(model, p => { parts.model = p; }).catch(() => { parts.model = 1; }),
      document.fonts.ready.then(() => { parts.fonts = 1; }),
      (document.readyState === 'complete' ? Promise.resolve() : new Promise(r => addEventListener('load', r, { once: true }))).then(() => { parts.page = 1; }),
      clipReady().then(() => { parts.clip = 1; }),
    ]);
    const cap = new Promise(r => setTimeout(r, MAX));

    let tl: gsap.core.Timeline | undefined, alive = true;
    Promise.race([all, cap])
      .then(() => new Promise(r => setTimeout(r, Math.max(0, MIN - (performance.now() - t0)))))
      .then(() => {
        if (!alive) return;
        gsap.ticker.remove(follow);
        const finish = () => {
          html.classList.remove(LOADING);
          window.dispatchEvent(new Event(READY));
          setOn(false);
        };
        if (reduce) { level.v = 1; paint(); return finish(); }
        tl = gsap.timeline({ onComplete: finish })
          // top the water out and land the count on 100
          .to(level, { v: 1, duration: 0.6, ease: 'power2.out', onUpdate: paint })
          .to(el.querySelector(`.${s.inner}`), { y: -40, opacity: 0, duration: 0.55, ease: 'power3.in' }, '+=0.15')
          // the curtain lifts away, its bottom edge bowing as it goes
          .to(el, { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, '-=0.2')
          .fromTo(el.querySelector(`.${s.edge}`), { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'power2.out' }, '<')
          .to(el.querySelector(`.${s.edge}`), { scaleY: 0, duration: 0.55, ease: 'power2.in' }, '>-0.1');
        // the page unlocks just before the curtain clears, so the hero is already live as it comes into view
        tl.call(() => html.classList.remove(LOADING), undefined, '-=0.5');
      });

    return () => { alive = false; gsap.ticker.remove(follow); tl?.kill(); html.classList.remove(LOADING); };
  }, [on, model]);

  if (!on) return null;
  return (
    <div ref={root} className={s.curtain} role="status" aria-live="polite" aria-label="Loading DVINE H2O">
      <span className={`wave-lines-blue ${s.pattern}`} aria-hidden="true" />
      <div className={s.inner} aria-hidden="true">
        <div className={s.mark}>
          <span className={s.water}><span className={s.wave} /><span className={`${s.wave} ${s.back}`} /></span>
        </div>
        <div className={s.meta}>
          <span className={s.tagline}>Water <em>as intended.</em></span>
          <span className={s.count}>000</span>
        </div>
      </div>
      <span className={s.edge} aria-hidden="true" />
    </div>
  );
}

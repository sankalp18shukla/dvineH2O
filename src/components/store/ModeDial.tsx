'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lockup } from '@/components/ui/Brand';
import { WaveBand } from './WaveBand';
import { smooth } from './SmoothScroll';
import s from './ModeDial.module.css';

gsap.registerPlugin(ScrollTrigger);

type Mode = { key: string; title: string; body: string; color: string };

/** one tick every 5° around the bezel */
const TICKS = Array.from({ length: 72 }, (_, k) => k * 5);

/**
 * Crystal 03 · Water modes. Four modes on a dial. On desktop the band pins under the header and the ring turns
 * with the scroll, straight and smooth (no snapping, no progress bar): each mode in turn comes up to the top,
 * lit in its own colour, while its row opens on the left and the band takes on its colour. Clicking a row
 * scrolls to that mode. Phones and reduced motion get a plain band where tapping a row turns the dial.
 */
export function ModeDial({ title, items, note, children, overlap = false }: { title: string; items: Mode[]; note: string; children?: ReactNode; overlap?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const orbit = useRef<HTMLDivElement>(null);
  const st = useRef<ScrollTrigger | null>(null);
  const [i, setI] = useState(0);
  const cur = useRef(0);
  const step = 360 / items.length, last = items.length - 1;

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      el.classList.add(s.h);
      const turn = gsap.quickTo(orbit.current!, 'rotation', { duration: .6, ease: 'power3.out' });
      // the section's padding is the wave band's bleed: the stage only sticks once that has scrolled past
      const pad = () => parseFloat(getComputedStyle(el).paddingTop) || 0;
      st.current = ScrollTrigger.create({
        trigger: el, start: () => `top+=${pad()} 76px`, end: () => `bottom-=${pad()} bottom`, invalidateOnRefresh: true,
        onUpdate: ({ progress }) => {
          turn(-progress * last * step);
          const k = Math.round(progress * last);
          if (k !== cur.current) { cur.current = k; setI(k); }
        },
      });
      // Hold the list at its tallest (every row shut but the longest line): as one row folds and the next opens
      // their sum dips for a few frames, which bobbed the note and buttons below up and down while scrolling.
      const list = el.querySelector<HTMLElement>(`.${s.list}`)!;
      const fit = () => {
        list.style.minHeight = '';
        const open = list.querySelector<HTMLElement>(`.${s.on} .${s.more}`);
        const tallest = Math.max(...Array.from(list.querySelectorAll<HTMLElement>(`.${s.more} > p`), p => p.scrollHeight));
        list.style.minHeight = `${list.offsetHeight - (open?.offsetHeight ?? 0) + tallest}px`;
      };
      ScrollTrigger.addEventListener('refresh', fit);
      ScrollTrigger.refresh();
      return () => {
        ScrollTrigger.removeEventListener('refresh', fit); list.style.minHeight = '';
        el.classList.remove(s.h); st.current = null; gsap.set(orbit.current, { clearProps: 'transform' });
      };
    });
    return () => mm.revert();
  }, [last, step]);

  const pick = (k: number) => {
    const t = st.current;
    const top = t ? t.start + (t.end - t.start) * (k / last) + 1 : 0;
    if (t && smooth.lenis) smooth.lenis.scrollTo(top, { duration: 1.2 });
    else if (t) window.scrollTo({ top, behavior: 'smooth' });
    else { cur.current = k; setI(k); }
  };
  const m = items[i];

  return (
    <section ref={root} id="modes" className={`on-dark ${s.section} ${overlap ? s.overlap : ''}`} aria-labelledby="modes-title">
      <div className={s.stage}>
        {/* the band runs well past the stage, so its wavy edges sit far above the title and below the buttons */}
        <div className={s.band} aria-hidden="true" data-no-hold><WaveBand interactive /></div>
        {/* sits on the stage, which always lies inside the band's wavy edges, so it never shows a straight edge */}
        <span className={s.scrim} aria-hidden="true" data-no-hold />
        <div className={`container-x ${s.grid}`}>
          <div>
            <Lockup id="modes-title" title={title} tone="glacier" size="md" />
            <ul className={s.list} role="tablist" aria-label="Water modes">
              {items.map((it, k) => (
                <li key={it.key} className={`${s.row} ${k === i ? s.on : ''}`} style={{ ['--c' as string]: it.color }}>
                  <button type="button" role="tab" id={`mode-${it.key}`} aria-selected={k === i} aria-controls={`mode-${it.key}-p`} className={s.tab} onClick={() => pick(k)}>
                    <span className={s.dot} aria-hidden="true" />
                    <h3 className={s.name}>{it.title}</h3>
                    <span className={s.num} aria-hidden="true">0{k + 1}</span>
                  </button>
                  <div className={s.more} id={`mode-${it.key}-p`} role="tabpanel" aria-labelledby={`mode-${it.key}`}><p>{it.body}</p></div>
                </li>
              ))}
            </ul>
            <p className={s.note}>{note}</p>
            {children && <div className="cta-row mt-8">{children}</div>}
          </div>

          <div className={s.dial} aria-hidden="true" style={{ ['--c' as string]: m.color }}>
            <svg className={s.ring} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgb(255 255 255 / .1)" strokeWidth=".2" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="rgb(255 255 255 / .16)" strokeWidth=".2" />
              {/* the index at the top, where the selected mode comes to rest */}
              <path d="M48.6 1.6h2.8L50 4.4z" fill="var(--c)" className={s.index} />
            </svg>
            <div ref={orbit} className={s.orbit} style={{ ['--rot' as string]: `${-i * step}deg` }}>
              {/* a bezel of fine ticks that turns with the orbs; a longer tick marks each mode */}
              <svg className={s.ring} viewBox="0 0 100 100">
                {TICKS.map(a => {
                  const major = a % step === 0, r0 = major ? 42 : 43.6, r1 = 45.6, rad = (a * Math.PI) / 180;
                  // rounded, so the server's and the browser's last-digit float differences can't break hydration
                  const at = (r: number, f: (x: number) => number, sign: number) => Math.round((50 + sign * r * f(rad)) * 1e3) / 1e3;
                  return <line key={a} x1={at(r0, Math.sin, 1)} y1={at(r0, Math.cos, -1)} x2={at(r1, Math.sin, 1)} y2={at(r1, Math.cos, -1)}
                    stroke={major ? 'rgb(255 255 255 / .7)' : 'rgb(255 255 255 / .22)'} strokeWidth={major ? .35 : .2} strokeLinecap="round" />;
                })}
              </svg>
              {items.map((it, k) => <span key={it.key} className={`${s.orb} ${k === i ? s.lit : ''}`} style={{ ['--c' as string]: it.color, ['--a' as string]: `${k * step}deg` }} />)}
            </div>
            <div className={s.core}>
              <span key={`n${i}`} className={`${s.coreNum} ${s.swap}`}>0{i + 1}</span>
              <span key={`t${i}`} className={`${s.coreName} ${s.swap}`}>{m.title}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

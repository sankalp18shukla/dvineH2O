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

/**
 * Crystal 03 · Water modes. Four modes on a dial. On desktop the band pins under the header and the ring turns
 * with the scroll, straight and smooth (no snapping, no progress bar): each mode in turn comes up to the top,
 * lit in its own colour, while its row opens on the left and the band takes on its colour. Clicking a row
 * scrolls to that mode. Phones and reduced motion get a plain band where tapping a row turns the dial.
 */
export function ModeDial({ title, items, note, children }: { title: string; items: Mode[]; note: string; children?: ReactNode }) {
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
      st.current = ScrollTrigger.create({
        trigger: el, start: 'top 76px', end: 'bottom bottom', invalidateOnRefresh: true,
        onUpdate: ({ progress }) => {
          turn(-progress * last * step);
          const k = Math.round(progress * last);
          if (k !== cur.current) { cur.current = k; setI(k); }
        },
      });
      ScrollTrigger.refresh();
      return () => { el.classList.remove(s.h); st.current = null; gsap.set(orbit.current, { clearProps: 'transform' }); };
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
    <section ref={root} id="modes" className={`on-dark ${s.section}`} aria-labelledby="modes-title">
      <div className={s.stage}>
        <WaveBand />
        <span className={s.wash} style={{ background: `radial-gradient(45% 65% at 74% 50%, ${m.color}38, transparent 72%)` }} aria-hidden="true" />
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
              <circle cx="50" cy="50" r="35" fill="none" stroke="rgb(255 255 255 / .2)" strokeWidth=".3" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(255 255 255 / .12)" strokeWidth=".25" strokeDasharray=".4 1.6" />
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgb(255 255 255 / .08)" strokeWidth=".25" />
              {/* a marker at the top, where the selected mode comes to rest */}
              <path d="M50 3.2v4.6" stroke="var(--color-voltage)" strokeWidth=".7" strokeLinecap="round" />
            </svg>
            <div ref={orbit} className={s.orbit} style={{ ['--rot' as string]: `${-i * step}deg` }}>
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

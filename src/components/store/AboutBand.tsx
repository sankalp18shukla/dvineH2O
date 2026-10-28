'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BandLockup, Squiggle } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import { WaveBand } from './WaveBand';
import hero from './hero/Hero.module.css';
import s from './About.module.css';

gsap.registerPlugin(ScrollTrigger);

/** Scrubbed timeline units: the band opens, the copy glows up word by word as the squiggles draw, then the buttons. */
const OPEN = 1, COPY = 1.6, BTNS = .6;

/**
 * 06 · About: "Meet [water as intended] DVINE." centred over the Glacier wave band (its top and bottom borders are
 * wave lines, which follow the scroll and the pointer), the copy below between two squiggles, then the hero's two
 * buttons. Scrubbed with the scroll: the band's pins slide apart and the sticker slaps on once it is open (as
 * TagReveal does elsewhere), the copy lights up word by word with a soft glow while both squiggles draw themselves,
 * and the buttons rise in last. Reduced motion, or no JS, shows it all.
 */
export function AboutBand({ lead, tail, body }: { lead: string; tail: string; body: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const band = el.querySelector<HTMLElement>('.band-lk')!;
      const words = el.querySelectorAll(`.${s.word}`), btns = el.querySelectorAll(`.${s.btns} > *`);
      const paths = el.querySelectorAll<SVGPathElement>(`.${s.squiggle} path`), len = paths[0].getTotalLength();
      // --open is written straight to the element (see setOpen in FitShowcase.tsx for why)
      const open = (v: number) => {
        band.style.setProperty('--open', String(v));
        band.classList.toggle('is-opening', v < 1);
        band.classList.toggle('is-stuck', v >= 1);
      };
      const o = { v: 0 };
      open(0);
      gsap.set(words, { opacity: .12, filter: 'blur(6px)' });
      gsap.set(paths, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(btns, { opacity: 0, y: 26 });

      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', end: 'center 40%', scrub: .8 } })
        .to(o, { v: 1, duration: OPEN, ease: 'power4.inOut', onUpdate: () => open(o.v) }, 0)
        .to(words, { opacity: 1, filter: 'blur(0px)', duration: .4, stagger: (COPY - .4) / Math.max(words.length, 1), ease: 'none' }, OPEN)
        .to(paths, { strokeDashoffset: 0, duration: COPY, ease: 'power1.inOut' }, OPEN)
        .to(btns, { opacity: 1, y: 0, duration: BTNS, stagger: .15, ease: 'power3.out' }, OPEN + COPY);
      return () => {
        tl.scrollTrigger?.kill(); tl.kill();
        band.style.removeProperty('--open'); band.classList.remove('is-opening', 'is-stuck');
        gsap.set([words, paths, btns], { clearProps: 'all' });
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} id="about" className="relative overflow-hidden py-32 text-ink sm:py-44" aria-labelledby="about-title" data-own-motion>
      <WaveBand tone="glacier" interactive />
      <div className="container-x relative flex flex-col items-center text-center">
        <BandLockup id="about-title" lead={lead} tail={tail} className="text-[clamp(38px,8vw,124px)]" />
        <div className="mt-14 max-w-3xl px-2 sm:mt-16">
          <div className="relative isolate">
            <Squiggle className={`${s.squiggle} pointer-events-none absolute -top-10 -left-14 -z-10 hidden w-24 -rotate-12 text-voltage md:block lg:-left-16 lg:w-28`} />
            <Squiggle className={`${s.squiggle} pointer-events-none absolute -right-14 -bottom-10 -z-10 hidden w-24 rotate-[168deg] text-voltage md:block lg:-right-16 lg:w-28`} />
            <p className="font-serif text-[22px] leading-snug text-ink sm:text-[28px]">
              {body.split(' ').map((w, i) => <span key={i} className={s.word}>{w} </span>)}
            </p>
          </div>
          <div className="mt-10 flex justify-center">
            <div className={`${hero.ctas} ${s.btns} justify-center`} style={{ marginTop: 0 }}>
              <a href="#collection" className={`${hero.cta} ${hero.primary} ${s.solid}`}>
                <span className={hero.chip} aria-hidden="true"><Icon name="arrow" /></span>
                <span>Meet the Products</span>
              </a>
              <Link href="/support#contact" className={`${hero.cta} ${hero.ghost} ${s.glass} glare`}>Ask Us a Question</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DieCut, Lockup } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import { FooterWaves } from './FooterWaves';
import hero from './hero/Hero.module.css';
import s from './Assist.module.css';

gsap.registerPlugin(ScrollTrigger);

/** Scrubbed timeline units: the frame opens and the sticker slaps on, the heading opens, the copy lights up, the buttons rise. */
const FRAME = 1, HEAD = 1, COPY = 1.2, BTNS = .6, STICK = .6;

/**
 * 07 · Assistance: the brand handover photo fills a pinned frame, with the brand wave lines flowing over it
 * (white strokes only, no fill; a slow, shallow swell and a slight parting around the pointer). "Questions / before you order?" with the copy and
 * the hero's two buttons on the sky, the "BRB, Refilling." sticker hanging off the frame. Scrubbed with the scroll:
 * the frame's squares slide out to its corners and the sticker slaps on once it is open, the heading's pins slide
 * apart, the copy lights up word by word, and the buttons rise in. Reduced motion, or no JS, shows it all.
 */
export function AssistBand({ title, body }: { title: string; body: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const frame = el.querySelector<HTMLElement>('.pin-frame')!, heading = el.querySelector<HTMLElement>('.lk')!;
      const words = el.querySelectorAll(`.${s.word}`), btns = el.querySelectorAll(`.${s.btns} > *`), sticker = el.querySelector('.diecut');
      // --open is written straight to the element (see setOpen in FitShowcase.tsx for why)
      const open = (t: HTMLElement, v: number) => {
        t.style.setProperty('--open', String(v));
        t.classList.toggle('is-opening', v < 1);
      };
      const f = { v: 0 }, h = { v: 0 };
      open(frame, 0); open(heading, 0);
      gsap.set(words, { opacity: .15, filter: 'blur(6px)' });
      gsap.set(btns, { opacity: 0, y: 26 });
      gsap.set(sticker, { scale: 0, rotate: 30, opacity: 0 });

      const at = { head: FRAME * .7, copy: FRAME * .7 + HEAD * .8 };
      const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 90%', end: 'center 40%', scrub: .8 } })
        .to(f, { v: 1, duration: FRAME, ease: 'power3.inOut', onUpdate: () => open(frame, f.v) }, 0)
        .to(h, { v: 1, duration: HEAD, ease: 'power4.inOut', onUpdate: () => open(heading, h.v) }, at.head)
        .to(words, { opacity: 1, filter: 'blur(0px)', duration: .4, stagger: (COPY - .4) / Math.max(words.length, 1), ease: 'none' }, at.copy)
        .to(btns, { opacity: 1, y: 0, duration: BTNS, stagger: .15, ease: 'power3.out' }, at.copy + COPY)
        .to(sticker, { scale: 1, rotate: 0, opacity: 1, duration: STICK, ease: 'back.out(2.6)' }, FRAME);
      return () => {
        tl.scrollTrigger?.kill(); tl.kill();
        [frame, heading].forEach(t => { t.style.removeProperty('--open'); t.classList.remove('is-opening'); });
        gsap.set([words, btns, sticker], { clearProps: 'all' });
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="section" aria-labelledby="assist-title" data-own-motion>
      <div className="container-x">
        <div className="pin-frame relative" style={{ ['--pin' as string]: 'var(--color-glacier)' }}>
          <div className={`${s.sky} on-dark relative overflow-hidden px-6 py-14 text-white sm:px-14 sm:py-16 lg:py-[72px]`}>
            <div className={s.photo}>
              <Image src="/images/brand-handover.webp" alt="" fill sizes="(min-width:1024px) 900px, 100vw" className="object-cover lg:object-[30%_50%]" />
            </div>
            <span className={s.scrim} aria-hidden="true" />
            <FooterWaves alpha={0.2} swell={4} spread={0.12} className="pointer-events-none absolute inset-0 size-full" />
            <div className="relative max-w-2xl">
              <Lockup id="assist-title" title={title} tone="glacier" className={s.title} />
              <p className="mt-9 text-[19px] leading-relaxed text-white/90 sm:text-xl">
                {body.split(' ').map((w, i) => <span key={i} className={s.word}>{w} </span>)}
              </p>
              <div className={`${hero.ctas} ${s.btns}`} style={{ ['--accent' as string]: 'var(--color-glacier)' }}>
                <Link href="/support#contact" className={`${hero.cta} ${hero.primary}`}>
                  <span className={hero.chip} aria-hidden="true"><Icon name="arrow" /></span>
                  <span>Contact DVINE</span>
                </Link>
                <Link href="/support#products" className={`${hero.cta} ${hero.ghost} glare`}>Get Product Support</Link>
              </div>
            </div>
          </div>
          <DieCut text={'BRB,\nRefilling.'} className="absolute -top-7 right-6 z-[4] text-[24px] sm:right-16 sm:text-[30px]" />
        </div>
      </div>
    </section>
  );
}

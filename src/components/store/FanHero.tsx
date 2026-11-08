'use client';
/* eslint-disable @next/next/no-img-element -- photos may be any hosted URL set in the admin */
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lockup, Tape } from '@/components/ui/Brand';
import { Words } from '@/components/ui/Cta';
import s from './FanHero.module.css';

gsap.registerPlugin(ScrollTrigger);

type Tone = 'glacier' | 'flash' | 'volt';
const PIN: Record<Tone, string> = { glacier: 'var(--color-glacier)', flash: 'var(--color-flash)', volt: 'var(--color-voltage)' };

/**
 * Hero for the service pages (water testing, partners): copy left, and on the right a hand of three photos, the
 * two at the back as white-edged prints, the one in front pinned and taped with the page's sticker on it. On load
 * the prints are dealt out from a stack; as the page scrolls the hand fans wider, scrubbed (no snapping).
 * `front` is the front photo (an <img> or a film), `back` the two prints behind it. Reduced motion shows it at rest.
 */
export function FanHero({ id, title, tone, body, front, back, sticker, children }: {
  id: string; title: string; tone: Tone; body?: string; front: ReactNode; back: [{ src: string; alt: string }, { src: string; alt: string }];
  sticker?: ReactNode; children?: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const [l, r, f] = [`.${s.left}`, `.${s.right}`, `.${s.front}`].map(q => el.querySelector<HTMLElement>(q)!);
      // dealt out: each print starts on the stack under the front one and slides to its place in the hand
      gsap.timeline({ delay: .2 })
        .from(f, { y: 60, rotate: 4, opacity: 0, duration: .9, ease: 'power3.out' }, 0)
        .from([l, r], { xPercent: (i: number) => (i ? -42 : 42), rotate: 0, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .08 }, .25)
        .from(`.${s.sticker}`, { scale: 0, rotate: -30, opacity: 0, duration: .6, ease: 'back.out(2.6)' }, 1);
      // the hand fans wider as the hero scrolls away (on the inner layer, so the deal-in never fights it)
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: .6 } });
      tl.to(`.${s.left} > .${s.in}`, { xPercent: -14, yPercent: 6, rotate: -5, ease: 'none' }, 0)
        .to(`.${s.right} > .${s.in}`, { xPercent: 14, yPercent: 4, rotate: 5, ease: 'none' }, 0)
        .to(`.${s.front} > .${s.in}`, { yPercent: -5, ease: 'none' }, 0);
    }, el);
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="overflow-x-clip pt-8 pb-10 sm:pt-14 sm:pb-14" aria-labelledby={id}>
      <div className="container-x grid items-center gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20 [&>*]:min-w-0">
        <div className="flex flex-col gap-8">
          <Lockup id={id} as="h1" title={title} tone={tone} size="md" />
          {body && <p className="max-w-xl font-serif text-[21px] leading-snug text-ink italic sm:text-[24px]" data-words><Words text={body} /></p>}
          {children}
        </div>
        <div className={s.hand}>
          {back.map((b, i) => (
            <figure key={b.src} className={`${s.print} ${i ? s.right : s.left}`}>
              <span className={s.in}><span className={s.paper}><img src={b.src} alt={b.alt} /></span></span>
            </figure>
          ))}
          <figure className={`${s.print} ${s.front}`}>
            <span className={s.in}>
              <span className="pin-frame relative block size-full" style={{ ['--pin' as string]: PIN[tone] }}>
                <span className={s.photo}>{front}</span>
              </span>
              <Tape className={s.tape} />
              {sticker && <span className={s.sticker} aria-hidden="true">{sticker}</span>}
            </span>
          </figure>
        </div>
      </div>
    </section>
  );
}

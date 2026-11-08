'use client';
/* eslint-disable @next/next/no-img-element -- the photo may be any hosted URL set in the admin */
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DieCut, Squiggle } from '@/components/ui/Brand';
import { tuck } from './squiggleTuck';
import s from './ProductStage.module.css';

gsap.registerPlugin(ScrollTrigger);

type Tone = 'glacier' | 'flash' | 'volt';

/**
 * Inner-page hero stage, the photo counterpart of the product pages' ProductStage: the same white pinned frame,
 * faded watermark word and squiggle, with the page's photo (or film) held in the brand disc. It loads in the same
 * way (frame squares open, disc opens from its centre, squiggle draws, photo settles, sticker slaps on) and the
 * watermark slides along its line with the scroll. `media` is the photo or film element; `badge` replaces the
 * die-cut sticker (e.g. the round "water as intended" sticker). Reduced motion shows it all at rest.
 */
export function PageStage({ word, tone, media, sticker, badge }: {
  word: string; tone: Tone; media?: ReactNode; sticker?: string; badge?: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const pin = { glacier: 'var(--color-glacier)', flash: 'var(--color-flash)', volt: 'var(--color-voltage)' }[tone];
  const stickerTone = ({ glacier: 'blue', flash: 'orange', volt: 'red' } as const)[tone];

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    const [back, front] = el.querySelectorAll<SVGPathElement>(`.${s.squiggle} path`);
    const line = tuck(back, front, el.querySelector<HTMLElement>(`.${s.disc}`)!, 11);
    line.draw(1);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ delay: .25 })
        .fromTo(`.${s.disc}`, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(71% at 50% 50%)', duration: 1.1, ease: 'power3.inOut' }, 0)
        .fromTo({ p: 0 }, { p: 0 }, { p: 1, duration: 2.2, ease: 'power1.inOut', onUpdate() { line.draw(this.targets()[0].p); } }, 0)
        .fromTo(`.${s.portholeIn}`, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, .1)
        .fromTo(`.${s.mark}`, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, .2)
        .fromTo(`.diecut, .${s.badge}`, { scale: 0, rotate: -30, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: .6, ease: 'back.out(2.6)' }, 1.05);
      gsap.fromTo(`.${s.markIn}`, { xPercent: 4 }, { xPercent: -9, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: .6 } });
    }, el);
    return () => { mm.revert(); line.stop(); line.draw(1); };
  }, []);

  return (
    <div ref={root} className={s[tone]}>
      <div className={`pin-frame ${s.stage}`} style={{ ['--pin' as string]: pin }}>
        <span className={s.mark} aria-hidden="true"><span className={s.markIn}>{word}</span></span>
        <Squiggle className={s.squiggle} />
        <Squiggle className={`${s.squiggle} ${s.front}`} />
        <span className={`${s.disc} ${s.porthole}`}>
          {media ? <span className={s.portholeIn}>{media}</span> : <span className={`wave-lines-blue ${s.pattern}`} />}
        </span>
        {badge ? <span className={s.badge} aria-hidden="true">{badge}</span> : sticker && <DieCut text={sticker} tone={stickerTone} className={s.sticker} />}
      </div>
    </div>
  );
}

/** A plain photo for PageStage's disc. */
export function StagePhoto({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="size-full object-cover" />;
}

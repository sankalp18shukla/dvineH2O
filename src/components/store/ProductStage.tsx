'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DieCut, Squiggle } from '@/components/ui/Brand';
import { FinishPaint, useFinish } from './BottleFinish';
import { tuck } from './squiggleTuck';
import s from './ProductStage.module.css';

gsap.registerPlugin(ScrollTrigger);

type Tone = 'glacier' | 'flash' | 'volt';

/**
 * Product page gallery (C01–C05 / B01–B04): opens on the product cutout standing on its brand disc, as on the
 * home collection, with the product photos one tap away in the thumbnail row. On load the frame's squares open
 * (PinFrames), the disc opens from its centre, the squiggle draws itself, the product rises onto the disc and
 * the sticker slaps on. Then, as the page scrolls, the faded name behind it slides sideways along its line,
 * scrubbed with the scroll. Reduced motion shows it all at rest.
 * `shell` (with a FinishProvider above): the cutout's metal map, so the chosen finish repaints the bottle in place
 * (BottleFinish.tsx); `axis` is the bottle's direction in the cutout image, base to cap, for the wipe.
 */
export function ProductStage({ name, tone, cutout, images, alt, sticker, stickerTone, shell, axis }: {
  name: string; tone: Tone; cutout: string; images: string[]; alt: string; sticker: string; stickerTone: 'blue' | 'red' | 'orange'; shell?: string; axis?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(-1); // -1: the cutout on the disc
  const finish = useFinish()?.i;
  const pos = tone === 'flash' ? '50% 50%' : '50% 100%';
  // a new finish brings the cutout back to the front, so the change is seen
  useEffect(() => { if (shell && finish !== undefined) setI(-1); }, [shell, finish]);
  const pin = { glacier: 'var(--color-glacier)', flash: 'var(--color-flash)', volt: 'var(--color-voltage)' }[tone];

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    const [back, front] = el.querySelectorAll<SVGPathElement>(`.${s.squiggle} path`);
    const line = tuck(back, front, el.querySelector<HTMLElement>(`.${s.disc}`)!);
    line.draw(1);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ delay: .25 })
        .fromTo(`.${s.disc}`, { clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(71% at 50% 55%)', duration: 1.1, ease: 'power3.inOut' }, 0)
        .fromTo({ p: 0 }, { p: 0 }, { p: 1, duration: 2.2, ease: 'power1.inOut', onUpdate() { line.draw(this.targets()[0].p); } }, 0)
        .fromTo(`.${s.product}`, { yPercent: 22, scale: .88, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out' }, .35)
        .fromTo(`.${s.mark}`, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, .2)
        .fromTo('.diecut', { scale: 0, rotate: -30, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: .6, ease: 'back.out(2.6)' }, 1.05);
      // the name slides sideways with the scroll, along its line: only xPercent, on the inner word, so it never
      // fights the load-in's y and never drops below the frame (the watermark's box clips it at the sides)
      gsap.fromTo(`.${s.markIn}`, { xPercent: 4 }, { xPercent: -9, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: .6 } });
    }, el);
    return () => { mm.revert(); line.stop(); line.draw(1); };
  }, []);

  return (
    <div ref={root} className={s[tone]}>
      <div className={`pin-frame ${s.stage}`} style={{ ['--pin' as string]: pin }}>
        <span className={s.mark} aria-hidden="true"><span className={s.markIn}>{name}</span></span>
        <span className={s.disc}><span className={`wave-lines-blue ${s.pattern}`} /></span>
        <Squiggle className={s.squiggle} />
        <Squiggle className={`${s.squiggle} ${s.front}`} />
        <span className={s.product} data-finish-tilt>
          <span className={s.shadow} />
          <span className={s.body}>
            <Image src={cutout} alt={i < 0 ? alt : ''} fill priority sizes="(min-width:1024px) 40vw, 80vw" className={s.cutout} />
            {shell && <FinishPaint shell={shell} axis={axis} position={pos} tilt />}
          </span>
        </span>
        {images.map((src, k) => (
          <span key={src} className={`${s.photo} ${k === i ? s.on : ''}`} aria-hidden={k !== i}>
            <Image src={src} alt={`${alt}, photo ${k + 1} of ${images.length}`} fill sizes="(min-width:1024px) 50vw, 100vw" />
          </span>
        ))}
        <DieCut text={sticker} tone={stickerTone} className={s.sticker} />
      </div>
      <div className={s.thumbs} role="group" aria-label={`${name} images`}>
        <button type="button" className={s.thumb} aria-pressed={i < 0} aria-label={`Show ${name}`} onClick={() => setI(-1)}>
          <span className={s.thumbDisc} />
          <span className={s.thumbBody}><Image src={cutout} alt="" fill sizes="76px" className={s.cutout} />{shell && <FinishPaint shell={shell} axis={axis} position={pos} />}</span>
        </button>
        {images.map((src, k) => (
          <button key={src} type="button" className={s.thumb} aria-pressed={k === i} aria-label={`Show photo ${k + 1}`} onClick={() => setI(k)}>
            <Image src={src} alt="" fill sizes="76px" />
          </button>
        ))}
      </div>
    </div>
  );
}

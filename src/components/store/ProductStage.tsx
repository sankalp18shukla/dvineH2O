'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { DieCut, Squiggle } from '@/components/ui/Brand';
import s from './ProductStage.module.css';

type Tone = 'glacier' | 'flash' | 'volt';

/**
 * Product page gallery (C01–C05 / B01–B04): opens on the product cutout standing on its brand disc, as on the
 * home collection, with the product photos one tap away in the thumbnail row. On load the frame's squares open
 * (PinFrames), the disc opens from its centre, the squiggle draws itself, the product rises onto the disc and
 * the sticker slaps on. Reduced motion shows it all at rest.
 */
export function ProductStage({ name, tone, cutout, images, alt, sticker, stickerTone }: {
  name: string; tone: Tone; cutout: string; images: string[]; alt: string; sticker: string; stickerTone: 'blue' | 'red' | 'orange';
}) {
  const root = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(-1); // -1: the cutout on the disc
  const pin = { glacier: 'var(--color-glacier)', flash: 'var(--color-flash)', volt: 'var(--color-voltage)' }[tone];

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const path = el.querySelector<SVGPathElement>(`.${s.squiggle} path`)!, len = path.getTotalLength();
      gsap.timeline({ delay: .25 })
        .fromTo(`.${s.disc}`, { clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(71% at 50% 55%)', duration: 1.1, ease: 'power3.inOut' }, 0)
        .fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.2, ease: 'power1.inOut' }, 0)
        .fromTo(`.${s.product}`, { yPercent: 22, scale: .88, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out' }, .35)
        .fromTo(`.${s.mark}`, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, .2)
        .fromTo('.diecut', { scale: 0, rotate: -30, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: .6, ease: 'back.out(2.6)' }, 1.05);
    }, el);
    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className={s[tone]}>
      <div className={`pin-frame ${s.stage}`} style={{ ['--pin' as string]: pin }}>
        <span className={s.mark} aria-hidden="true">{name}</span>
        <span className={s.disc}><span className={`wave-lines-blue ${s.pattern}`} /></span>
        <Squiggle className={s.squiggle} />
        <span className={s.product}>
          <span className={s.shadow} />
          <Image src={cutout} alt={i < 0 ? alt : ''} fill priority sizes="(min-width:1024px) 40vw, 80vw" className={s.cutout} />
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
          <span className={s.thumbDisc} /><Image src={cutout} alt="" fill sizes="76px" className={s.thumbCut} />
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

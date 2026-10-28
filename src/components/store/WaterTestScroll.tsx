'use client';
import { Fragment, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lockup } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import s from './WaterTestScroll.module.css';

gsap.registerPlugin(ScrollTrigger);

/** Length of the trimmed clip (public/videos/water-drop-*.mp4, 0–11.3s of the original, all-intra so seeks are instant). */
const CLIP = 11.25;
/** The drop hits the water ~0.85s into the clip. */
const SPLASH = 0.85;
/**
 * Timeline beats (0–12 across the pinned scroll): the card grows from a small box while the drop
 * falls in slow motion, splashes as the card fills, the headline drops in with the splash and opens
 * like the hero descriptor, the body fades up dim under it, then the glow sweep, then the actions.
 */
const T = { grow: 2.6, fall: 2.2, open: 2.75, dim: 3.3, words: 4, sweep: 5, ctas: 9.3, end: 12 };
/**
 * Photos set between the words, after the word given.
 * With LINE_ENDS this gives one photo per desktop line, alternating sides so no two stack:
 *   Start with a closer look ▢ at the water you use / every day. See which tests are available ▢ /
 *   in your area, ▢ what they include and how to book. / Already have a report? Share it with our team. ▢
 */
const PICS: Record<string, { src: string; alt: string }> = {
  'look': { src: '/images/1_2ndsec.png', alt: 'Cupped hands catching clear running water' },
  'available': { src: '/images/2_2ndsec.png', alt: 'A scientist holding up a sample vial in a lab' },
  'area,': { src: '/images/3_2ndsec.png', alt: 'A street map of the local area' },
  'team.': { src: '/images/4_2ndsec.png', alt: 'A drop of water falling into still water' },
};
/** Words that end a line on desktop; smaller screens wrap naturally. */
const LINE_ENDS = new Set(['use', 'available', 'book.']);
const GLOW = { off: '0 0 0px rgb(37 255 232 / 0), 0 0 0px rgb(37 255 232 / 0)', peak: '0 0 18px rgb(37 255 232 / .85), 0 0 2px rgb(37 255 232 / .7)', rest: '0 0 16px rgb(37 255 232 / .18), 0 0 0px rgb(37 255 232 / 0)' };

/**
 * Home section 02. A sticky stage scrubs the water-drop clip with the scroll: the card opens out of a
 * small box as the drop falls, the headline lands with the splash, the body lights up word by word in
 * a Glacier glow, then the two actions rise in as the water settles. Reduced motion gets the poster
 * frame with everything shown.
 */
export function WaterTestScroll({ title, body }: { title: string; body: string }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = root.current!, v = video.current!;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      v.src = matchMedia('(max-width: 767px)').matches ? '/videos/water-drop-1280.mp4' : '/videos/water-drop-1920.mp4';
      // iOS only paints seeks on a muted video that has played once
      const prime = () => v.play().then(() => v.pause()).catch(() => {});
      v.addEventListener('loadedmetadata', prime, { once: true });

      // scroll sets a target time; the ticker seeks toward it without stacking seeks
      const clip = { t: 0 };
      const seek = () => { if (v.readyState >= 1 && !v.seeking && Math.abs(v.currentTime - clip.t) > 0.01) v.currentTime = clip.t; };
      gsap.ticker.add(seek);

      const q = gsap.utils.selector(el);
      const items = q(`.${s.word}, .${s.pic}`), ctas = q(`.${s.cta}`);
      const words = items.filter(e => e.classList.contains(s.word)), pics = items.filter(e => e.classList.contains(s.pic));
      // Heading entrance, as the hero descriptor's: it drops in with its two pins together at the centre,
      // then the pins slide apart and the blocks open between them. The whole heading is clipped, never
      // its lines one by one (each would become its own stacking context and cover the other's glyphs).
      // --gap moves the pins (see .heading in the CSS); the clip window follows them, with notches for
      // the pin heads above the top-left corner and below the bottom-right one.
      const heading = q('.lk')[0], open = { v: 0 };
      const paint = () => {
        const w = heading.offsetWidth, g = w / 2 * (1 - open.v);
        heading.style.setProperty('--gap', `${g}px`);
        if (open.v >= 1) { heading.style.clipPath = 'inset(-30% -60px)'; return; }
        // window between the pins (zero wide when shut), widened 1px along each pin's line and 7px at its head
        const th = heading.querySelector<HTMLElement>('.lk-top')!.offsetHeight, bt = heading.querySelector<HTMLElement>('.lk-bot')!.offsetTop, l = g, r = w - g;
        heading.style.clipPath = `polygon(${l - 7}px -30%, ${r}px -30%, ${r}px ${bt}px, ${r + 1}px ${bt}px, ${r + 1}px 100%, ${r + 7}px 100%, ${r + 7}px 130%, `
          + `${l}px 130%, ${l}px ${th}px, ${l - 1}px ${th}px, ${l - 1}px 0px, ${l - 7}px 0px)`;
      };
      paint();
      ScrollTrigger.addEventListener('refresh', paint);
      gsap.set(heading, { opacity: 0, y: -60 });
      gsap.set(words, { opacity: 0, color: '#F0F2F7', textShadow: GLOW.off });
      gsap.set(pics, { opacity: 0, scale: .4, rotate: -8 });
      gsap.set(ctas, { opacity: 0, y: 26, filter: 'blur(6px)' });

      // the card starts as a small box in the middle of the stage (same shape on every screen)
      const card = q(`.${s.card}`)[0], media = q(`.${s.media}`)[0];
      const box = () => {
        const w = card.offsetWidth, h = card.offsetHeight, bw = gsap.utils.clamp(130, 250, w * .17), bh = bw * .68;
        return `inset(${(h - bh) / 2}px ${(w - bw) / 2}px ${(h - bh) / 2}px ${(w - bw) / 2}px round 18px)`;
      };

      // starts when the stage sticks under the header, ends as it lets go
      const hdr = () => parseFloat(getComputedStyle(el).getPropertyValue('--hdr'));
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: () => `top ${hdr()}px`, end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true } })
        .fromTo(card, { clipPath: box }, { clipPath: 'inset(0px 0px 0px 0px round 30px)', duration: T.grow, ease: 'power2.inOut' }, 0)
        .fromTo(media, { scale: .55 }, { scale: 1, duration: T.grow, ease: 'power2.inOut' }, 0)
        // the fall is stretched across the grow (slow motion), then the clip runs on to the end
        .to(clip, { t: SPLASH, duration: T.grow, ease: 'none' }, 0)
        .to(clip, { t: CLIP, duration: T.end - T.grow, ease: 'none' }, T.grow)
        .to(heading, { y: 0, duration: .8, ease: 'back.out(1.5)' }, T.fall)
        .to(heading, { opacity: 1, duration: .45, ease: 'none' }, T.fall)
        .to(open, { v: 1, duration: 1, ease: 'power4.inOut', onUpdate: paint }, T.open)
        .to(words, { opacity: .16, duration: .7, ease: 'none' }, T.dim);
      // the glow sweeps word by word; each photo pops in when the sweep reaches it
      items.forEach((e, i) => {
        const at = T.words + i * (T.sweep / items.length);
        if (pics.includes(e)) tl.to(e, { opacity: 1, scale: 1, rotate: 0, duration: .7, ease: 'back.out(2)' }, at);
        else tl.to(e, { keyframes: [
          { opacity: 1, color: '#25FFE8', textShadow: GLOW.peak, duration: .45, ease: 'power2.out' },
          { color: '#F0F2F7', textShadow: GLOW.rest, duration: .8, ease: 'power2.inOut' },
        ] }, at);
      });
      tl.to(ctas, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .9, stagger: .3, ease: 'power3.out' }, T.ctas);

      return () => {
        ScrollTrigger.removeEventListener('refresh', paint); heading.style.removeProperty('--gap'); heading.style.clipPath = '';
        gsap.ticker.remove(seek); v.removeEventListener('loadedmetadata', prime); v.removeAttribute('src'); v.load(); };
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className={s.track} aria-labelledby="wt-title" data-own-motion>
      <div className={s.stage}>
       <div className={`${s.card} on-dark`}>
        <div className={s.media} aria-hidden="true">
          <video ref={video} className={s.video} poster="/videos/water-drop-poster.jpg" muted playsInline preload="auto" disablePictureInPicture tabIndex={-1} />
          <span className={s.tint} />
          <span className={s.shade} />
        </div>
        <div className={`frame-x ${s.content}`}>
          <div className={s.copy}>
            <Lockup id="wt-title" title={title} tone="glacier" className={s.heading} />
            <p className={s.body}>
              {body.split(' ').map((w, i) => (
                <Fragment key={i}>
                  <span className={s.word}>{w}</span>{' '}
                  {PICS[w] && <><span className={s.pic}><Image src={PICS[w].src} alt={PICS[w].alt} fill sizes="140px" /></span>{' '}</>}
                  {LINE_ENDS.has(w) && <br className={s.br} />}
                </Fragment>
              ))}
            </p>
            <div className={s.ctas}>
              <Link href="/water-testing#book" className={`${s.cta} ${s.primary}`}>
                Book a Water Test
                <span className={s.chip} aria-hidden="true"><Icon name="arrow" /><Icon name="arrow" /></span>
              </Link>
              <Link href="/water-testing#upload" className={`${s.cta} ${s.ghost} glare`}>Upload My Report</Link>
            </div>
          </div>
        </div>
       </div>
      </div>
    </section>
  );
}

'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lockup } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import fit from './FitShowcase.module.css';
import s from './InsideScroll.module.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * public/videos/inside-1280.mp4: the generated walkthrough with its misdrawn wordmark painted out of the control
 * head (frames 195–239), all-intra so seeks are instant. Ends a frame short of 10s so the last seek always lands.
 */
const CLIP = 9.95;
/**
 * When each step's copy changes over, in clip seconds: the camera leaves the cartridges for the ionisation
 * chamber at ~3.5s and passes out through the front of the machine at ~7.5s, settling on the panel by ~8s.
 */
const STEPS = [{ at: 0, out: 3.1 }, { at: 3.6, out: 6.7 }, { at: 7.8, out: Infinity }];
/** The push-in on the outside shots, hidden in the blur of passing through the front panel: it crops the top of the control head out of frame. */
const ZOOM = { at: 7.2, dur: .9, scale: 1.32 };
/** Scroll held on the last frame (in clip seconds) before the stage lets go. */
const HOLD = 1;
/** The stage's shape off the section: inset from the sides with rounded corners, as it arrives and as it leaves. */
const CARD = 'inset(0% 4% 0% 4% round 36px)', BLEED = 'inset(0% 0% 0% 0% round 0px)';

type Step = { title: string; body: string; fact: string; note: string };

// --open is written straight to the element (see FitShowcase.tsx for why it isn't tweened as a CSS variable)
const setOpen = (h: Element, v: number) => (h as HTMLElement).style.setProperty('--open', String(v));
/**
 * Opens a lockup like the hero's descriptor tag: pins apart, blocks and words revealed between them.
 * The value is written by a setter rather than onUpdate: when the page loads already scrolled past a trigger
 * (reload with scroll restored), ScrollTrigger jumps the timeline with events suppressed, which skips
 * onUpdate and left the lockups shut when scrolling back.
 */
const openUp = (h: Element, duration = .5) => {
  let cur = 0;
  const o = { get v() { return cur; }, set v(x: number) { cur = x; setOpen(h, x); } };
  return gsap.to(o, { v: 1, duration, ease: 'power4.inOut' });
};

/**
 * Home section 04. A sticky stage scrubs the inside-the-machine clip with the scroll: filtration, then
 * ionisation, then the touch panel from outside. Each part brings in its own copy beside the subject (number,
 * pinned title block, description lit word by word) with a matching figure opposite. The stage opens out to
 * full bleed as it arrives and folds back into a rounded card as it leaves. Reduced motion gets the first
 * frame with all three steps listed.
 */
export function InsideScroll({ title, steps, cta }: { title: string; steps: Step[]; cta: { label: string; href: string } }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = root.current!, v = video.current!;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      v.src = '/videos/inside-1280.mp4';
      // iOS only paints seeks on a muted video that has played once
      const prime = () => v.play().then(() => v.pause()).catch(() => {});
      v.addEventListener('loadedmetadata', prime, { once: true });

      // scroll sets a target time; the ticker seeks toward it without stacking seeks
      const clip = { t: 0 };
      const seek = () => { if (v.readyState >= 1 && !v.seeking && Math.abs(v.currentTime - clip.t) > 0.01) v.currentTime = clip.t; };
      gsap.ticker.add(seek);

      const q = gsap.utils.selector(el);
      const stage = q(`.${s.stage}`)[0], media = q(`.${s.media}`)[0], heading = q(`.${s.heading}`)[0];
      const items = q(`.${s.step}`), facts = q(`.${s.fact}`), locks = q(`.${s.step} .lk`);
      [heading, ...locks].forEach(h => setOpen(h, 0));

      /** A step's entrance: the title block opens between its pins, the words light up, then the figure rises opposite. */
      const enter = (i: number) => {
        const p = gsap.utils.selector(items[i]), f = gsap.utils.selector(facts[i]);
        return gsap.timeline()
          .fromTo([items[i], facts[i]], { autoAlpha: 0 }, { autoAlpha: 1, duration: .01, immediateRender: false }, 0)
          .add(openUp(locks[i], .6), 0)
          .from(p(`.${s.word}`), { opacity: .12, duration: .25, stagger: .5 / Math.max(p(`.${s.word}`).length, 1), ease: 'none' }, .35)
          .from(p(`.${s.action}`), { y: 18, opacity: 0, duration: .5, ease: 'power3.out' }, .75)
          .from(f(`.${s.figure} > span`), { yPercent: 115, duration: .6, ease: 'power3.out' }, .2)
          .from(f(`.${s.note}`), { opacity: 0, y: 10, duration: .45, ease: 'power2.out' }, .45);
      };
      const leave = (i: number) =>
        gsap.to([items[i], facts[i]], { autoAlpha: 0, y: -30, duration: .45, ease: 'power2.in' });

      const hdr = () => parseFloat(getComputedStyle(el).getPropertyValue('--hdr'));

      // arriving: the stage widens out to full bleed and the footage settles, then the headline opens and the
      // first step lands as the stage sticks under the header
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top bottom', end: () => `top ${hdr()}px`, scrub: .8, invalidateOnRefresh: true } })
        .fromTo(stage, { clipPath: CARD }, { clipPath: BLEED, duration: 1, ease: 'power2.inOut' }, 0)
        .fromTo(media, { scale: 1.2 }, { scale: 1, duration: 1, ease: 'power2.out' }, 0)
        .add(openUp(heading), .35)
        .add(enter(0), .1);

      // pinned: the clip runs with the scroll, each step's copy handing over to the next as the camera moves on
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: () => `top ${hdr()}px`, end: 'bottom bottom', scrub: .8, invalidateOnRefresh: true } })
        .to(clip, { t: CLIP, duration: CLIP, ease: 'none' }, 0)
        .to(v, { scale: ZOOM.scale, duration: ZOOM.dur, ease: 'power2.inOut' }, ZOOM.at)
        .to({}, { duration: HOLD }, CLIP);
      STEPS.forEach((st, i) => {
        if (i > 0) tl.add(enter(i), st.at);
        if (st.out < Infinity) tl.add(leave(i), st.out);
      });

      // leaving: the stage folds back into a rounded card as the next section comes up under it
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'bottom bottom', end: 'bottom 30%', scrub: .8 } })
        .fromTo(stage, { clipPath: BLEED }, { clipPath: CARD, duration: 1, ease: 'power2.inOut', immediateRender: false });

      return () => {
        [heading, ...locks].forEach(h => (h as HTMLElement).style.removeProperty('--open'));
        gsap.ticker.remove(seek); v.removeEventListener('loadedmetadata', prime); v.removeAttribute('src'); v.load(); };
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className={s.track} aria-labelledby="inside-title" data-own-motion>
      <div className={`${s.stage} on-dark`}>
        <div className={s.media} aria-hidden="true">
          <video ref={video} className={s.video} poster="/videos/inside-poster.jpg" muted playsInline preload="auto" disablePictureInPicture tabIndex={-1} />
          <span className={s.tint} />
          <span className={s.shade} />
        </div>
        <div className={`frame-x ${s.content}`}>
          <Lockup id="inside-title" title={title} tone="glacier" className={`${s.heading} ${s.open}`} />
          <div className={s.middle}>
            <ol className={s.steps}>
              {steps.map((st, i) => (
                <li key={st.title} className={s.step}>
                  <Lockup as="h3" title={st.title} size="sm" className={`${s.title} ${s.open}`} />
                  <p className={s.body}>
                    {st.body.split(' ').map((w, j) => <span key={j} className={s.word}>{w} </span>)}
                  </p>
                  {i === steps.length - 1 && (
                    <div className={s.action}>
                      <Link href={cta.href} className={fit.cta}>
                        <span className={fit.chip} aria-hidden="true"><Icon name="arrow" className="" /></span>
                        {cta.label}
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <div className={s.facts} aria-hidden="true">
              {steps.map(st => (
                <p key={st.title} className={s.fact}>
                  <span className={s.figure}><span>{st.fact}</span></span>
                  <span className={s.note}>{st.note}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * The home page's scrubbed copy motion, for every page (sections marked [data-own-motion] run their own):
 * - [data-words]: the .sw words (see Words in Cta.tsx) light up one by one (opacity only, so it stays on the GPU).
 * - [data-rise]: the element's children rise in one after another.
 * - [data-draw] / [data-draw="x"] / [data-draw="x-rev"]: a line grows down, across, or across from the right.
 * - [data-speed="n"]: gentle parallax, n from about -1 to 1.
 * - [data-pop]: a sticker slaps on (scale and turn, overshooting) as it reaches the screen.
 * Everything is scrubbed straight to the scroll, with no snapping. Things already on screen when the page
 * loads play in once. Reduced motion, or no JS, shows it all.
 */
export function ScrollCopy() {
  const path = usePathname();
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const all = (sel: string) => gsap.utils.toArray<HTMLElement>(sel).filter(e => !e.closest('[data-own-motion]'));
      const onScreen = (e: Element) => e.getBoundingClientRect().top < innerHeight * .85;
      /** scrubbed between `start` and `end`, or played once if the element is already in view */
      const drive = (e: HTMLElement, tl: gsap.core.Timeline, start = 'top 88%', end = 'top 52%') => {
        if (onScreen(e)) { tl.duration(Math.min(tl.duration(), 1.4)); gsap.delayedCall(.35, () => { tl.play(); }); }
        else ScrollTrigger.create({ animation: tl, trigger: e, start, end, scrub: .8 });
      };

      all('[data-words]').forEach(e => {
        const words = e.querySelectorAll('.sw');
        if (!words.length) return;
        gsap.set(words, { opacity: .14 });
        drive(e, gsap.timeline({ paused: true }).to(words, { opacity: 1, duration: .4, stagger: 1.2 / words.length, ease: 'none' }));
      });

      all('[data-rise]').forEach(e => {
        const kids = Array.from(e.children);
        gsap.set(kids, { opacity: 0, y: 30 });
        drive(e, gsap.timeline({ paused: true }).to(kids, { opacity: 1, y: 0, duration: .7, stagger: .14, ease: 'power3.out' }), 'top 92%', 'top 60%');
      });

      all('[data-draw]').forEach(e => {
        const x = e.dataset.draw?.startsWith('x');
        gsap.set(e, x ? { scaleX: 0, transformOrigin: e.dataset.draw === 'x-rev' ? '100% 50%' : '0 50%' } : { scaleY: 0, transformOrigin: '50% 0' });
        gsap.to(e, { [x ? 'scaleX' : 'scaleY']: 1, ease: 'none', scrollTrigger: { trigger: e, start: 'top 80%', end: x ? 'top 40%' : 'bottom 55%', scrub: .8 } });
      });

      all('[data-speed]').forEach(e => {
        const n = parseFloat(e.dataset.speed || '0') * 12;
        gsap.fromTo(e, { yPercent: n }, { yPercent: -n, ease: 'none', scrollTrigger: { trigger: e, start: 'top bottom', end: 'bottom top', scrub: .4 } });
        e.style.willChange = 'transform';
      });

      all('[data-pop]').forEach(e => {
        gsap.set(e, { scale: 0, rotate: 28, opacity: 0 });
        drive(e, gsap.timeline({ paused: true }).to(e, { scale: 1, rotate: 0, opacity: 1, duration: .6, ease: 'back.out(2.6)' }), 'top 92%', 'top 70%');
      });
    });
    return () => mm.revert();
  }, [path]);
  return null;
}

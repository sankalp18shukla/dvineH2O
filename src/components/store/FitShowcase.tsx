'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DieCut, Lockup, Squiggle } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import s from './FitShowcase.module.css';

gsap.registerPlugin(ScrollTrigger);

export type FitItem = {
  slug: string; href: string; title: string; where: string; desc: string; body: string; cta: string;
  /** product image: a transparent cutout floats over the disc; until it is in, the photo fills the disc.
   *  Loaded eagerly: the panels sit off-screen, so lazy loading would start them mid-entrance */
  src: string; cutout: boolean;
  feats: { title: string; sub: string }[];
};

/** One brand colour per product: the disc, its lockup and its die-cut sticker (brand elements page). */
const LOOK: Record<string, { tone: 'glacier' | 'flash' | 'volt'; sticker: string; sc: 'blue' | 'red' | 'orange' }> = {
  crystal: { tone: 'glacier', sticker: 'Soft Launching\n“My Water Era.”', sc: 'blue' },
  hyper: { tone: 'flash', sticker: 'Sip Check.', sc: 'orange' },
  titan: { tone: 'volt', sticker: 'Main Character\nHydration.', sc: 'red' },
};

/**
 * Heading reveal, as the hero's descriptor tag: the lockup's two pin lines start together at the centre and
 * slide apart in opposite directions, opening the highlight blocks and revealing the words as they go
 * (--open, 0 → 1, drives the CSS in .open).
 */
// --open is written straight to the element rather than tweened by GSAP: GSAP's revert between React's
// two development effect runs drops the variable and its second set never lands, leaving headings open
const setOpen = (heading: Element | Element[], v: number) =>
  gsap.utils.toArray<HTMLElement>(heading).forEach(h => h.style.setProperty('--open', String(v)));
const shut = (heading: Element | Element[]) => setOpen(heading, 0);
const openUp = (heading: Element | Element[]) => {
  const o = { v: 0 };
  return gsap.to(o, { v: 1, duration: 1, ease: 'power4.inOut', onUpdate: () => setOpen(heading, o.v) });
};
/** Back to the stylesheet's resting value (fully open), for when a layout's animations are torn down. */
const release = (root: HTMLElement) => root.querySelectorAll<HTMLElement>('.lk').forEach(h => h.style.removeProperty('--open'));

/** Scrubbed timeline units: a beat to read the intro once pinned, the intro lifting away, each product's rest, and the slide to the next one. */
const TITLE = .5, LIFT = 1.2, HOLD = .45, MOVE = 2.4;

/**
 * Puts one product panel in its start state and returns its entrance: the disc opens from its centre,
 * the squiggle draws itself slowly across the whole entrance, the product rises onto the disc (works the
 * same for a cutout or the photo), the sticker slaps on, and the lockup opens like the hero's tag (pins
 * apart, blocks and words revealed). The copy follows, the description lighting up word by word.
 */
function entrance(panel: HTMLElement) {
  const q = gsap.utils.selector(panel), dir = panel.querySelector(`.${s.flip}`) ? 1 : -1;
  const squiggle = panel.querySelectorAll<SVGPathElement>(`.${s.squiggle} path`), len = squiggle[0].getTotalLength();
  const [disc, product, sticker, heading, para, words, rest] = [`.${s.disc}`, `.${s.product}`, '.diecut', '.lk', `.${s.body}`, `.${s.word}`, '.fit-after'].map(c => q(c));

  gsap.set(disc, { clipPath: 'circle(0% at 50% 55%)' });
  gsap.set(squiggle, { strokeDasharray: len, strokeDashoffset: len });
  // a cutout rises onto the disc; the stand-in photo, clipped by the disc, settles in from a slight zoom
  const cutout = !!panel.querySelector(`.${s.cutout}`);
  gsap.set(product, cutout ? { yPercent: 26, scale: .86, rotate: dir * 6, opacity: 0 } : { scale: 1.3, opacity: 0 });
  gsap.set(sticker, { scale: 0, rotate: dir * -30, opacity: 0 });
  shut(heading);
  gsap.set(para, { opacity: 0 });
  gsap.set(words, { opacity: .14 });
  gsap.set(rest, { opacity: 0, y: 22 });

  return gsap.timeline()
    .to(disc, { clipPath: 'circle(71% at 50% 55%)', duration: 1.1, ease: 'power3.inOut' }, 0)
    .to(squiggle, { strokeDashoffset: 0, duration: 2.6, ease: 'power1.inOut' }, 0)
    .to(product, { yPercent: 0, scale: 1, rotate: 0, opacity: 1, duration: 1.1, ease: 'power3.out' }, cutout ? .35 : .15)
    .to(sticker, { scale: 1, rotate: 0, opacity: 1, duration: .6, ease: 'back.out(2.6)' }, 1.05)
    .add(openUp(heading), .2)
    .to(rest, { opacity: 1, y: 0, duration: .7, stagger: .1, ease: 'power3.out' }, .9)
    .to(para, { opacity: 1, duration: .35 }, .8)
    .to(words, { opacity: 1, duration: .3, stagger: .9 / Math.max(words.length, 1), ease: 'none' }, .95);
}

/**
 * Home section 03. On desktop the section pins under the header: the first scroll lifts the "Find the
 * right fit" intro away so the products get the whole screen, then each scroll slides the next product in
 * from the right (Crystal, Hyper, Titan), each panel keeping its own alternating layout. The row follows
 * the scroll smoothly, with no snapping. On small screens the products
 * stack and play in as they reach the screen. Reduced motion gets the stacked layout with everything shown.
 */
export function FitShowcase({ title, body, items }: { title: string; body: string; items: FitItem[] }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const panels = gsap.utils.toArray<HTMLElement>(`.${s.panel}`, el);
    const mm = gsap.matchMedia();

    // small screens (no pinned stage): "Find the right fit." opens with the scroll as it reaches the middle of the screen
    mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
      const title = el.querySelector(`.${s.title}`)!, intro = el.querySelector(`.${s.intro}`)!;
      shut(title); gsap.set(intro, { opacity: 0, x: -16 });
      const tl = gsap.timeline().add(openUp(title), 0).to(intro, { opacity: 1, x: 0, duration: .6, ease: 'power2.out' }, .7);
      ScrollTrigger.create({ animation: tl, trigger: title, start: 'top 80%', end: 'top 45%', scrub: .8 });
      return () => release(el);
    });

    // desktop: pinned stage, horizontal track
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      el.classList.add(s.h);
      const track = el.querySelector<HTMLElement>(`.${s.track}`)!;
      const rail = el.querySelector<HTMLElement>(`.${s.rail}`)!, head = el.querySelector<HTMLElement>(`.${s.head}`)!;
      const viewport = el.querySelector<HTMLElement>(`.${s.viewport}`)!;
      const hdr = () => parseFloat(getComputedStyle(el).getPropertyValue('--hdr'));
      const width = () => viewport.offsetWidth;

      // coming down into the section: first "Find the right fit." opens (pins apart, box widening, words
      // revealed) with its line fading in beside it, then Crystal builds, done as the stage pins
      const title = el.querySelector(`.${s.title}`)!, intro = el.querySelector(`.${s.intro}`)!;
      shut(title); gsap.set(intro, { opacity: 0, x: -16 });
      const opening = gsap.timeline().add(openUp(title), 0).to(intro, { opacity: 1, x: 0, duration: .6, ease: 'power2.out' }, .7);
      ScrollTrigger.create({ animation: opening, trigger: el, start: 'top 85%', end: 'top 50%', scrub: .8 });
      ScrollTrigger.create({ animation: entrance(panels[0]), trigger: el, start: 'top 50%', end: () => `top ${hdr()}px`, scrub: .8, invalidateOnRefresh: true });

      // once pinned, after a beat, the intro lifts out of the stage (with its padding) so the products fill it
      const tl = gsap.timeline({ defaults: { ease: 'none' } })
        .to(rail, { y: () => -viewport.offsetTop, duration: LIFT, ease: 'power2.inOut' }, TITLE)
        .to(head, { opacity: 0, duration: LIFT * .7, ease: 'power1.in' }, TITLE);
      panels.slice(1).forEach((panel, k) => {
        const i = k + 1, at = tl.duration() + HOLD, prev = panels[k];
        tl.to(track, { x: () => -width() * i, duration: MOVE, ease: 'power1.inOut' }, at)
          // depth while sliding: the leaving product drifts slower and sinks back, the arriving one catches up
          .to(prev.querySelector(`.${s.media}`), { xPercent: 22, scale: .92, opacity: 0, duration: MOVE * .6, ease: 'power1.in' }, at)
          .to(prev.querySelector(`.${s.copy}`), { opacity: 0, x: -60, duration: MOVE * .6, ease: 'power2.in' }, at)
          // the build plays while the panel slides in and is finished the moment it lands
          .add(entrance(panel).duration(MOVE * .8), at + MOVE * .2);
      });
      tl.to({}, { duration: HOLD * 2.5 }); // Titan rests before the page moves on
      // the big faded names drift gently left to right the whole way through
      tl.fromTo(el.querySelectorAll(`.${s.mark}`), { xPercent: -9 }, { xPercent: 9, duration: tl.duration(), ease: 'none' }, 0);

      // scrubbed straight to the scroll, no snapping: the row glides sideways as you scroll
      ScrollTrigger.create({
        animation: tl, trigger: el, start: () => `top ${hdr()}px`, end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true,
      });
      ScrollTrigger.refresh();

      return () => { el.classList.remove(s.h); release(el); };
    });

    // small screens: stacked panels, each plays in as it arrives
    mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
      panels.forEach(panel => {
        const tl = entrance(panel).pause();
        ScrollTrigger.create({ trigger: panel, start: 'top 72%', once: true, onEnter: () => tl.play() });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} id="collection" className={s.section} aria-labelledby="col-title" data-own-motion>
      <div className={s.stage}>
       <div className={s.rail}>
        <div className={`container-x ${s.head}`}>
          <Lockup id="col-title" title={title} tone="blue" className={`${s.title} ${s.open}`} />
          <p className={s.intro}>{body}</p>
        </div>

        <div className={s.viewport}>
          <ol className={s.track}>
            {items.map((p, i) => {
              const look = LOOK[p.slug];
              return (
                <li key={p.slug} className={s.panel} aria-label={`${i + 1} of ${items.length}: ${p.title}`}>
                  <div className={`container-x ${s.row} ${s[look.tone]} ${i % 2 ? s.flip : ''}`}>
                    <span className={s.mark} aria-hidden="true">{p.title}</span>

                    <Link href={p.href} className={s.media} tabIndex={-1} aria-hidden="true">
                      <span className={s.disc}>
                        <span className={`wave-lines-blue ${s.pattern}`} />
                        {!p.cutout && (
                          <span className={s.product}>
                            <Image src={p.src} alt="" fill loading="eager" sizes="(min-width:1024px) 42vw, 86vw" className={s.photo} />
                          </span>
                        )}
                      </span>
                      {/* drawn twice: the full line behind the disc, and in front of it all but the tail, so only its end tucks in behind the circle */}
                      <Squiggle className={s.squiggle} />
                      <Squiggle className={`${s.squiggle} ${s.front}`} />
                      {p.cutout && (
                        <span className={s.product}>
                          <span className={s.shadow} />
                          <Image src={p.src} alt="" fill loading="eager" sizes="(min-width:1024px) 46vw, 92vw" className={s.cutout} />
                        </span>
                      )}
                      <DieCut text={look.sticker} tone={look.sc} className={s.sticker} />
                    </Link>

                    <div className={s.copy}>
                      <Lockup title={`*${p.where}* ${p.title}.`} tone={look.tone} as="h3" className={`${s.heading} ${s.open}`} />
                      <p className={s.body}>
                        {p.body.split(' ').map((w, k) => <span key={k}><span className={s.word}>{w}</span> </span>)}
                      </p>
                      <dl className={`fit-after ${s.facts}`}>
                        {p.feats.map(f => <div key={f.title}><dt>{f.title}</dt><dd>{f.sub}</dd></div>)}
                      </dl>
                      <div className="fit-after">
                        <Link href={p.href} className={s.cta}>
                          <span className={s.chip} aria-hidden="true"><Icon name="arrow" className="" /></span>
                          {p.cta}
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
       </div>

      </div>
    </section>
  );
}

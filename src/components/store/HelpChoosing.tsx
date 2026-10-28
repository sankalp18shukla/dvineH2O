'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lockup } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import fit from './FitShowcase.module.css';
import s from './HelpChoosing.module.css';

gsap.registerPlugin(ScrollTrigger);

export type HelpOption = { title: string; product: string; desc: string; tone: string; href: string; src: string };

/** Scrubbed timeline units: wiping a title open, the button rising after it, each card's rest, and the swap to the next card. */
const TYPE = 1, BTN = .6, HOLD = 1.1, MOVE = 2.2;

/**
 * Where a card sits in the deck: 0 is the front, 1 and 2 recede to the left, smaller, turned in 3D and
 * washed out under the veil. `wide` spreads the deck further on screens with room beside it.
 */
const depth = (level: number, wide: boolean) => [
  { xPercent: 0, scale: 1, rotateY: 0 },
  { xPercent: wide ? -26 : -16, scale: .85, rotateY: 22 },
  { xPercent: wide ? -46 : -28, scale: .72, rotateY: 30 },
][level];
const VEIL = [0, .45, .7];

/** The CTA pill from "Find the right fit", in the option's colour. */
function Cta({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  return (
    <Link href={href} className={`${fit.cta} ${className}`}>
      <span className={fit.chip} aria-hidden="true"><Icon name="arrow" className="" /></span>
      {label}
    </Link>
  );
}

/**
 * Home section 05. The heading scrolls away, then a sticky stage holds a deck of three photo cards. At Home
 * lands big in the centre, its title wipes open left to right and "Check out Crystal" rises under it; each
 * scroll then sinks the front card back (smaller, faded, turned in 3D) while the next slides in over it from
 * the right and opens its own title. Everything is transforms, opacity and clip-path (no layout work per
 * frame), scrubbed with no snapping. Reduced motion gets the three cards side by side with everything shown.
 */
export function HelpChoosing({ title, body, options }: { title: string; body: string; options: HelpOption[] }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();

    mm.add({ motion: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 768px)' }, ctx => {
      const { motion, wide } = ctx.conditions!;
      if (!motion) return;
      el.classList.add(s.on);
      const q = gsap.utils.selector(el);
      const cards = q(`.${s.card}`), veils = q(`.${s.veil}`), infos = q(`.${s.info}`);
      const tags = q(`.${s.tag}`), texts = q(`.${s.text}`), descs = q(`.${s.desc}`), btns = q(`.${s.go}`);
      const track = el.querySelector<HTMLElement>(`.${s.track}`)!;
      const hdr = () => parseFloat(getComputedStyle(el).getPropertyValue('--hdr'));

      gsap.set(cards, { transformPerspective: 1600, transformOrigin: '50% 50%' });
      gsap.set(cards.slice(1), { xPercent: 130, rotateY: -38, scale: .92, opacity: 0 });
      // the clip leaves room around the box for its corner pins
      const SHUT = 'inset(-10px 100% -10px -10px)', OPEN = 'inset(-10px -10px -10px -10px)';
      gsap.set(tags, { clipPath: SHUT });
      gsap.set(texts, { xPercent: -8, opacity: 0 });
      gsap.set([...descs, ...btns], { opacity: 0, y: 22 });

      // the tag wipes open left to right with its words gliding in behind the edge, then the line and button rise in
      const write = (tl: gsap.core.Timeline, i: number, at: number) => {
        tl.to(tags[i], { clipPath: OPEN, duration: TYPE, ease: 'power2.inOut' }, at)
          .to(texts[i], { xPercent: 0, opacity: 1, duration: TYPE, ease: 'power2.out' }, at + TYPE * .15)
          .to([descs[i], btns[i]], { opacity: 1, y: 0, duration: BTN, stagger: .15, ease: 'power3.out' }, at + TYPE * .7);
      };

      // coming down into the section, At Home rises out of a tilt and grows into place
      gsap.fromTo(cards[0], { scale: .78, y: 70, rotateX: 16, opacity: 0 }, {
        scale: 1, y: 0, rotateX: 0, opacity: 1, ease: 'power2.out',
        scrollTrigger: { trigger: track, start: 'top 80%', end: () => `top ${hdr()}px`, scrub: .8, invalidateOnRefresh: true },
      });

      const tl = gsap.timeline();
      write(tl, 0, 0);
      cards.slice(1).forEach((card, k) => {
        const i = k + 1, at = tl.duration() + HOLD;
        // every card already in the deck sinks one level further back; its title and button fade with it
        cards.slice(0, i).forEach((back, j) => {
          const from = i - 1 - j, to = i - j;
          tl.fromTo(back, depth(from, wide), { ...depth(to, wide), duration: MOVE, ease: 'power2.inOut', immediateRender: false }, at)
            .fromTo(veils[j], { opacity: VEIL[from] }, { opacity: VEIL[to], duration: MOVE, ease: 'power1.inOut', immediateRender: false }, at);
        });
        tl.to(infos[i - 1], { opacity: 0, duration: MOVE * .35, ease: 'power1.in' }, at)
          // the next card swings in from the right over the top of the deck
          .to(card, { xPercent: 0, rotateY: 0, scale: 1, duration: MOVE, ease: 'power3.out' }, at)
          .to(card, { opacity: 1, duration: MOVE * .25, ease: 'none' }, at);
        write(tl, i, at + MOVE * .7);
      });
      tl.to({}, { duration: HOLD * 1.5 }); // For My Business rests before the page moves on

      // scrubbed with a soft catch-up so the deck glides after the scroll rather than jumping with it
      ScrollTrigger.create({
        animation: tl, trigger: track, start: () => `top ${hdr()}px`, end: 'bottom bottom', scrub: 1.6, invalidateOnRefresh: true,
      });
      ScrollTrigger.refresh();

      return () => el.classList.remove(s.on);
    });
    return () => mm.revert();
  }, [options]);

  return (
    <section ref={root} className={s.section} aria-labelledby="help-title">
      <div className={`container-x ${s.head}`}>
          <Lockup id="help-title" title={title} tone="flash" className={s.title} />
          <p className={s.intro}>{body}</p>
      </div>

      <div className={s.track}>
       <div className={s.stage}>
        <ol className={`container-x ${s.deck}`}>
          {options.map(o => (
            <li key={o.href} className={`${s.card} ${s[o.tone]}`}>
              <Image src={o.src} alt="" fill sizes="(min-width:1024px) 62vw, 86vw" className={s.photo} />
              <span className={s.shade} aria-hidden="true" />
              <div className={s.info}>
                <h3 className={`tag-box ${s.tag}`}><span className={s.text}>{o.title}</span></h3>
                <p className={s.desc}>{o.product} · {o.desc}</p>
                <Cta href={o.href} label={`Check out ${o.product}`} className={s.go} />
              </div>
              <span className={s.veil} aria-hidden="true" />
            </li>
          ))}
        </ol>
       </div>
      </div>
    </section>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Icon } from '@/components/ui/Icon';

gsap.registerPlugin(ScrollTrigger);

/**
 * A 16:9 film frame that opens out of a small rounded box as it scrolls into view (the home water-test card's
 * entrance), its poster settling from a slight zoom. The film is tap-to-play, never autoplay (wireframe note).
 * Any link to #id elsewhere on the page ("Watch Crystal Demo") scrolls here and starts it. Without a film,
 * the poster shows with `pending` as a note.
 */
export function GrowVideo({ id, src, poster, alt, pending, label, className = '' }: {
  id: string; src?: string | null; poster: string; alt: string; pending: string; label: string; className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    if (!src) return;
    setPlaying(true);
    requestAnimationFrame(() => video.current?.play().catch(() => {}));
  };

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const frame = el.querySelector('[data-frame]'), media = el.querySelector('[data-media]');
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 95%', end: 'center 55%', scrub: .8 } })
        .fromTo(frame, { clipPath: 'inset(14% 24% 14% 24% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 30px)', ease: 'power2.inOut' }, 0)
        .fromTo(media, { scale: 1.3 }, { scale: 1, ease: 'power2.inOut' }, 0);
    });
    // "Watch …" links pointing here start the film once the page has scrolled to it
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.(`a[href="#${id}"]`);
      if (a && src) setTimeout(play, 650);
    };
    document.addEventListener('click', onClick);
    return () => { mm.revert(); document.removeEventListener('click', onClick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, src]);

  return (
    <div ref={root} id={id} className={`relative scroll-mt-32 ${className}`} data-own-motion>
      <div data-frame className="relative aspect-video overflow-hidden rounded-[30px] bg-stage-deep">
        <div data-media className="absolute inset-0">
          {playing && src
            ? <video ref={video} src={src} poster={poster} controls playsInline preload="metadata" className="size-full object-cover" aria-label={label} onEnded={() => setPlaying(false)} />
            : <Image src={poster} alt={alt} fill sizes="(min-width:1320px) 1240px, 100vw" className="object-cover" />}
        </div>
        {!playing && <>
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgb(3_14_54/.15),rgb(3_14_54/.55))]" aria-hidden="true" />
          <div className="on-dark absolute inset-0 grid place-items-center p-6 text-center">
            {src
              ? <button type="button" onClick={play} className="group flex flex-col items-center gap-4 text-white" aria-label={label}>
                  <span className="cta-glass glare grid size-20 place-items-center rounded-full transition duration-500 group-hover:scale-110 sm:size-24"><Icon name="play" className="ml-1 size-8 sm:size-9" /></span>
                  <span className="font-sans text-[15px] font-semibold tracking-tight">{label}</span>
                </button>
              : <div className="flex flex-col items-center gap-4 text-white">
                  <span className="cta-glass grid size-20 place-items-center rounded-full"><Icon name="play" className="ml-1 size-8" /></span>
                  <p className="font-serif text-[19px] italic text-white/90 sm:text-[22px]">{pending}</p>
                </div>}
          </div>
        </>}
      </div>
    </div>
  );
}

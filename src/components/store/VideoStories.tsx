'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Icon } from '../ui/Icon';
import { STORIES } from '@/lib/content';

type Story = (typeof STORIES.items)[number];

/**
 * One story: its poster in a still, ruled frame with a play chip; pressing it swaps in the video, with sound and
 * controls. Only one story plays at a time: when another starts (from its chip or its own controls) this one pauses.
 */
function Tile({ s, n, active, onPlay }: { s: Story; n: number; active: boolean; onPlay: () => void }) {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (!active) ref.current?.pause(); }, [active]);
  const play = () => {
    setOn(true);
    onPlay();
    // the video mounts on this render; start it on the next frame so the press counts as the user's gesture
    requestAnimationFrame(() => ref.current?.play().catch(() => {}));
  };
  return (
    <figure className="flex flex-col">
      <div className="pin-frame relative aspect-[4/5] overflow-hidden bg-ink" style={{ ['--pin' as string]: 'var(--color-flash)' }}>
        {on ? (
          <video ref={ref} src={s.src} poster={s.poster} width={s.w} height={s.h} controls playsInline preload="metadata" onPlay={onPlay}
            className="absolute inset-0 size-full object-contain" aria-label={`Customer story ${n}, Hyper owner`} />
        ) : (
          <button type="button" onClick={play} className="group absolute inset-0 cursor-pointer" aria-label={`Play customer story ${n}, ${s.duration}`}>
            <Image src={s.poster} alt="" fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw" className="object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" aria-hidden="true" />
            <span className="absolute bottom-5 left-5 inline-flex items-center gap-3 rounded-full bg-white py-2 pr-4 pl-2 font-sans text-[14px] font-semibold text-ink shadow-lg transition group-hover:bg-flash group-hover:text-white">
              <span className="grid size-8 place-items-center rounded-full bg-flash text-white transition group-hover:bg-white group-hover:text-flash"><Icon name="play" className="size-3.5 translate-x-px fill-current" /></span>
              Watch · {s.duration}
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-4 flex items-center gap-3 font-sans">
        <span className="size-2.5 shrink-0 bg-flash" aria-hidden="true" />
        <span><span className="font-serif text-[18px] italic text-deep-current">Story 0{n}</span><span className="ml-2 text-[14px] text-muted">Hyper owner, in their own words</span></span>
      </figcaption>
    </figure>
  );
}

/**
 * Customer video stories in a row (one column on phones); nothing downloads until a story is played. The frames sit
 * still: [data-own-motion] keeps the scroll-opening pin animation (PinFrames.tsx) off them, and there is no hover zoom.
 * Playing one story pauses whichever was playing.
 */
export function VideoStories({ className = '' }: { className?: string }) {
  const [playing, setPlaying] = useState<number | null>(null);
  return (
    <div data-own-motion className={`grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10 ${className}`}>
      {STORIES.items.map((s, i) => <Tile key={s.src} s={s} n={i + 1} active={playing === i} onPlay={() => setPlaying(i)} />)}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Gallery } from './Gallery';
import { DieCut, Lockup } from '../ui/Brand';

type Tone = 'glacier' | 'flash' | 'volt';
/** Product colours as on the home collection: lockup tone, frame pins and die-cut sticker. */
const LOOK: Record<Tone, { pin: string; sc: 'blue' | 'red' | 'orange' }> = {
  glacier: { pin: 'var(--color-glacier)', sc: 'blue' },
  flash: { pin: 'var(--color-flash)', sc: 'orange' },
  volt: { pin: 'var(--color-voltage)', sc: 'red' },
};

/** `title` is a lockup string ("Crystal. *Made for your kitchen.*"); `sticker` is the product's die-cut phrase from the home page. */
export function ProductHero({ title, tone, sticker, body, images, alt, children }: { title: string; tone: Tone; sticker: string; body: string; images: string[]; alt: string; children: ReactNode }) {
  const look = LOOK[tone];
  return (
    <section className="pt-8 pb-16 sm:pt-12 sm:pb-24" aria-labelledby="p-title">
      <div className="container-x grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="relative" style={{ ['--pin' as string]: look.pin }}>
          <Gallery images={images} alt={alt} />
          <DieCut text={sticker} tone={look.sc} className="absolute -top-6 right-4 z-[4] text-[22px] sm:right-10 sm:text-[28px]" />
        </div>
        <div className="flex flex-col gap-7 lg:pt-6">
          <Lockup id="p-title" as="h1" title={title} tone={tone} size="md" />
          <p className="font-serif text-[21px] leading-snug text-ink italic sm:text-[23px]">{body}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

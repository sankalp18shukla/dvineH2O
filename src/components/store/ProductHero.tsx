import type { ReactNode } from 'react';
import { ProductStage } from './ProductStage';
import { Lockup } from '../ui/Brand';
import { Words } from '../ui/Cta';

type Tone = 'glacier' | 'flash' | 'volt';
/** Product colours as on the home collection: lockup tone, disc, frame pins and die-cut sticker. */
const STICKER: Record<Tone, 'blue' | 'red' | 'orange'> = { glacier: 'blue', flash: 'orange', volt: 'red' };

/**
 * Product page hero (01): gallery left (55%), purchase right (45%), as the content document lays out.
 * The title is the brand lockup: `title` (the category, "Home water system") as the italic line over the product's
 * `name` as a large sans line (.ph-lk in globals.css); the body lights up word by word on load.
 */
export function ProductHero({ name, title, tone, sticker, body, cutout, images, alt, axis, children }: {
  name: string; title: string; tone: Tone; sticker: string; body: string; cutout: string; images: string[]; alt: string; children: ReactNode;
  /** the cut-out's direction, base to top, for the finish wipe (products sold in several finishes; see ProductStage) */
  axis?: number;
}) {
  return (
    // pt-16: the die-cut sticker stands on the frame's top edge and must clear the header at the top of the page
    <section className="pt-16 pb-20 sm:pb-28" aria-labelledby="p-title">
      <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16 [&>*]:min-w-0">
        {/* From lg the gallery stays put under the sticky header (76px + 68px: room for the sticker standing on the frame) while the purchase column scrolls past,
            and lets go only when the hero ends, so no empty space opens under the thumbnails. Its width is capped by
            the viewport's height (stage 0.96:1 plus ~110px of thumbnails, 24px clear below, 144px above) so the whole gallery,
            thumbnails included, stays in view on short laptop screens. */}
        <div className="lg:sticky lg:top-[144px] lg:self-start">
          <div className="lg:mx-auto lg:max-w-[max(420px,calc((100svh_-_278px)/0.96))]">
            <ProductStage name={name} tone={tone} cutout={cutout} images={images} alt={alt} sticker={sticker} stickerTone={STICKER[tone]} axis={axis} />
          </div>
        </div>
        {/* data-still: the product's name and intro are simply there, with no scroll entrance (landing.ts) */}
        <div className="flex flex-col gap-8 lg:pt-4" data-still>
          <Lockup id="p-title" as="h1" title={`*${title}* ${name}.`} tone={tone} className="ph-lk" />
          <p className="font-serif text-[21px] leading-snug text-ink italic sm:text-[24px]" data-words><Words text={body} /></p>
          {children}
        </div>
      </div>
    </section>
  );
}

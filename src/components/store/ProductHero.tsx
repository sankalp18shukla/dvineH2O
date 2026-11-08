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
export function ProductHero({ name, title, tone, sticker, body, cutout, images, alt, shell, axis, children }: {
  name: string; title: string; tone: Tone; sticker: string; body: string; cutout: string; images: string[]; alt: string; children: ReactNode;
  /** the cutout's metal map and direction, for products sold in several finishes (see ProductStage) */
  shell?: string; axis?: number;
}) {
  return (
    <section className="pt-6 pb-20 sm:pt-10 sm:pb-28" aria-labelledby="p-title">
      <div className="container-x grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16 [&>*]:min-w-0">
        <ProductStage name={name} tone={tone} cutout={cutout} images={images} alt={alt} sticker={sticker} stickerTone={STICKER[tone]} shell={shell} axis={axis} />
        <div className="flex flex-col gap-8 lg:pt-4">
          <Lockup id="p-title" as="h1" title={`*${title}* ${name}.`} tone={tone} className="ph-lk" />
          <p className="font-serif text-[21px] leading-snug text-ink italic sm:text-[24px]" data-words><Words text={body} /></p>
          {children}
        </div>
      </div>
    </section>
  );
}

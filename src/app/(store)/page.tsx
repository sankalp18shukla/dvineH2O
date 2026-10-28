import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { HeroShowcase } from '@/components/store/hero/HeroShowcase';
import { HOME, HERO_SLIDES } from '@/lib/content';
import { ActionBar } from '@/components/store/ActionBar';
import { WaterTestScroll } from '@/components/store/WaterTestScroll';
import { FitShowcase, type FitItem } from '@/components/store/FitShowcase';
import { InsideScroll } from '@/components/store/InsideScroll';
import { HelpChoosing } from '@/components/store/HelpChoosing';
import { AboutBand } from '@/components/store/AboutBand';
import { SmoothScroll } from '@/components/store/SmoothScroll';
import { Preloader } from '@/components/store/Preloader';
import { Lockup, DieCut, Squiggle } from '@/components/ui/Brand';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Collection rows: the hero's accent and features per product, and the transparent cutout once it is in public/. */
const fitItems = (): FitItem[] => HOME.collection.cards.map(c => {
  const slide = HERO_SLIDES.find(h => h.key === c.slug)!;
  const cutout = existsSync(join(process.cwd(), 'public', c.cutout));
  return { ...c, src: cutout ? c.cutout : c.image, cutout, feats: slide.feats };
});

/** Help-choosing cards: the section photo once it is in public/, otherwise the fallback. */
const helpOptions = HOME.helpChoosing.options.map(({ image, fallback, ...o }) => ({
  ...o, src: existsSync(join(process.cwd(), 'public', image)) ? image : fallback,
}));

const [, aboutLead, aboutTail] = HOME.about.title.match(/^\*([^*]+)\*\s*(.*)$/)!;

export default function Home() {
  return (
    <>
      <Preloader model={HERO_SLIDES[0].model} />
      <SmoothScroll />
      <Header framed />
      <main id="main">
        <h1 className="sr-only">DVINE H2O — functional hydration for home, on the go and business</h1>
        <HeroShowcase slides={HERO_SLIDES} />

        {/* 02 · Water testing: scroll-scrubbed water-drop clip, copy lights up in step */}
        <WaterTestScroll title={HOME.waterTesting.title} body={HOME.waterTesting.body} />

        {/* 03 · Collection: one product per row, alternating sides */}
        <FitShowcase title={HOME.collection.title} body={HOME.collection.body} items={fitItems()} />

        {/* 04 · Technology: scroll-scrubbed walk through the machine, one step of copy per part of the clip */}
        <InsideScroll title={HOME.technology.title} steps={HOME.technology.labels} cta={{ label: 'Explore Crystal Technology', href: '/home-water-systems#technology' }} />

        {/* 05 · Help choosing: a 3D deck of the three options, each typed in and stacked over the last as you scroll */}
        <HelpChoosing title={HOME.helpChoosing.title} body={HOME.helpChoosing.body} options={helpOptions} />

        {/* 06 · About: "Meet [water as intended] DVINE." over the Glacier wave band, the copy glowing up, then the buttons */}
        <AboutBand lead={aboutLead} tail={aboutTail} body={HOME.about.body} />

        {/* 07 · Assistance */}
        <section className="section" aria-labelledby="assist-title">
          <div className="container-x">
            <div className="pin-frame relative" style={{ ['--pin' as string]: 'var(--color-glacier)' }} data-reveal>
              <div className="surface-blue relative overflow-hidden px-6 py-14 sm:px-14 sm:py-16">
                <Squiggle className="pointer-events-none absolute -right-16 -bottom-24 hidden w-64 text-voltage opacity-90 md:block" />
                <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
                  <div className="max-w-2xl">
                    <Lockup id="assist-title" title={HOME.assistance.title} tone="glacier" />
                    <p className="mt-9 text-[19px] leading-relaxed text-white/85 sm:text-xl">{HOME.assistance.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 lg:flex-col lg:items-stretch">
                    <Link href="/support#contact" className="btn btn-red">Contact DVINE</Link>
                    <Link href="/support#products" className="btn border border-white/40 text-white hover:bg-white hover:text-deep-current">Get Product Support</Link>
                  </div>
                </div>
              </div>
              <DieCut text={'BRB,\nRefilling.'} className="absolute -top-7 right-6 z-[4] text-[24px] sm:right-16 sm:text-[30px]" />
            </div>
          </div>
        </section>
      </main>
      <ActionBar watch="wt-title" title="Crystal" sub="Home water system" action={{ label: 'Shop Crystal', href: '/home-water-systems' }} />
    </>
  );
}

import { Header } from '@/components/store/Header';
import { HeroShowcase } from '@/components/store/hero/HeroShowcase';
import { HOME, HERO_SLIDES } from '@/lib/content';
import { ActionBar } from '@/components/store/ActionBar';
import { WaterTestScroll } from '@/components/store/WaterTestScroll';
import { FitShowcase, type FitItem } from '@/components/store/FitShowcase';
import { InsideScroll } from '@/components/store/InsideScroll';
import { HelpChoosing } from '@/components/store/HelpChoosing';
import { AboutBand } from '@/components/store/AboutBand';
import { AssistBand } from '@/components/store/AssistBand';
import { SmoothScroll } from '@/components/store/SmoothScroll';
import { Preloader } from '@/components/store/Preloader';
import { PromoCards } from '@/components/store/PromoCards';
import { getContent } from '@/lib/site-content.server';
import { DEFAULT_CONTENT, isLive, todayIST } from '@/lib/site-content';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Collection rows: each card's own copy and facts, and the transparent cutout once it is in public/. */
const fitItems = (): FitItem[] => HOME.collection.cards.map(c => {
  const cutout = existsSync(join(process.cwd(), 'public', c.cutout));
  return { ...c, src: cutout ? c.cutout : c.image, cutout };
});

/** Help-choosing cards: the section photo once it is in public/, otherwise the fallback. */
const helpOptions = HOME.helpChoosing.options.map(({ image, fallback, ...o }) => ({
  ...o, src: existsSync(join(process.cwd(), 'public', image)) ? image : fallback,
}));

const [, aboutLead, aboutTail] = HOME.about.title.match(/^\*([^*]+)\*\s*(.*)$/)!;

/** Rendered per request: the promotions (Admin › Homepage & promotions) run on dates, and staff can preview the draft. */
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const c = await getContent((await searchParams).preview);
  const today = todayIST();
  const promos = c.slides.filter(x => isLive(x, today) && (x.title || x.tag || x.media?.src));
  const cards = c.promo.enabled ? c.promo.cards.filter(x => isLive(x, today)) : [];
  const ribbon = { ...c.ribbon, enabled: c.ribbon.enabled && isLive(c.ribbon, today) };
  const w = c.water;
  return (
    <>
      <Preloader model={HERO_SLIDES[0].model} />
      <SmoothScroll />
      <Header framed home ribbon={ribbon} />
      {/* data-home: keeps the homepage out of the inner-page headline rules (globals.css, LockupFit.tsx) */}
      <main id="main" data-home>
        <h1 className="sr-only">DVINE H2O — functional hydration for home, on the go and business</h1>
        <HeroShowcase slides={HERO_SLIDES} promos={promos} />

        {/* Optional promotion cards (one banner, or two or three cards) */}
        <PromoCards promo={c.promo} cards={cards} />

        {/* 02 · Water testing: scroll-scrubbed water-drop clip, copy lights up in step */}
        <WaterTestScroll title={w.title} body={w.body} pics={w.pics} primary={w.primary} secondary={w.secondary}
          designed={w.body === DEFAULT_CONTENT.water.body} designedTitle={w.title === DEFAULT_CONTENT.water.title} />

        {/* 03 · Collection: one product per row, alternating sides */}
        <FitShowcase title={HOME.collection.title} body={HOME.collection.body} items={fitItems()} />

        {/* 04 · Technology: scroll-scrubbed walk through the machine, one step of copy per part of the clip */}
        <InsideScroll title={HOME.technology.title} steps={HOME.technology.labels} cta={{ label: 'Explore Crystal Technology', href: '/home-water-systems#technology' }} />

        {/* 05 · Help choosing: a 3D deck of the three options, each typed in and stacked over the last as you scroll */}
        <HelpChoosing title={HOME.helpChoosing.title} body={HOME.helpChoosing.body} options={helpOptions} />

        {/* 06 · About: "Meet [water as intended] DVINE." over the Glacier wave band, the copy glowing up, then the buttons */}
        <AboutBand lead={aboutLead} tail={aboutTail} body={HOME.about.body} />

        {/* 07 · Assistance: the handover photo under moving wave lines, the copy, the buttons, then the sticker */}
        <AssistBand title={HOME.assistance.title} body={HOME.assistance.body} />
      </main>
      <ActionBar watch="wt-title" title="Crystal" sub="Home water system" action={{ label: 'Shop Crystal', href: '/home-water-systems' }} />
    </>
  );
}

import type { Metadata } from 'next';
import { seo } from '@/lib/seo-keywords';
import { Header } from '@/components/store/Header';
import { HeroShowcase } from '@/components/store/hero/HeroShowcase';
import { HOME, HERO_SLIDES, TEST_NOTE } from '@/lib/content';
import { WaterTestScroll } from '@/components/store/WaterTestScroll';
import { FitShowcase, type FitItem } from '@/components/store/FitShowcase';
import { InsideScroll } from '@/components/store/InsideScroll';
import { Benefits } from '@/components/store/Benefits';
import { Certifications } from '@/components/store/Certifications';
import { HomeReviews } from '@/components/store/HomeReviews';
import { HomeBlog } from '@/components/store/HomeBlog';
import { getHomePosts } from '@/lib/blog.server';
import { withLiveRefs } from '@/lib/research';
import { AboutBand } from '@/components/store/AboutBand';
import { AssistBand } from '@/components/store/AssistBand';
import { SmoothScroll } from '@/components/store/SmoothScroll';
import { Preloader } from '@/components/store/Preloader';
import { PromoCards } from '@/components/store/PromoCards';
import { getContent } from '@/lib/site-content.server';
import { DEFAULT_CONTENT, isLive, todayIST } from '@/lib/site-content';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Home keeps the site title; this adds its search terms and canonical URL (src/lib/seo-keywords.ts). */
export const metadata: Metadata = seo('/');

/** Collection rows: each card's own copy and facts, and the transparent cutout once it is in public/. */
const fitItems = (): FitItem[] => HOME.collection.cards.map(c => {
  const cutout = existsSync(join(process.cwd(), 'public', c.cutout));
  return { ...c, src: cutout ? c.cutout : c.image, cutout };
});

const [, aboutLead, aboutTail] = HOME.about.title.match(/^\*([^*]+)\*\s*(.*)$/)!;

/** Rendered per request: the promotions (Admin › Homepage & promotions) run on dates, and staff can preview the draft. */
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  const [c, posts] = await Promise.all([getContent(preview), getHomePosts(4)]);
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
        <InsideScroll title={HOME.technology.title} steps={withLiveRefs(HOME.technology.labels)} cta={{ label: 'Explore Crystal Technology', href: '/home-water-systems#technology' }} />

        {/* 05 · Benefits: six photo cards, each saying how we know (takes the place of "A few details can help you choose") */}
        <Benefits id="benefits-title" title={HOME.benefits.title} cards={HOME.benefits.cards} note={<>{TEST_NOTE} <a href="/home-water-systems/test-results" className="link whitespace-nowrap">See the test results</a></>} />

        {/* 06 · Certifications: one row of marks, each opening what it covers */}
        <Certifications title={HOME.certs.title} body={HOME.certs.body} items={HOME.certs.items} />

        {/* 07 · Reviews: hidden on the live site until ten real ones are approved */}
        <HomeReviews title={HOME.reviews.title} minimum={HOME.reviews.minimum} preview={preview === 'reviews'} />

        {/* 08 · Blog: the three articles chosen in Admin › Blog */}
        <HomeBlog title={HOME.blog.title} posts={posts} />

        {/* 09 · About: "Meet [water as intended] DVINE." over the Glacier wave band, the copy glowing up, then the buttons */}
        <AboutBand lead={aboutLead} tail={aboutTail} body={HOME.about.body} />

        {/* 10 · Assistance: the handover photo under moving wave lines, the copy, the buttons, then the sticker */}
        <AssistBand title={HOME.assistance.title} body={HOME.assistance.body} />
      </main>
    </>
  );
}

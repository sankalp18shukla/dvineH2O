/* eslint-disable @next/next/no-img-element -- FanHero takes its front photo as a plain <img> */
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { seo } from '@/lib/seo-keywords';
import { Header } from '@/components/store/Header';
import { SmoothScroll } from '@/components/store/SmoothScroll';
import { ActionBar } from '@/components/store/ActionBar';
import { WaveBand } from '@/components/store/WaveBand';
import { FanHero } from '@/components/store/FanHero';
import { LightUp } from '@/components/store/LightUp';
import { Certifications } from '@/components/store/Certifications';
import { SectionHead } from '@/components/ui/Section';
import { Icon } from '@/components/ui/Icon';
import { Cta, Words } from '@/components/ui/Cta';
import { DieCut, Facts, Lockup, plain } from '@/components/ui/Brand';
import css from '@/components/store/Bands.module.css';
import { ABOUT, HOME, SITE } from '@/lib/content';

export const metadata: Metadata = seo('/about', {
  title: 'About us',
  description: `${plain(ABOUT.body)} Founded by ${ABOUT.founder.name}.`,
});

/**
 * About Us: who DVINE H2O is (hero), the founder's note, what we believe, the three systems, after-sale care, the
 * certificates (the homepage's row) and the company's registrations. Copy lives in ABOUT in src/lib/content.ts.
 */
export default function AboutPage() {
  const f = ABOUT.founder;
  const tel = `tel:${SITE.phone.replace(/\s/g, '')}`;
  return (
    <>
      <Header framed />
      <SmoothScroll />
      <main id="main">
        {/* 01 · Hero: copy left, a hand of three photos right */}
        <FanHero id="about-title" title={ABOUT.title} tone="glacier" body={ABOUT.body}
          front={<img src="/images/hands-water.webp" alt="Cupped hands holding water" />}
          back={[{ src: '/images/crystal/kitchen-pour.webp', alt: 'Crystal pouring a glass of water on a kitchen counter' }, { src: '/images/hyper-water.webp', alt: 'A Hyper bottle lying in rippling water' }]}
          sticker={<DieCut text={'Main Character\nHydration.'} tone="blue" />}>
          <div id="hero-actions" className="cta-row border-t-2 border-ink pt-6" data-rise>
            <Cta href="#founder" tone="glacier">Read the Founder’s Note</Cta>
            <Cta href="#collection" kind="glass">Meet the Products</Cta>
          </div>
        </FanHero>

        {/* 02 · The founder's note: the question that started DVINE, in her words */}
        <section id="founder" className="section" aria-labelledby="founder-title">
          <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-20">
            <div>
              <Lockup id="founder-title" title={f.title} tone="glacier" size="md" />
              <figure className="mt-10 max-w-[440px]" data-rise>
                <div className="relative aspect-[3/4] overflow-hidden bg-mist">
                  <Image src={f.portrait.src} alt={f.portrait.alt} fill sizes="(min-width:480px) 440px, 100vw" className="object-cover" />
                </div>
                <figcaption className="border-t-2 border-ink pt-6 mt-6">
                  <p className="font-sans text-[26px] font-bold tracking-[-0.03em]">{f.name}</p>
                  <p className="mt-1 font-serif text-[20px] italic text-muted">{f.role}</p>
                </figcaption>
              </figure>
            </div>
            <blockquote className="relative">
              <span className="pointer-events-none absolute -top-16 -left-2 font-serif text-[160px] leading-none text-deep-current/15 select-none sm:-left-8" aria-hidden="true">“</span>
              <p className="relative font-serif text-[28px] leading-[1.15] italic text-ink sm:text-[38px]" data-words><Words text={f.lead} /></p>
              {f.note.map(p => <p key={p} className="mt-6 max-w-2xl text-[19px] leading-relaxed text-ink/80" data-reveal>{p}</p>)}
              <p className="mt-10 max-w-2xl border-t-2 border-ink pt-6 font-sans text-[21px] font-bold leading-snug tracking-[-0.02em]" data-reveal>{f.close}</p>
              <footer className="mt-6 font-serif text-[20px] italic text-muted">— {f.name}</footer>
            </blockquote>
          </div>
          {/* Nandini at work: the stall, a meeting, a café desk, a Hyper in every one */}
          <div className="container-x mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-5 lg:mt-24">
            {f.moments.map((m, i) => (
              <figure key={m.src} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                <div className="relative aspect-[4/5] overflow-hidden bg-mist sm:aspect-[3/4]">
                  <Image src={m.src} alt={m.alt} fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mt-3 border-t-2 border-ink pt-3 font-serif text-[18px] italic text-muted">{m.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* 03 · What we believe: numbered, ruled tiles that light up in turn */}
        <section className="section pt-0" aria-labelledby="believe-title">
          <div className="container-x">
            <SectionHead id="believe-title" tone="volt" title={ABOUT.beliefs.title} />
            <LightUp armClass={css.armed} litClass={css.lit} className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {ABOUT.beliefs.items.map((b, i) => (
                <article key={b.title} className={`${css.tile} ${css.callout}`} data-light={i}>
                  <div className="flex items-center justify-between">
                    <span className={css.chip} style={{ ['--d' as string]: `${i * -1.2}s` }}><Icon name={b.icon} className="size-6" strokeWidth={1.4} /></span>
                    <span className={`${css.tileN} font-serif text-[34px] leading-none text-deep-current/80 italic`}>0{i + 1}</span>
                  </div>
                  <h3 className="mt-6 font-sans text-[22px] font-bold tracking-[-0.03em]">{b.title}</h3>
                  <p className="mt-2 text-[17px] leading-snug text-muted">{b.body}</p>
                  {'href' in b && b.href && <Link href={b.href} className="mt-4 inline-flex items-center gap-2 font-sans text-[15px] font-semibold text-ink underline underline-offset-4">{b.link} <Icon name="arrow" className="size-4" /></Link>}
                </article>
              ))}
            </LightUp>
          </div>
        </section>

        {/* 04 · The three systems */}
        <section id="collection" className="section pt-0" aria-labelledby="collection-title">
          <div className="container-x">
            <SectionHead id="collection-title" tone="flash" title={ABOUT.collection.title} />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {ABOUT.collection.items.map((p, i) => (
                <Link key={p.href} href={p.href} className="group relative flex aspect-[4/5] flex-col items-start justify-end overflow-hidden bg-stage p-6 text-white sm:aspect-[3/4]" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                  <Image src={p.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-stage-deep/90 via-stage-deep/15 to-transparent" aria-hidden="true" />
                  <h3 className="tag-box relative text-[30px] sm:text-[34px]">{p.title}</h3>
                  <span className="relative mt-4 flex items-center gap-2 font-sans text-sm text-white/85">{p.body} <Icon name="arrow" className="size-4 transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 05 · After the sale: installation, service area, warranty, one number */}
        <section className={`on-glacier relative overflow-clip text-ink ${css.bandTop} ${css.glacierCopy}`} aria-labelledby="care-title">
          <WaveBand tone="glacier" interactive knot />
          <div className="container-x relative grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-20">
            <div className="lg:sticky lg:top-36 lg:self-start">
              <Lockup id="care-title" title={ABOUT.care.title} tone="blue" size="md" />
              <p className="lede mt-9" data-words><Words text={ABOUT.care.body} /></p>
              <div className="cta-row mt-10" data-rise>
                <Cta href="/support" kind="ink">Get Support</Cta>
                <Cta href={tel} kind="glass">Call {SITE.phone}</Cta>
              </div>
            </div>
            <div data-reveal><Facts cols={2} items={ABOUT.care.items} /></div>
          </div>
        </section>

        {/* 06 · Certificates: the homepage's row, on the deep band tucked under the Glacier one */}
        <Certifications title={HOME.certs.title} body={HOME.certs.body} items={HOME.certs.items} className={`${css.overlap} ${css.bandUnder}`} />

        {/* 07 · The company on record */}
        <section className="section" aria-labelledby="registered-title">
          <div className="container-x">
            <SectionHead id="registered-title" tone="glacier" title={ABOUT.registered.title} />
            <div data-reveal>
              <Facts cols={3} items={ABOUT.registered.items.map(r => ({
                title: r.title,
                body: <>{r.body}{'file' in r && r.file && <> <a href={r.file} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 font-sans text-[15px] font-semibold text-ink underline underline-offset-4">View the certificate <Icon name="arrow" className="size-4" /></a></>}</>,
              }))} />
            </div>
          </div>
        </section>

        {/* 08 · Close */}
        <section className="section pt-0" aria-labelledby="close-title">
          <div className="container-x">
            <SectionHead id="close-title" tone="volt" title={ABOUT.close.title} body={ABOUT.close.body} align="center">
              <div className="cta-row justify-center" data-rise>
                <Cta href="/book-demo" tone="glacier">Book a Demo</Cta>
                <Cta href="/support#ask" kind="glass">Ask Us a Question</Cta>
              </div>
            </SectionHead>
          </div>
        </section>
      </main>
      <ActionBar tone="blue" watch="hero-actions" title="About DVINE H2O" sub="Bhubaneswar, Odisha" action={{ label: 'Book a Demo', href: '/book-demo' }} />
    </>
  );
}

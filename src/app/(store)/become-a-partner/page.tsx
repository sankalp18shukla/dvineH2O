/* eslint-disable @next/next/no-img-element -- the hero photo may be any hosted URL set in the admin */
import type { Metadata } from 'next';
import { Header } from '@/components/store/Header';
import { SmoothScroll } from '@/components/store/SmoothScroll';
import { ActionBar } from '@/components/store/ActionBar';
import { WaveBand } from '@/components/store/WaveBand';
import { AutoVideo } from '@/components/store/AutoVideo';
import { ScrollMarquee } from '@/components/store/ScrollMarquee';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { SectionHead } from '@/components/ui/Section';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { Cta, Words } from '@/components/ui/Cta';
import { DieCut, LabelBox, Lockup, plain } from '@/components/ui/Brand';
import { LightUp } from '@/components/store/LightUp';
import { FanHero } from '@/components/store/FanHero';
import css from '@/components/store/Bands.module.css';
import { getContent } from '@/lib/site-content.server';
import { DEFAULT_PARTNER } from '@/lib/site-content';
import { SITE } from '@/lib/content';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Become a partner', description: plain(DEFAULT_PARTNER.body), alternates: { canonical: '/become-a-partner' } };

const ICONS = ['box', 'users', 'wrench', 'gift', 'star', 'chat', 'building', 'drop'];

/** Become a Partner: distributors, dealers and institutional partners. All copy is edited in Admin › Homepage & promotions › Partner page. */
export default async function PartnerPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const p = (await getContent((await searchParams).preview)).partner;
  const m = p.media?.src ? p.media : null;
  const tel = `tel:${SITE.phone.replace(/\s/g, '')}`;
  const types = p.partnerTypes.map(t => t.text).filter(Boolean);
  return (
    <>
      <Header framed />
      <SmoothScroll />
      <main id="main">
        {/* 01 · Hero: copy and actions left, a hand of three photos right (FanHero); the front one is the admin's photo or film */}
        <FanHero id="p-title" title={p.title} tone="volt" body={p.body || undefined}
          front={m ? (m.type === 'video' ? <AutoVideo src={m.src} poster={m.poster} className="size-full object-cover" label={m.alt || undefined} /> : <img src={m.src} alt={m.alt} />) : <img src="/images/collection.webp" alt="Crystal, Titan and Hyper together" />}
          back={[{ src: '/images/titan_sec.png', alt: 'Colleagues at TitanForce 111 in an office' }, { src: '/images/brand-handover.webp', alt: 'A Hyper bottle passed from one hand to another' }]}
          sticker={<DieCut text={'Let’s Grow\nTogether.'} tone="red" />}>
          <div className="flex flex-col gap-6" data-rise>
            <div id="hero-actions" className="cta-row border-t-2 border-ink pt-6">
              <Cta href="#apply" tone="volt">Apply to Partner</Cta>
              <Cta href={tel} kind="glass">Call {SITE.phone}</Cta>
            </div>
            {types.length > 0 && (
              <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 font-sans text-[14px] text-muted">
                {types.slice(0, 4).map(t => <li key={t} className="flex items-center gap-2"><Icon name="check" className="size-4 shrink-0 text-deep-current" /> {t}</li>)}
              </ul>
            )}
          </div>
        </FanHero>

        {/* 02 · Who we work with: the partner types slide past in the lockup's two voices as you scroll */}
        {types.length > 0 && (
          <section className="pt-20 sm:pt-28" aria-labelledby="who-title">
            <div className="container-x mb-10"><h2 id="who-title"><LabelBox tone="blue">Who we work with</LabelBox></h2></div>
            <ScrollMarquee items={types} label="We work with" />
          </section>
        )}

        {/* 03 · Why partner: numbered, ruled tiles that rise in one after another */}
        {p.benefits.length > 0 && (
          <section className="section" aria-labelledby="why-title">
            <div className="container-x">
              <SectionHead id="why-title" tone="volt" title={p.benefitsTitle || '*Why partner* with us.'} />
              <LightUp armClass={css.armed} litClass={css.lit} className={`grid gap-x-8 gap-y-14 sm:grid-cols-2 ${p.benefits.length % 3 === 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                {p.benefits.map((b, i) => (
                  <article key={b.id} className={`${css.tile} ${css.callout}`} data-light={i}>
                    <div className="flex items-center justify-between">
                      <span className={css.chip} style={{ ['--d' as string]: `${i * -1.2}s` }}><Icon name={ICONS[i % ICONS.length]} className="size-6" strokeWidth={1.4} /></span>
                      <span className={`${css.tileN} font-serif text-[34px] leading-none text-deep-current/80 italic`}>0{i + 1}</span>
                    </div>
                    <h3 className="mt-6 font-sans text-[22px] font-bold tracking-[-0.03em]">{b.title}</h3>
                    <p className="mt-2 text-[17px] leading-snug text-muted">{b.body}</p>
                  </article>
                ))}
              </LightUp>
              <div className="mt-14" data-rise><Cta href="#apply" kind="ink">Apply to Partner</Cta></div>
            </div>
          </section>
        )}

        {/* 04 · How it works: steps on a line that draws down with the scroll */}
        {p.steps.length > 0 && (
          <section className={`on-glacier relative overflow-clip text-ink ${css.bandTop} ${css.glacierCopy}`} aria-labelledby="how-title">
            <WaveBand tone="glacier" interactive knot />
            <div className="container-x relative grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
              <div className="lg:sticky lg:top-36 lg:self-start">
                <Lockup id="how-title" title={p.stepsTitle || '*How it* works.'} tone="blue" size="md" />
                <div className="mt-10" data-rise><Cta href="#apply" kind="ink">Apply to Partner</Cta></div>
              </div>
              <ol className="relative">
                {p.steps.map((s, i) => (
                  <li key={s.id} className="relative grid grid-cols-[56px_1fr] gap-6 pb-12 last:pb-0 lg:min-h-[22svh] lg:last:min-h-0">
                    {i < p.steps.length - 1 && <span className="absolute top-14 bottom-0 left-[27px] w-[2px] bg-ink/15" aria-hidden="true"><span className="block size-full bg-ink" data-draw /></span>}
                    <span className="grid size-14 place-items-center rounded-full bg-ink font-serif text-[30px] text-glacier italic ring-8 ring-glacier" data-pop>{i + 1}</span>
                    <div className="pt-2"><h3 className="font-sans text-[22px] font-bold tracking-[-0.03em]">{s.title}</h3>{s.body && <p className="mt-1 font-serif text-[20px] leading-snug italic text-ink/80" data-words><Words text={s.body} /></p>}</div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* 05 · Partner enquiry, into the CRM as a distributorship enquiry */}
        <section id="apply" className={`on-dark relative overflow-clip text-white ${p.steps.length > 0 ? `${css.overlap} ${css.bandUnder}` : css.bandPad}`} aria-labelledby="apply-title">
          <WaveBand interactive knot />
          <span className={css.scrim} aria-hidden="true" />
          <div className="container-x relative grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Lockup id="apply-title" title={p.formTitle || '*Tell us* about your business.'} tone="volt" size="md" />
              {p.formBody && <p className="lede mt-9" data-words><Words text={p.formBody} /></p>}
              <ul className="mt-10 grid gap-4 font-sans" data-rise>
                <li><a href={tel} className="group flex items-center gap-4 text-white"><span className="grid size-11 place-items-center rounded-full bg-white/10 transition group-hover:bg-voltage group-hover:text-ink"><Icon name="phone" className="size-5" /></span>{SITE.phone}</a></li>
                <li><a href={`mailto:${SITE.email}`} className="group flex items-center gap-4 text-white"><span className="grid size-11 place-items-center rounded-full bg-white/10 transition group-hover:bg-voltage group-hover:text-ink"><Icon name="chat" className="size-5" /></span>{SITE.email}</a></li>
                <li><a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 text-white"><span className="grid size-11 place-items-center rounded-full bg-white/10 transition group-hover:bg-voltage group-hover:text-ink"><Icon name="whatsapp" className="size-5" /></span>WhatsApp us</a></li>
              </ul>
            </div>
            <EnquiryForm variant="distributorship" source="/become-a-partner" submitLabel="Send Partner Enquiry" dark partnerTypes={types} />
          </div>
        </section>

        {/* 06 · Questions */}
        {p.faqs.length > 0 && (
          <section className="section" aria-labelledby="pfaq-title">
            <div className="container-x">
              <SectionHead id="pfaq-title" tone="flash" title="*Partner* questions." />
              <div data-reveal><Faq items={p.faqs.map(f => ({ q: f.q, a: f.a }))} /></div>
              <div className="cta-row mt-12" data-rise><Cta href="#apply" kind="ink">Apply to Partner</Cta><Cta href="/support#contact" kind="glass">Ask Us a Question</Cta></div>
            </div>
          </section>
        )}
      </main>
      <ActionBar tone="blue" watch="hero-actions" title="Become a partner" sub="Distributors, dealers and institutions" action={{ label: 'Apply', href: '#apply' }} />
    </>
  );
}

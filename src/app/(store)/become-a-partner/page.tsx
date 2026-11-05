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
import { DieCut, LabelBox, Lockup, Squiggle, plain } from '@/components/ui/Brand';
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
        {/* 01 · Hero: inset card, framed like the home cards */}
        <section className="frame-card stage on-dark" aria-labelledby="p-title">
          <div className="wave-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="container-x relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div>
              <Lockup id="p-title" as="h1" title={p.title} tone="volt" />
              {p.body && <p className="mt-10 max-w-xl font-serif text-[21px] leading-snug text-white/90 italic sm:text-[24px]" data-words><Words text={p.body} /></p>}
              <div id="hero-actions" className="cta-row mt-10" data-rise>
                <Cta href="#apply" tone="volt">Apply to Partner</Cta>
                <Cta href={tel} kind="glass">Call {SITE.phone}</Cta>
              </div>
            </div>
            {m && (
              <div className="relative" style={{ ['--pin' as string]: 'var(--color-voltage)' }}>
                <div className="pin-frame relative aspect-[4/3]"><div className="absolute inset-0 overflow-hidden">
                  {m.type === 'video' ? <AutoVideo src={m.src} poster={m.poster} className="size-full object-cover" label={m.alt || undefined} /> : <img src={m.src} alt={m.alt} className="size-full scale-[1.12] object-cover" data-speed=".25" />}
                </div></div>
                <span className="absolute -bottom-7 -left-3 z-[4] sm:-left-8" data-pop><DieCut text={'Let’s Grow\nTogether.'} className="text-[22px] sm:text-[28px]" /></span>
              </div>
            )}
          </div>
        </section>

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
              <div className={`grid gap-x-8 gap-y-12 sm:grid-cols-2 ${p.benefits.length % 3 === 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`} data-rise>
                {p.benefits.map((b, i) => (
                  <article key={b.id} className="group border-t-2 border-ink pt-6">
                    <div className="flex items-center justify-between">
                      <span className="grid size-14 place-items-center rounded-full bg-voltage text-ink transition duration-500 group-hover:-rotate-12 group-hover:scale-105"><Icon name={ICONS[i % ICONS.length]} className="size-6" /></span>
                      <span className="font-serif text-[34px] leading-none text-deep-current/80 italic">0{i + 1}</span>
                    </div>
                    <h3 className="mt-6 font-sans text-[22px] font-bold tracking-[-0.03em]">{b.title}</h3>
                    <p className="mt-2 text-[17px] leading-snug text-muted">{b.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 04 · How it works: steps on a line that draws down with the scroll */}
        {p.steps.length > 0 && (
          <section className="surface-glacier section relative overflow-hidden" aria-labelledby="how-title">
            <Squiggle className="pointer-events-none absolute -right-16 -bottom-20 hidden w-72 text-deep-current/20 lg:block" />
            <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
              <div className="lg:sticky lg:top-36 lg:self-start">
                <Lockup id="how-title" title={p.stepsTitle || '*How it* works.'} tone="blue" size="md" />
                <div className="mt-10" data-rise><Cta href="#apply" kind="ink">Apply to Partner</Cta></div>
              </div>
              <ol className="relative">
                <span className="absolute top-5 bottom-10 left-[23px] w-[2px] bg-ink/15" aria-hidden="true"><span className="block size-full bg-ink" data-draw /></span>
                {p.steps.map((s, i) => (
                  <li key={s.id} className="relative grid grid-cols-[48px_1fr] gap-6 pb-14 last:pb-0">
                    <span className="grid size-12 place-items-center bg-voltage font-sans text-[15px] font-bold text-ink ring-8 ring-glacier" data-pop>{String(i + 1).padStart(2, '0')}</span>
                    <div><h3 className="font-sans text-[24px] font-bold tracking-[-0.03em]">{s.title}</h3>{s.body && <p className="mt-2 text-[18px] leading-snug text-ink/75" data-words><Words text={s.body} /></p>}</div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* 05 · Partner enquiry, into the CRM as a distributorship enquiry */}
        <section id="apply" className="on-dark section relative overflow-hidden py-28 text-white sm:py-40" aria-labelledby="apply-title">
          <WaveBand />
          <div className="container-x relative grid gap-14 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <Lockup id="apply-title" title={p.formTitle || '*Tell us* about your business.'} tone="volt" size="md" />
              {p.formBody && <p className="lede mt-9" data-words><Words text={p.formBody} /></p>}
              <ul className="mt-10 grid gap-4 font-sans" data-rise>
                <li><a href={tel} className="group flex items-center gap-4 text-white"><span className="grid size-11 place-items-center rounded-full bg-white/10 transition group-hover:bg-voltage group-hover:text-ink"><Icon name="phone" className="size-5" /></span>{SITE.phone}</a></li>
                <li><a href={`mailto:${SITE.email}`} className="group flex items-center gap-4 text-white"><span className="grid size-11 place-items-center rounded-full bg-white/10 transition group-hover:bg-voltage group-hover:text-ink"><Icon name="chat" className="size-5" /></span>{SITE.email}</a></li>
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
      <ActionBar watch="hero-actions" title="Become a partner" sub="Distributors, dealers and institutions" action={{ label: 'Apply', href: '#apply' }} />
    </>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { SupportForm } from '@/components/forms/SupportForm';
import { ActionBar } from '@/components/store/ActionBar';
import { SectionHead } from '@/components/ui/Section';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { SUPPORT } from '@/lib/content';
import { Lockup, Squiggle } from '@/components/ui/Brand';

export const metadata: Metadata = { title: 'Support', description: SUPPORT.hero.body, alternates: { canonical: '/support' } };

export default function SupportPage() {
  return (
    <>
      <Header framed />
      <main id="main">
        <section className="section pb-12" aria-labelledby="s-title">
          <div className="container-x">
            <Lockup id="s-title" as="h1" title={SUPPORT.hero.title} tone="glacier" />
            <p className="mt-10 max-w-2xl font-serif text-[21px] leading-snug text-ink italic sm:text-[24px]">{SUPPORT.hero.body}</p>
            <form action="/search" className="mt-9 flex max-w-2xl gap-2" role="search">
              <label htmlFor="sq" className="sr-only">Search support</label>
              <div className="relative flex-1"><Icon name="search" className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" /><input id="sq" name="q" className="input min-h-14 rounded-full pl-12 text-[17px]" placeholder="Search a product, order topic or question" /></div>
              <button className="btn btn-primary min-h-14">Search Support</button>
            </form>
            <p className="mt-4 flex flex-wrap items-center gap-2 font-sans text-sm text-muted">Suggested topics: {SUPPORT.hero.topics.map(t => <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="pill hover:border-deep-current">{t}</Link>)}</p>
            <a id="hero-actions" href="#contact" className="btn btn-outline mt-6">Contact Us</a>
          </div>
        </section>

        <section id="products" className="section" aria-labelledby="p-title">
          <div className="container-x">
            <SectionHead id="p-title" tone="flash" title={SUPPORT.products.title} body={SUPPORT.products.body} />
            <div className="grid gap-6 md:grid-cols-3">
              {SUPPORT.products.items.map((p, i) => (
                <Link key={p.slug} href={`/support/${p.slug}`} className="group relative flex aspect-[4/5] flex-col items-start justify-end overflow-hidden bg-stage p-6 text-white sm:aspect-[3/4]" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                  <Image src={p.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-stage-deep/90 via-stage-deep/15 to-transparent" aria-hidden="true" />
                  <h3 className="tag-box relative text-[30px] sm:text-[34px]">{p.title}</h3>
                  <span className="relative mt-4 flex items-center gap-2 font-sans text-sm text-white/85">{p.body} <Icon name="arrow" className="size-4 transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
            <div className="mt-12 flex flex-wrap gap-3">{SUPPORT.products.items.map((p, i) => <Link key={p.slug} href={`/support/${p.slug}`} className={`btn ${i === 0 ? 'btn-primary' : 'btn-outline'}`}>{p.title}</Link>)}</div>
          </div>
        </section>

        <section className="section" aria-labelledby="o-title">
          <div className="container-x">
            <div className="pin-frame relative" style={{ ['--pin' as string]: 'var(--color-glacier)' }} data-reveal>
              <div className="surface-blue relative overflow-hidden px-6 py-14 sm:px-14 sm:py-16">
                <Squiggle className="pointer-events-none absolute -right-16 -bottom-24 hidden w-64 text-voltage opacity-90 md:block" />
                <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
                  <div className="max-w-2xl"><Lockup id="o-title" title={SUPPORT.order.title} tone="glacier" size="md" /><p className="mt-9 text-[19px] leading-relaxed text-white/85 sm:text-xl">{SUPPORT.order.body}</p></div>
                  <div className="flex flex-wrap gap-3 lg:flex-col lg:items-stretch"><Link href="/track" className="btn btn-red">Track My Order</Link><a href="#contact" className="btn border border-white/40 text-white hover:bg-white hover:text-deep-current">Ask About Delivery</a></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="manuals" className="surface-glacier section" aria-labelledby="m-title">
          <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div data-reveal>
              <Lockup id="m-title" title={SUPPORT.manuals.title} tone="blue" size="md" /><p className="lede mt-9">{SUPPORT.manuals.body}</p>
              <div className="mt-9 flex flex-wrap gap-3"><Link href="/support/crystal" className="btn btn-primary">Download Manual</Link><Link href="/policies/warranty" className="btn btn-outline">Read Warranty</Link><a href="#contact" className="btn btn-outline">Request Service</a></div>
            </div>
            <div className="relative" data-reveal>
              <Squiggle className="pointer-events-none absolute -top-16 -left-14 z-[3] hidden w-52 text-voltage lg:block" />
              <div className="pin-frame relative aspect-[4/3]" style={{ ['--pin' as string]: 'var(--color-deep-current)' }}><div className="absolute inset-0 overflow-hidden"><Image src="/images/crystal-inside.webp" alt="Inside a DVINE system: filter cartridges and ionisation chamber" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /></div></div>
            </div>
          </div>
        </section>

        <section id="contact" className="section" aria-labelledby="c-title">
          <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <Lockup id="c-title" title={SUPPORT.contact.title} tone="volt" size="md" /><p className="lede mt-9">{SUPPORT.contact.body}</p>
              <ul className="mt-8 space-y-3 font-sans">
                <li className="flex items-center gap-3"><Icon name="phone" className="size-5 text-deep-current" /><a href="tel:18002024504" className="hover:underline">1800 202 4504</a></li>
                <li className="flex items-center gap-3"><Icon name="chat" className="size-5 text-deep-current" />Chat with us, bottom right</li>
              </ul>
            </div>
            <SupportForm topics={SUPPORT.contact.topics} />
          </div>
        </section>

        <section id="faq" className="section" aria-labelledby="f-title">
          <div className="container-x">
            <SectionHead id="f-title" tone="glacier" title={SUPPORT.faq.title} />
            <Faq items={SUPPORT.faq.items} />
            <div className="mt-12 flex flex-wrap gap-3"><Link href="/water-testing" className="btn btn-primary">Visit Water Testing</Link><Link href="/home-water-systems" className="btn btn-outline">Continue Shopping</Link></div>
          </div>
        </section>
      </main>
      <ActionBar watch="hero-actions" title="Need a hand?" sub="Our team replies quickly" action={{ label: 'Contact Us', href: '#contact' }} />
    </>
  );
}

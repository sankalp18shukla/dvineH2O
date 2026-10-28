import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { SupportForm } from '@/components/forms/SupportForm';
import { Faq } from '@/components/ui/Faq';
import { Icon } from '@/components/ui/Icon';
import { CRYSTAL, HYPER, SUPPORT } from '@/lib/content';
import { getProduct } from '@/lib/catalog';
import { Lockup, Steps } from '@/components/ui/Brand';

const GUIDES = {
  crystal: { title: 'Crystal', sub: 'Home water system', image: '/images/crystal.webp', care: ['Use only the drinking-water settings specified in the manual.', 'Replace filters as guided by the touchscreen filter status.', 'Book the annual maintenance visit to keep ionisation plates in condition.', 'Keep the drip tray clean and dry.'], faq: CRYSTAL.faq.items, shop: '/home-water-systems' },
  hyper: { title: 'Hyper', sub: 'Hydrogen water bottle', image: '/images/hyper.webp', care: ['Fill with suitable drinking water only.', 'Run Auto Clean as described in the guide.', 'Charge over USB-C; don’t charge while submerged.', 'Rinse the glass chamber and dry before storing.'], faq: HYPER.faq.items, shop: '/hydrogen-bottles' },
  titan: { title: 'Titan', sub: 'Business water system', image: '/images/titan.webp', care: ['Service is arranged through your DVINE account manager.', 'Follow the configured maintenance schedule for your site.', 'Report any display warnings to support with the serial number.'], faq: [], shop: '/for-business' },
} as const;

/** Product colours as on the home collection. */
const TONE = { crystal: 'glacier', hyper: 'flash', titan: 'volt' } as const;
const PIN = { crystal: 'var(--color-glacier)', hyper: 'var(--color-flash)', titan: 'var(--color-voltage)' } as const;

export function generateStaticParams() { return Object.keys(GUIDES).map(product => ({ product })); }
export async function generateMetadata({ params }: { params: Promise<{ product: string }> }): Promise<Metadata> {
  const g = GUIDES[(await params).product as keyof typeof GUIDES]; return { title: g ? `${g.title} guides and care` : 'Support' };
}

export default async function ProductSupport({ params }: { params: Promise<{ product: string }> }) {
  const slug = (await params).product as keyof typeof GUIDES;
  const g = GUIDES[slug]; if (!g) notFound();
  const p = await getProduct(slug);
  return (
    <>
      <Header framed />
      <main id="main">
        <section className="section pb-10">
          <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <Link href="/support" className="inline-flex items-center gap-2 font-sans text-sm text-muted hover:text-ink"><Icon name="arrowLeft" className="size-4" /> Support</Link>
              <Lockup as="h1" title={`*${g.sub}* ${g.title}.`} tone={TONE[slug]} className="mt-10" />
              <p className="mt-9 font-serif text-[21px] leading-snug text-ink italic sm:text-[23px]">Guides, care and service.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                {p?.manualUrl ? <a href={p.manualUrl} className="btn btn-primary"><Icon name="doc" className="size-4" /> Download Manual</a> : <span className="btn btn-outline pointer-events-none opacity-60">Manual coming soon</span>}
                <Link href="/policies/warranty" className="btn btn-outline">Read Warranty</Link>
                <a href="#service" className="btn btn-outline">Request Service</a>
              </div>
            </div>
            <div className="pin-frame relative aspect-[16/10] bg-stage" style={{ ['--pin' as string]: PIN[slug] }}><div className="absolute inset-0 overflow-hidden"><Image src={g.image} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /></div></div>
          </div>
        </section>
        <section className="surface-glacier section">
          <div className="container-x grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div><Lockup title="*Care,* in short." tone="blue" size="md" /><Steps className="mt-10" items={g.care.map(title => ({ title }))} /></div>
            {p?.specs && <dl className="self-start divide-y divide-ink/15 border-t-2 border-ink">{p.specs.map(s => <div key={s.label} className="grid grid-cols-[140px_1fr] gap-4 py-3.5 font-sans text-sm"><dt className="text-ink/70">{s.label}</dt><dd className="font-medium">{s.value}</dd></div>)}</dl>}
          </div>
        </section>
        {g.faq.length > 0 && <section className="section"><div className="container-x"><Lockup title="*Common* questions." tone="volt" size="md" className="mb-12" /><Faq items={[...g.faq]} /></div></section>}
        <section id="service" className="section scroll-mt-24">
          <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.4fr]">
            <div><Lockup title="*Something* not right?" tone="flash" size="md" /><p className="lede mt-9">Send us the details. Signed-in owners can also raise a request from <Link href="/account/service" className="link">their account</Link>, linked to their warranty.</p></div>
            <SupportForm topics={SUPPORT.contact.topics} defaultProduct={slug} />
          </div>
        </section>
      </main>
    </>
  );
}

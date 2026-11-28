import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PAGE_KEYWORDS, seo } from '@/lib/seo-keywords';
import { Header } from '@/components/store/Header';
import { Specs, BoxContents } from '@/components/store/Specs';
import { ActionBar } from '@/components/store/ActionBar';
import { Lockup } from '@/components/ui/Brand';
import { Cta } from '@/components/ui/Cta';
import { Icon } from '@/components/ui/Icon';
import { getProduct } from '@/lib/catalog';
import { formatINR } from '@/lib/money';

/** Rendered per request: the table comes from the catalogue (Admin › Products). */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = seo('/home-water-systems/specifications', {
  title: 'Crystal specifications',
  description: 'Every specification of Crystal (DC-5114): ionisation plates, voltage, power, pH presets, flow, storage, filtration, source water and certifications.',
}, PAGE_KEYWORDS['/home-water-systems']);

/** The full Crystal table on its own page ("See full specifications"), with what comes in the box. */
export default async function CrystalSpecsPage() {
  const p = await getProduct('crystal');
  if (!p) notFound();
  return (
    <>
      <Header framed shop page="crystal" />
      <main id="main">
        <section className="section" aria-labelledby="specs-title">
          <div className="container-x">
            <p className="mb-8 font-sans text-[14px]"><Link href="/home-water-systems" className="inline-flex items-center gap-2 text-muted hover:text-ink"><Icon name="arrow" className="size-4 rotate-180" /> Crystal</Link></p>
            <Lockup id="specs-title" as="h1" title="*Crystal, in* full detail." tone="glacier" size="md" />
            <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-[1.5fr_1fr]">
              <div><Specs p={p} box={false} /></div>
              <div className="grid content-start gap-10">
                <BoxContents p={p} />
                <div className="cta-row">
                  <Cta href="/home-water-systems#buy" tone="glacier">Shop Crystal</Cta>
                  {p.manualUrl && <Cta href={p.manualUrl} kind="glass" icon="doc">User Manual</Cta>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <ActionBar watch="specs-title" title="Crystal" sub={`${formatINR(p.price)} · incl. GST`} action={p.available > 0 ? { label: 'Add to Cart', productId: p.id } : { label: 'Talk to DVINE', href: '/support#contact' }} />
    </>
  );
}

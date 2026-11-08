import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { POLICIES } from '@/lib/content';
import { Lockup } from '@/components/ui/Brand';

/** Headline split for each policy, italic over sans, in the title's own words. A one-word title stays one line. */
const LOCKUP: Record<string, string> = {
  privacy: '*Privacy* policy', terms: '*Terms of use* and sale', 'shipping-and-installation': '*Shipping and* installation',
  returns: '*Returns and* cancellations',
};

export function generateStaticParams() { return Object.keys(POLICIES).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const p = POLICIES[(await params).slug]; return { title: p?.title ?? 'Policy' }; }

export default async function Policy({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const p = POLICIES[slug]; if (!p) notFound();
  return (
    <>
      <Header framed />
      <main id="main" className="container-x py-16">
        <article className="prose-dvine mx-auto max-w-3xl">
          <Lockup as="h1" title={LOCKUP[slug] ?? p.title} tone="glacier" size="sm" className="mb-10" />
          {/* These policies are drafts awaiting DVINE's legal review: see docs/legal-review.md (no banner on the page) */}
          {p.sections.map(s => <section key={s.h}><h2>{s.h}</h2>{s.p.map(x => <p key={x}>{x}</p>)}</section>)}
        </article>
      </main>
    </>
  );
}

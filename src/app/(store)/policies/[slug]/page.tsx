import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { POLICIES, type PolicyBlock, type PolicyDoc, type PolicySection } from '@/lib/content';
import { Lockup } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';

/** Headline split for each policy, italic over sans, in the title's own words. A one-word title stays one line. */
const LOCKUP: Record<string, string> = {
  privacy: '*Privacy* policy', terms: '*Terms of use* and sale', 'shipping-and-installation': '*Shipping and* installation',
  returns: '*Returns, refunds* and replacement',
};

export function generateStaticParams() { return Object.keys(POLICIES).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const p = POLICIES[slug];
  if (!p) return { title: 'Policy' };
  return { title: p.title, description: `${p.title} for DVINE H2O: Crystal, Hyper and TitanForce 111.`, alternates: { canonical: `/policies/${slug}` } };
}

const Block = ({ b }: { b: PolicyBlock }) => Array.isArray(b) ? <ul>{b.map(x => <li key={x}>{x}</li>)}</ul> : <p>{b}</p>;
const Section = ({ s, sub }: { s: PolicySection; sub?: boolean }) => (
  <section>{sub ? <h3>{s.h}</h3> : <h2>{s.h}</h2>}{s.p.map((b, i) => <Block key={i} b={b} />)}</section>
);
/** DVINE's own PDF of the policy or manual, opened in a new tab. */
const Docs = ({ docs }: { docs: PolicyDoc[] }) => (
  <div className="my-6 flex flex-wrap gap-3">
    {docs.map(d => <a key={d.href} href={d.href} target="_blank" rel="noopener" className="btn btn-outline"><Icon name="doc" className="size-4" /> {d.label} (PDF)</a>)}
  </div>
);

export default async function Policy({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const p = POLICIES[slug]; if (!p) notFound();
  return (
    <>
      <Header framed />
      <main id="main" className="container-x py-16">
        <article className="prose-dvine mx-auto max-w-3xl">
          <Lockup as="h1" title={LOCKUP[slug] ?? p.title} tone="glacier" size="sm" className="mb-10" />
          {p.intro && <p className="lede">{p.intro}</p>}
          {p.parts && p.parts.length > 1 && (
            <nav aria-label="Products" className="mt-6 flex flex-wrap gap-2">
              {p.parts.map(x => <a key={x.id} href={`#${x.id}`} className="btn btn-outline min-h-10 px-5 text-sm">{x.title}</a>)}
            </nav>
          )}
          {/* Privacy, Terms and Shipping are drafts awaiting DVINE's legal review: see docs/legal-review.md (no banner on the page) */}
          {p.sections?.map(s => <Section key={s.h} s={s} />)}
          {p.parts?.map(x => (
            <section key={x.id} id={x.id} className="scroll-mt-28 border-t-2 border-ink mt-14 pt-2">
              <h2>{x.title}</h2>
              {x.intro && <p className="text-muted">{x.intro}</p>}
              {x.docs && <Docs docs={x.docs} />}
              {x.sections.map(s => <Section key={s.h} s={s} sub />)}
            </section>
          ))}
        </article>
      </main>
    </>
  );
}

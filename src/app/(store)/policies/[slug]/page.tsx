import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { POLICIES } from '@/lib/content';
import { Lockup } from '@/components/ui/Brand';

export function generateStaticParams() { return Object.keys(POLICIES).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const p = POLICIES[(await params).slug]; return { title: p?.title ?? 'Policy' }; }

export default async function Policy({ params }: { params: Promise<{ slug: string }> }) {
  const p = POLICIES[(await params).slug]; if (!p) notFound();
  return (
    <>
      <Header framed />
      <main id="main" className="container-x py-16">
        <article className="prose-dvine mx-auto max-w-3xl">
          <Lockup as="h1" title={p.title} tone="glacier" size="sm" className="mb-10" />
          <p className="rounded-xl bg-[#FFF4D6] px-4 py-3 font-sans text-sm text-[#7A4B00]">Draft for review by DVINE H2O’s legal team before launch.</p>
          {p.sections.map(s => <section key={s.h}><h2>{s.h}</h2>{s.p.map(x => <p key={x}>{x}</p>)}</section>)}
        </article>
      </main>
    </>
  );
}

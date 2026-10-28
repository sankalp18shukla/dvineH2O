import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import { searchIndex } from '@/lib/content';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

function search(q: string) {
  const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (!terms.length) return [];
  return searchIndex().map(i => {
    const t = i.title.toLowerCase(), b = i.body.toLowerCase();
    const score = terms.reduce((s, w) => s + (t.includes(w) ? 3 : 0) + (b.includes(w) ? 1 : 0), 0);
    return { ...i, score };
  }).filter(i => i.score > 0).sort((a, b) => b.score - a.score).slice(0, 20);
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').slice(0, 100);
  const results = search(q);
  return (
    <>
      <Header framed />
      <main id="main" className="container-x min-h-[60vh] py-14">
        <Lockup as="h1" title="*Search* DVINE." tone="glacier" size="md" />
        <form className="mt-10 flex max-w-2xl gap-2" role="search">
          <label htmlFor="q" className="sr-only">Search</label>
          <div className="relative flex-1"><Icon name="search" className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" /><input id="q" name="q" defaultValue={q} autoFocus className="input min-h-14 rounded-full pl-12" placeholder="Products, delivery, installation, care…" /></div>
          <button className="btn btn-primary min-h-14">Search</button>
        </form>
        {q && <p className="mt-6 font-sans text-sm text-muted" aria-live="polite">{results.length} result{results.length === 1 ? '' : 's'} for “{q}”</p>}
        <ul className="mt-6 max-w-3xl divide-y divide-line">
          {results.map(r => (
            <li key={r.href + r.title}><Link href={r.href} className="group block py-5"><span className="font-sans text-lg font-semibold group-hover:text-deep-current">{r.title}</span><span className="mt-1 line-clamp-2 block text-muted">{r.body}</span><span className="mt-1 block font-sans text-[13px] text-deep-current">{r.href}</span></Link></li>
          ))}
        </ul>
        {q && !results.length && <p className="mt-4 text-muted">Nothing matched. Try another word, or <Link href="/support#contact" className="link">ask our team</Link>.</p>}
      </main>
    </>
  );
}

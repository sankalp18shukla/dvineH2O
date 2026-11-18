/* eslint-disable @next/next/no-img-element -- small thumbnails of uploaded and hosted covers */
import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { adminListPosts } from '@/lib/blog.server';
import { CATEGORIES, POST_PRODUCTS, categoryLabel, type Post } from '@/lib/blog';
import { PageHead, Panel, Empty, day } from '@/components/admin/ui';
import { Icon } from '@/components/ui/Icon';

export const metadata = { title: 'Blog' };

const TABS = [['all', 'All'], ['published', 'Live'], ['draft', 'Drafts']] as const;

function Row({ p }: { p: Post }) {
  const product = POST_PRODUCTS.find(x => x.key === p.product);
  return (
    <li>
      <Link href={`/admin/blog/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 font-sans hover:bg-paper">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#EEF1F7] text-muted">
          {p.coverImage ? <img src={p.coverImage} alt="" className="size-full object-cover" loading="lazy" /> : <Icon name={p.externalUrl ? 'external' : 'doc'} className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{p.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
            <span>{categoryLabel(p.category)}</span>
            {product && <><span aria-hidden="true">·</span><span>{product.label} page</span></>}
            {p.externalUrl && <><span aria-hidden="true">·</span><span>on {p.source}</span></>}
            {p.featured && <span className="rounded-full bg-voltage px-2 py-0.5 text-[11px] font-bold text-ink">Featured</span>}
            {p.category === 'value' && p.product && !p.externalUrl && p.status === 'published' && <span className="rounded-full bg-[#E9F8EE] px-2 py-0.5 text-[11px] font-semibold text-[#14532D]">Price button</span>}
          </span>
        </span>
        <span className="hidden shrink-0 text-right text-[12.5px] text-muted sm:block">{p.status === 'published' ? day(p.publishedAt) : `Edited ${day(p.updatedAt)}`}</span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${p.status === 'published' ? 'bg-[#E9F8EE] text-[#14532D]' : 'bg-[#EEF1F7] text-muted'}`}>{p.status === 'published' ? 'Live' : 'Draft'}</span>
        <Icon name="chevron" className="size-4 shrink-0 text-muted" />
      </Link>
    </li>
  );
}

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<{ show?: string; topic?: string }> }) {
  await requireStaff('content');
  const sp = await searchParams;
  const show = TABS.some(([k]) => k === sp.show) ? sp.show! : 'all';
  const topic = CATEGORIES.find(c => c.key === sp.topic);
  const all = await adminListPosts({});
  const list = all.filter(p => (show === 'all' || p.status === show) && (!topic || p.category === topic.key));
  const ours = list.filter(p => !p.externalUrl), linked = list.filter(p => p.externalUrl);
  const count = (k: string) => (k === 'all' ? all.length : all.filter(p => p.status === k).length);
  const q = (o: { show?: string; topic?: string }) => { const u = new URLSearchParams(); const s = o.show ?? show, t = 'topic' in o ? o.topic : topic?.key; if (s !== 'all') u.set('show', s); if (t) u.set('topic', t); const x = u.toString(); return `/admin/blog${x ? `?${x}` : ''}`; };
  // which products still have no "Why this price?" post
  const missing = POST_PRODUCTS.filter(pr => !all.some(p => p.product === pr.key && p.category === 'value' && p.status === 'published' && !p.externalUrl));

  return (
    <>
      <PageHead title="Blog" sub="Articles on the website’s blog. Posts linked to a product also show on that product’s page."
        actions={<><a href="/blog" target="_blank" rel="noopener" className="btn btn-outline btn-sm min-h-10"><Icon name="external" className="size-4" />View blog</a><Link href="/admin/blog/new?link=1" className="btn btn-outline btn-sm min-h-10">Add a link</Link><Link href="/admin/blog/new" className="btn btn-primary btn-sm min-h-10"><Icon name="plus" className="size-4" />Write a post</Link></>} />

      {missing.length > 0 && (
        <ul className="mb-5 grid gap-2">{missing.map(m => (
          <li key={m.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FFF4D6] px-4 py-2.5 font-sans text-sm text-[#7A4B00]">
            <span className="flex items-start gap-2"><Icon name="alert" className="mt-0.5 size-4 shrink-0" />{m.label} has no live “Price and value” post, so the button under its price is hidden.</span>
            <Link href={`/admin/blog/new?category=value&product=${m.key}`} className="font-semibold underline underline-offset-4">Write one</Link>
          </li>))}
        </ul>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-sm">
        <div className="flex gap-1 rounded-3xl border border-line bg-white p-1">{TABS.map(([k, l]) => <Link key={k} href={q({ show: k })} className={`rounded-full px-3.5 py-1.5 ${show === k ? 'bg-ink font-semibold text-white' : 'hover:bg-paper'}`}>{l} <span className={show === k ? 'text-white/70' : 'text-muted'}>{count(k)}</span></Link>)}</div>
        <div className="flex flex-wrap gap-1.5">
          <Link href={q({ topic: undefined })} className={`pill ${!topic ? 'border-ink bg-ink text-white' : 'hover:border-deep-current'}`}>All topics</Link>
          {CATEGORIES.filter(c => all.some(p => p.category === c.key)).map(c => <Link key={c.key} href={q({ topic: c.key })} className={`pill ${topic?.key === c.key ? 'border-ink bg-ink text-white' : 'hover:border-deep-current'}`}>{c.label}</Link>)}
        </div>
      </div>

      <div className="grid gap-6">
        <Panel title={`Written here · ${ours.length}`}>
          {ours.length === 0 ? <Empty>No posts here yet. <Link href="/admin/blog/new" className="link">Write the first one</Link>.</Empty> : <ul className="-mx-5 -my-5 divide-y divide-line/70">{ours.map(p => <Row key={p.id} p={p} />)}</ul>}
        </Panel>
        {(linked.length > 0 || show === 'all') && (
          <Panel title={`Published on other sites · ${linked.length}`} actions={<Link href="/admin/blog/new?link=1" className="link text-sm">Add a link</Link>}>
            {linked.length === 0 ? <Empty>Articles your team has published elsewhere can be listed here. They open on the other site.</Empty> : <ul className="-mx-5 -my-5 divide-y divide-line/70">{linked.map(p => <Row key={p.id} p={p} />)}</ul>}
          </Panel>
        )}
      </div>
    </>
  );
}

'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/admin/AdminIcon';
import { Markdown } from '@/components/ui/Markdown';
import { CATEGORIES, POST_PRODUCTS, readMinutes, slugify, type Category, type PostProduct } from '@/lib/blog';
import { deletePost, savePost } from '@/app/actions/blog';
import { Area, Label, Pill, Segmented, Text } from './content/fields';
import { MediaField, uploadMedia } from './content/MediaField';

export type PostDraft = {
  id?: number; title: string; slug: string; excerpt: string; category: Category; product: PostProduct | null;
  coverImage: string; coverAlt: string; body: string; external: boolean; externalUrl: string; source: string;
  author: string; seoDescription: string; featured: boolean; featureOrder: number; publishedAt: string; status: 'draft' | 'published';
};

const toast = (ok: boolean, message: string) => window.dispatchEvent(new CustomEvent('dvine-admin-toast', { detail: { ok, message } }));
const input = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 font-sans text-[14.5px] text-ink transition focus:border-deep-current focus:ring-4 focus:ring-deep-current/12 focus:outline-none';

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-line bg-white"><h2 className="border-b border-line px-5 py-3 font-sans text-[14px] font-semibold">{title}</h2><div className="grid gap-4 p-5">{children}</div></section>;
}
const Err = ({ children }: { children?: string }) => (children ? <p className="mt-1.5 font-sans text-[12.5px] font-medium text-[#A1101B]">{children}</p> : null);

const TOOLS: { label: string; icon?: string; text?: string; wrap?: [string, string]; line?: string; block?: string; title: string }[] = [
  { label: 'Heading', text: 'H2', line: '## ', title: 'Section heading' },
  { label: 'Sub-heading', text: 'H3', line: '### ', title: 'Smaller heading' },
  { label: 'Bold', text: 'B', wrap: ['**', '**'], title: 'Bold' },
  { label: 'Italic', text: 'I', wrap: ['*', '*'], title: 'Italic' },
  { label: 'Link', text: 'Link', wrap: ['[', '](https://)'], title: 'Link: put the address inside the round brackets' },
  { label: 'List', text: '• List', line: '- ', title: 'Bullet list' },
  { label: 'Numbered list', text: '1. List', line: '1. ', title: 'Numbered list' },
  { label: 'Key point', text: '❝ Key point', line: '> ', title: 'Highlighted key point' },
  { label: 'Table', text: 'Table', block: '| Column one | Column two |\n| --- | --- |\n| First row | Details |\n| Second row | Details |', title: 'Table' },
];

export function PostEditor({ initial, siteImages }: { initial: PostDraft; siteImages: string[] }) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [uploading, setUploading] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(d) !== saved;
  const set = <K extends keyof PostDraft>(k: K, v: PostDraft[K]) => setD(x => ({ ...x, [k]: v }));
  const slug = slugTouched ? d.slug : slugify(d.title);
  const live = initial.status === 'published' && !!d.id;
  const words = useMemo(() => d.body.trim().split(/\s+/).filter(Boolean).length, [d.body]);

  // leaving with unsaved changes asks first
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = (status: PostDraft['status']) => start(async () => {
    const next = { ...d, slug, status };
    const r = await savePost(JSON.stringify(next));
    toast(r.ok, r.message);
    setErrors(r.errors ?? {});
    if (!r.ok) { if (r.errors?.body) setView('write'); return; }
    const done = { ...next, id: r.id, slug: r.slug ?? slug };
    setD(done); setSaved(JSON.stringify(done)); setSlugTouched(true);
    if (!d.id && r.id) router.replace(`/admin/blog/${r.id}`); else router.refresh();
  });
  // ⌘S / Ctrl+S saves without changing whether the post is live
  const saveRef = useRef(save); saveRef.current = save;
  const statusRef = useRef(d.status); statusRef.current = d.status;
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveRef.current(statusRef.current); } };
    window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on);
  }, []);

  const remove = () => {
    if (!d.id || !confirm(`Delete “${d.title}” for good? This cannot be undone.`)) return;
    start(async () => { const r = await deletePost(d.id!); toast(r.ok, r.message); if (r.ok) { setSaved(JSON.stringify(d)); router.replace('/admin/blog'); router.refresh(); } });
  };

  /** Applies a toolbar button to the selection in the article box, keeping the cursor where you'd expect. */
  const edit = (fn: (sel: string, before: string) => { text: string; from?: number; to?: number }) => {
    const el = area.current; if (!el) return;
    const a = el.selectionStart, b = el.selectionEnd, before = d.body.slice(0, a), sel = d.body.slice(a, b);
    const r = fn(sel, before);
    set('body', before + r.text + d.body.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + (r.from ?? r.text.length), a + (r.to ?? r.from ?? r.text.length)); });
  };
  const apply = (t: (typeof TOOLS)[number]) => {
    if (t.wrap) { const [l, r] = t.wrap; edit(sel => { const s = sel || t.label.toLowerCase(); return { text: l + s + r, from: l.length, to: l.length + s.length }; }); }
    else if (t.line) edit((sel, before) => { const nl = before && !before.endsWith('\n') ? '\n' : ''; const body = (sel || t.label).split('\n').map((x, i) => (t.line === '1. ' ? `${i + 1}. ` : t.line) + x).join('\n'); return { text: nl + body, from: nl.length + t.line!.length, to: nl.length + body.length }; });
    else if (t.block) edit((_s, before) => { const nl = !before ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'; return { text: `${nl}${t.block}\n\n` }; });
  };
  const addPhoto = async (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith('image')) return toast(false, 'Articles take photos here, not videos.');
    setUploading(0);
    try {
      const up = await uploadMedia(f, setUploading);
      edit((_s, before) => { const nl = !before ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'; const cap = 'Describe this photo'; return { text: `${nl}![${cap}](${up.src})\n\n`, from: nl.length + 2, to: nl.length + 2 + cap.length }; });
    } catch (e) { toast(false, e instanceof Error ? e.message : 'The upload failed.'); }
    setUploading(null); if (file.current) file.current.value = '';
  };

  const state = dirty ? { tone: 'amber' as const, label: 'Unsaved changes' } : live ? { tone: 'green' as const, label: 'Live on the website' } : { tone: 'gray' as const, label: d.id ? 'Draft · not on the website' : 'New post' };
  const priceSpot = d.category === 'value' && d.product && !d.external;

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 -mt-4 mb-6 border-b border-line bg-[#F6F8FC] px-4 py-3 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto min-w-0">
            <Link href="/admin/blog" className="mb-1 inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-ink"><Icon name="arrowLeft" className="size-4" />Blog</Link>
            <h1 className="truncate font-sans text-2xl font-bold tracking-tight">{d.title || 'New post'}</h1>
            <div className="mt-1"><Pill tone={state.tone}>{state.label}</Pill></div>
          </div>
          {live && !d.external && <a href={`/blog/${initial.slug}`} target="_blank" rel="noopener" className="btn btn-outline btn-sm min-h-10"><Icon name="external" className="size-4" />View on site</a>}
          {live
            ? <><button type="button" onClick={() => confirm('Take this post off the website? It moves back to drafts.') && save('draft')} disabled={pending} className="btn btn-outline btn-sm min-h-10">Unpublish</button>
                <button type="button" onClick={() => save('published')} disabled={pending || !dirty} className="btn btn-primary btn-sm min-h-10" title="⌘S"><Icon name="check" className="size-4" />{pending ? 'Saving…' : 'Save changes'}</button></>
            : <><button type="button" onClick={() => save('draft')} disabled={pending || (!dirty && !!d.id)} className="btn btn-outline btn-sm min-h-10" title="⌘S">{pending ? 'Saving…' : 'Save draft'}</button>
                <button type="button" onClick={() => confirm('Publish this post to the website?') && save('published')} disabled={pending} className="btn btn-primary btn-sm min-h-10"><Icon name="check" className="size-4" />Publish</button></>}
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-6">
          <Box title="The post">
            <div><Text label="Title" value={d.title} onChange={v => set('title', v)} max={160} placeholder="What you are paying for when you buy Crystal" /><Err>{errors.title}</Err></div>
            <div><Area label="Short summary" value={d.excerpt} onChange={v => set('excerpt', v)} max={400} rows={2} placeholder="One or two sentences. Shown on the blog page, under the title and in search results." /><Err>{errors.excerpt}</Err></div>
            <Segmented label="Where is the article?" value={d.external ? 'link' : 'here'} onChange={v => set('external', v === 'link')}
              options={[{ value: 'here', label: 'Written here', icon: 'doc' }, { value: 'link', label: 'Published on another site', icon: 'external' }]} />
          </Box>

          {d.external ? (
            <Box title="Link to the article">
              <div><Text label="Web address" value={d.externalUrl} onChange={v => set('externalUrl', v)} placeholder="https://www.example.com/article" mono /><Err>{errors.externalUrl}</Err></div>
              <Text label="Published by" value={d.source} onChange={v => set('source', v)} max={80} placeholder="Name of the site, e.g. Plus100Years" />
              <p className="font-sans text-[13px] text-muted">The post appears under “Our writing elsewhere” on the blog page and opens on that site in a new tab.</p>
            </Box>
          ) : (
            <section className="rounded-2xl border border-line bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
                <h2 className="font-sans text-[14px] font-semibold">Article <span className="ml-2 font-normal text-muted">{words} words · {readMinutes(d.body)} min read</span></h2>
                <Segmented value={view} onChange={setView} options={[{ value: 'write', label: 'Write' }, { value: 'preview', label: 'Preview', icon: 'eye' }]} />
              </div>
              {view === 'write' ? (
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap gap-1.5" role="toolbar" aria-label="Formatting">
                    {TOOLS.map(t => <button key={t.label} type="button" title={t.title} aria-label={t.label} onClick={() => apply(t)} className={`rounded-lg border border-line bg-white px-2.5 py-1.5 font-sans text-[13px] font-semibold text-ink hover:border-deep-current/50 hover:bg-[#F6F8FC] ${t.text === 'I' ? 'italic' : ''}`}>{t.text}</button>)}
                    <button type="button" onClick={() => file.current?.click()} disabled={uploading !== null} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 font-sans text-[13px] font-semibold text-ink hover:border-deep-current/50 hover:bg-[#F6F8FC]"><Icon name="image" className="size-4" />{uploading !== null ? `Uploading ${Math.round(uploading * 100)}%` : 'Photo'}</button>
                    <input ref={file} type="file" accept="image/*" hidden onChange={e => addPhoto(e.target.files?.[0])} />
                  </div>
                  <label htmlFor="post-body" className="sr-only">Article text</label>
                  <textarea id="post-body" ref={area} value={d.body} onChange={e => set('body', e.target.value)} rows={26} spellCheck
                    onDrop={e => { const f = e.dataTransfer.files?.[0]; if (f) { e.preventDefault(); addPhoto(f); } }}
                    placeholder={'Start writing. Leave a blank line between paragraphs.\n\n## A heading starts a new section\n\nUse the buttons above for bold, links, lists, tables and photos, or drop a photo straight in.'}
                    className={`${input} min-h-[420px] resize-y font-mono text-[14px] leading-relaxed`} />
                  <Err>{errors.body}</Err>
                  <p className="mt-2 font-sans text-[12.5px] text-muted">Tip: link to a page on this site with its path, e.g. <code className="rounded bg-[#EEF1F7] px-1">[book a water test](/water-testing#book)</code>.</p>
                </div>
              ) : (
                <div className="bg-paper px-5 py-8 sm:px-10">
                  <div className="mx-auto max-w-[44rem]">
                    <h3 className="font-sans text-[34px] leading-none font-extrabold tracking-[-0.04em] text-balance">{d.title || 'Untitled post'}</h3>
                    {d.excerpt && <p className="mt-4 font-serif text-[21px] leading-snug italic">{d.excerpt}</p>}
                    <div className="mt-8">{d.body.trim() ? <Markdown text={d.body} /> : <p className="font-sans text-sm text-muted">Nothing written yet.</p>}</div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="grid gap-6">
          <Box title="Where it shows">
            <div>
              <Label htmlFor="post-cat">Topic</Label>
              <select id="post-cat" value={d.category} onChange={e => set('category', e.target.value as Category)} className={input}>{CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
              <p className="mt-1.5 font-sans text-[12.5px] text-muted">{CATEGORIES.find(c => c.key === d.category)?.blurb}</p>
            </div>
            <div>
              <Label htmlFor="post-prod">Product</Label>
              <select id="post-prod" value={d.product ?? ''} onChange={e => set('product', (e.target.value || null) as PostProduct | null)} className={input}><option value="">None (general article)</option>{POST_PRODUCTS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
              <p className="mt-1.5 font-sans text-[12.5px] text-muted">{d.external ? 'Linked articles show on the blog page only.' : d.product ? `Also offered on the ${POST_PRODUCTS.find(p => p.key === d.product)!.label} page, under “Worth reading”.` : 'Pick a product to offer this post on its page.'}</p>
            </div>
            {priceSpot && <p className="flex items-start gap-2 rounded-xl bg-[#E9F8EE] px-3.5 py-2.5 font-sans text-[13px] text-[#14532D]"><Icon name="tag" className="mt-0.5 size-4 shrink-0" />The newest published “Price and value” post for {POST_PRODUCTS.find(p => p.key === d.product)!.label} opens from the “{d.product === 'titan' ? 'How quotations work' : 'Why this price?'}” button under its price.</p>}
            {!d.external && (
              <div>
                <Segmented label="Featured on the homepage" value={String(d.featureOrder) as '0' | '1' | '2' | '3' | '4'}
                  onChange={v => setD(x => ({ ...x, featureOrder: Number(v), featured: v !== '0' }))}
                  options={[{ value: '0', label: 'No' }, { value: '1', label: '1st' }, { value: '2', label: '2nd' }, { value: '3', label: '3rd' }, { value: '4', label: '4th' }]} />
                <p className="mt-1.5 font-sans text-[12.5px] text-muted">Four tiles at most, in this order. Taking a place that another post holds moves that post off the homepage. The 1st also leads the blog page.</p>
              </div>
            )}
          </Box>

          {!d.external && (
            <Box title="Cover photo">
              <MediaField label="Photo" accept="image" siteImages={siteImages} compact
                value={d.coverImage ? { type: 'image', src: d.coverImage, poster: '', alt: d.coverAlt } : null}
                onChange={m => setD(x => ({ ...x, coverImage: m?.src ?? '', coverAlt: m ? (m.alt || x.coverAlt) : '' }))} hint="Landscape works best" />
              <Err>{errors.coverImage}</Err>
              {d.coverImage && <Text label="Describe the photo" value={d.coverAlt} onChange={v => set('coverAlt', v)} max={200} hint="For screen readers" />}
            </Box>
          )}

          <Box title="Details">
            <div>
              <Text label="Web address" value={slug} onChange={v => { setSlugTouched(true); set('slug', v.toLowerCase().replace(/[^a-z0-9-]+/g, '-')); }} mono hint={d.external ? undefined : '/blog/…'} />
              <Err>{errors.slug}</Err>
              {live && slug !== initial.slug && <p className="mt-1.5 font-sans text-[12.5px] text-[#8A5A00]">Changing this breaks links people have already shared.</p>}
            </div>
            <div>
              <Label htmlFor="post-date" hint="Optional">Date shown</Label>
              <input id="post-date" type="date" value={d.publishedAt.slice(0, 10)} onChange={e => set('publishedAt', e.target.value ? `${e.target.value}T04:30:00.000Z` : '')} className={input} />
              <Err>{errors.publishedAt}</Err>
              <p className="mt-1.5 font-sans text-[12.5px] text-muted">Left empty, the day you publish is used.</p>
            </div>
            <Text label="Author" value={d.author} onChange={v => set('author', v)} max={80} />
            {!d.external && <Area label="Search description" value={d.seoDescription} onChange={v => set('seoDescription', v)} max={200} rows={2} placeholder="Optional. Google shows this under the title; the summary is used when empty." />}
          </Box>

          {d.id && <button type="button" onClick={remove} disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F2C7CB] bg-white px-4 py-2.5 font-sans text-[13.5px] font-semibold text-[#A1101B] hover:bg-[#FFF1F2]"><Icon name="trash" className="size-4" />Delete this post</button>}
        </aside>
      </div>
    </>
  );
}

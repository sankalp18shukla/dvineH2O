'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Icon } from '@/components/ui/Icon';
import { saveSiteContent, discardSiteDraft } from '@/app/actions/content';
import { HERO_SLIDES } from '@/lib/content';
import { SlideSchema, CardSchema, PRODUCT_PAGES, TEMPLATES, THEMES, isLive, newId, type ProductKey, type SiteContent, type Template } from '@/lib/site-content';
import { CardsPanel, PartnerPanel, RibbonPanel, Section, SlidesPanel, WaterPanel, type Set } from './panels';
import { Pill } from './fields';
import { ProductsPanel } from './ProductsPanel';

type Tab = 'overview' | 'ribbon' | 'slides' | 'cards' | 'products' | 'water' | 'partner';
const TABS: { key: Tab; label: string; icon: string; sub: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'dashboard', sub: 'Festive themes and the page at a glance' },
  { key: 'ribbon', label: 'Announcement ribbon', icon: 'ribbon', sub: 'Moving offer band at the top' },
  { key: 'slides', label: 'Hero slides', icon: 'sparkle', sub: 'Your slides in the slideshow' },
  { key: 'cards', label: 'Promotion cards', icon: 'layout', sub: 'Banner or cards after the hero' },
  { key: 'products', label: 'Product pages', icon: 'tag', sub: 'Offer tickets and cards on Crystal, Hyper and Titan' },
  { key: 'water', label: 'Water testing text', icon: 'drop', sub: 'Words and photos' },
  { key: 'partner', label: 'Partner page', icon: 'users', sub: 'Become a Partner' },
];
const toast = (ok: boolean, message: string) => window.dispatchEvent(new CustomEvent('dvine-admin-toast', { detail: { ok, message } }));

export function ContentEditor({ live, draft, hasDraft: initialHasDraft, siteImages }: { live: SiteContent; draft: SiteContent; hasDraft: boolean; siteImages: string[] }) {
  const [doc, setDoc] = useState(draft);
  const [saved, setSaved] = useState(() => JSON.stringify(draft));
  const [liveJson, setLiveJson] = useState(() => JSON.stringify(live));
  const [hasDraft, setHasDraft] = useState(initialHasDraft);
  const [tab, setTab] = useState<Tab>('overview');
  const [product, setProduct] = useState<ProductKey>('crystal');
  const [preview, setPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [pending, start] = useTransition();
  const json = useMemo(() => JSON.stringify(doc), [doc]);
  const dirty = json !== saved;
  const unpublished = json !== liveJson;

  const set: Set = useCallback(recipe => setDoc(prev => { const n = structuredClone(prev); recipe(n); return n; }), []);

  // warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const save = (mode: 'draft' | 'publish', after?: () => void) => start(async () => {
    const r = await saveSiteContent(json, mode);
    toast(r.ok, r.message);
    if (!r.ok) return;
    setSaved(json);
    if (mode === 'publish') { setLiveJson(json); setHasDraft(false); } else setHasDraft(true);
    setPreviewKey(k => k + 1);
    after?.();
  });
  // ⌘S / Ctrl+S saves a draft
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveRef.current('draft'); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);

  const discard = () => {
    if (!confirm('Throw away the unpublished changes and go back to what is live?')) return;
    start(async () => { const r = await discardSiteDraft(); toast(r.ok, r.message); setDoc(JSON.parse(liveJson)); setSaved(liveJson); setHasDraft(false); setPreviewKey(k => k + 1); });
  };

  const state = dirty ? { tone: 'amber' as const, label: 'Unsaved changes' } : unpublished ? { tone: 'blue' as const, label: 'Draft saved · not live yet' } : { tone: 'green' as const, label: 'Live on the website' };
  const previewPath = tab === 'partner' ? '/become-a-partner?preview=1' : tab === 'products' ? `${PRODUCT_PAGES.find(p => p.key === product)!.path}?preview=1` : '/?preview=1';

  return (
    <div className={`grid gap-6 ${preview ? 'xl:grid-cols-[minmax(0,1fr)_minmax(420px,44%)]' : ''}`}>
      <div className="min-w-0">
        {/* toolbar */}
        <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-line bg-[#F3F5FA]/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-auto min-w-0">
              <h1 className="font-sans text-2xl font-bold tracking-tight">Homepage & promotions</h1>
              <div className="mt-1 flex items-center gap-2"><Pill tone={state.tone}><span className={`size-1.5 rounded-full ${state.tone === 'green' ? 'bg-[#1B6B2C]' : state.tone === 'blue' ? 'bg-deep-current' : 'bg-[#C08A00]'}`} />{state.label}</Pill>
                {hasDraft && !dirty && unpublished && <button type="button" onClick={discard} className="font-sans text-[12.5px] text-muted hover:text-ink hover:underline">Discard draft</button>}</div>
            </div>
            <button type="button" onClick={() => setPreview(p => !p)} className={`btn btn-sm min-h-10 ${preview ? 'bg-ink text-white' : 'btn-outline'}`}><Icon name="eye" className="size-4" />{preview ? 'Hide preview' : 'Preview'}</button>
            <button type="button" onClick={() => save('draft')} disabled={pending || !dirty} className="btn btn-outline btn-sm min-h-10" title="⌘S">{pending ? 'Saving…' : 'Save draft'}</button>
            <button type="button" onClick={() => confirm('Publish these changes to the live website?') && save('publish')} disabled={pending || !unpublished} className="btn btn-primary btn-sm min-h-10"><Icon name="check" className="size-4" />Publish</button>
          </div>
          <nav aria-label="Sections" className="-mx-1 mt-4 flex gap-1 overflow-x-auto pb-1">
            {TABS.map(t => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-current={tab === t.key ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 font-sans text-[13.5px] font-semibold transition ${tab === t.key ? 'bg-white text-ink shadow-[0_1px_4px_rgb(4_22_74/.12)]' : 'text-muted hover:bg-white/60 hover:text-ink'}`}>
                <Icon name={t.icon} className="size-4" />{t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === 'overview' && <Overview doc={doc} set={set} go={setTab} pick={k => { setProduct(k); setTab('products'); }} />}
        {tab === 'ribbon' && <RibbonPanel doc={doc} set={set} siteImages={siteImages} />}
        {tab === 'slides' && <SlidesPanel doc={doc} set={set} siteImages={siteImages} />}
        {tab === 'cards' && <CardsPanel doc={doc} set={set} siteImages={siteImages} />}
        {tab === 'products' && <ProductsPanel doc={doc} set={set} siteImages={siteImages} product={product} setProduct={setProduct} />}
        {tab === 'water' && <WaterPanel doc={doc} set={set} siteImages={siteImages} />}
        {tab === 'partner' && <PartnerPanel doc={doc} set={set} siteImages={siteImages} />}
      </div>

      {preview && <Preview path={previewPath} reloadKey={previewKey} dirty={dirty} onRefresh={() => (dirty ? save('draft') : setPreviewKey(k => k + 1))} />}
    </div>
  );
}

/* ───────────── Live preview: the real page with the saved draft (?preview=1, staff only) ───────────── */
function Preview({ path, reloadKey, dirty, onRefresh }: { path: string; reloadKey: number; dirty: boolean; onRefresh: () => void }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  useEffect(() => { const ro = new ResizeObserver(([e]) => setW(e.contentRect.width)); ro.observe(box.current!); return () => ro.disconnect(); }, []);
  const vw = device === 'desktop' ? 1440 : 390, vh = device === 'desktop' ? 900 : 844;
  const scale = Math.min(1, w / vw);
  return (
    <aside className="xl:sticky xl:top-4 xl:self-start">
      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="font-sans text-[13px] font-semibold">Preview</span>
          <span className="font-sans text-[12px] text-muted">{dirty ? 'Save to see your latest edits' : 'Showing your saved draft'}</span>
          <span className="flex-1" />
          <div className="inline-flex rounded-lg bg-[#EEF1F7] p-0.5">
            {(['desktop', 'mobile'] as const).map(d => <button key={d} type="button" onClick={() => setDevice(d)} aria-label={d} className={`grid size-7 place-items-center rounded-md ${device === d ? 'bg-white shadow-sm' : 'text-muted'}`}><Icon name={d} className="size-4" /></button>)}
          </div>
          <button type="button" onClick={onRefresh} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#EEF1F7] hover:text-ink" aria-label="Save and refresh preview" title={dirty ? 'Save draft and refresh' : 'Refresh'}><Icon name="refresh" className="size-4" /></button>
          <a href={path} target="_blank" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#EEF1F7] hover:text-ink" aria-label="Open preview in a new tab"><Icon name="external" className="size-4" /></a>
        </div>
        <div ref={box} className="bg-[#E6EAF2] p-0">
          <div className="mx-auto overflow-hidden" style={{ width: vw * scale, height: Math.min(vh, 1000) * scale }}>
            <iframe key={`${reloadKey}-${path}-${device}`} src={path} title="Website preview" style={{ width: vw, height: vh, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0, background: '#F6F8FC' }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ───────────── Overview: festive themes + the homepage as a list of blocks ───────────── */
function Overview({ doc, set, go, pick }: { doc: SiteContent; set: Set; go: (t: Tab) => void; pick: (k: ProductKey) => void }) {
  const apply = (t: Template) => {
    if (!confirm(`Apply the ${t.label} theme?\n\nThis sets the ribbon messages, adds a ${t.label} slide at the start of the hero and a ${t.label} promotion card${t.slide.decor?.length ? ', with festive decorations you can move around' : ''}, and puts a ${t.label} offer ticket on the Crystal and Hyper pages (add your code and end date there). Everything stays editable, and nothing goes live until you publish.`)) return;
    set(d => {
      d.ribbon = { ...d.ribbon, enabled: true, theme: t.theme, items: t.ribbon.map(text => ({ id: newId(), text })) };
      const slide = SlideSchema.parse({ id: `tpl-${newId()}`, position: 'first', theme: t.theme, tag: t.slide.tag, title: t.slide.title, body: t.slide.body, primary: t.slide.primary, fit: t.slide.fit, media: { type: 'image', src: t.slide.media, poster: '', alt: '' }, duration: 8, decor: (t.slide.decor ?? []).map(x => ({ ...x, id: newId() })) });
      const old = d.slides.findIndex(s => s.id.startsWith('tpl-'));
      if (old >= 0) d.slides[old] = slide; else { d.slides.unshift(slide); d.slides = d.slides.slice(0, 4); }
      const card = CardSchema.parse({ id: `tpl-${newId()}`, theme: t.theme, tag: t.card.tag, title: t.card.title, body: t.card.body, cta: t.card.cta, media: { type: 'image', src: t.card.media, poster: '', alt: '' }, decor: (t.card.decor ?? []).map(x => ({ ...x, id: newId() })) });
      const oc = d.promo.cards.findIndex(c => c.id.startsWith('tpl-'));
      if (oc >= 0) d.promo.cards[oc] = card; else { d.promo.cards.unshift(card); d.promo.cards = d.promo.cards.slice(0, 3); }
      d.promo.enabled = true;
      // offer tickets on the shop's product pages (Titan is priced on quotation, so it is left to the team)
      for (const k of ['crystal', 'hyper'] as const) {
        const name = PRODUCT_PAGES.find(p => p.key === k)!.name;
        const o = d.products[k].offer;
        d.products[k].offer = { ...o, enabled: true, theme: t.theme, tag: t.offer.tag, title: t.offer.title.replace('{name}', name), body: t.offer.body };
      }
    });
    toast(true, `${t.label} theme applied. Review it, then save or publish.`);
  };
  const clearAll = () => {
    if (!confirm('Switch off every promotion (ribbon, promotion slides and cards, and the product pages’ offers and cards)? The site goes back to its standard design. Your content is kept, only hidden.')) return;
    set(d => { d.ribbon.enabled = false; d.slides.forEach(s => { s.enabled = false; }); d.promo.enabled = false; PRODUCT_PAGES.forEach(p => { d.products[p.key].offer.enabled = false; d.products[p.key].banner.enabled = false; }); });
  };

  const promoFirst = doc.slides.filter(s => s.position === 'first' && isLive(s)).length;
  const promoLast = doc.slides.filter(s => s.position !== 'first' && isLive(s)).length;
  const cards = doc.promo.enabled ? doc.promo.cards.filter(c => isLive(c)).length : 0;
  const blocks: { tab?: Tab; title: string; sub: string; on: boolean; fixed?: boolean }[] = [
    { tab: 'ribbon', title: 'Announcement ribbon', sub: doc.ribbon.enabled ? `${doc.ribbon.items.length} message${doc.ribbon.items.length === 1 ? '' : 's'} · ${doc.ribbon.scope === 'all' ? 'every page' : doc.ribbon.scope === 'shop' ? 'homepage and product pages' : 'homepage'}` : 'Off', on: doc.ribbon.enabled && isLive(doc.ribbon) },
    { tab: 'slides', title: 'Hero slideshow', sub: `${promoFirst ? `${promoFirst} promotion slide${promoFirst > 1 ? 's' : ''}, then ` : ''}${HERO_SLIDES.map(h => h.name).join(', ')}${promoLast ? `, then ${promoLast} more` : ''}`, on: true },
    { tab: 'cards', title: 'Promotion cards', sub: cards ? `${cards} card${cards > 1 ? 's' : ''}${cards === 1 ? ' · wide banner' : ''}` : 'Off', on: cards > 0 },
    { tab: 'water', title: 'Water testing', sub: `${doc.water.pics.length} photo${doc.water.pics.length === 1 ? '' : 's'} in the text`, on: true },
    { title: 'Find the right fit', sub: 'Products from Admin › Products', on: true, fixed: true },
    { title: 'See what happens inside', sub: 'Crystal technology video', on: true, fixed: true },
    { title: 'Help choosing, Meet DVINE, Questions', sub: 'As designed', on: true, fixed: true },
  ];

  return (
    <div className="grid gap-6">
      <Section title="Festive and promotion themes" sub="Start a campaign in one click: each theme fills the ribbon, a first hero slide and a promotion card with ready copy, photos and matching brand colours. Change anything afterwards."
        aside={<button type="button" onClick={clearAll} className="font-sans text-[13px] font-semibold text-muted hover:text-ink hover:underline">Switch all promotions off</button>}>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TEMPLATES.map(t => {
            const th = THEMES[t.theme];
            return (
              <li key={t.key}>
                <button type="button" onClick={() => apply(t)} className="group relative block w-full overflow-hidden rounded-2xl text-left ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgb(4_22_74/.55)]" style={{ background: th.bg, color: th.fg }}>
                  <div className="px-4 pt-4 pb-3">
                    <span className="text-2xl" aria-hidden="true">{t.emoji}</span>
                    <p className="mt-2 font-sans text-[17px] font-bold tracking-tight">{t.label}</p>
                    <p className="mt-0.5 line-clamp-1 font-serif text-[14px] italic opacity-80">{t.ribbon[0]}</p>
                  </div>
                  <div className="flex items-center justify-between border-t px-4 py-2 font-sans text-[12px] font-semibold" style={{ borderColor: `${th.fg}22` }}>
                    <span style={{ color: th.em }}>{th.label}</span><span className="opacity-0 transition group-hover:opacity-100">Apply →</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Your homepage, top to bottom" sub="Click a block to edit it. Blocks marked “As designed” come from the products and site design.">
        <ol className="grid gap-2">
          {blocks.map((b, i) => (
            <li key={b.title}>
              <button type="button" disabled={b.fixed} onClick={() => b.tab && go(b.tab)} className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left font-sans transition ${b.fixed ? 'cursor-default border-dashed border-line bg-transparent' : 'border-line bg-white hover:border-deep-current/40 hover:shadow-[0_8px_24px_-16px_rgb(4_22_74/.5)]'}`}>
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-[12px] font-bold ${b.on && !b.fixed ? 'bg-voltage text-ink' : 'bg-[#EEF1F7] text-muted'}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1"><span className="block text-[14.5px] font-semibold">{b.title}</span><span className="block truncate text-[12.5px] text-muted">{b.sub}</span></span>
                {b.fixed ? <Pill>As designed</Pill> : <>{b.on ? <Pill tone="green">Showing</Pill> : <Pill>Off</Pill>}<Icon name="chevron" className="size-4 text-muted" /></>}
              </button>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Product pages" sub="An offer ticket under the price and optional promotion cards, per product.">
        <ul className="grid gap-2 sm:grid-cols-3">
          {PRODUCT_PAGES.map(p => {
            const x = doc.products[p.key];
            const offer = x.offer.enabled && isLive(x.offer) && !!(x.offer.title || x.offer.tag || x.offer.code);
            const n = x.banner.enabled ? x.banner.cards.filter(c => isLive(c)).length : 0;
            const sub = [offer && (x.offer.tag || 'Offer ticket'), n && `${n} card${n > 1 ? 's' : ''}`].filter(Boolean).join(' · ') || 'No promotions';
            return (
              <li key={p.key}>
                <button type="button" onClick={() => pick(p.key)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left font-sans transition hover:border-deep-current/40 hover:shadow-[0_8px_24px_-16px_rgb(4_22_74/.5)]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg text-[13px] font-extrabold" style={{ background: THEMES[p.theme].bg, color: THEMES[p.theme].fg }}>{p.name[0]}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[14.5px] font-semibold">{p.name}</span><span className="block truncate text-[12.5px] text-muted">{sub}</span></span>
                  {offer || n ? <Pill tone="green">Showing</Pill> : <Pill>Off</Pill>}
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="How publishing works">
        <ol className="grid gap-3 font-sans text-[13.5px] sm:grid-cols-3">
          {[['Edit', 'Change anything in the tabs above. Drag photos and videos straight onto the upload boxes.'], ['Save draft', 'Saves your work without changing the website. Open Preview to see the real page with your draft.'], ['Publish', 'Puts the changes live for every visitor. Scheduled items appear and disappear on their dates by themselves.']].map(([t, b], i) => (
            <li key={t} className="rounded-2xl bg-[#F6F8FC] p-4"><span className="mb-2 grid size-7 place-items-center bg-voltage text-[12px] font-bold">{i + 1}</span><b className="block">{t}</b><span className="text-muted">{b}</span></li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

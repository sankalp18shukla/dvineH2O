'use client';
/* eslint-disable @next/next/no-img-element -- previews of uploaded and hosted media */
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Ribbon } from '@/components/store/Ribbon';
import { PromoCards } from '@/components/store/PromoCards';
import { HERO_SLIDES } from '@/lib/content';
import {
  DEFAULT_CONTENT, THEMES, isLive, newId, todayIST, CardSchema, SlideSchema,
  type PromoCard, type PromoSlide, type SiteContent, type ThemeKey,
} from '@/lib/site-content';
import { MediaField, uploadMedia } from './MediaField';
import { DecorEditor } from './DecorEditor';
import { Area, IconBtn, ItemCard, LinkField, Pill, Range, Schedule, Segmented, Text, ThemePicker, Toggle, moveItem, useSortable } from './fields';

export type Set = (recipe: (d: SiteContent) => void) => void;
export type PanelProps = { doc: SiteContent; set: Set; siteImages: string[] };

export function Section({ title, sub, children, aside }: { title: ReactNode; sub?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div><h3 className="font-sans text-[16px] font-bold">{title}</h3>{sub && <p className="mt-0.5 max-w-2xl font-sans text-[13px] text-muted">{sub}</p>}</div>
        {aside}
      </div>
      <div className="grid gap-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}

export const status = (x: { enabled?: boolean; schedule: { from: string; to: string } }) => {
  if (x.enabled === false) return <Pill>Hidden</Pill>;
  if (!isLive(x)) return <Pill tone="amber">{x.schedule.from && x.schedule.from > todayIST() ? `Starts ${x.schedule.from}` : 'Ended'}</Pill>;
  return <Pill tone="green">{x.schedule.to ? `Until ${x.schedule.to}` : 'Showing'}</Pill>;
};

/* ───────────── Ribbon ───────────── */
export function RibbonPanel({ doc, set }: PanelProps) {
  const r = doc.ribbon;
  const sort = useSortable(r.items.length, (a, b) => set(d => { d.ribbon.items = moveItem(d.ribbon.items, a, b); }));
  const [draft, setDraft] = useState('');
  const add = () => { const v = draft.trim(); if (!v) return; set(d => { d.ribbon.items.push({ id: newId(), text: v }); }); setDraft(''); };
  return (
    <div className="grid gap-6">
      <Section title="Announcement ribbon" sub="A thin moving band above the menu for offers and festive messages. Messages scroll right to left and pause when a visitor points at them."
        aside={<Toggle checked={r.enabled} onChange={v => set(d => { d.ribbon.enabled = v; })} label={r.enabled ? 'On' : 'Off'} />}>
        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          <p className="border-b border-line px-3 py-1.5 font-sans text-[11.5px] font-semibold uppercase tracking-wider text-muted">Live preview</p>
          {r.items.some(i => i.text) ? <Ribbon ribbon={r} preview /> : <p className="py-3 text-center font-sans text-[13px] text-muted">Add a message to see the ribbon.</p>}
          <div className="flex h-12 items-center justify-between px-5 opacity-50"><span className="h-3 w-16 rounded bg-ink/30" /><span className="flex gap-4">{[0, 1, 2, 3].map(i => <span key={i} className="h-2 w-14 rounded bg-ink/20" />)}</span><span className="h-6 w-20 rounded-full bg-deep-current/40" /></div>
        </div>

        <div>
          <p className="mb-2 font-sans text-[13px] font-semibold">Messages <span className="font-normal text-muted">· drag to reorder</span></p>
          <ul className="grid gap-2">
            {r.items.map((it, i) => (
              <li key={it.id} {...sort.row(i)}>
                <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white p-1.5">
                  <span {...sort.handle(i)} className="grid size-8 cursor-grab place-items-center text-muted" aria-label="Drag to reorder"><Icon name="grip" className="size-4" strokeWidth={2.4} /></span>
                  <input value={it.text} maxLength={140} onChange={e => set(d => { d.ribbon.items[i].text = e.target.value; })} aria-label={`Message ${i + 1}`}
                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 font-sans text-[14px] focus:bg-[#F3F6FB] focus:outline-none" />
                  <IconBtn icon="trash" label="Remove message" danger onClick={() => set(d => { d.ribbon.items.splice(i, 1); })} />
                </div>
              </li>
            ))}
          </ul>
          <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}>
            <input value={draft} onChange={e => setDraft(e.target.value)} maxLength={140} placeholder="e.g. Festive offers on Crystal, this week only" aria-label="New message"
              className="min-w-0 flex-1 rounded-xl border border-dashed border-[#C9D2E3] bg-[#F8FAFD] px-3.5 py-2.5 font-sans text-[14px] focus:border-deep-current focus:bg-white focus:outline-none" />
            <button disabled={r.items.length >= 12} className="btn btn-outline btn-sm min-h-11"><Icon name="plus" className="size-4" />Add</button>
          </form>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <ThemePicker value={r.theme} onChange={v => set(d => { d.ribbon.theme = v; })} />
          <Segmented label="Between messages" value={r.separator} onChange={v => set(d => { d.ribbon.separator = v; })}
            options={[{ value: 'drop', label: 'Drop' }, { value: 'star', label: 'Spark' }, { value: 'dot', label: 'Dot' }, { value: 'spark', label: 'Burst' }]} />
          <Range label="Speed" value={130 - r.speed} min={10} max={122} onChange={v => set(d => { d.ribbon.speed = 130 - v; })} left="Slow" right="Fast" format={() => (r.speed > 50 ? 'Slow' : r.speed > 26 ? 'Medium' : 'Fast')} />
          <Segmented label="Show on" value={r.scope} onChange={v => set(d => { d.ribbon.scope = v; })} options={[{ value: 'home', label: 'Homepage only' }, { value: 'shop', label: 'Homepage and product pages' }, { value: 'all', label: 'Every page' }]} />
          <LinkField label="Clicking the ribbon opens (optional)" value={{ label: 'Ribbon', href: r.href }} onChange={v => set(d => { d.ribbon.href = v.href; })} />
          <div className="self-end"><Schedule value={r.schedule} onChange={v => set(d => { d.ribbon.schedule = v; })} /></div>
        </div>
      </Section>
    </div>
  );
}

/* ───────────── Hero slides ───────────── */
function SlideMock({ p, layer }: { p: PromoSlide; layer?: (l: 'back' | 'front') => ReactNode }) {
  const t = THEMES[p.theme];
  const m = p.media?.src ? p.media : null;
  const words = p.tag.split(/\s+/).filter(Boolean);
  return (
    <div className="relative isolate aspect-[1.84] overflow-hidden rounded-2xl font-sans text-white" style={{ background: 'radial-gradient(70% 80% at 62% 55%, #0B3FA8 0%, #082A7E 40%, #061C5E 72%, #04134A 100%)' }}>
      {p.fit !== 'cover' && layer?.('back')}
      {p.fit === 'lineup' && (
        <div className="pointer-events-none absolute inset-y-[8%] right-[3%] left-[50%] flex items-end justify-center gap-[3%] pb-[6%]">
          <img src="/images/crystal_product.png" alt="" className="h-[52%] object-contain drop-shadow-2xl" />
          <img src="/images/titan_product.png" alt="" className="h-[78%] object-contain drop-shadow-2xl" />
          <img src="/images/hyper_product.png" alt="" className="h-[40%] object-contain drop-shadow-2xl" />
        </div>
      )}
      {m && p.fit !== 'lineup' && (p.fit === 'cover'
        ? <>{m.type === 'video' ? <video src={m.src} poster={m.poster || undefined} className="absolute inset-0 size-full object-cover" muted loop autoPlay playsInline /> : <img src={m.src} alt="" className="absolute inset-0 size-full object-cover" />}
          <span className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgb(3 14 54 / ${p.shade / 100 * 1.15}) 0%, rgb(3 14 54 / ${p.shade / 100 * .7}) 42%, rgb(3 14 54 / ${p.shade / 100 * .15}) 75%, transparent)` }} /></>
        : <div className="pointer-events-none absolute inset-y-[7%] right-[4%] left-[52%]">{m.type === 'video' ? <video src={m.src} className="size-full rounded-xl object-cover" muted loop autoPlay playsInline /> : <img src={m.src} alt="" className="size-full object-contain drop-shadow-2xl" />}</div>)}
      {p.fit === 'cover' && layer?.('back')}
      <div className="pointer-events-none absolute inset-y-0 left-[5%] flex w-[46%] flex-col justify-center gap-[3%]">
        {words.length > 0 && <span className="inline-flex self-start gap-1 px-1.5 py-0.5 font-serif text-[clamp(9px,1.3vw,14px)] italic" style={{ background: t.bg, color: t.fg }}>{words.slice(0, -1).join(' ')} <em style={{ color: t.em }}>{words.at(-1)}</em></span>}
        {p.title && <p className="whitespace-pre-line text-[clamp(20px,4.4vw,52px)] leading-[.86] font-semibold tracking-[-.06em]">{p.title}</p>}
        {p.body && <p className="line-clamp-3 text-[clamp(8px,1.05vw,12px)] leading-snug text-white/80">{p.body}</p>}
        <div className="mt-[2%] flex gap-1.5">
          {p.primary.label && <span className="rounded-full px-3 py-1.5 text-[clamp(8px,1vw,11px)] font-semibold text-ink" style={{ background: t.accent }}>→ {p.primary.label}</span>}
          {p.secondary.label && <span className="rounded-full bg-white/15 px-3 py-1.5 text-[clamp(8px,1vw,11px)] font-semibold">{p.secondary.label}</span>}
        </div>
      </div>
      {layer?.('front')}
    </div>
  );
}

/** Rough card preview for placing decorations (the full block preview is below the list). */
export function CardMock({ c, layer, wide }: { c: PromoCard; layer: (l: 'back' | 'front') => ReactNode; wide: boolean }) {
  const t = THEMES[c.theme];
  const m = c.media?.src ? c.media : null;
  return (
    <div className={`relative isolate flex overflow-hidden font-sans ${wide ? 'aspect-[2.2] flex-row' : 'mx-auto aspect-[.82] max-w-[340px] flex-col-reverse'}`} style={{ background: t.bg, color: t.fg }}>
      {layer('back')}
      <div className={`pointer-events-none relative z-[1] flex flex-col justify-center gap-2 p-[5%] ${wide ? 'w-[42%]' : 'flex-1'}`}>
        {c.tag && <span className="self-start px-2 py-0.5 font-serif text-[13px] italic" style={{ background: t.dark ? '#F0FF00' : '#046FED', color: t.dark ? '#04164A' : '#F0FF00' }}>{c.tag}</span>}
        <p className={`font-extrabold leading-none tracking-tight ${wide ? 'text-[clamp(18px,3vw,34px)]' : 'text-[22px]'}`}>{c.title}</p>
        {c.cta.label && <p className="text-[12px] font-semibold">{c.cta.label} →</p>}
      </div>
      <div className={`pointer-events-none relative z-[1] overflow-hidden ${wide ? 'flex-1' : 'aspect-[4/3]'}`}>
        {m && (m.type === 'video' ? <video src={m.src} className="absolute inset-0 size-full object-cover" muted /> : <img src={m.src} alt="" className="absolute inset-0 size-full object-cover" />)}
      </div>
      {layer('front')}
    </div>
  );
}

export function SlidesPanel({ doc, set, siteImages }: PanelProps) {
  const [open, setOpen] = useState<string | null>(doc.slides[0]?.id ?? null);
  const sort = useSortable(doc.slides.length, (a, b) => set(d => { d.slides = moveItem(d.slides, a, b); }));
  const add = (seed?: Partial<PromoSlide>) => {
    const s = SlideSchema.parse({ id: newId(), tag: 'Festive Offers Now On', title: 'Your\nheadline.', body: '', theme: 'volt', primary: { label: 'Shop Now', href: '/home-water-systems' }, ...seed });
    set(d => { d.slides.push(s); }); setOpen(s.id);
  };
  const order = [
    ...doc.slides.filter(s => s.position === 'first').map(s => ({ k: s.id, label: s.title.replace(/\n/g, ' ') || s.tag || 'Promotion', promo: true, live: isLive(s) })),
    ...HERO_SLIDES.map(h => ({ k: h.key, label: h.name, promo: false, live: true })),
    ...doc.slides.filter(s => s.position !== 'first').map(s => ({ k: s.id, label: s.title.replace(/\n/g, ' ') || s.tag || 'Promotion', promo: true, live: isLive(s) })),
  ];
  const dropNew = async (file: File) => {
    try { const r = await uploadMedia(file, () => {}); add({ media: { type: r.type, src: r.src, poster: '', alt: '' }, fit: 'cover' }); }
    catch (e) { window.dispatchEvent(new CustomEvent('dvine-admin-toast', { detail: { ok: false, message: e instanceof Error ? e.message : 'The upload failed.' } })); }
  };
  return (
    <div className="grid gap-6">
      <Section title="Hero slideshow" sub="The first thing visitors see. Your promotion slides play alongside the three product slides (Hyper, Crystal and Titan, which stay as designed). Put a slide first so it greets every visitor, or last so it follows the products.">
        <div>
          <p className="mb-2 font-sans text-[12px] font-semibold uppercase tracking-wider text-muted">Slideshow order</p>
          <ol className="flex flex-wrap items-center gap-1.5">
            {order.map((o, i) => (
              <li key={o.k} className="flex items-center gap-1.5">
                {i > 0 && <Icon name="chevron" className="size-3.5 text-muted" />}
                <button type="button" onClick={() => o.promo && setOpen(o.k)} disabled={!o.promo}
                  className={`max-w-[180px] truncate rounded-full px-3 py-1.5 font-sans text-[12.5px] font-semibold ${o.promo ? (o.live ? 'bg-voltage text-ink hover:ring-2 hover:ring-ink/20' : 'bg-[#EEF1F7] text-muted line-through') : 'bg-stage text-white/90'}`}>
                  {o.promo && <Icon name="sparkle" className="mr-1 inline size-3" />}{o.label}
                </button>
              </li>
            ))}
          </ol>
        </div>
        {doc.slides.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-[#C9D2E3] bg-[#F8FAFD] p-8 text-center font-sans"
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) dropNew(f); }}>
            <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-white text-deep-current shadow"><Icon name="sparkle" /></span>
            <p className="text-[15px] font-semibold">No promotion slides yet</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">Add a slide with your own headline, photo or video. Drop a photo or video here to start a slide with it, or begin from a festive template on the Overview tab.</p>
            <button type="button" onClick={() => add()} className="btn btn-primary btn-sm mt-4"><Icon name="plus" className="size-4" />Add a promotion slide</button>
          </div>
        )}
        <ul className="grid gap-3">
          {doc.slides.map((p, i) => (
            <li key={p.id} {...sort.row(i)}>
              <ItemCard open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} drag={sort.handle(i)} muted={!p.enabled}
                title={p.title.replace(/\n/g, ' ') || p.tag || 'Untitled slide'}
                badge={<>{status(p)}<Pill tone="blue">{p.position === 'first' ? 'Before products' : 'After products'}</Pill></>}
                actions={<>
                  <IconBtn icon={p.enabled ? 'eye' : 'close'} label={p.enabled ? 'Hide slide' : 'Show slide'} onClick={() => set(d => { d.slides[i].enabled = !d.slides[i].enabled; })} />
                  <IconBtn icon="copy" label="Duplicate" disabled={doc.slides.length >= 4} onClick={() => set(d => { d.slides.splice(i + 1, 0, { ...structuredClone(p), id: newId() }); })} />
                  <IconBtn icon="trash" label="Delete slide" danger onClick={() => confirm('Delete this slide?') && set(d => { d.slides.splice(i, 1); })} />
                </>}>
                <DecorEditor items={p.decor} onChange={v => set(d => { d.slides[i].decor = v; })}>
                  {layer => <SlideMock p={p} layer={layer} />}
                </DecorEditor>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid content-start gap-4">
                    <Text label="Pinned label" value={p.tag} max={60} onChange={v => set(d => { d.slides[i].tag = v; })} placeholder="This Diwali Festive Offers" hint="The last word is set in the accent colour" />
                    <Area label="Headline" value={p.title} max={80} rows={2} onChange={v => set(d => { d.slides[i].title = v; })} placeholder={'Light up\nevery sip.'} hint="Press Enter for a new line" />
                    <Area label="Text" value={p.body} max={320} rows={3} onChange={v => set(d => { d.slides[i].body = v; })} placeholder="One or two sentences about the offer." />
                    <LinkField label="Main button" value={p.primary} onChange={v => set(d => { d.slides[i].primary = v; })} />
                    <LinkField label="Second button (optional)" value={p.secondary} onChange={v => set(d => { d.slides[i].secondary = v; })} />
                  </div>
                  <div className="grid content-start gap-4">
                    {p.fit !== 'lineup' && <MediaField label="Photo or video" value={p.media} onChange={m => set(d => { d.slides[i].media = m; })} siteImages={siteImages} hint="Videos play muted, on a loop" />}
                    <Segmented label="How the media sits" value={p.fit} onChange={v => set(d => { d.slides[i].fit = v; })}
                      options={[{ value: 'cover', label: 'Full background', icon: 'image' }, { value: 'side', label: 'On the right, like the products', icon: 'layout' }, { value: 'lineup', label: 'All three products (3D)', icon: 'layout' }]} />
                    {p.fit === 'cover' && p.media?.src && <Range label="Darken behind the text" value={p.shade} min={0} max={90} step={5} onChange={v => set(d => { d.slides[i].shade = v; })} format={v => `${v}%`} />}
                    <ThemePicker label="Colours" value={p.theme} onChange={v => set(d => { d.slides[i].theme = v; })} />
                    <Segmented label="Position" value={p.position} onChange={v => set(d => { d.slides[i].position = v; })}
                      options={[{ value: 'first', label: 'Before the products (seen first)' }, { value: 'last', label: 'After the products' }]} />
                    <Range label="Time on screen" value={p.duration} min={3} max={30} onChange={v => set(d => { d.slides[i].duration = v; })} format={v => `${v} seconds`} />
                    <Schedule value={p.schedule} onChange={v => set(d => { d.slides[i].schedule = v; })} />
                  </div>
                </div>
              </ItemCard>
            </li>
          ))}
        </ul>
        {doc.slides.length > 0 && <button type="button" disabled={doc.slides.length >= 4} onClick={() => add()} className="btn btn-outline btn-sm justify-self-start"><Icon name="plus" className="size-4" />Add another slide {doc.slides.length >= 4 && '(up to 4)'}</button>}
      </Section>
    </div>
  );
}

/* ───────────── Promotion cards ───────────── */
export function CardsPanel({ doc, set, siteImages }: PanelProps) {
  const pr = doc.promo;
  const [open, setOpen] = useState<string | null>(pr.cards[0]?.id ?? null);
  const sort = useSortable(pr.cards.length, (a, b) => set(d => { d.promo.cards = moveItem(d.promo.cards, a, b); }));
  const add = () => { const c = CardSchema.parse({ id: newId(), tag: 'Offer', title: 'Your offer', body: '', theme: (['volt', 'glacier', 'flash'] as ThemeKey[])[pr.cards.length % 3], cta: { label: 'Find out more', href: '/home-water-systems' } }); set(d => { d.promo.cards.push(c); d.promo.enabled = true; }); setOpen(c.id); };
  const live = pr.cards.filter(c => isLive(c));
  return (
    <div className="grid gap-6">
      <Section title="Promotion cards" sub="An optional block straight after the hero. One card shows as a wide banner; two or three sit side by side. Leave it off when there is nothing to promote."
        aside={<Toggle checked={pr.enabled} onChange={v => set(d => { d.promo.enabled = v; })} label={pr.enabled ? 'On' : 'Off'} />}>
        <div className="grid gap-4 md:grid-cols-2">
          <Text label="Heading (optional)" value={pr.title} max={90} onChange={v => set(d => { d.promo.title = v; })} placeholder="*Festive* offers." hint="Wrap words in *stars* for the italic line" />
          <Text label="Text beside the heading (optional)" value={pr.body} max={280} onChange={v => set(d => { d.promo.body = v; })} placeholder="Limited-period offers across the range." />
        </div>
        <ul className="grid gap-3">
          {pr.cards.map((c, i) => (
            <li key={c.id} {...sort.row(i)}>
              <ItemCard open={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} drag={sort.handle(i)} muted={!c.enabled}
                title={c.title || c.tag || 'Untitled card'} badge={<><span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: THEMES[c.theme].bg }} />{status(c)}</>}
                actions={<>
                  <IconBtn icon={c.enabled ? 'eye' : 'close'} label={c.enabled ? 'Hide card' : 'Show card'} onClick={() => set(d => { d.promo.cards[i].enabled = !d.promo.cards[i].enabled; })} />
                  <IconBtn icon="copy" label="Duplicate" disabled={pr.cards.length >= 3} onClick={() => set(d => { d.promo.cards.splice(i + 1, 0, { ...structuredClone(c), id: newId() }); })} />
                  <IconBtn icon="trash" label="Delete card" danger onClick={() => confirm('Delete this card?') && set(d => { d.promo.cards.splice(i, 1); })} />
                </>}>
                <DecorEditor items={c.decor} onChange={v => set(d => { d.promo.cards[i].decor = v; })}>
                  {layer => <CardMock c={c} layer={layer} wide={pr.cards.filter(x => x.enabled).length <= 1} />}
                </DecorEditor>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid content-start gap-4">
                    <Text label="Pinned label" value={c.tag} max={40} onChange={v => set(d => { d.promo.cards[i].tag = v; })} placeholder="Diwali gifting" />
                    <Text label="Title" value={c.title} max={90} onChange={v => set(d => { d.promo.cards[i].title = v; })} />
                    <Area label="Text" value={c.body} max={280} onChange={v => set(d => { d.promo.cards[i].body = v; })} />
                    <LinkField label="Link" value={c.cta} onChange={v => set(d => { d.promo.cards[i].cta = v; })} />
                  </div>
                  <div className="grid content-start gap-4">
                    <MediaField label="Photo or video" value={c.media} onChange={m => set(d => { d.promo.cards[i].media = m; })} siteImages={siteImages} compact />
                    <ThemePicker label="Card colour" value={c.theme} onChange={v => set(d => { d.promo.cards[i].theme = v; })} />
                    <Schedule value={c.schedule} onChange={v => set(d => { d.promo.cards[i].schedule = v; })} />
                  </div>
                </div>
              </ItemCard>
            </li>
          ))}
        </ul>
        <button type="button" disabled={pr.cards.length >= 3} onClick={add} className="btn btn-outline btn-sm justify-self-start"><Icon name="plus" className="size-4" />Add a card {pr.cards.length >= 3 && '(up to 3)'}</button>
      </Section>
      {pr.enabled && live.length > 0 && (
        <Section title="Preview" sub="How the block looks on a large screen.">
          <div className="overflow-hidden rounded-2xl border border-line bg-paper [&_[data-reveal]]:!translate-y-0 [&_[data-reveal]]:!opacity-100">
            <div style={{ width: 1280, zoom: .5 }}><PromoCards promo={pr} cards={live} /></div>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ───────────── Water testing text with photos between the words ───────────── */
export function WaterPanel({ doc, set, siteImages }: PanelProps) {
  const w = doc.water;
  const words = w.body.split(/\s+/).filter(Boolean);
  const [drag, setDrag] = useState<string | null>(null);
  const [overWord, setOverWord] = useState<number | null>(null);
  const [picking, setPicking] = useState<number | null>(null);
  // which word each photo sits after (first free match, as on the site)
  const at = new Map<number, number>();
  w.pics.forEach((p, pi) => { const i = words.findIndex((x, k) => !at.has(k) && x.toLowerCase() === p.after.trim().toLowerCase()); at.set(i >= 0 ? i : words.length - 1, pi); });
  const placeAt = (pi: number, wi: number) => set(d => { d.water.pics[pi].after = words[wi]; });
  const designed = w.body === DEFAULT_CONTENT.water.body && w.title === DEFAULT_CONTENT.water.title;
  return (
    <div className="grid gap-6">
      <Section title="Water testing text" sub="The section after the hero, where the words light up over the water-drop video with small photos set between them."
        aside={!designed && <button type="button" className="font-sans text-[13px] font-semibold text-deep-current hover:underline" onClick={() => confirm('Put back the original heading, text and photos?') && set(d => { d.water = structuredClone(DEFAULT_CONTENT.water); })}>Restore the original</button>}>
        <Text label="Heading" value={w.title} max={90} onChange={v => set(d => { d.water.title = v; })} hint="*Stars* around the first words make the italic line" />
        <Area label="Text" value={w.body} max={600} rows={4} onChange={v => set(d => { d.water.body = v; })} />
        <div>
          <p className="mb-1 font-sans text-[13px] font-semibold">Photos in the text</p>
          <p className="mb-3 font-sans text-[12.5px] text-muted">Drag a photo onto any word to move it there, or press the + after a word to add a photo. Up to 8.</p>
          <div className="rounded-2xl p-5 font-serif text-[21px] leading-[1.9] text-white italic" style={{ background: 'radial-gradient(70% 60% at 50% 52%, #0A2A7A, #030E36)' }}>
            {words.map((x, i) => {
              const pi = at.get(i); const p = pi !== undefined ? w.pics[pi] : null;
              return (
                <span key={i} className="inline">
                  <span onDragOver={e => { if (drag) { e.preventDefault(); setOverWord(i); } }} onDragLeave={() => setOverWord(null)}
                    onDrop={e => { e.preventDefault(); const from = w.pics.findIndex(q => q.id === drag); if (from >= 0) placeAt(from, i); setDrag(null); setOverWord(null); }}
                    className={`rounded px-0.5 transition ${overWord === i ? 'bg-glacier text-ink' : ''}`}>{x}</span>
                  {p ? (
                    <span draggable onDragStart={() => setDrag(p.id)} onDragEnd={() => { setDrag(null); setOverWord(null); }}
                      className="group relative mx-1 inline-block h-[1.05em] w-[2em] cursor-grab overflow-hidden rounded-[.14em] align-[-.2em] ring-2 ring-glacier/70 active:cursor-grabbing" title="Drag onto another word">
                      {p.src ? <img src={p.src} alt="" className="absolute inset-0 size-full object-cover" draggable={false} /> : <span className="absolute inset-0 bg-white/20" />}
                      <button type="button" onClick={() => set(d => { d.water.pics.splice(pi!, 1); })} className="absolute inset-0 hidden place-items-center bg-[#B3261E]/80 font-sans text-[11px] not-italic group-hover:grid" aria-label="Remove photo"><Icon name="trash" className="size-3.5" /></button>
                    </span>
                  ) : (
                    <button type="button" disabled={w.pics.length >= 8} onClick={() => setPicking(i)} className="mx-0.5 inline-grid size-4 place-items-center rounded-full align-middle text-white/25 hover:bg-glacier hover:text-ink disabled:hidden" aria-label={`Add a photo after “${x}”`}><Icon name="plus" className="size-3" strokeWidth={2.4} /></button>
                  )}{' '}
                </span>
              );
            })}
          </div>
          {picking !== null && (
            <div className="mt-3 rounded-2xl border border-deep-current/30 bg-[#F4F8FF] p-4">
              <div className="mb-2 flex items-center justify-between font-sans text-[13px]"><b>Photo after “{words[picking]}”</b><button type="button" onClick={() => setPicking(null)} className="text-muted">Cancel</button></div>
              <MediaField label="" accept="image" compact value={null} siteImages={siteImages} onChange={m => { if (m) set(d => { d.water.pics.push({ id: newId(), after: words[picking], src: m.src, alt: m.alt }); }); setPicking(null); }} />
            </div>
          )}
          {w.pics.length > 0 && (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {w.pics.map((p, pi) => (
                <li key={p.id} className="flex items-center gap-2 rounded-xl border border-line p-2">
                  <img src={p.src} alt="" className="h-9 w-14 shrink-0 rounded object-cover" />
                  <input value={p.alt} onChange={e => set(d => { d.water.pics[pi].alt = e.target.value; })} placeholder="Describe the photo" aria-label="Photo description" className="min-w-0 flex-1 rounded-lg px-2 py-1 font-sans text-[13px] focus:bg-[#F3F6FB] focus:outline-none" />
                  <span className="shrink-0 font-sans text-[11.5px] text-muted">after “{p.after}”</span>
                  <IconBtn icon="trash" label="Remove" danger onClick={() => set(d => { d.water.pics.splice(pi, 1); })} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <LinkField label="Main button" value={w.primary} onChange={v => set(d => { d.water.primary = v; })} />
          <LinkField label="Second button" value={w.secondary} onChange={v => set(d => { d.water.secondary = v; })} />
        </div>
      </Section>
    </div>
  );
}

/* ───────────── Partner page ───────────── */
function ListEditor<T extends { id: string }>({ items, onChange, render, blank, max, addLabel }: { items: T[]; onChange: (v: T[]) => void; render: (it: T, update: (p: Partial<T>) => void) => ReactNode; blank: () => T; max: number; addLabel: string }) {
  const sort = useSortable(items.length, (a, b) => onChange(moveItem(items, a, b)));
  return (
    <div className="grid gap-2">
      {items.map((it, i) => (
        <div key={it.id} {...sort.row(i)}>
          <div className="flex items-start gap-1.5 rounded-xl border border-line bg-white p-2">
            <span {...sort.handle(i)} className="mt-1.5 grid size-7 shrink-0 cursor-grab place-items-center text-muted" aria-label="Drag to reorder"><Icon name="grip" className="size-4" strokeWidth={2.4} /></span>
            <div className="grid min-w-0 flex-1 gap-1.5">{render(it, p => onChange(items.map((x, k) => (k === i ? { ...x, ...p } : x))))}</div>
            <IconBtn icon="trash" label="Remove" danger onClick={() => onChange(items.filter((_, k) => k !== i))} />
          </div>
        </div>
      ))}
      <button type="button" disabled={items.length >= max} onClick={() => onChange([...items, blank()])} className="justify-self-start rounded-lg px-2 py-1 font-sans text-[13px] font-semibold text-deep-current hover:bg-[#EEF4FE] disabled:opacity-40"><Icon name="plus" className="mr-1 inline size-3.5" />{addLabel}</button>
    </div>
  );
}
const mini = 'w-full rounded-lg px-2 py-1.5 font-sans text-[14px] focus:bg-[#F3F6FB] focus:outline-none';

export function PartnerPanel({ doc, set, siteImages }: PanelProps) {
  const p = doc.partner;
  return (
    <div className="grid gap-6">
      <Section title="Become a Partner page" sub="Its own page in the main menu. Enquiries arrive in Enquiries & CRM as distributorship enquiries, with the partnership type chosen."
        aside={<a href="/become-a-partner" target="_blank" className="btn btn-outline btn-sm min-h-9"><Icon name="external" className="size-4" />Open page</a>}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid content-start gap-4">
            <Text label="Heading" value={p.title} max={90} onChange={v => set(d => { d.partner.title = v; })} hint="*Stars* make the italic line" />
            <Area label="Introduction" value={p.body} max={500} rows={4} onChange={v => set(d => { d.partner.body = v; })} />
          </div>
          <MediaField label="Hero photo or video" value={p.media} onChange={m => set(d => { d.partner.media = m; })} siteImages={siteImages} compact />
        </div>
      </Section>
      <Section title="Why partner" sub="Shown as ruled rows with an icon each.">
        <Text label="Section heading" value={p.benefitsTitle} max={90} onChange={v => set(d => { d.partner.benefitsTitle = v; })} />
        <ListEditor items={p.benefits} max={8} addLabel="Add a reason" onChange={v => set(d => { d.partner.benefits = v; })} blank={() => ({ id: newId(), title: '', body: '' })}
          render={(it, u) => <><input value={it.title} onChange={e => u({ title: e.target.value })} placeholder="Title" aria-label="Title" className={`${mini} font-semibold`} /><textarea value={it.body} onChange={e => u({ body: e.target.value })} placeholder="Text" aria-label="Text" rows={2} className={`${mini} resize-y`} /></>} />
      </Section>
      <Section title="How it works" sub="Numbered steps.">
        <Text label="Section heading" value={p.stepsTitle} max={90} onChange={v => set(d => { d.partner.stepsTitle = v; })} />
        <ListEditor items={p.steps} max={8} addLabel="Add a step" onChange={v => set(d => { d.partner.steps = v; })} blank={() => ({ id: newId(), title: '', body: '' })}
          render={(it, u) => <><input value={it.title} onChange={e => u({ title: e.target.value })} placeholder="Step" aria-label="Step" className={`${mini} font-semibold`} /><input value={it.body} onChange={e => u({ body: e.target.value })} placeholder="Detail (optional)" aria-label="Detail" className={mini} /></>} />
      </Section>
      <Section title="Enquiry form">
        <div className="grid gap-4 md:grid-cols-2">
          <Text label="Heading" value={p.formTitle} max={90} onChange={v => set(d => { d.partner.formTitle = v; })} />
          <Text label="Text" value={p.formBody} max={400} onChange={v => set(d => { d.partner.formBody = v; })} />
        </div>
        <div>
          <p className="mb-2 font-sans text-[13px] font-semibold">Partnership types in the form</p>
          <ListEditor items={p.partnerTypes} max={12} addLabel="Add a type" onChange={v => set(d => { d.partner.partnerTypes = v; })} blank={() => ({ id: newId(), text: '' })}
            render={(it, u) => <input value={it.text} onChange={e => u({ text: e.target.value })} placeholder="e.g. Distributor" aria-label="Partnership type" className={mini} />} />
        </div>
      </Section>
      <Section title="Questions">
        <ListEditor items={p.faqs} max={12} addLabel="Add a question" onChange={v => set(d => { d.partner.faqs = v; })} blank={() => ({ id: newId(), q: '', a: '' })}
          render={(it, u) => <><input value={it.q} onChange={e => u({ q: e.target.value })} placeholder="Question" aria-label="Question" className={`${mini} font-semibold`} /><textarea value={it.a} onChange={e => u({ a: e.target.value })} placeholder="Answer" aria-label="Answer" rows={2} className={`${mini} resize-y`} /></>} />
      </Section>
    </div>
  );
}

export type { PromoCard };

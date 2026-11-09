'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { OfferTicket } from '@/components/store/OfferTicket';
import { PromoCards } from '@/components/store/PromoCards';
import { CardSchema, PRODUCT_PAGES, THEMES, isLive, newId, type ProductKey, type ThemeKey } from '@/lib/site-content';
import { DecorEditor } from './DecorEditor';
import { MediaField } from './MediaField';
import { Area, IconBtn, ItemCard, LinkField, Pill, Schedule, Segmented, Text, ThemePicker, Toggle, moveItem, useSortable } from './fields';
import { CardMock, Section, status, type PanelProps } from './panels';

/** The store's scroll scripts aren't running here: show what they would otherwise reveal. */
const SHOW = '[&_.label-box]:!visible [&_.pin-frame]:!visible [&_[data-reveal]]:!translate-y-0 [&_[data-reveal]]:!opacity-100';

/**
 * Product pages (Crystal, Hyper, Titan): an offer ticket in the purchase panel and optional promotion cards.
 * `product` is held by the editor so the preview opens the page being edited.
 */
export function ProductsPanel({ doc, set, siteImages, product, setProduct }: PanelProps & { product: ProductKey; setProduct: (k: ProductKey) => void }) {
  const page = PRODUCT_PAGES.find(p => p.key === product)!;
  const pp = doc.products[product];
  const o = pp.offer, b = pp.banner;
  const titan = product === 'titan';
  const [open, setOpen] = useState<string | null>(b.cards[0]?.id ?? null);
  const sort = useSortable(b.cards.length, (from, to) => set(d => { d.products[product].banner.cards = moveItem(d.products[product].banner.cards, from, to); }));
  const offerLive = o.enabled && isLive(o) && !!(o.title || o.tag || o.code);
  const liveCards = b.enabled ? b.cards.filter(c => isLive(c)) : [];

  const addCard = () => {
    const c = CardSchema.parse({ id: newId(), tag: 'Offer', title: `Your ${page.name} offer`, theme: (b.cards.length ? 'volt' : page.theme) as ThemeKey, cta: { label: 'Find out more', href: '#buy' } });
    set(d => { d.products[product].banner.cards.push(c); d.products[product].banner.enabled = true; }); setOpen(c.id);
  };
  const copyOffer = () => {
    const others = PRODUCT_PAGES.filter(p => p.key !== product);
    if (!confirm(`Copy this offer ticket to ${others.map(p => p.name).join(' and ')}? Their current offers are replaced. “${page.name}” in the text becomes each product’s name.`)) return;
    set(d => others.forEach(p => {
      const swap = (v: string) => v.split(page.name).join(p.name);
      d.products[p.key].offer = { ...structuredClone(o), tag: swap(o.tag), title: swap(o.title), body: swap(o.body) };
    }));
  };

  return (
    <div className="grid gap-6">
      {/* which product */}
      <div className="grid gap-2 sm:grid-cols-3">
        {PRODUCT_PAGES.map(p => {
          const x = doc.products[p.key];
          const on = (x.offer.enabled && isLive(x.offer)) || (x.banner.enabled && x.banner.cards.some(c => isLive(c)));
          const t = THEMES[p.theme];
          return (
            <button key={p.key} type="button" onClick={() => setProduct(p.key)} aria-pressed={product === p.key}
              className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left font-sans transition ${product === p.key ? 'border-ink shadow-[0_8px_24px_-14px_rgb(4_22_74/.55)]' : 'border-line hover:border-deep-current/40'}`}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl text-[15px] font-extrabold" style={{ background: t.bg, color: t.fg }}>{p.name[0]}</span>
              <span className="min-w-0 flex-1"><span className="block text-[14.5px] font-semibold">{p.name}</span><span className="block truncate text-[12.5px] text-muted">{p.sub}</span></span>
              {on ? <Pill tone="green">Promo on</Pill> : <Pill>Standard</Pill>}
            </button>
          );
        })}
      </div>

      {/* offer ticket */}
      <Section title={<>Offer ticket <span className="font-normal text-muted">· {page.name}</span></>}
        sub={`A coupon-style ticket ${titan ? 'beside the quotation' : 'right under the price'}, with an optional code to copy and a countdown to the end date. On phones its label also rides in the bottom bar.`}
        aside={<Toggle checked={o.enabled} onChange={v => set(d => { d.products[product].offer.enabled = v; })} label={o.enabled ? 'On' : 'Off'} />}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <Text label="Pinned label" value={o.tag} max={40} onChange={v => set(d => { d.products[product].offer.tag = v; })} placeholder="Diwali offer" hint="Also shown in the phone’s bottom bar" />
            <Text label="Offer" value={o.title} max={90} onChange={v => set(d => { d.products[product].offer.title = v; })} placeholder={titan ? 'Free first-year service on Titan' : `Festive pricing on ${page.name}`} />
            <Area label="Small print (optional)" value={o.body} max={220} rows={2} onChange={v => set(d => { d.products[product].offer.body = v; })} placeholder="For a limited period. Cannot be combined with other offers." />
            <Text label="Code (optional)" mono value={o.code} max={24} onChange={v => set(d => { d.products[product].offer.code = v.toUpperCase().replace(/\s+/g, ''); })} placeholder="DIWALI10"
              hint={titan ? 'Visitors quote it when they enquire' : <>Create the same code in <Link href="/admin/marketing" className="font-semibold text-deep-current hover:underline">Marketing</Link> so it works in the cart</>} />
            <LinkField label="Link (optional)" value={o.link} onChange={v => set(d => { d.products[product].offer.link = v; })} />
          </div>
          <div className="grid content-start gap-4">
            <div>
              <p className="mb-2 font-sans text-[12px] font-semibold uppercase tracking-wider text-muted">Preview</p>
              <div className={`rounded-2xl border border-line bg-paper p-5 ${SHOW}`}>
                {o.title || o.tag || o.code ? <OfferTicket offer={o} codeHint={titan ? 'Quote it when you enquire' : undefined} /> : <p className="py-6 text-center font-sans text-[13px] text-muted">Write the offer to see the ticket.</p>}
              </div>
              <p className="mt-2 font-sans text-[12px] text-muted">The code moves under the offer on narrow screens and phones.</p>
            </div>
            <ThemePicker label="Ticket colour" value={o.theme} onChange={v => set(d => { d.products[product].offer.theme = v; })} />
            <Schedule value={o.schedule} onChange={v => set(d => { d.products[product].offer.schedule = v; })} />
            <Toggle checked={o.countdown} onChange={v => set(d => { d.products[product].offer.countdown = v; })} label="Count down to the end date"
              sub={o.schedule.to ? 'Shows the end date, then days left, then a live clock on the last day' : 'Set an end date above to show a countdown'} />
            <div className="flex flex-wrap items-center gap-3">
              {o.enabled && status(o)}
              <button type="button" onClick={copyOffer} disabled={!(o.title || o.tag)} className="btn btn-outline btn-sm"><Icon name="copy" className="size-4" />Copy to the other products</button>
            </div>
          </div>
        </div>
      </Section>

      {/* promotion cards */}
      <Section title={<>Promotion cards <span className="font-normal text-muted">· {page.name}</span></>}
        sub="The homepage’s promotion cards, on this product’s page. One card shows as a wide banner; two sit side by side (stacked on phones)."
        aside={<Toggle checked={b.enabled} onChange={v => set(d => { d.products[product].banner.enabled = v; })} label={b.enabled ? 'On' : 'Off'} />}>
        <div className="grid gap-4 md:grid-cols-2">
          <Segmented label="Where on the page" value={b.placement} onChange={v => set(d => { d.products[product].banner.placement = v; })}
            options={[{ value: 'hero', label: 'After the hero' }, { value: 'faq', label: titan ? 'Near the end' : 'Before the questions' }]} />
          <div />
          <Text label="Heading (optional)" value={b.title} max={90} onChange={v => set(d => { d.products[product].banner.title = v; })} placeholder="*This season’s* offers." hint="Wrap words in *stars* for the italic line" />
          <Text label="Text beside the heading (optional)" value={b.body} max={280} onChange={v => set(d => { d.products[product].banner.body = v; })} />
        </div>
        <ul className="grid gap-3">
          {b.cards.map((c, i) => {
            const upd = (fn: (x: typeof c) => void) => set(d => fn(d.products[product].banner.cards[i]));
            return (
              <li key={c.id} {...sort.row(i)}>
                <ItemCard open={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} drag={sort.handle(i)} muted={!c.enabled}
                  title={c.title || c.tag || 'Untitled card'} badge={<><span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: THEMES[c.theme].bg }} />{status(c)}</>}
                  actions={<>
                    <IconBtn icon={c.enabled ? 'eye' : 'close'} label={c.enabled ? 'Hide card' : 'Show card'} onClick={() => upd(x => { x.enabled = !x.enabled; })} />
                    <IconBtn icon="copy" label="Duplicate" disabled={b.cards.length >= 2} onClick={() => set(d => { d.products[product].banner.cards.splice(i + 1, 0, { ...structuredClone(c), id: newId() }); })} />
                    <IconBtn icon="trash" label="Delete card" danger onClick={() => confirm('Delete this card?') && set(d => { d.products[product].banner.cards.splice(i, 1); })} />
                  </>}>
                  <DecorEditor items={c.decor} onChange={v => upd(x => { x.decor = v; })}>
                    {layer => <CardMock c={c} layer={layer} wide={b.cards.filter(x => x.enabled).length <= 1} />}
                  </DecorEditor>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="grid content-start gap-4">
                      <Text label="Pinned label" value={c.tag} max={40} onChange={v => upd(x => { x.tag = v; })} placeholder="Festive bundle" />
                      <Text label="Title" value={c.title} max={90} onChange={v => upd(x => { x.title = v; })} />
                      <Area label="Text" value={c.body} max={280} onChange={v => upd(x => { x.body = v; })} />
                      <LinkField label="Link" value={c.cta} onChange={v => upd(x => { x.cta = v; })} />
                    </div>
                    <div className="grid content-start gap-4">
                      <MediaField label="Photo or video" value={c.media} onChange={m => upd(x => { x.media = m; })} siteImages={siteImages} compact />
                      <ThemePicker label="Card colour" value={c.theme} onChange={v => upd(x => { x.theme = v; })} />
                      <Schedule value={c.schedule} onChange={v => upd(x => { x.schedule = v; })} />
                    </div>
                  </div>
                </ItemCard>
              </li>
            );
          })}
        </ul>
        <button type="button" disabled={b.cards.length >= 2} onClick={addCard} className="btn btn-outline btn-sm justify-self-start"><Icon name="plus" className="size-4" />Add a card {b.cards.length >= 2 && '(up to 2)'}</button>
      </Section>
      {liveCards.length > 0 && (
        <Section title="Preview" sub="How the cards look on a large screen.">
          <div className={`overflow-hidden rounded-2xl border border-line bg-paper ${SHOW}`}>
            <div style={{ width: 1280, zoom: .5 }}><PromoCards promo={b} cards={liveCards} id={`pv-${product}`} tone={page.theme} wrap="container-x" /></div>
          </div>
        </Section>
      )}
    </div>
  );
}

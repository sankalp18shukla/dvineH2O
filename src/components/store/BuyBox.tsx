import type { Product } from '@/lib/catalog';
import { formatINR } from '@/lib/money';
import { AddToCart } from './AddToCart';
import { PincodeCheck } from './PincodeCheck';
import { Stars } from './Reviews';
import { Icon } from '../ui/Icon';
import { Cta, type CtaTone } from '../ui/Cta';
import { OfferTicket } from './OfferTicket';
import type { Offer } from '@/lib/site-content';
import { PriceStory } from './WorthReading';
import wr from './WorthReading.module.css';

/**
 * Purchase panel, in the content document's order: price, tax note, stock, postcode check, quantity, then the
 * buttons (the home page's accent pill with the arrow chip, and the frosted pill). Rises in with the page (data-rise).
 * A running offer (Admin › Homepage & promotions › Product pages) shows as a ticket straight under the price.
 * `why` is the blog post that explains the price (Admin › Blog: category "Price and value" for this product).
 */
export function BuyBox({ p, tone = 'glacier', secondary, offer, why, whyHref }: { p: Product; tone?: CtaTone; secondary?: { href: string; label: string }; offer?: Offer | null; why?: { slug: string } | null; whyHref?: string }) {
  const save = p.mrp > p.price ? p.mrp - p.price : 0;
  return (
    <div id="buy" className="flex scroll-mt-32 flex-col gap-6" data-rise>
      <div>
        {p.reviewCount > 0 && <a href="#reviews" className="mb-3 flex items-center gap-2 font-sans text-sm text-muted"><Stars value={p.rating} /> {p.rating.toFixed(1)} · {p.reviewCount} review{p.reviewCount === 1 ? '' : 's'}</a>}
        {/* the brief's order: MRP struck through, then the offer price, then the saving */}
        <div className="border-t-2 border-ink pt-5 font-sans">
          {save > 0 && <p className="text-[15px] text-muted">MRP <s>{formatINR(p.mrp)}</s></p>}
          <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
            <span className="text-[44px] leading-none font-bold tracking-[-0.04em]">{formatINR(p.price)}</span>
            {save > 0 && <span className="mb-1 bg-voltage px-2 py-0.5 text-[13px] font-bold text-ink">You save {formatINR(save)}</span>}
          </div>
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[13.5px] text-muted">
          <span>GST inclusive</span>
          <span className="flex items-center gap-2 font-semibold text-ink">
            <span className={`size-2 rounded-full ${p.stock === 'out_of_stock' ? 'bg-pulse' : p.stock === 'low_stock' ? 'bg-[#E59A00]' : 'bg-[#1FA34A]'}`} aria-hidden="true" />
            {p.stock === 'out_of_stock' ? 'Out of stock' : p.stock === 'low_stock' ? `Only ${p.available} left in stock` : 'In stock'}
          </span>
          <span>{p.requiresInstallation ? 'Installation by a DVINE-trained technician' : 'Free delivery'}</span>
        </p>
        {whyHref ? <a href={whyHref} className={`${wr.why} mt-4`}><Icon name="info" className="size-4" /><span>Why this price?</span><Icon name="down" className="size-3.5" /></a>
          : why && <PriceStory slug={why.slug} className="mt-4" />}
      </div>
      {offer && <OfferTicket offer={offer} />}
      <div className="border-t border-line pt-5">
        <p className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold"><Icon name="truck" className="size-4" /> Check delivery{p.requiresInstallation ? ' and installation' : ''}</p>
        <PincodeCheck installationNote={p.requiresInstallation} />
      </div>
      <AddToCart productId={p.id} max={Math.min(p.available, p.maxPerOrder)} tone={tone} />
      {secondary && <div><Cta href={secondary.href} kind="glass">{secondary.label}</Cta></div>}
      <ul className="grid grid-cols-1 gap-2 border-t border-line pt-5 font-sans text-[14px] text-muted sm:grid-cols-3 sm:gap-4">
        {/* Crystal: 1 year on the machine and 5 on the chamber, and 30-day returns (client, Nov 2026) */}
        <li className="flex items-center gap-2"><Icon name="shield" className="size-4 shrink-0 text-deep-current" /> {p.warrantyMonths >= 12 ? `${p.warrantyMonths / 12}-year` : `${p.warrantyMonths}-month`} warranty{p.slug === 'crystal' ? ', 5 years on the chamber' : ''}</li>
        <li className="flex items-center gap-2"><Icon name="card" className="size-4 shrink-0 text-deep-current" /> UPI, cards and EMI</li>
        {p.slug === 'crystal'
          ? <li className="flex items-center gap-2"><Icon name="doc" className="size-4 shrink-0 text-deep-current" /> 30-day returns</li>
          : <li className="flex items-center gap-2"><Icon name="doc" className="size-4 shrink-0 text-deep-current" /> GST invoice</li>}
      </ul>
    </div>
  );
}

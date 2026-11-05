import type { Product } from '@/lib/catalog';
import { formatINR } from '@/lib/money';
import { AddToCart } from './AddToCart';
import { PincodeCheck } from './PincodeCheck';
import { Stars } from './Reviews';
import { Icon } from '../ui/Icon';
import { Cta, type CtaTone } from '../ui/Cta';

/**
 * Purchase panel, in the content document's order: price, tax note, stock, postcode check, quantity, then the
 * buttons (the home page's accent pill with the arrow chip, and the frosted pill). Rises in with the page (data-rise).
 */
export function BuyBox({ p, tone = 'glacier', secondary }: { p: Product; tone?: CtaTone; secondary?: { href: string; label: string } }) {
  const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <div id="buy" className="flex scroll-mt-32 flex-col gap-6" data-rise>
      <div>
        {p.reviewCount > 0 && <a href="#reviews" className="mb-3 flex items-center gap-2 font-sans text-sm text-muted"><Stars value={p.rating} /> {p.rating.toFixed(1)} · {p.reviewCount} review{p.reviewCount === 1 ? '' : 's'}</a>}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-t-2 border-ink pt-5 font-sans">
          <span className="text-[44px] leading-none font-bold tracking-[-0.04em]">{formatINR(p.price)}</span>
          {off > 0 && <><span className="pb-1 text-lg text-muted line-through">{formatINR(p.mrp)}</span><span className="mb-1 bg-voltage px-2 py-0.5 text-[13px] font-bold text-ink">{off}% off</span></>}
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[13.5px] text-muted">
          <span>Inclusive of GST</span>
          <span className="flex items-center gap-2 font-semibold text-ink">
            <span className={`size-2 rounded-full ${p.stock === 'out_of_stock' ? 'bg-pulse' : p.stock === 'low_stock' ? 'bg-[#E59A00]' : 'bg-[#1FA34A]'}`} aria-hidden="true" />
            {p.stock === 'out_of_stock' ? 'Out of stock' : p.stock === 'low_stock' ? `Only ${p.available} left in stock` : 'In stock'}
          </span>
          <span>{p.requiresInstallation ? 'Installation by a DVINE-trained technician' : 'Free delivery'}</span>
        </p>
      </div>
      <div className="border-t border-line pt-5">
        <p className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold"><Icon name="truck" className="size-4" /> Check delivery{p.requiresInstallation ? ' and installation' : ''}</p>
        <PincodeCheck installationNote={p.requiresInstallation} />
      </div>
      <AddToCart productId={p.id} max={Math.min(p.available, p.maxPerOrder)} tone={tone} />
      {secondary && <div><Cta href={secondary.href} kind="glass">{secondary.label}</Cta></div>}
      <ul className="grid gap-2 border-t border-line pt-5 font-sans text-[14px] text-muted sm:grid-cols-3 sm:gap-4">
        <li className="flex items-center gap-2"><Icon name="shield" className="size-4 shrink-0 text-deep-current" /> {p.warrantyMonths >= 12 ? `${p.warrantyMonths / 12}-year` : `${p.warrantyMonths}-month`} warranty</li>
        <li className="flex items-center gap-2"><Icon name="card" className="size-4 shrink-0 text-deep-current" /> UPI, cards and EMI</li>
        <li className="flex items-center gap-2"><Icon name="doc" className="size-4 shrink-0 text-deep-current" /> GST invoice</li>
      </ul>
    </div>
  );
}

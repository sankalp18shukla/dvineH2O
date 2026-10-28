import Link from 'next/link';
import type { Product } from '@/lib/catalog';
import { formatINR } from '@/lib/money';
import { AddToCart } from './AddToCart';
import { PincodeCheck } from './PincodeCheck';
import { Stars } from './Reviews';
import { Icon } from '../ui/Icon';

export function BuyBox({ p, secondary }: { p: Product; secondary?: { href: string; label: string } }) {
  const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <div id="buy" className="flex scroll-mt-32 flex-col gap-5">
      {p.reviewCount > 0 && <a href="#reviews" className="flex items-center gap-2 font-sans text-sm text-muted"><Stars value={p.rating} /> {p.rating.toFixed(1)} · {p.reviewCount} review{p.reviewCount === 1 ? '' : 's'}</a>}
      <div className="flex flex-wrap items-baseline gap-3 font-sans">
        <span className="text-4xl font-bold tracking-tight">{formatINR(p.price)}</span>
        {off > 0 && <><span className="text-lg text-muted line-through">{formatINR(p.mrp)}</span><span className="badge bg-[#DFF5E3] text-[#1B6B2C]">{off}% off</span></>}
      </div>
      <p className="-mt-3 font-sans text-[13px] text-muted">Inclusive of GST. {p.requiresInstallation ? 'Installation by a DVINE-trained technician.' : 'Free delivery.'}</p>
      <p className="-mt-2 flex items-center gap-2 font-sans text-sm font-semibold">
        <span className={`size-2 rounded-full ${p.stock === 'out_of_stock' ? 'bg-pulse' : p.stock === 'low_stock' ? 'bg-[#E59A00]' : 'bg-[#1FA34A]'}`} aria-hidden="true" />
        {p.stock === 'out_of_stock' ? 'Out of stock' : p.stock === 'low_stock' ? `Only ${p.available} left in stock` : 'In stock'}
      </p>
      <AddToCart productId={p.id} max={Math.min(p.available, p.maxPerOrder)} />
      {secondary && <Link href={secondary.href} className="btn btn-outline self-start">{secondary.label}</Link>}
      <div className="rounded-2xl border border-line bg-white p-4">
        <p className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold"><Icon name="truck" className="size-4" /> Check delivery{p.requiresInstallation ? ' and installation' : ''}</p>
        <PincodeCheck installationNote={p.requiresInstallation} />
      </div>
      <ul className="grid gap-2 font-sans text-[14px] text-muted">
        <li className="flex items-center gap-2"><Icon name="shield" className="size-4 text-deep-current" /> {p.warrantyMonths >= 12 ? `${p.warrantyMonths / 12}-year` : `${p.warrantyMonths}-month`} warranty</li>
        <li className="flex items-center gap-2"><Icon name="card" className="size-4 text-deep-current" /> UPI, cards, net banking, wallets and EMI via Razorpay</li>
        <li className="flex items-center gap-2"><Icon name="doc" className="size-4 text-deep-current" /> GST invoice with every order</li>
      </ul>
    </div>
  );
}

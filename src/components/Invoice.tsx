import type { FullOrder } from '@/lib/order-view';
import type { Company } from '@/lib/settings';
import { formatINR } from '@/lib/money';
import { splitInclusive } from '@/lib/gst';
import { Logo } from './ui/Logo';

/** Printable GST tax invoice / credit note. */
export function InvoiceDoc({ o, company, kind = 'invoice', creditNumber }: { o: FullOrder; company: Company; kind?: 'invoice' | 'credit_note'; creditNumber?: string }) {
  const inv = kind === 'invoice' ? o.invoices.find(i => i.kind === 'invoice') : o.invoices.find(i => i.number === creditNumber);
  if (!inv) return <p className="p-10 font-sans">No {kind === 'invoice' ? 'invoice' : 'credit note'} has been issued for this order yet.</p>;
  const ref = kind === 'credit_note' ? o.invoices.find(i => i.id === inv.refInvoiceId) : null;
  const intra = inv.igst === 0 && (inv.cgst > 0 || inv.sgst > 0);
  const b = o.billingAddress, s = o.shippingAddress;
  const shipTax = o.shipping ? splitInclusive(o.shipping, 1800) : null;
  return (
    <article className="mx-auto max-w-[860px] bg-white p-8 font-sans text-[13px] text-ink sm:p-12 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-6">
        <div>
          <Logo className="h-6 w-auto text-deep-current" />
          <p className="mt-3 font-semibold">{company.legalName}</p>
          {company.address && <p className="text-muted">{company.address}, {company.city}, {company.state} {company.pincode}</p>}
          <p className="text-muted">{company.gstin ? `GSTIN ${company.gstin}` : 'GSTIN: to be configured'}{company.pan ? ` · PAN ${company.pan}` : ''}</p>
          <p className="text-muted">{company.phone} · {company.email}</p>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-tight">{kind === 'invoice' ? 'Tax Invoice' : 'Credit Note'}</h1>
          <p className="mt-2"><span className="text-muted">No.</span> <b>{inv.number}</b></p>
          <p><span className="text-muted">Date</span> {inv.issuedAt.toLocaleDateString('en-IN')}</p>
          <p><span className="text-muted">Order</span> {o.number}</p>
          {ref && <p><span className="text-muted">Against invoice</span> {ref.number}</p>}
        </div>
      </header>
      {!company.confirmed && <p className="mt-4 rounded bg-[#FFF4D6] px-3 py-2 text-[#7A4B00] print:hidden">Seller details are placeholders. Set the legal name, address and GSTIN in Admin › Settings before issuing real invoices.</p>}
      <section className="mt-6 grid gap-6 sm:grid-cols-3">
        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Bill to</p><p className="mt-1 font-semibold">{b.name}</p><p>{b.line1}{b.line2 ? `, ${b.line2}` : ''}<br />{b.city}, {b.state} {b.pincode}</p>{inv.buyerGstin && <p>GSTIN {inv.buyerGstin}</p>}</div>
        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Ship to</p><p className="mt-1 font-semibold">{s.name}</p><p>{s.line1}{s.line2 ? `, ${s.line2}` : ''}<br />{s.city}, {s.state} {s.pincode}</p></div>
        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Place of supply</p><p className="mt-1">{inv.placeOfSupply}</p><p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Supply type</p><p className="mt-1">{intra ? 'Intra-state (CGST + SGST)' : 'Inter-state (IGST)'}</p></div>
      </section>
      {kind === 'invoice' ? (
        <table className="mt-8 w-full border-collapse text-left">
          <thead><tr className="border-y border-ink text-[11px] uppercase tracking-wider"><th className="py-2">Item</th><th>HSN</th><th className="text-right">Qty</th><th className="text-right">Taxable value</th><th className="text-right">GST</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            {o.items.map(i => (
              <tr key={i.id} className="border-b border-line align-top">
                <td className="py-2.5"><b>{i.name}</b><br /><span className="text-muted">{i.sku}{i.serials?.length ? ` · S/N ${i.serials.join(', ')}` : ''}{i.discount ? ` · discount ${formatINR(i.discount, true)}` : ''}</span></td>
                <td>{i.hsn ?? '—'}</td><td className="text-right">{i.qty}</td>
                <td className="text-right">{formatINR(i.lineTotal - i.taxAmount, true)}</td><td className="text-right">{i.taxRate / 100}%<br /><span className="text-muted">{formatINR(i.taxAmount, true)}</span></td><td className="text-right">{formatINR(i.lineTotal, true)}</td>
              </tr>
            ))}
            {shipTax && <tr className="border-b border-line"><td className="py-2.5">Delivery charges</td><td>996812</td><td className="text-right">1</td><td className="text-right">{formatINR(shipTax.taxable, true)}</td><td className="text-right">18%<br /><span className="text-muted">{formatINR(shipTax.tax, true)}</span></td><td className="text-right">{formatINR(o.shipping, true)}</td></tr>}
          </tbody>
        </table>
      ) : <p className="mt-8">Refund against order {o.number}.</p>}
      <section className="mt-6 ml-auto w-full max-w-xs space-y-1.5">
        <p className="flex justify-between"><span className="text-muted">Taxable value</span><span>{formatINR(inv.taxable, true)}</span></p>
        {intra ? <><p className="flex justify-between"><span className="text-muted">CGST</span><span>{formatINR(inv.cgst, true)}</span></p><p className="flex justify-between"><span className="text-muted">SGST</span><span>{formatINR(inv.sgst, true)}</span></p></> : <p className="flex justify-between"><span className="text-muted">IGST</span><span>{formatINR(inv.igst, true)}</span></p>}
        <p className="flex justify-between border-t-2 border-ink pt-2 text-base font-bold"><span>{kind === 'invoice' ? 'Total' : 'Credit amount'}</span><span>{formatINR(inv.total, true)}</span></p>
      </section>
      <footer className="mt-12 border-t border-line pt-4 text-[11px] text-muted">
        <p>Prices are inclusive of GST. This is a computer-generated document and does not require a signature.</p>
        <p className="mt-1">Warranty: DVINE Assured Care. Keep this invoice for warranty and service.</p>
      </footer>
    </article>
  );
}

import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, products } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { overview, parseRange } from '@/lib/metrics';
import { getCompany } from '@/lib/settings';
import { razorpayEnabled } from '@/lib/razorpay';
import { shiprocketEnabled } from '@/lib/shiprocket';
import { formatINR } from '@/lib/money';
import { Kpi, PageHead, Panel, TableWrap, pct, dt } from '@/components/admin/ui';
import { Status, humanize } from '@/components/ui/Status';
import { Icon } from '@/components/ui/Icon';
import { STATUS_LABEL } from '@/lib/orders';
import { ENQUIRY_LABEL } from '@/lib/enquiries';

const RANGES = [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['month', 'This month']] as const;

export default async function Overview({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string; denied?: string }> }) {
  await requireStaff('overview');
  const sp = await searchParams;
  const r = parseRange(sp.range, sp.from, sp.to);
  const [m, company, unconfirmed, recent] = await Promise.all([
    overview(r), getCompany(),
    db.query.products.findMany({ where: eq(products.priceConfirmed, false) }),
    db.query.orders.findMany({ orderBy: desc(orders.createdAt), limit: 6 }),
  ]);
  const warnings = [
    !razorpayEnabled() && 'Payments are in TEST MODE. Add Razorpay keys to take real payments.',
    !shiprocketEnabled() && 'Shiprocket is not connected. Shipments are recorded manually.',
    !company.confirmed && 'Company legal name, address and GSTIN are not confirmed. Invoices show placeholders.',
    unconfirmed.filter(p => p.saleMode === 'cart').length > 0 && `Prices for ${unconfirmed.filter(p => p.saleMode === 'cart').map(p => p.shortName).join(', ')} are placeholders. Confirm them in Products.`,
  ].filter(Boolean) as string[];
  const maxDay = Math.max(1, ...m.daily.map(d => d.total));

  return (
    <>
      <PageHead title="Overview" sub={`${r.label} · ${r.from.toLocaleDateString('en-IN')} to ${new Date(r.to.getTime() - 1).toLocaleDateString('en-IN')}`} actions={
        <form className="flex max-w-full flex-wrap items-center gap-1 rounded-3xl border border-line bg-white p-1 font-sans text-sm">
          {RANGES.map(([k, l]) => <Link key={k} href={`/admin?range=${k}`} className={`rounded-full px-3 py-1.5 ${r.key === k ? 'bg-ink font-semibold text-white' : 'hover:bg-paper'}`}>{l}</Link>)}
          <input type="hidden" name="range" value="custom" />
          <label className="sr-only" htmlFor="rf">From</label><input id="rf" type="date" name="from" defaultValue={sp.from} className="rounded-full px-2 py-1 text-[13px]" />
          <label className="sr-only" htmlFor="rt">To</label><input id="rt" type="date" name="to" defaultValue={sp.to} className="rounded-full px-2 py-1 text-[13px]" />
          <button className="rounded-full px-3 py-1.5 font-semibold hover:bg-paper">Go</button>
        </form>
      } />
      {sp.denied && <p className="mb-4 rounded-xl bg-[#FFE3E3] px-4 py-3 font-sans text-sm text-[#8A0E18]">Your role doesn’t have access to that page.</p>}
      {warnings.length > 0 && <ul className="mb-6 grid gap-2">{warnings.map(w => <li key={w} className="flex items-start gap-2 rounded-xl bg-[#FFF4D6] px-4 py-2.5 font-sans text-sm text-[#7A4B00]"><Icon name="alert" className="mt-0.5 size-4 shrink-0" />{w}</li>)}</ul>}

      {/* Sales snapshot */}
      <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-muted">Sales</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Kpi label="Orders" value={m.sales.orders} href="/admin/orders" />
        <Kpi label="Units sold" value={m.sales.units} />
        <Kpi label="Gross sales" value={formatINR(m.sales.gross)} />
        <Kpi label="Discounts" value={formatINR(m.sales.discount)} />
        <Kpi label="GST collected" value={formatINR(m.sales.gst)} />
        <Kpi label="Refunds" value={formatINR(m.sales.refunds)} />
        <Kpi label="Net sales" value={formatINR(m.sales.net)} tone="good" />
        <Kpi label="AOV" value={formatINR(m.sales.aov)} sub="Net ÷ orders" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Net sales by day">
          {m.daily.length === 0 ? <p className="py-8 text-center font-sans text-sm text-muted">No paid orders in this period.</p> : (
            <div className="flex h-44 items-end gap-1" role="img" aria-label="Daily sales chart">
              {m.daily.map(d => <div key={d.d} className="group relative flex-1"><div className="rounded-t bg-deep-current transition group-hover:bg-ultra" style={{ height: `${Math.max(3, (d.total / maxDay) * 160)}px` }} /><span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-ink px-2 py-1 font-sans text-[11px] whitespace-nowrap text-white group-hover:block">{d.d}: {formatINR(d.total)} · {d.c}</span></div>)}
            </div>
          )}
        </Panel>
        <Panel title="Order pipeline" actions={<Link href="/admin/orders" className="link text-sm">Open orders</Link>}>
          <ul className="grid grid-cols-2 gap-2 font-sans text-sm sm:grid-cols-4">
            {Object.entries(m.pipeline).map(([k, v]) => <li key={k}><Link href={`/admin/orders?status=${k}`} className="block rounded-xl bg-paper px-3 py-2.5 hover:bg-fog/60"><span className="block text-[12px] text-muted">{STATUS_LABEL[k]}</span><b className="text-lg">{v}</b></Link></li>)}
          </ul>
        </Panel>
      </div>

      {/* KPIs */}
      <h2 className="mt-8 mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-muted">Core KPIs</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Cart abandonment" value={pct(m.kpis.cartAbandonment)} sub={`${m.carts.abandoned} of ${m.carts.created} carts · ${formatINR(m.carts.abandonedValue)}`} tone={m.kpis.cartAbandonment > 0.7 ? 'warn' : undefined} />
        <Kpi label="Checkout conversion" value={pct(m.kpis.checkoutConversion)} sub={`${m.sales.orders} orders ÷ ${m.carts.checkouts} checkouts`} />
        <Kpi label="Payment success" value={pct(m.kpis.paymentSuccess)} sub={`${m.carts.success} ok · ${m.carts.failed} failed`} tone={m.carts.failed > m.carts.success ? 'bad' : undefined} href="/admin/payments" />
        <Kpi label="Cancellation rate" value={pct(m.kpis.cancellationRate)} />
        <Kpi label="Return rate (orders)" value={pct(m.kpis.returnRate)} />
        <Kpi label="Repeat customer rate" value={pct(m.kpis.repeatRate)} sub={`${m.customers.repeat} of ${m.customers.buyers} buyers`} />
        <Kpi label="Low-stock SKUs" value={`${m.kpis.lowStock} / ${m.products.filter(p => !p.buildToOrder).length}`} tone={m.kpis.lowStock ? 'warn' : 'good'} href="/admin/inventory" />
        <Kpi label="Lead-to-sale" value={pct(m.kpis.leadToSale)} sub={`${m.enquiries.converted} converted ÷ ${m.enquiries.qualified} qualified`} href="/admin/enquiries" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title="Product snapshot" actions={<Link href="/admin/products" className="link text-sm">Products</Link>}>
          <TableWrap>
            <thead><tr><th>SKU</th><th className="text-right">Units</th><th className="text-right">Sales</th><th className="text-right">Enquiries</th><th className="text-right">Available</th><th>Stock</th></tr></thead>
            <tbody>{m.products.map(p => <tr key={p.slug}><td className="font-semibold">{p.name}{p.saleMode === 'enquiry' && <span className="ml-1 text-[11px] font-normal text-muted">(enquiry-led)</span>}</td><td className="text-right">{p.units}</td><td className="text-right">{formatINR(p.sales)}</td><td className="text-right">{p.enquiries}</td><td className="text-right">{p.buildToOrder ? '—' : `${p.available} (${p.reserved} held)`}</td><td><Status value={p.state} /></td></tr>)}</tbody>
          </TableWrap>
        </Panel>
        <Panel title="Cart, checkout and payments">
          <dl className="grid grid-cols-2 gap-4 font-sans text-sm sm:grid-cols-3">
            {[['Carts created', m.carts.created], ['Abandoned carts', m.carts.abandoned], ['Checkouts started', m.carts.checkouts], ['Payment attempts', m.carts.attempts], ['Successful', m.carts.success], ['Failed', m.carts.failed]].map(([k, v]) => <div key={k as string}><dt className="text-muted">{k}</dt><dd className="text-xl font-bold">{v}</dd></div>)}
          </dl>
          {m.carts.failReasons.length > 0 && <div className="mt-5"><p className="font-sans text-[12px] font-semibold uppercase tracking-wider text-muted">Top failure reasons</p><ul className="mt-2 space-y-1 font-sans text-sm">{m.carts.failReasons.map(f => <li key={f.reason} className="flex justify-between"><span>{f.reason}</span><b>{Number(f.c)}</b></li>)}</ul></div>}
        </Panel>
        <Panel title="Customers" actions={<Link href="/admin/customers" className="link text-sm">Customers</Link>}>
          <dl className="grid grid-cols-2 gap-4 font-sans text-sm sm:grid-cols-4">
            {[['New', m.customers.new], ['Repeat', m.customers.repeat], ['Total', m.customers.total], ['Total spend', formatINR(m.customers.spend)]].map(([k, v]) => <div key={k as string}><dt className="text-muted">{k}</dt><dd className="text-xl font-bold">{v}</dd></div>)}
          </dl>
        </Panel>
        <Panel title="Water testing and enquiries" actions={<Link href="/admin/enquiries" className="link text-sm">CRM</Link>}>
          <dl className="grid grid-cols-2 gap-4 font-sans text-sm sm:grid-cols-4">
            {[['Tests booked', m.enquiries.tests.booked], ['Tests completed', m.enquiries.tests.completed], ['Tests → orders', m.enquiries.tests.converted], ['Open enquiries', m.enquiries.open]].map(([k, v]) => <div key={k as string}><dt className="text-muted">{k}</dt><dd className="text-xl font-bold">{v}</dd></div>)}
          </dl>
          <ul className="mt-5 flex flex-wrap gap-2 font-sans text-[13px]">{Object.entries(m.enquiries.byType).filter(([, v]) => v).map(([k, v]) => <li key={k}><Link href={`/admin/enquiries?type=${k}`} className="pill hover:border-deep-current">{ENQUIRY_LABEL[k as keyof typeof ENQUIRY_LABEL]} <b>{v}</b></Link></li>)}</ul>
        </Panel>
        <Panel title="Post-purchase" actions={<Link href="/admin/service" className="link text-sm">Service</Link>}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Kpi label="Installations to do" value={m.post.instPending} tone={m.post.instPending ? 'warn' : undefined} href="/admin/service?tab=installations" />
            <Kpi label="Installed (period)" value={m.post.instDone} />
            <Kpi label="Active warranties" value={m.post.warrActive} href="/admin/service?tab=warranties" />
            <Kpi label="Open service tickets" value={m.post.ticketsOpen} tone={m.post.ticketsOpen ? 'warn' : undefined} href="/admin/service" />
            <Kpi label="Reviews to moderate" value={m.post.reviewsPending} href="/admin/reviews" />
            <Kpi label="Service rating" value={m.post.avgRating ? `${m.post.avgRating.toFixed(1)} / 5` : '—'} />
          </div>
        </Panel>
        <Panel title="Needs attention">
          <ul className="grid gap-2 font-sans text-sm">
            {[[`${m.pipeline.confirmed + m.pipeline.processing} orders to pack and ship`, '/admin/orders?status=confirmed', m.pipeline.confirmed + m.pipeline.processing],
              [`${m.pipeline.pending_payment} orders awaiting payment`, '/admin/orders?status=pending_payment', m.pipeline.pending_payment],
              [`${m.post.returnsOpen} open returns`, '/admin/orders?returns=1', m.post.returnsOpen],
              [`${m.post.exceptionsOpen} delivery exceptions`, '/admin/orders?exceptions=1', m.post.exceptionsOpen],
              [`${m.post.shipDelayed} delayed / RTO shipments`, '/admin/orders?status=shipped', m.post.shipDelayed],
              [`${m.post.refundsPending} refunds pending`, '/admin/payments?tab=refunds', m.post.refundsPending]].map(([l, h, v]) => (
              <li key={l as string}><Link href={h as string} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${Number(v) ? 'bg-[#FFF4D6]' : 'bg-paper text-muted'}`}><span>{l}</span><Icon name="chevron" className="size-4" /></Link></li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Latest orders" className="mt-8" actions={<Link href="/admin/orders" className="link text-sm">All orders</Link>}>
        <TableWrap>
          <thead><tr><th>Order</th><th>Customer</th><th>Created</th><th>Status</th><th>Payment</th><th className="text-right">Total</th></tr></thead>
          <tbody>{recent.map(o => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`} className="link">{o.number}</Link></td><td>{o.contactName}</td><td>{dt(o.createdAt)}</td><td><Status value={o.status} /></td><td><Status value={o.paymentStatus} /></td><td className="text-right font-semibold">{formatINR(o.total)}</td></tr>)}</tbody>
        </TableWrap>
      </Panel>
      <p className="mt-4 font-sans text-[12px] text-muted">Definitions follow the DVINE requirements: orders = confirmed (paid) orders placed in the period; net sales = order totals minus refunds; abandonment uses the inactivity window in Settings. {humanize('in_stock')} thresholds come from each product’s reorder level.</p>
    </>
  );
}

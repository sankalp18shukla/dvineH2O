import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderEvents, refunds, payments } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { can } from '@/lib/session';
import { formatINR } from '@/lib/money';
import { TRANSITIONS, STATUS_LABEL } from '@/lib/orders';
import { shiprocketEnabled } from '@/lib/shiprocket';
import { PageHead, Panel, TableWrap, dt } from '@/components/admin/ui';
import { AdminForm } from '@/components/admin/AdminForm';
import { Status } from '@/components/ui/Status';
import { SubmitButton } from '@/components/forms/SubmitButton';
import {
  changeOrderStatus, saveOrderNote, issueRefund, createShipment, updateShipment, assignSerials, updateInstallation, updateReturn, resolveException, addException,
} from '@/app/actions/admin';

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireStaff('orders');
  const id = Number((await params).id);
  const o = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { customer: true, items: { with: { product: true } }, payments: { orderBy: desc(payments.createdAt) }, shipments: true, invoices: true, refunds: { orderBy: desc(refunds.initiatedAt) }, returns: true, exceptions: true, installations: true, events: { orderBy: desc(orderEvents.createdAt) } },
  });
  if (!o) notFound();
  const write = can(s.role, 'ordersWrite');
  const next = TRANSITIONS[o.status].filter(t => !(t === 'shipped' && !o.shipments.length));
  const paid = o.payments.find(p => p.status === 'success');
  const refunded = o.refunds.filter(r => r.status !== 'failed').reduce((t, r) => t + r.amount, 0);
  const ship = o.shipments[0];
  const inv = o.invoices.find(i => i.kind === 'invoice');
  const sel = 'input min-h-10 text-sm';
  return (
    <>
      <PageHead back={{ href: '/admin/orders', label: 'Orders' }} title={o.number} sub={<>Created {dt(o.createdAt)}{o.placedAt ? ` · paid ${dt(o.placedAt)}` : ''}</>}
        actions={<>{inv && <a href={`/invoice/${o.number}`} target="_blank" className="btn btn-outline btn-sm">Invoice {inv.number}</a>}<a href={`/order/${o.number}?t=${o.accessToken}`} target="_blank" className="btn btn-outline btn-sm">Customer view</a></>} />
      <div className="mb-6 flex flex-wrap gap-2"><Status value={o.status} /><Status value={o.paymentStatus} />{o.couponCode && <span className="badge bg-paper">Coupon {o.couponCode}</span>}{o.referralCode && <span className="badge bg-paper">Referral {o.referralCode}</span>}</div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-6">
          <Panel title="Items">
            <TableWrap>
              <thead><tr><th>Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Discount</th><th className="text-right">GST</th><th className="text-right">Total</th></tr></thead>
              <tbody>{o.items.map(i => (
                <tr key={i.id}><td><b>{i.name}</b><span className="block text-[12px] text-muted">{i.sku} · HSN {i.hsn ?? '—'}</span>
                  {i.product.trackSerials && o.paymentStatus === 'paid' && (
                    <AdminForm action={assignSerials} className="mt-2 flex flex-wrap gap-2"><><input type="hidden" name="itemId" value={i.id} /><input name="serials" defaultValue={(i.serials ?? []).join(', ')} placeholder={`${i.qty} serial no.`} className="input min-h-9 w-56 text-[13px]" aria-label="Serial numbers" />{write && <SubmitButton className="btn btn-outline btn-sm min-h-9" pendingLabel="Saving">Save serials</SubmitButton>}</></AdminForm>
                  )}
                </td><td className="text-right">{i.qty}</td><td className="text-right">{formatINR(i.unitPrice)}</td><td className="text-right">{i.discount ? `−${formatINR(i.discount)}` : '—'}</td><td className="text-right">{formatINR(i.taxAmount, true)}<span className="block text-[11px] text-muted">{i.taxRate / 100}%</span></td><td className="text-right font-semibold">{formatINR(i.lineTotal)}</td></tr>
              ))}</tbody>
            </TableWrap>
            <dl className="mt-4 ml-auto max-w-xs space-y-1 font-sans text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>−{formatINR(o.discount)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{formatINR(o.shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">GST (incl.)</dt><dd>{formatINR(o.taxTotal, true)}</dd></div>
              <div className="flex justify-between border-t border-line pt-1 text-base font-bold"><dt>Total</dt><dd>{formatINR(o.total)}</dd></div>
              {refunded > 0 && <div className="flex justify-between text-[#A1101B]"><dt>Refunded</dt><dd>−{formatINR(refunded)}</dd></div>}
            </dl>
          </Panel>

          <Panel title="Fulfilment">
            {write && next.length > 0 && (
              <AdminForm action={changeOrderStatus} className="mb-5 flex flex-wrap items-end gap-2" confirm="Change the order status?">
                <>
                  <input type="hidden" name="orderId" value={o.id} />
                  <div className="field"><label className="label text-[12px]" htmlFor="ns">Move to</label><select id="ns" name="status" className={`${sel} w-44`}>{next.map(t => <option key={t} value={t}>{STATUS_LABEL[t]}</option>)}</select></div>
                  <div className="field flex-1"><label className="label text-[12px]" htmlFor="nn">Note (shown in history)</label><input id="nn" name="note" className={sel} /></div>
                  <SubmitButton className="btn btn-primary btn-sm min-h-10" pendingLabel="Updating">Update status</SubmitButton>
                </>
              </AdminForm>
            )}
            {!ship && o.paymentStatus === 'paid' && write && ['confirmed', 'processing', 'packed'].includes(o.status) && (
              <div className="grid gap-4 md:grid-cols-2">
                <AdminForm action={createShipment} className="grid gap-2 rounded-xl border border-line p-4">
                  <><p className="font-sans text-sm font-semibold">Ship with Shiprocket</p><input type="hidden" name="orderId" value={o.id} /><input type="hidden" name="mode" value="shiprocket" />
                    <div className="grid grid-cols-4 gap-2">{[['length', 'L cm', 30], ['breadth', 'B cm', 30], ['height', 'H cm', 30], ['weight', 'kg', o.items.some(i => i.sku.includes('CRY')) ? 18 : 1]].map(([n, l, d]) => <div key={n as string} className="field"><label className="label text-[11px]" htmlFor={`d-${n}`}>{l}</label><input id={`d-${n}`} name={n as string} defaultValue={d as number} className={sel} inputMode="decimal" /></div>)}</div>
                    <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Pushing">{shiprocketEnabled() ? 'Push order & get AWB' : 'Shiprocket not configured'}</SubmitButton></>
                </AdminForm>
                <AdminForm action={createShipment} className="grid gap-2 rounded-xl border border-line p-4">
                  <><p className="font-sans text-sm font-semibold">Manual shipment</p><input type="hidden" name="orderId" value={o.id} /><input type="hidden" name="mode" value="manual" />
                    <input name="courier" placeholder="Courier" className={sel} aria-label="Courier" /><input name="awb" placeholder="AWB / tracking no." className={sel} aria-label="AWB" /><input name="trackingUrl" placeholder="Tracking link (optional)" className={sel} aria-label="Tracking link" />
                    <SubmitButton className="btn btn-outline btn-sm" pendingLabel="Saving">Create shipment</SubmitButton></>
                </AdminForm>
              </div>
            )}
            {ship && (
              <div className="rounded-xl border border-line p-4 font-sans text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2"><p><b>{ship.provider === 'shiprocket' ? 'Shiprocket' : 'Manual'}</b> · {ship.courier ?? 'courier pending'} · AWB {ship.awb ?? '—'}</p><Status value={ship.status} /></div>
                {ship.trackingUrl && <a href={ship.trackingUrl} target="_blank" rel="noopener noreferrer" className="link mt-1 inline-block">Tracking link</a>}
                {write && (
                  <AdminForm action={updateShipment} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                    <><input type="hidden" name="shipmentId" value={ship.id} />
                      <select name="status" defaultValue={ship.status} className={sel} aria-label="Shipment status">{['pending', 'in_transit', 'delivered', 'delayed', 'rto', 'exception'].map(x => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}</select>
                      <input name="awb" defaultValue={ship.awb ?? ''} placeholder="AWB" className={sel} aria-label="AWB" />
                      <input name="eventNote" placeholder="Event note" className={sel} aria-label="Event note" />
                      <SubmitButton className="btn btn-outline btn-sm min-h-10" pendingLabel="Saving">Update</SubmitButton></>
                  </AdminForm>
                )}
                {write && ship.provider === 'shiprocket' && ship.awb && <AdminForm action={updateShipment} className="mt-2"><><input type="hidden" name="shipmentId" value={ship.id} /><input type="hidden" name="action" value="refresh" /><SubmitButton className="btn btn-ghost btn-sm" pendingLabel="Refreshing">Refresh tracking from Shiprocket</SubmitButton></></AdminForm>}
                {!!ship.events?.length && <ol className="mt-3 space-y-1 border-l-2 border-line pl-3 text-[13px]">{ship.events.slice().reverse().slice(0, 8).map((e, k) => <li key={k}><b>{e.status}</b>{e.location ? ` · ${e.location}` : ''} <span className="text-muted">{new Date(e.at).toLocaleString('en-IN')}</span></li>)}</ol>}
              </div>
            )}
            {o.installations.map(inst => (
              <AdminForm key={inst.id} action={updateInstallation} className="mt-4 grid gap-2 rounded-xl border border-line p-4 sm:grid-cols-2">
                <><p className="font-sans text-sm font-semibold sm:col-span-2">Installation <Status value={inst.status} /></p><input type="hidden" name="installationId" value={inst.id} />
                  <select name="status" defaultValue={inst.status} className={sel} aria-label="Installation status">{['pending', 'scheduled', 'completed', 'cancelled'].map(x => <option key={x}>{x}</option>)}</select>
                  <input type="datetime-local" name="scheduledAt" defaultValue={inst.scheduledAt ? new Date(inst.scheduledAt.getTime() - inst.scheduledAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} className={sel} aria-label="Scheduled for" />
                  <input name="technician" defaultValue={inst.technician ?? ''} placeholder="Technician" className={sel} aria-label="Technician" />
                  <input name="notes" defaultValue={inst.notes ?? ''} placeholder="Notes" className={sel} aria-label="Notes" />
                  <div className="sm:col-span-2"><SubmitButton className="btn btn-outline btn-sm" pendingLabel="Saving">Save installation</SubmitButton></div></>
              </AdminForm>
            ))}
          </Panel>

          {(o.returns.length > 0 || o.exceptions.length > 0 || write) && (
            <Panel title="Returns and exceptions">
              {o.returns.map(r => (
                <AdminForm key={r.id} action={updateReturn} className="mb-3 flex flex-wrap items-end gap-2 rounded-xl bg-paper p-3">
                  <><input type="hidden" name="returnId" value={r.id} /><p className="w-full font-sans text-sm"><b>Return</b> · {r.reason} <Status value={r.status} /></p>
                    <select name="status" defaultValue={r.status} className={`${sel} w-40`} aria-label="Return status">{['requested', 'approved', 'received', 'rejected', 'refunded'].map(x => <option key={x}>{x}</option>)}</select>
                    <input name="note" defaultValue={r.note ?? ''} placeholder="Note" className={`${sel} flex-1`} aria-label="Note" /><SubmitButton className="btn btn-outline btn-sm min-h-10">Save</SubmitButton></>
                </AdminForm>
              ))}
              {o.exceptions.map(e => (
                <AdminForm key={e.id} action={resolveException} className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-paper p-3">
                  <><input type="hidden" name="exceptionId" value={e.id} /><p className="flex-1 font-sans text-sm"><b>{e.type.replace('_', ' ')}</b> · {e.note} <Status value={e.status} /></p>{e.status === 'open' && <><input name="note" placeholder="Resolution" className={`${sel} w-48`} aria-label="Resolution" /><SubmitButton className="btn btn-outline btn-sm min-h-10">Resolve</SubmitButton></>}</>
                </AdminForm>
              ))}
              {write && <AdminForm action={addException} className="flex flex-wrap items-end gap-2"><><input type="hidden" name="orderId" value={o.id} /><select name="type" className={`${sel} w-44`} aria-label="Exception type"><option value="delivery_failure">Delivery failure</option><option value="damaged">Damaged product</option><option value="address_issue">Address issue</option><option value="other">Other</option></select><input name="note" placeholder="Details" className={`${sel} flex-1`} aria-label="Details" /><SubmitButton className="btn btn-ghost btn-sm min-h-10">Log exception</SubmitButton></></AdminForm>}
            </Panel>
          )}

          <Panel title="History">
            <ol className="space-y-2 font-sans text-sm">{o.events.map(e => <li key={e.id} className="flex gap-4"><span className="w-36 shrink-0 text-muted">{dt(e.createdAt)}</span><span><b>{e.status.replace(/_/g, ' ')}</b>{e.note ? ` — ${e.note}` : ''} <span className="text-muted">({e.actor})</span></span></li>)}</ol>
          </Panel>
        </div>

        <div className="grid h-fit min-w-0 gap-6">
          <Panel title="Customer">
            <div className="font-sans text-sm">
              <Link href={`/admin/customers/${o.customerId}`} className="link text-base">{o.contactName}</Link>
              <p className="mt-1">{o.contactEmail}<br />{o.contactPhone}</p>
              <p className="mt-3 font-semibold">Ship to</p><p className="text-muted">{o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}<br />{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.pincode}</p>
              <p className="mt-3 font-semibold">Bill to</p><p className="text-muted">{o.billingAddress.name}{o.billingAddress.gstin ? ` · GSTIN ${o.billingAddress.gstin}` : ''}<br />{o.billingAddress.city}, {o.billingAddress.state}</p>
              {o.customerNote && <><p className="mt-3 font-semibold">Customer note</p><p className="text-muted">{o.customerNote}</p></>}
            </div>
          </Panel>
          <Panel title="Payments">
            <ul className="space-y-2 font-sans text-sm">{o.payments.map(p => <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2"><span>#{p.attempt} · {p.gateway}{p.method ? ` · ${p.method}` : ''}<span className="block text-[12px] text-muted">{p.gatewayPaymentId ?? p.gatewayOrderId}{p.errorDescription ? ` · ${p.errorDescription}` : ''}</span></span><span className="flex items-center gap-2"><Status value={p.status} /><b>{formatINR(p.amount)}</b></span></li>)}{!o.payments.length && <li className="text-muted">No payment attempts yet.</li>}</ul>
            {paid && can(s.role, 'refunds') && refunded < paid.amount && (
              <AdminForm action={issueRefund} className="mt-4 grid gap-2 border-t border-line pt-4" confirm="Issue this refund through the payment gateway?">
                <><p className="font-sans text-sm font-semibold">Refund</p><input type="hidden" name="orderId" value={o.id} />
                  <div className="flex gap-2"><input name="amount" defaultValue={((paid.amount - refunded) / 100).toFixed(2)} inputMode="decimal" className={`${sel} w-32`} aria-label="Amount in rupees" /><input name="reason" placeholder="Reason" className={`${sel} flex-1`} aria-label="Reason" required /></div>
                  <SubmitButton className="btn btn-red btn-sm" pendingLabel="Refunding">Refund via {paid.gateway === 'razorpay' ? 'Razorpay' : 'test gateway'}</SubmitButton>
                  <p className="font-sans text-[12px] text-muted">A GST credit note is issued automatically. To cancel and refund in full, use “Move to Cancelled”.</p></>
              </AdminForm>
            )}
            {o.refunds.length > 0 && <ul className="mt-3 space-y-1 font-sans text-sm">{o.refunds.map(r => <li key={r.id} className="flex justify-between"><span>Refund {formatINR(r.amount)} · {r.reason}</span><Status value={r.status} /></li>)}</ul>}
            {o.invoices.filter(i => i.kind === 'credit_note').map(cn => <a key={cn.id} href={`/invoice/${o.number}?cn=${encodeURIComponent(cn.number)}`} target="_blank" className="link mt-2 block font-sans text-sm">Credit note {cn.number}</a>)}
          </Panel>
          <Panel title="Internal note">
            <AdminForm action={saveOrderNote}><><input type="hidden" name="orderId" value={o.id} /><textarea name="internalNote" defaultValue={o.internalNote ?? ''} rows={4} className="input text-sm" aria-label="Internal note" /><SubmitButton className="btn btn-outline btn-sm justify-self-start" pendingLabel="Saving">Save note</SubmitButton></></AdminForm>
          </Panel>
        </div>
      </div>
    </>
  );
}


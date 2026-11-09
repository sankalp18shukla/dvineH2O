import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { enquiries, enquiryNotes, reportUploads, staff, orders, products, ENQUIRY_STATUSES, INTERESTS } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { ENQUIRY_LABEL, INTEREST_LABEL } from '@/lib/enquiries';
import type { ChatMsg } from '@/lib/chatbot';
import { PageHead, Panel, dt } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status, humanize } from '@/components/ui/Status';
import { AutoRefresh } from '@/components/admin/AutoRefresh';
import { updateEnquiry, replyToChat, createPaymentLink } from '@/app/actions/admin';
import { CopyButton } from '@/components/CopyButton';
import { INDIAN_STATES } from '@/lib/gst';
import { formatINR } from '@/lib/money';
import { links } from '@/lib/notify';
import { STATUS_LABEL } from '@/lib/orders';

const LABELS: Record<string, string> = { setting: 'Setting', locations: 'Locations', users: 'Daily users', peak: 'Peak time', waterSource: 'Source water', timeline: 'Timeline', quantity: 'Quantity', demoMode: 'Demo format', territory: 'Territory', gstin: 'GSTIN', test: 'Test', sampleType: 'Sample', testDate: 'Report date' };

export default async function Enquiry({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('enquiries');
  const id = Number((await params).id);
  const e = await db.query.enquiries.findFirst({ where: eq(enquiries.id, id), with: { customer: true, notes: { orderBy: asc(enquiryNotes.createdAt) } } });
  if (!e) notFound();
  const [team, files, catalog, linked] = await Promise.all([
    db.query.staff.findMany({ where: eq(staff.active, true) }),
    db.query.reportUploads.findMany({ where: eq(reportUploads.enquiryId, id) }),
    db.query.products.findMany({ where: eq(products.status, 'active') }),
    e.outcomeRef ? db.query.orders.findFirst({ where: eq(orders.number, e.outcomeRef) }) : Promise.resolve(undefined),
  ]);
  const defaultProduct = catalog.find(p => p.slug.includes(e.productInterest)) ?? catalog.find(p => p.saleMode === 'enquiry') ?? catalog[0];
  const linkOpen = linked && linked.paymentStatus !== 'paid' && linked.status === 'pending_payment';
  const data = (e.data ?? {}) as Record<string, unknown> & { transcript?: ChatMsg[] };
  const extra = Object.entries(data).filter(([k, v]) => LABELS[k] && v);
  const sel = 'input min-h-10 text-sm';
  const wa = e.phone ? `https://wa.me/91${e.phone}?text=${encodeURIComponent(`Hi ${e.name.split(' ')[0]}, this is DVINE H2O about your enquiry ${e.ref}.`)}` : null;
  return (
    <>
      <PageHead back={{ href: '/admin/enquiries', label: 'Enquiries' }} title={`${e.ref} · ${ENQUIRY_LABEL[e.type]}`} sub={`Received ${dt(e.createdAt)} from ${e.source ?? 'website'}`}
        actions={<>{e.phone && <a href={`tel:${e.phone}`} className="btn btn-outline btn-sm">Call</a>}{wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">WhatsApp</a>}{e.email && <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Your DVINE H2O enquiry ${e.ref}`)}`} className="btn btn-outline btn-sm">Email</a>}</>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <Panel title="Details">
            <dl className="grid gap-4 font-sans text-sm sm:grid-cols-3">
              <div><dt className="text-muted">Name</dt><dd className="font-semibold">{e.customerId ? <Link href={`/admin/customers/${e.customerId}`} className="link">{e.name}</Link> : e.name}</dd></div>
              <div><dt className="text-muted">Phone</dt><dd>{e.phone ?? '—'}</dd></div>
              <div><dt className="text-muted">Email</dt><dd>{e.email ?? '—'}</dd></div>
              <div><dt className="text-muted">Company</dt><dd>{e.company ?? '—'}</dd></div>
              <div><dt className="text-muted">City / pincode</dt><dd>{[e.city, e.pincode].filter(Boolean).join(' · ') || '—'}</dd></div>
              <div><dt className="text-muted">Preferred time</dt><dd>{e.preferredAt ?? '—'}</dd></div>
              {extra.map(([k, v]) => <div key={k}><dt className="text-muted">{LABELS[k]}</dt><dd>{String(v)}</dd></div>)}
            </dl>
            {e.message && e.type !== 'chat' && <p className="mt-5 rounded-xl bg-paper p-4 font-sans text-sm whitespace-pre-line">{e.message}</p>}
            {files.map(f => <a key={f.id} href={`/api/admin/files/${f.id}`} target="_blank" className="btn btn-outline btn-sm mt-4">Open uploaded file: {f.fileName}</a>)}
          </Panel>

          {e.type === 'chat' && data.transcript && (
            <Panel title="Live chat" actions={<AutoRefresh seconds={8} />}>
              <ol className="max-h-[460px] space-y-2 overflow-y-auto rounded-xl bg-paper p-3 font-sans text-sm">
                {data.transcript.map((m, i) => <li key={i} className={`flex ${m.from === 'user' ? 'justify-start' : 'justify-end'}`}><span className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.from === 'user' ? 'bg-white' : m.from === 'agent' ? 'bg-deep-current text-white' : 'bg-[#E8E4FF]'}`}><span className="block text-[10px] font-semibold uppercase opacity-70">{m.from === 'user' ? e.name : m.from === 'agent' ? 'DVINE team' : 'Assistant'} · {m.at ? new Date(m.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ''}</span>{m.text}</span></li>)}
              </ol>
              <AdminForm action={replyToChat} className="mt-3 flex gap-2" reset><input type="hidden" name="id" value={e.id} /><input name="text" className="input flex-1 text-sm" placeholder="Reply to the customer" aria-label="Reply" autoComplete="off" /><SubmitButton className="btn btn-primary btn-sm min-h-12" pendingLabel="Sending">Send</SubmitButton><AdminError name="text" /></AdminForm>
              <p className="mt-2 font-sans text-[12px] text-muted">The customer sees replies in their chat window while it’s open. Otherwise call them on {e.phone}.</p>
            </Panel>
          )}

          <Panel title="Notes">
            {e.notes.length === 0 ? <p className="font-sans text-sm text-muted">No notes yet.</p> : <ol className="space-y-3 font-sans text-sm">{e.notes.map(n => <li key={n.id} className="rounded-xl bg-paper p-3"><span className="text-[12px] text-muted">{dt(n.createdAt)} · {team.find(t => t.id === n.staffId)?.name ?? 'staff'}</span><p className="mt-1 whitespace-pre-line">{n.note}</p></li>)}</ol>}
          </Panel>
        </div>

        <div className="grid content-start gap-6">
        <Panel title="Pipeline">
          <AdminForm action={updateEnquiry}>
            <input type="hidden" name="id" value={e.id} />
            <div className="flex gap-2"><Status value={e.status} /><Status value={e.quoteStatus} label={`Quote: ${humanize(e.quoteStatus)}`} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="field"><label className="label text-[12px]" htmlFor="st">Stage</label><select id="st" name="status" defaultValue={e.status} className={sel}>{ENQUIRY_STATUSES.map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select></div>
              <div className="field"><label className="label text-[12px]" htmlFor="as">Owner</label><select id="as" name="assignedTo" defaultValue={e.assignedTo ?? ''} className={sel}><option value="">Unassigned</option>{team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div className="field"><label className="label text-[12px]" htmlFor="pi">Product interest</label><select id="pi" name="productInterest" defaultValue={e.productInterest} className={sel}>{INTERESTS.map(i => <option key={i} value={i}>{INTEREST_LABEL[i]}</option>)}</select></div>
              <div className="field"><label className="label text-[12px]" htmlFor="qs">Quote status</label><select id="qs" name="quoteStatus" defaultValue={e.quoteStatus} className={sel}>{['none', 'draft', 'sent', 'accepted', 'declined'].map(q => <option key={q} value={q}>{humanize(q)}</option>)}</select></div>
              <div className="field"><label className="label text-[12px]" htmlFor="qv">Quote value (₹)</label><input id="qv" name="quoteValue" inputMode="decimal" defaultValue={e.quoteValue ? (e.quoteValue / 100).toFixed(0) : ''} className={sel} /></div>
              <div className="field"><label className="label text-[12px]" htmlFor="op">Converted product</label><input id="op" name="outcomeProduct" defaultValue={e.outcomeProduct ?? ''} className={sel} /></div>
              <div className="field sm:col-span-2"><label className="label text-[12px]" htmlFor="or">Order / quote reference</label><input id="or" name="outcomeRef" defaultValue={e.outcomeRef ?? ''} className={sel} /></div>
            </div>
            <div className="field"><label className="label text-[12px]" htmlFor="nt">Add note</label><textarea id="nt" name="note" rows={3} className="input text-sm" placeholder="Call summary, next step…" /></div>
            <SubmitButton className="btn btn-primary btn-sm justify-self-start">Save</SubmitButton>
          </AdminForm>
        </Panel>

        <Panel title="Payment link">
          {linked && (
            <div className="mb-4 grid gap-2 rounded-xl bg-paper p-3 font-sans text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/orders/${linked.id}`} className="link font-semibold">{linked.number}</Link>
                <span className="flex items-center gap-2"><Status value={linked.paymentStatus === 'paid' ? 'paid' : linked.status} label={linked.paymentStatus === 'paid' ? 'Paid' : STATUS_LABEL[linked.status]} /><b>{formatINR(linked.total)}</b></span>
              </div>
              {linkOpen && <>
                <input readOnly value={links.pay(linked.number, linked.accessToken)} className="input min-h-9 font-mono text-[12px]" aria-label="Payment link" />
                <div className="flex flex-wrap items-center gap-2"><CopyButton text={links.pay(linked.number, linked.accessToken)} label="Copy link" />{e.phone && <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/91${e.phone}?text=${encodeURIComponent(`Hi ${e.name.split(' ')[0]}, here is the secure payment link for your DVINE H2O order ${linked.number} (${formatINR(linked.total)}): ${links.pay(linked.number, linked.accessToken)}`)}`}>Send on WhatsApp</a>}<span className="text-[12px] text-muted">Valid until {dt(linked.reservationExpiresAt)}</span></div>
              </>}
            </div>
          )}
          {!linkOpen && (linked?.paymentStatus === 'paid' ? <p className="font-sans text-sm text-muted">This quote has been paid. Manage delivery and installation from the order.</p> : (
            <AdminForm action={createPaymentLink} className="grid gap-3" confirm="Create an order and payment link for this quote?">
              <p className="font-sans text-[13px] text-muted">For quote-led sales (Titan, bulk). Creates an order at the agreed price; the customer pays online and the invoice, warranty and installation follow automatically.</p>
              <input type="hidden" name="id" value={e.id} />
              <div className="grid gap-3 sm:grid-cols-[1fr_80px]">
                <div className="field"><label className="label text-[12px]" htmlFor="pl-p">Product</label><select id="pl-p" name="productId" defaultValue={defaultProduct?.id} className={sel}>{catalog.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}</select></div>
                <div className="field"><label className="label text-[12px]" htmlFor="pl-q">Qty</label><input id="pl-q" name="qty" type="number" min={1} defaultValue={Number(data.quantity) || 1} className={sel} /></div>
              </div>
              <div className="field"><label className="label text-[12px]" htmlFor="pl-a">Agreed total, GST included (₹)</label><input id="pl-a" name="amount" inputMode="decimal" defaultValue={e.quoteValue ? (e.quoteValue / 100).toFixed(0) : ''} className={sel} /><AdminError name="amount" /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="field"><label className="label text-[12px]" htmlFor="pl-n">Customer name</label><input id="pl-n" name="name" defaultValue={e.company ? `${e.name}` : e.name} className={sel} /><AdminError name="name" /></div>
                <div className="field"><label className="label text-[12px]" htmlFor="pl-ph">Mobile</label><input id="pl-ph" name="phone" inputMode="tel" defaultValue={e.phone ?? ''} className={sel} /><AdminError name="phone" /></div>
                <div className="field sm:col-span-2"><label className="label text-[12px]" htmlFor="pl-e">Email</label><input id="pl-e" name="email" type="email" defaultValue={e.email ?? ''} className={sel} /><AdminError name="email" /></div>
                <div className="field sm:col-span-2"><label className="label text-[12px]" htmlFor="pl-l1">Delivery / installation address</label><input id="pl-l1" name="line1" className={sel} placeholder="Building, street" /><AdminError name="line1" /></div>
                <div className="field sm:col-span-2"><input aria-label="Address line 2" name="line2" className={sel} placeholder="Area, landmark (optional)" /></div>
                <div className="field"><label className="label text-[12px]" htmlFor="pl-c">City</label><input id="pl-c" name="city" defaultValue={e.city ?? ''} className={sel} /><AdminError name="city" /></div>
                <div className="field"><label className="label text-[12px]" htmlFor="pl-pin">Pincode</label><input id="pl-pin" name="pincode" inputMode="numeric" defaultValue={e.pincode ?? ''} className={sel} /><AdminError name="pincode" /></div>
                <div className="field"><label className="label text-[12px]" htmlFor="pl-s">State</label><select id="pl-s" name="state" defaultValue="" className={sel}><option value="" disabled>Choose</option>{INDIAN_STATES.map(st => <option key={st}>{st}</option>)}</select><AdminError name="state" /></div>
                <div className="field"><label className="label text-[12px]" htmlFor="pl-g">GSTIN (optional)</label><input id="pl-g" name="gstin" defaultValue={typeof data.gstin === 'string' ? data.gstin : ''} className={sel} /><AdminError name="gstin" /></div>
                <div className="field"><label className="label text-[12px]" htmlFor="pl-v">Link valid for (days)</label><input id="pl-v" name="validDays" type="number" min={1} max={30} defaultValue={7} className={sel} /></div>
              </div>
              <div className="field"><label className="label text-[12px]" htmlFor="pl-nt">Internal note (optional)</label><input id="pl-nt" name="note" className={sel} placeholder="Site visit done, 2 units for 3rd floor pantry…" /></div>
              <label className="flex items-center gap-2 font-sans text-sm"><input type="checkbox" name="send" defaultChecked /> Email / WhatsApp the link to the customer</label>
              <SubmitButton className="btn btn-primary btn-sm justify-self-start" pendingLabel="Creating">Create payment link</SubmitButton>
            </AdminForm>
          ))}
        </Panel>
        </div>
      </div>
    </>
  );
}

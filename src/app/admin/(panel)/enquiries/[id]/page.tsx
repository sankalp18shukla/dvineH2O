import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { enquiries, enquiryNotes, reportUploads, staff, ENQUIRY_STATUSES, INTERESTS } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { ENQUIRY_LABEL, INTEREST_LABEL } from '@/lib/enquiries';
import type { ChatMsg } from '@/lib/chatbot';
import { PageHead, Panel, dt } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status, humanize } from '@/components/ui/Status';
import { AutoRefresh } from '@/components/admin/AutoRefresh';
import { updateEnquiry, replyToChat } from '@/app/actions/admin';

const LABELS: Record<string, string> = { setting: 'Setting', locations: 'Locations', users: 'Daily users', peak: 'Peak time', waterSource: 'Source water', timeline: 'Timeline', quantity: 'Quantity', demoMode: 'Demo format', territory: 'Territory', gstin: 'GSTIN', test: 'Test', sampleType: 'Sample', testDate: 'Report date' };

export default async function Enquiry({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('enquiries');
  const id = Number((await params).id);
  const e = await db.query.enquiries.findFirst({ where: eq(enquiries.id, id), with: { customer: true, notes: { orderBy: asc(enquiryNotes.createdAt) } } });
  if (!e) notFound();
  const [team, files] = await Promise.all([db.query.staff.findMany({ where: eq(staff.active, true) }), db.query.reportUploads.findMany({ where: eq(reportUploads.enquiryId, id) })]);
  const data = (e.data ?? {}) as Record<string, unknown> & { transcript?: ChatMsg[] };
  const extra = Object.entries(data).filter(([k, v]) => LABELS[k] && v);
  const sel = 'input min-h-10 text-sm';
  const wa = e.phone ? `https://wa.me/91${e.phone}?text=${encodeURIComponent(`Hi ${e.name.split(' ')[0]}, this is DVINE H2O about your enquiry ${e.ref}.`)}` : null;
  return (
    <>
      <PageHead back={{ href: '/admin/enquiries', label: 'Enquiries' }} title={`${e.ref} · ${ENQUIRY_LABEL[e.type]}`} sub={`Received ${dt(e.createdAt)} from ${e.source ?? 'website'}`}
        actions={<>{e.phone && <a href={`tel:${e.phone}`} className="btn btn-outline btn-sm">Call</a>}{wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">WhatsApp</a>}{e.email && <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Your DVINE H2O enquiry ${e.ref}`)}`} className="btn btn-outline btn-sm">Email</a>}</>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
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
      </div>
    </>
  );
}

import Link from 'next/link';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { enquiries, ENQUIRY_TYPES, ENQUIRY_STATUSES, INTERESTS } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { ENQUIRY_LABEL, INTEREST_LABEL } from '@/lib/enquiries';
import { PageHead, Panel, TableWrap, Filters, Empty, dt } from '@/components/admin/ui';
import { Status, humanize } from '@/components/ui/Status';

export const metadata = { title: 'Enquiries' };

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ type?: string; status?: string; interest?: string; q?: string }> }) {
  await requireStaff('enquiries');
  const sp = await searchParams;
  const conds = [
    sp.type && (ENQUIRY_TYPES as readonly string[]).includes(sp.type) ? eq(enquiries.type, sp.type as typeof ENQUIRY_TYPES[number]) : undefined,
    sp.status && (ENQUIRY_STATUSES as readonly string[]).includes(sp.status) ? eq(enquiries.status, sp.status as typeof ENQUIRY_STATUSES[number]) : undefined,
    sp.interest && (INTERESTS as readonly string[]).includes(sp.interest) ? eq(enquiries.productInterest, sp.interest as typeof INTERESTS[number]) : undefined,
    sp.q ? or(like(enquiries.name, `%${sp.q}%`), like(enquiries.phone, `%${sp.q}%`), like(enquiries.email, `%${sp.q}%`), like(enquiries.ref, `%${sp.q.toUpperCase()}%`), like(enquiries.company, `%${sp.q}%`)) : undefined,
  ].filter(Boolean);
  const list = await db.query.enquiries.findMany({ where: conds.length ? and(...(conds as NonNullable<typeof conds[number]>[])) : undefined, orderBy: desc(enquiries.createdAt), limit: 200, with: { assignee: true } });
  return (
    <>
      <PageHead title="Enquiries & CRM" sub="Every website form, chat hand-over, demo and consultation request." actions={<a href="/api/admin/export?type=enquiries&range=30d" className="btn btn-outline btn-sm">Export CSV</a>} />
      <Filters>
        <div className="field"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={sp.q} className="input w-56" placeholder="Name, phone, ref, company" /></div>
        <div className="field"><label className="label" htmlFor="t">Type</label><select id="t" name="type" defaultValue={sp.type ?? ''} className="input w-44"><option value="">All</option>{ENQUIRY_TYPES.map(t => <option key={t} value={t}>{ENQUIRY_LABEL[t]}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="s">Stage</label><select id="s" name="status" defaultValue={sp.status ?? ''} className="input w-36"><option value="">All</option>{ENQUIRY_STATUSES.map(t => <option key={t} value={t}>{humanize(t)}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="i">Interest</label><select id="i" name="interest" defaultValue={sp.interest ?? ''} className="input w-36"><option value="">All</option>{INTERESTS.map(t => <option key={t} value={t}>{INTEREST_LABEL[t]}</option>)}</select></div>
      </Filters>
      <Panel>
        {list.length === 0 ? <Empty>No enquiries match.</Empty> : (
          <TableWrap>
            <thead><tr><th>Ref</th><th>Received</th><th>Type</th><th>Name</th><th>Interest</th><th>City</th><th>Stage</th><th>Owner</th></tr></thead>
            <tbody>{list.map(e => (
              <tr key={e.id}><td><Link href={`/admin/enquiries/${e.id}`} className="link">{e.ref}</Link></td><td className="whitespace-nowrap">{dt(e.createdAt)}</td><td>{ENQUIRY_LABEL[e.type]}{e.type === 'chat' && <span className="ml-1 badge bg-[#E8E4FF] text-[#3A1DB3]">live</span>}</td><td>{e.name}{e.company ? <span className="block text-[12px] text-muted">{e.company}</span> : null}<span className="block text-[12px] text-muted">{e.phone}</span></td><td>{INTEREST_LABEL[e.productInterest]}</td><td>{e.city ?? '—'}</td><td><Status value={e.status} /></td><td>{e.assignee?.name ?? '—'}</td></tr>
            ))}</tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}

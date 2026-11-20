import Link from 'next/link';
import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { likeTerm } from '@/lib/validators';
import { db } from '@/lib/db';
import { enquiries, ENQUIRY_TYPES, ENQUIRY_STATUSES, INTERESTS } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { can } from '@/lib/session';
import { getLinks } from '@/lib/sheet-sync';
import { SheetButton } from '@/components/admin/SheetButton';
import { INTEREST_LABEL } from '@/lib/enquiries';
import { FORMS, formOf } from '@/lib/form-responses';
import { PageHead, Panel, TableWrap, Filters, Empty, dt } from '@/components/admin/ui';
import { Icon } from '@/components/admin/AdminIcon';
import { Status, humanize } from '@/components/ui/Status';

export const metadata = { title: 'Form responses' };

type SP = { type?: string; status?: string; interest?: string; q?: string };

export default async function FormResponses({ searchParams }: { searchParams: Promise<SP> }) {
  const staff = await requireStaff('enquiries');
  const sp = await searchParams;
  const type = sp.type && (ENQUIRY_TYPES as readonly string[]).includes(sp.type) ? sp.type as typeof ENQUIRY_TYPES[number] : undefined;
  const conds = [
    type ? eq(enquiries.type, type) : undefined,
    sp.status && (ENQUIRY_STATUSES as readonly string[]).includes(sp.status) ? eq(enquiries.status, sp.status as typeof ENQUIRY_STATUSES[number]) : undefined,
    sp.interest && (INTERESTS as readonly string[]).includes(sp.interest) ? eq(enquiries.productInterest, sp.interest as typeof INTERESTS[number]) : undefined,
    sp.q ? or(ilike(enquiries.name, likeTerm(sp.q)), ilike(enquiries.phone, likeTerm(sp.q)), ilike(enquiries.email, likeTerm(sp.q)), ilike(enquiries.ref, likeTerm(sp.q)), ilike(enquiries.company, likeTerm(sp.q))) : undefined,
  ].filter(Boolean);
  const [list, tally, links] = await Promise.all([
    db.query.enquiries.findMany({ where: conds.length ? and(...(conds as NonNullable<typeof conds[number]>[])) : undefined, orderBy: desc(enquiries.createdAt), limit: 200, with: { assignee: true } }),
    db.select({ type: enquiries.type, total: count(), fresh: sql<number>`count(*) filter (where ${enquiries.status} = 'new')`.mapWith(Number) }).from(enquiries).groupBy(enquiries.type),
    getLinks().catch(() => new Map()),
  ]);
  const canLink = can(staff.role, 'settings');
  const linkedForms = FORMS.filter(f => links.has(`form:${f.type}`)).length;
  const by = new Map(tally.map(t => [t.type, t]));
  const allNew = tally.reduce((n, t) => n + t.fresh, 0);
  const allTotal = tally.reduce((n, t) => n + t.total, 0);
  const href = (t?: string) => {
    const q = new URLSearchParams(Object.entries({ ...sp, type: t }).filter(([, v]) => v) as [string, string][]);
    return `/admin/enquiries${q.size ? `?${q}` : ''}`;
  };
  const current = type ? formOf(type) : null;

  const tab = (key: string | undefined, label: string, fresh: number, total: number) => {
    const on = (key ?? '') === (type ?? '');
    return (
      <Link key={key ?? 'all'} href={href(key)} aria-current={on ? 'page' : undefined}
        className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 font-sans text-[13px] transition-colors ${on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-[#2E3A57] hover:border-[#B8C4D9]'}`}>
        {label}
        <span className={`text-[12px] ${on ? 'text-white/70' : 'text-muted'}`}>{total}</span>
        {fresh > 0 && <span className={`rounded-full px-1.5 text-[11px] font-semibold leading-[18px] ${on ? 'bg-white text-ink' : 'bg-deep-current text-white'}`}>{fresh} new</span>}
      </Link>
    );
  };

  return (
    <>
      <PageHead title="Form responses" sub={current ? `${current.tab} · sent from the ${current.from.toLowerCase()}` : 'Everything people send through the website’s forms and chat, newest first.'}
        actions={<>
          {type
            ? <SheetButton feed={`form:${type}`} link={links.get(`form:${type}`)} canLink={canLink} />
            : canLink && <a href="/admin/settings/sheets" className="btn btn-outline btn-sm"><Icon name="sheet" className="size-4" />Google Sheets{linkedForms ? ` · ${linkedForms} linked` : ''}</a>}
          <a href="/api/admin/export?type=enquiries&range=30d" className="btn btn-outline btn-sm"><Icon name="download" className="size-4" />Export CSV</a>
        </>} />

      <nav aria-label="Forms" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {tab(undefined, 'All forms', allNew, allTotal)}
        {FORMS.map(f => tab(f.type, f.tab, by.get(f.type)?.fresh ?? 0, by.get(f.type)?.total ?? 0))}
      </nav>

      <Filters>
        {type && <input type="hidden" name="type" value={type} />}
        <div className="field"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={sp.q} className="input w-56" placeholder="Name, phone, company, ref" /></div>
        <div className="field"><label className="label" htmlFor="s">Stage</label><select id="s" name="status" defaultValue={sp.status ?? ''} className="input w-36"><option value="">All</option>{ENQUIRY_STATUSES.map(t => <option key={t} value={t}>{humanize(t)}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="i">Product</label><select id="i" name="interest" defaultValue={sp.interest ?? ''} className="input w-36"><option value="">All</option>{INTERESTS.map(t => <option key={t} value={t}>{INTEREST_LABEL[t]}</option>)}</select></div>
      </Filters>

      <Panel>
        {list.length === 0 ? <Empty>{allTotal === 0 ? 'No responses yet. When someone sends a form on the website, it appears here and in the bell at the top.' : 'No responses match.'}</Empty> : (
          <TableWrap>
            <thead><tr><th>Received</th><th>From</th>{!type && <th>Form</th>}<th>Product</th><th>Message</th><th>Stage</th><th>Owner</th></tr></thead>
            <tbody>{list.map(e => {
              const fresh = e.status === 'new';
              return (
                <tr key={e.id} className={fresh ? 'bg-[#F7FAFF]' : undefined}>
                  <td className="whitespace-nowrap">{fresh && <span className="mr-2 inline-block size-1.5 rounded-full bg-deep-current align-middle" aria-label="New" />}{dt(e.createdAt)}</td>
                  <td className="min-w-44">
                    <Link href={`/admin/enquiries/${e.id}`} className={`link ${fresh ? 'font-semibold' : ''}`}>{e.name}</Link>
                    {e.company && <span className="block text-[12px] text-ink">{e.company}</span>}
                    <span className="block text-[12px] text-muted">{[e.phone, e.city].filter(Boolean).join(' · ')}</span>
                  </td>
                  {!type && <td className="whitespace-nowrap">{formOf(e.type).one}</td>}
                  <td>{INTEREST_LABEL[e.productInterest]}</td>
                  <td className="max-w-[320px]"><span className="line-clamp-2 text-[13px] text-[#3B4766]">{e.message || '—'}</span></td>
                  <td><Status value={e.status} /></td>
                  <td>{e.assignee?.name ?? '—'}</td>
                </tr>
              );
            })}</tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}

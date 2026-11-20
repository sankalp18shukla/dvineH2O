import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pincodes } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { sheetUrl } from '@/lib/google-sheets';
import { getLink, refreshPincodesIfStale } from '@/lib/sheet-sync';
import { Empty, Filters, Kpi, PageHead, Panel, TableWrap } from '@/components/admin/ui';
import { AdminForm } from '@/components/admin/AdminForm';
import { Icon } from '@/components/admin/AdminIcon';
import { SheetButton, ago } from '@/components/admin/SheetButton';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { savePincodes, togglePincode } from '@/app/actions/admin';
import { syncSheet } from '@/app/actions/sheets';

export const metadata = { title: 'Pincodes' };

type SP = { q?: string; state?: string; show?: string };
const SHOW: [string, string][] = [['', 'All'], ['delivers', 'We deliver'], ['installation', 'Installation'], ['water', 'Water testing'], ['off', 'Not served']];

export default async function Pincodes({ searchParams }: { searchParams: Promise<SP> }) {
  await requireStaff('settings');
  const sp = await searchParams;
  // with a sheet linked, read it first when the last read is a couple of minutes old, so this page shows the sheet's list
  await refreshPincodesIfStale(2).catch(() => {});
  const [all, link] = await Promise.all([db.query.pincodes.findMany({ orderBy: [asc(pincodes.state), asc(pincodes.city), asc(pincodes.pincode)] }), getLink('pincodes')]);

  const states = [...new Set(all.map(p => p.state))].sort();
  const q = (sp.q ?? '').trim().toLowerCase();
  const list = all.filter(p =>
    (!q || p.pincode.startsWith(q) || p.city.toLowerCase().includes(q)) &&
    (!sp.state || p.state === sp.state) &&
    (sp.show === 'delivers' ? p.serviceable : sp.show === 'installation' ? p.installation : sp.show === 'water' ? p.waterTesting : sp.show === 'off' ? !p.serviceable : true));
  const n = (f: (p: typeof all[number]) => boolean) => all.filter(f).length;
  const cities = new Set(all.filter(p => p.serviceable).map(p => `${p.city}|${p.state}`)).size;

  const T = ({ pin, field, on, what }: { pin: string; field: string; on: boolean; what: string }) => (
    <AdminForm action={togglePincode} className="inline"><input type="hidden" name="pincode" value={pin} /><input type="hidden" name="field" value={field} />
      <button className={`badge ${on ? 'bg-[#DFF5E3] text-[#1B6B2C]' : 'bg-[#F1F2F5] text-[#505A70]'}`} aria-label={`${what} for ${pin}: ${on ? 'yes' : 'no'}. Click to change.`}>{on ? 'Yes' : 'No'}</button>
    </AdminForm>
  );

  return (
    <>
      <PageHead title="Serviceable pincodes" sub="Where we deliver, install and collect water samples. Used by the pincode check, checkout and water-test booking."
        actions={<SheetButton feed="pincodes" link={link} />} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Pincodes" value={all.length} sub={`${states.length} state${states.length === 1 ? '' : 's'}`} />
        <Kpi label="We deliver" value={n(p => p.serviceable)} sub={`${cities} cit${cities === 1 ? 'y' : 'ies'}`} tone="good" />
        <Kpi label="Installation" value={n(p => p.installation)} />
        <Kpi label="Water testing" value={n(p => p.waterTesting)} />
        <Kpi label="Not served" value={n(p => !p.serviceable)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="grid h-fit gap-6">
          {link && (
            <Panel title="Managed from a Google Sheet">
              <div className="grid gap-3 font-sans text-[13px] text-[#3B4766]">
                <a href={sheetUrl(link.spreadsheetId, link.tabId)} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1.5 text-[13px]"><Icon name="sheet" className="size-4" />{link.title} › {link.tab}</a>
                <p>The sheet is the master list. Add, change or delete rows there and the website follows within a few minutes. Changes made on this page are written back to the sheet.</p>
                <p className="text-muted">Last read {ago(link.lastSyncAt)}{link.rows != null ? ` · ${link.rows} pincodes` : ''}</p>
                {link.lastError && <p className="flex gap-1.5 text-[#B42318]"><Icon name="alert" className="mt-px size-4 shrink-0" />{link.lastError}</p>}
                {link.note && !link.lastError && <p className="text-[#7A4B00]">{link.note}</p>}
                <AdminForm action={syncSheet} className="contents"><input type="hidden" name="feed" value="pincodes" /><SubmitButton className="btn btn-outline btn-sm justify-self-start" pendingLabel="Reading…"><Icon name="refresh" className="size-4" />Read sheet now</SubmitButton></AdminForm>
              </div>
            </Panel>
          )}
          <Panel title="Add or update">
            <AdminForm action={savePincodes} reset>
              <label htmlFor="rows" className="font-sans text-[13px] text-muted">One per line: <code>pincode, city, state, delivery days, installation (y/n), water testing (y/n)</code></label>
              <textarea id="rows" name="rows" rows={8} className="input font-mono text-[13px]" placeholder={'560001, Bengaluru, Karnataka, 4, y, y\n110001, New Delhi, Delhi, 3, y, n'} />
              <SubmitButton className="btn btn-primary btn-sm justify-self-start">Save pincodes</SubmitButton>
            </AdminForm>
          </Panel>
        </div>

        <div className="min-w-0">
          <Filters>
            <div className="field"><label className="label" htmlFor="pq">Search</label><input id="pq" name="q" defaultValue={sp.q} className="input w-44" placeholder="Pincode or city" inputMode="search" /></div>
            <div className="field"><label className="label" htmlFor="ps">State</label><select id="ps" name="state" defaultValue={sp.state ?? ''} className="input w-44"><option value="">All states</option>{states.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label className="label" htmlFor="pw">Show</label><select id="pw" name="show" defaultValue={sp.show ?? ''} className="input w-40">{SHOW.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </Filters>
          <Panel>
            {list.length === 0 ? <Empty>{all.length ? 'No pincodes match.' : 'No pincodes yet. Add some on the left, or link a Google Sheet.'}</Empty> : (
              <TableWrap>
                <thead><tr><th>Pincode</th><th>City</th><th>State</th><th>Days</th><th>Delivers</th><th>Installation</th><th>Water testing</th></tr></thead>
                <tbody>{list.map(p => (
                  <tr key={p.pincode} className={p.serviceable ? undefined : 'text-muted'}>
                    <td className="font-mono">{p.pincode}</td><td>{p.city}</td><td>{p.state}</td><td className="tabular-nums">{p.deliveryDays}</td>
                    <td><T pin={p.pincode} field="serviceable" on={p.serviceable} what="Delivery" /></td>
                    <td><T pin={p.pincode} field="installation" on={p.installation} what="Installation" /></td>
                    <td><T pin={p.pincode} field="waterTesting" on={p.waterTesting} what="Water testing" /></td>
                  </tr>
                ))}</tbody>
              </TableWrap>
            )}
            {list.length > 0 && list.length < all.length && <p className="mt-4 font-sans text-[12.5px] text-muted">Showing {list.length} of {all.length}.</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}

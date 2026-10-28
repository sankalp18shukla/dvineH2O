import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pincodes } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { PageHead, Panel, TableWrap } from '@/components/admin/ui';
import { AdminForm } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { savePincodes, togglePincode } from '@/app/actions/admin';

export const metadata = { title: 'Pincodes' };

export default async function Pincodes() {
  await requireStaff('settings');
  const list = await db.query.pincodes.findMany({ orderBy: asc(pincodes.pincode) });
  const T = ({ pin, field, on }: { pin: string; field: string; on: boolean }) => (
    <AdminForm action={togglePincode} className="inline"><input type="hidden" name="pincode" value={pin} /><input type="hidden" name="field" value={field} /><button className={`badge ${on ? 'bg-[#DFF5E3] text-[#1B6B2C]' : 'bg-[#F1F2F5] text-[#505A70]'}`} aria-label={`Toggle ${field} for ${pin}`}>{on ? 'Yes' : 'No'}</button></AdminForm>
  );
  return (
    <>
      <PageHead title="Serviceable pincodes" sub={`${list.length} pincodes. Used for delivery checks, installation and water-testing availability.`} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel title="Add or update (paste rows)">
          <AdminForm action={savePincodes} reset>
            <label htmlFor="rows" className="font-sans text-[13px] text-muted">One per line: <code>pincode, city, state, delivery days, installation (y/n), water testing (y/n)</code></label>
            <textarea id="rows" name="rows" rows={10} className="input font-mono text-[13px]" placeholder={'560001, Bengaluru, Karnataka, 4, y, y\n110001, New Delhi, Delhi, 3, y, n'} />
            <SubmitButton className="btn btn-primary btn-sm justify-self-start">Save pincodes</SubmitButton>
          </AdminForm>
        </Panel>
        <Panel>
          <TableWrap>
            <thead><tr><th>Pincode</th><th>City</th><th>State</th><th>Days</th><th>Delivers</th><th>Installation</th><th>Water testing</th></tr></thead>
            <tbody>{list.map(p => <tr key={p.pincode}><td className="font-mono">{p.pincode}</td><td>{p.city}</td><td>{p.state}</td><td>{p.deliveryDays}</td><td><T pin={p.pincode} field="serviceable" on={p.serviceable} /></td><td><T pin={p.pincode} field="installation" on={p.installation} /></td><td><T pin={p.pincode} field="waterTesting" on={p.waterTesting} /></td></tr>)}</tbody>
          </TableWrap>
        </Panel>
      </div>
    </>
  );
}

import { requireStaff } from '@/lib/auth';
import { getCompany, getCommerce } from '@/lib/settings';
import { INDIAN_STATES } from '@/lib/gst';
import { PageHead, Panel } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { saveCompany, saveCommerce } from '@/app/actions/admin';

export const metadata = { title: 'Settings' };
const rup = (p: number) => (p / 100).toFixed(0);

export default async function Settings() {
  await requireStaff('settings');
  const [c, m] = await Promise.all([getCompany(), getCommerce()]);
  const sel = 'input min-h-10 text-sm';
  return (
    <>
      <PageHead title="Settings" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Company (appears on GST invoices)">
          <AdminForm action={saveCompany} className="grid gap-3 sm:grid-cols-2">
            {[['legalName', 'Legal name', c.legalName], ['tradeName', 'Trade name', c.tradeName], ['gstin', 'GSTIN', c.gstin], ['pan', 'PAN', c.pan], ['address', 'Registered address', c.address], ['city', 'City', c.city], ['pincode', 'Pincode', c.pincode], ['phone', 'Phone', c.phone], ['email', 'Email', c.email], ['invoicePrefix', 'Invoice prefix', c.invoicePrefix]].map(([n, l, v]) => (
              <div key={n} className={`field ${n === 'address' ? 'sm:col-span-2' : ''}`}><label className="label text-[12px]" htmlFor={`c-${n}`}>{l}</label><input id={`c-${n}`} name={n} defaultValue={v} className={sel} /><AdminError name={n} /></div>
            ))}
            <div className="field"><label className="label text-[12px]" htmlFor="c-state">State (decides CGST+SGST vs IGST)</label><select id="c-state" name="state" defaultValue={c.state} className={sel}><option value="">Choose</option>{INDIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
            <SubmitButton className="btn btn-primary btn-sm justify-self-start">Save company</SubmitButton>
          </AdminForm>
        </Panel>
        <div className="grid h-fit gap-6">
          <Panel title="Store rules">
            <AdminForm action={saveCommerce} className="grid gap-3 sm:grid-cols-2">
              {[['shippingFee', 'Delivery fee (₹, 0 = free)', rup(m.shippingFee)], ['freeShippingAbove', 'Free delivery above (₹)', rup(m.freeShippingAbove)], ['reservationMinutes', 'Hold stock for unpaid orders (min)', m.reservationMinutes], ['abandonmentMinutes', 'Cart counts as abandoned after (min)', m.abandonmentMinutes], ['returnWindowDays', 'Return window (days)', m.returnWindowDays]].map(([n, l, v]) => <div key={n as string} className="field"><label className="label text-[12px]" htmlFor={`m-${n}`}>{l}</label><input id={`m-${n}`} name={n as string} defaultValue={v as string} className={sel} inputMode="numeric" /></div>)}
              <div className="field"><label className="label text-[12px]" htmlFor="m-cb">Customers can cancel online until</label><select id="m-cb" name="cancelBefore" defaultValue={m.cancelBefore} className={sel}><option value="packed">Order is packed</option><option value="shipped">Order is shipped</option></select></div>
              <SubmitButton className="btn btn-primary btn-sm justify-self-start">Save store rules</SubmitButton>
            </AdminForm>
          </Panel>
        </div>
      </div>
    </>
  );
}

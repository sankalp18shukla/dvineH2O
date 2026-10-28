import { requireStaff } from '@/lib/auth';
import { getCompany, getCommerce } from '@/lib/settings';
import { INDIAN_STATES } from '@/lib/gst';
import { razorpayEnabled } from '@/lib/razorpay';
import { shiprocketEnabled } from '@/lib/shiprocket';
import { PageHead, Panel } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { Status } from '@/components/ui/Status';
import { saveCompany, saveCommerce, runMaintenanceNow } from '@/app/actions/admin';

export const metadata = { title: 'Settings' };
const rup = (p: number) => (p / 100).toFixed(0);

export default async function Settings() {
  await requireStaff('settings');
  const [c, m] = await Promise.all([getCompany(), getCommerce()]);
  const sel = 'input min-h-10 text-sm';
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
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
            <label className="flex items-center gap-2 font-sans text-sm sm:col-span-2"><input type="checkbox" name="confirmed" defaultChecked={c.confirmed} className="check mt-0" />These details are confirmed and correct</label>
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
          <Panel title="Integrations">
            <ul className="grid gap-3 font-sans text-sm">
              <li className="flex items-center justify-between"><span>Razorpay payments</span><Status value={razorpayEnabled() ? 'active' : 'pending'} label={razorpayEnabled() ? 'Connected' : 'Test mode'} /></li>
              <li className="flex items-center justify-between"><span>Shiprocket shipping</span><Status value={shiprocketEnabled() ? 'active' : 'pending'} label={shiprocketEnabled() ? 'Connected' : 'Manual'} /></li>
              <li className="flex items-center justify-between"><span>Email (SMTP)</span><Status value={process.env.SMTP_HOST ? 'active' : 'pending'} label={process.env.SMTP_HOST ? 'Connected' : 'Logging only'} /></li>
              <li className="flex items-center justify-between"><span>WhatsApp Cloud API</span><Status value={process.env.WHATSAPP_TOKEN ? 'active' : 'pending'} label={process.env.WHATSAPP_TOKEN ? 'Connected' : 'Logging only'} /></li>
            </ul>
            <div className="mt-4 rounded-xl bg-paper p-3 font-mono text-[12px] leading-relaxed">
              Razorpay webhook: {site}/api/webhooks/razorpay<br />Shiprocket webhook: {site}/api/webhooks/shiprocket?token=…<br />Maintenance cron: POST {site}/api/cron/maintenance
            </div>
            <p className="mt-2 font-sans text-[12px] text-muted">Keys are set as environment variables on the server, never here. See the README.</p>
          </Panel>
          <Panel title="Maintenance">
            <p className="font-sans text-sm text-muted">Releases stock held by unpaid orders past their window and marks idle carts as abandoned. This also runs on the scheduled job.</p>
            <AdminForm action={runMaintenanceNow} className="mt-3"><SubmitButton className="btn btn-outline btn-sm justify-self-start" pendingLabel="Running">Run now</SubmitButton></AdminForm>
          </Panel>
        </div>
      </div>
    </>
  );
}

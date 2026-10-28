import { requireStaff } from '@/lib/auth';
import { PageHead, Panel } from '@/components/admin/ui';

export const metadata = { title: 'Reports & export' };
const EXPORTS = [
  ['orders', 'Orders', 'One row per order with totals, GST, coupon, invoice and AWB'],
  ['items', 'Order items', 'One row per line: SKU, HSN, qty, discount, GST, serials'],
  ['payments', 'Payment attempts', 'Gateway references, method, status, failure reasons'],
  ['refunds', 'Refunds', 'Amounts, gateway refund IDs, status'],
  ['invoices', 'GST invoices & credit notes', 'FY series, taxable value, CGST/SGST/IGST, place of supply'],
  ['customers', 'Customers', 'Profile, consent, orders and spend'],
  ['enquiries', 'Enquiries (CRM)', 'All website leads with stage, interest, quote and outcome'],
  ['water_tests', 'Water tests', 'Bookings, status, payment, recommendation'],
  ['stock', 'Stock movements', 'Inward, sale, return, adjustment, damage'],
  ['service', 'Service tickets', 'Issues, status, resolution, rating'],
  ['warranties', 'Warranties', 'Serials, purchase / installation / expiry dates'],
];

export default async function Reports({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  await requireStaff('reports');
  const sp = await searchParams;
  const range = sp.range ?? '30d';
  const q = new URLSearchParams({ range, ...(sp.from ? { from: sp.from } : {}), ...(sp.to ? { to: sp.to } : {}) }).toString();
  return (
    <>
      <PageHead title="Reports & export" sub="Date-filtered CSV files. They open directly in Excel or Google Sheets." />
      <form className="mb-6 flex flex-wrap items-end gap-2 font-sans">
        <div className="field"><label className="label text-[12px]" htmlFor="r">Period</label><select id="r" name="range" defaultValue={range} className="input min-h-10 w-44 text-sm"><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="month">This month</option><option value="custom">Custom dates</option></select></div>
        <div className="field"><label className="label text-[12px]" htmlFor="f">From</label><input id="f" type="date" name="from" defaultValue={sp.from} className="input min-h-10 text-sm" /></div>
        <div className="field"><label className="label text-[12px]" htmlFor="t">To</label><input id="t" type="date" name="to" defaultValue={sp.to} className="input min-h-10 text-sm" /></div>
        <button className="btn btn-outline btn-sm min-h-10">Set period</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {EXPORTS.map(([k, t, d]) => (
          <Panel key={k}>
            <p className="font-sans font-semibold">{t}</p><p className="mt-1 font-sans text-sm text-muted">{d}</p>
            <a href={`/api/admin/export?type=${k}&${q}`} className="btn btn-primary btn-sm mt-4">Download CSV</a>
          </Panel>
        ))}
      </div>
      <p className="mt-6 font-sans text-[13px] text-muted">Customers and warranties export the full list regardless of period. Every export is recorded in the audit log.</p>
    </>
  );
}

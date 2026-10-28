import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { stockMovements, serialUnits } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { available, stockState } from '@/lib/inventory';
import { PageHead, Panel, TableWrap, Kpi, dt } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { Status } from '@/components/ui/Status';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { adjustStock } from '@/app/actions/admin';

export const metadata = { title: 'Inventory' };

export default async function Inventory() {
  await requireStaff('inventory');
  const prods = await db.query.products.findMany();
  const moves = await db.query.stockMovements.findMany({ orderBy: desc(stockMovements.createdAt), limit: 60, with: { product: true, staff: true } });
  const serialCounts = await Promise.all(prods.map(p => db.$count(serialUnits, eq(serialUnits.productId, p.id))));
  return (
    <>
      <PageHead title="Inventory" sub="On-hand, reserved for unpaid orders, and available to sell." actions={<a href="/api/admin/export?type=stock&range=30d" className="btn btn-outline btn-sm">Export movements</a>} />
      <div className="grid gap-4 lg:grid-cols-3">
        {prods.map((p, i) => (
          <Panel key={p.id} title={<span className="flex items-center gap-2">{p.shortName} <Status value={stockState(p)} /></span>}>
            {p.buildToOrder ? <p className="font-sans text-sm text-muted">Build to order. No stock is held for {p.shortName}.</p> : (
              <div className="grid grid-cols-3 gap-2">
                <Kpi label="On hand" value={p.onHand} /><Kpi label="Reserved" value={p.reserved} /><Kpi label="Available" value={available(p)} sub={`Reorder at ${p.reorderLevel}`} tone={stockState(p) === 'in_stock' ? undefined : 'warn'} />
              </div>
            )}
            <AdminForm action={adjustStock} className="mt-4 grid gap-2 border-t border-line pt-4" reset>
              <>
                <input type="hidden" name="productId" value={p.id} />
                <div className="grid grid-cols-[1fr_90px] gap-2">
                  <select name="type" className="input min-h-10 text-sm" aria-label="Movement type"><option value="inward">Inward (received)</option><option value="adjustment">Adjustment (+/−)</option><option value="damage">Damage / write-off</option></select>
                  <input name="qty" type="number" placeholder="Qty" className="input min-h-10 text-sm" aria-label="Quantity" />
                </div>
                <input name="reference" placeholder="Reference (PO / GRN no.)" className="input min-h-10 text-sm" aria-label="Reference" />
                <input name="note" placeholder="Note / reason" className="input min-h-10 text-sm" aria-label="Note" />
                {p.trackSerials && <input name="serials" placeholder="Serial numbers received (comma separated)" className="input min-h-10 text-sm" aria-label="Serial numbers" />}
                <AdminError name="qty" /><AdminError name="note" />
                <SubmitButton className="btn btn-outline btn-sm" pendingLabel="Saving">Record movement</SubmitButton>
                {p.trackSerials && <p className="font-sans text-[12px] text-muted">{serialCounts[i]} serial numbers on record</p>}
              </>
            </AdminForm>
          </Panel>
        ))}
      </div>
      <Panel title="Stock movements" className="mt-6">
        <TableWrap>
          <thead><tr><th>When</th><th>Product</th><th>Type</th><th className="text-right">Change</th><th className="text-right">On hand</th><th className="text-right">Reserved</th><th>Reference</th><th>Note</th><th>By</th></tr></thead>
          <tbody>{moves.map(m => <tr key={m.id}><td className="whitespace-nowrap">{dt(m.createdAt)}</td><td>{m.product.shortName}</td><td>{m.type}</td><td className={`text-right font-semibold ${m.qty < 0 ? 'text-[#A1101B]' : m.qty > 0 ? 'text-[#1B6B2C]' : ''}`}>{m.qty > 0 ? `+${m.qty}` : m.qty || '·'}</td><td className="text-right">{m.onHandAfter}</td><td className="text-right">{m.reservedAfter}</td><td>{m.reference}</td><td>{m.note}</td><td>{m.staff?.name ?? 'system'}</td></tr>)}</tbody>
        </TableWrap>
      </Panel>
    </>
  );
}

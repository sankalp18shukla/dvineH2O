import Link from 'next/link';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { available, stockState } from '@/lib/inventory';
import { PageHead, Panel, TableWrap } from '@/components/admin/ui';
import { Status } from '@/components/ui/Status';

export const metadata = { title: 'Products' };

export default async function Products() {
  await requireStaff('products');
  const list = await db.query.products.findMany();
  return (
    <>
      <PageHead title="Products" sub="One SKU record per product. Changes go live on the website immediately." />
      <Panel>
        <TableWrap>
          <thead><tr><th>Product</th><th>SKU</th><th>Sale mode</th><th className="text-right">MRP</th><th className="text-right">Price</th><th>GST</th><th className="text-right">Available</th><th>Status</th></tr></thead>
          <tbody>{list.map(p => (
            <tr key={p.id}>
              <td><Link href={`/admin/products/${p.id}`} className="link">{p.name}</Link>{!p.priceConfirmed && p.saleMode === 'cart' && <span className="ml-2 badge bg-[#FFF4D6] text-[#7A4B00]">Price unconfirmed</span>}</td>
              <td>{p.sku}</td><td>{p.saleMode === 'cart' ? 'Cart → checkout' : 'Enquiry / quote'}</td>
              <td className="text-right">{p.mrp ? formatINR(p.mrp) : '—'}</td><td className="text-right font-semibold">{p.price ? formatINR(p.price) : p.quoteNote ? 'On quote' : '—'}</td><td>{p.gstRate / 100}%</td>
              <td className="text-right">{p.buildToOrder ? 'Build to order' : available(p)}</td>
              <td className="flex gap-1"><Status value={p.status} /><Status value={stockState(p)} /></td>
            </tr>
          ))}</tbody>
        </TableWrap>
      </Panel>
    </>
  );
}

import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { PageHead, Panel } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { saveProduct } from '@/app/actions/admin';

const rup = (p: number) => (p / 100).toFixed(2).replace(/\.00$/, '');

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('products');
  const p = await db.query.products.findFirst({ where: eq(products.id, Number((await params).id)) });
  if (!p) notFound();
  const F = ({ name, label, def, hint, type = 'text', span = false }: { name: string; label: string; def?: string | number | null; hint?: string; type?: string; span?: boolean }) => (
    <div className={`field ${span ? 'sm:col-span-2' : ''}`}><label className="label text-[13px]" htmlFor={`p-${name}`}>{label}</label><input id={`p-${name}`} name={name} type={type} defaultValue={def ?? ''} className="input min-h-10 text-sm" />{hint && <p className="hint">{hint}</p>}<AdminError name={name} /></div>
  );
  const C = ({ name, label, def }: { name: string; label: string; def: boolean }) => <label className="flex items-center gap-2 font-sans text-sm"><input type="checkbox" name={name} defaultChecked={def} className="check mt-0" />{label}</label>;
  return (
    <>
      <PageHead back={{ href: '/admin/products', label: 'Products' }} title={p.name} sub={`SKU ${p.sku} · /${p.slug === 'crystal' ? 'home-water-systems' : p.slug === 'hyper' ? 'hydrogen-bottles' : 'for-business'}`} />
      <AdminForm action={saveProduct} className="grid gap-6 xl:grid-cols-2">
        <>
          <input type="hidden" name="id" value={p.id} />
          <Panel title="Commercial">
            <div className="grid gap-4 sm:grid-cols-2">
              <F name="name" label="Product name" def={p.name} span />
              <F name="shortName" label="Short name" def={p.shortName} />
              <div className="field"><label className="label text-[13px]" htmlFor="p-status">Status</label><select id="p-status" name="status" defaultValue={p.status} className="input min-h-10 text-sm"><option value="active">Active</option><option value="draft">Draft (hidden from cart)</option><option value="archived">Archived</option></select></div>
              <div className="field"><label className="label text-[13px]" htmlFor="p-mode">Sale mode</label><select id="p-mode" name="saleMode" defaultValue={p.saleMode} className="input min-h-10 text-sm"><option value="cart">Cart → checkout → payment</option><option value="enquiry">Enquiry / consultation-led</option></select></div>
              <F name="gstRate" label="GST rate (%)" def={p.gstRate / 100} type="number" />
              <F name="mrp" label="MRP (₹, incl. GST)" def={rup(p.mrp)} />
              <F name="price" label="Selling price (₹, incl. GST)" def={rup(p.price)} />
              <F name="hsn" label="HSN code" def={p.hsn} />
              <F name="quoteNote" label="Quote note (enquiry products)" def={p.quoteNote} />
              <div className="sm:col-span-2"><C name="priceConfirmed" label="Price confirmed by DVINE (removes the warning)" def={p.priceConfirmed} /></div>
            </div>
          </Panel>
          <Panel title="Operations">
            <div className="grid gap-4 sm:grid-cols-2">
              <F name="reorderLevel" label="Reorder (low-stock) level" def={p.reorderLevel} type="number" />
              <F name="maxPerOrder" label="Max units per order" def={p.maxPerOrder} type="number" />
              <F name="warrantyMonths" label="Warranty (months)" def={p.warrantyMonths} type="number" />
              <div className="grid content-center gap-2 sm:col-span-2">
                <C name="buildToOrder" label="Build to order (no stock limit)" def={p.buildToOrder} />
                <C name="trackSerials" label="Track serial numbers" def={p.trackSerials} />
                <C name="requiresInstallation" label="Requires installation (creates an installation job)" def={p.requiresInstallation} />
              </div>
              <p className="font-sans text-sm text-muted sm:col-span-2">Stock levels are changed in Inventory, so every change has a movement record.</p>
            </div>
          </Panel>
          <Panel title="Website content" className="xl:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <F name="tagline" label="Tagline" def={p.tagline} span />
              <div className="field sm:col-span-2"><label className="label text-[13px]" htmlFor="p-desc">Description</label><textarea id="p-desc" name="description" defaultValue={p.description ?? ''} rows={3} className="input text-sm" /></div>
              <div className="field"><label className="label text-[13px]" htmlFor="p-specs">Specifications (one per line, “Label: value”)</label><textarea id="p-specs" name="specs" rows={8} defaultValue={(p.specs ?? []).map(s => `${s.label}: ${s.value}`).join('\n')} className="input font-mono text-[13px]" /></div>
              <div className="grid gap-4">
                <div className="field"><label className="label text-[13px]" htmlFor="p-box">In the box (one per line)</label><textarea id="p-box" name="boxContents" rows={3} defaultValue={(p.boxContents ?? []).join('\n')} className="input text-sm" /></div>
                <div className="field"><label className="label text-[13px]" htmlFor="p-img">Images (one path or URL per line, first is the main image)</label><textarea id="p-img" name="images" rows={3} defaultValue={(p.images ?? []).join('\n')} className="input font-mono text-[13px]" /></div>
              </div>
              <F name="brochureUrl" label="Brochure URL" def={p.brochureUrl} />
              <F name="manualUrl" label="Manual / guide URL" def={p.manualUrl} />
              <F name="videoUrl" label="Demo video URL (MP4)" def={p.videoUrl} span />
            </div>
          </Panel>
          <div className="xl:col-span-2"><SubmitButton pendingLabel="Saving…">Save product</SubmitButton></div>
        </>
      </AdminForm>
    </>
  );
}

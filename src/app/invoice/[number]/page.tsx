import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadOrder } from '@/lib/order-view';
import { getCustomer, getStaff } from '@/lib/auth';
import { getCompany } from '@/lib/settings';
import { InvoiceDoc } from '@/components/Invoice';
import { PrintButton } from '@/components/PrintButton';

export const metadata: Metadata = { title: 'Invoice', robots: { index: false } };

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; cn?: string }> }) {
  const { number } = await params; const { t, cn } = await searchParams;
  const o = await loadOrder(number);
  if (!o) notFound();
  const [c, s] = await Promise.all([getCustomer(), getStaff()]);
  if (o.accessToken !== t && o.customerId !== c?.id && !s) notFound();
  return (
    <main className="min-h-screen bg-paper py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[860px] justify-end px-4"><PrintButton /></div>
      <InvoiceDoc o={o} company={await getCompany()} kind={cn ? 'credit_note' : 'invoice'} creditNumber={cn} />
    </main>
  );
}

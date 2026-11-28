import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { WarrantyForm } from '@/components/forms/WarrantyForm';
import { Lockup } from '@/components/ui/Brand';

export const metadata: Metadata = {
  title: 'Check your warranty',
  description: 'See how much warranty is left on your DVINE Crystal or Hyper, with your order or serial number.',
  alternates: { canonical: '/warranty' },
};

export default function WarrantyPage() {
  return (
    <>
      <Header framed />
      <main id="main" className="container-x min-h-[60vh] py-16">
        <Lockup as="h1" title="*Check* your warranty." tone="glacier" size="md" />
        <p className="lede mt-9 max-w-2xl">Enter your order number, or the serial number on the product, and the phone or email you bought with. We’ll show how long your warranty has left.</p>
        <div className="mt-10 max-w-4xl"><WarrantyForm /></div>
        <p className="mt-8 max-w-2xl font-sans text-sm text-muted">Need help with a product? <Link href="/support#contact" className="link">Raise a service request</Link>. What’s covered is in the <Link href="/policies/warranty" className="link">warranty policy</Link>. Signed in? Your warranties are also in <Link href="/account/warranties" className="link">your account</Link>.</p>
      </main>
    </>
  );
}

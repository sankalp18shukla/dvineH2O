import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { TrackForm } from '@/components/forms/TrackForm';
import { Lockup } from '@/components/ui/Brand';

export const metadata: Metadata = { title: 'Track my order' };

export default function TrackPage() {
  return (
    <>
      <Header framed />
      <main id="main" className="container-x min-h-[60vh] py-16">
        <Lockup as="h1" title="*Track* your order." tone="glacier" size="md" />
        <p className="lede mt-9 max-w-2xl">Enter the order number from your confirmation and the email or phone number you used at checkout.</p>
        <div className="mt-10 max-w-4xl"><TrackForm /></div>
        <p className="mt-6 font-sans text-sm text-muted">Signed in? See all your orders in <Link href="/account/orders" className="link">your account</Link>.</p>
      </main>
    </>
  );
}

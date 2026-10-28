import type { Metadata } from 'next';
import Image from 'next/image';
import { Header } from '@/components/store/Header';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Icon } from '@/components/ui/Icon';
import { Lockup, Squiggle } from '@/components/ui/Brand';

export const metadata: Metadata = { title: 'Book a demo', description: 'See Crystal or Titan working at your home or on a video call.' };

export default async function BookDemo({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  return (
    <>
      <Header framed />
      <main id="main" className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Lockup as="h1" title="See it working *before you choose.*" tone="glacier" size="md" />
            <p className="mt-9 font-serif text-[21px] leading-snug text-ink italic sm:text-[23px]">A DVINE specialist shows you how to select a mode, read the display and use the controls, and answers questions about your water and installation.</p>
            <ul className="mt-8 space-y-3 font-sans">{['At your home, by video call, or at an experience centre', 'Around 30 minutes', 'No obligation to buy'].map(x => <li key={x} className="flex items-center gap-3"><Icon name="check" className="size-5 text-deep-current" />{x}</li>)}</ul>
            <div className="relative mt-16 hidden lg:block">
              <Squiggle className="pointer-events-none absolute -top-14 -left-12 z-[3] w-44 text-voltage" />
              <div className="pin-frame relative aspect-[16/10]" style={{ ['--pin' as string]: 'var(--color-flash)' }}><div className="absolute inset-0 overflow-hidden"><Image src="/images/collection.webp" alt="" fill sizes="40vw" className="object-cover" /></div></div>
            </div>
          </div>
          <div className="self-start border-t-2 border-ink bg-white p-6 sm:p-8"><EnquiryForm variant="demo" source="/book-demo" defaultInterest={product === 'titan' ? 'titan' : product === 'hyper' ? 'hyper' : 'crystal'} submitLabel="Book My Demo" /></div>
        </div>
      </main>
    </>
  );
}

import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { DieCut, Lockup } from '@/components/ui/Brand';

export default function NotFound() {
  return (
    <>
      <Header framed />
      <main id="main" className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
        <div className="relative"><DieCut text={'BRB,\nRefilling.'} className="absolute -top-16 right-0 text-[24px] sm:-right-16 sm:text-[30px]" /><Lockup as="h1" title="*This page has* run dry." tone="flash" className="is-center" /><p className="lede mx-auto mt-10">The page you’re looking for doesn’t exist or has moved.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/" className="btn btn-primary">Go home</Link><Link href="/support" className="btn btn-outline">Visit Support</Link></div></div>
      </main>
    </>
  );
}

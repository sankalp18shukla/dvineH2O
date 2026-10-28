import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import { requireCustomer } from '@/lib/auth';
import { logoutCustomer } from '@/app/actions/auth';
import { AccountNav } from '@/components/store/AccountNav';

export const dynamic = 'force-dynamic';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const c = await requireCustomer();
  return (
    <>
      <Header framed />
      <main id="main" className="container-x py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow mb-6">My account</p><Lockup as="h1" title={`*Hello,* ${c.name.split(' ')[0]}.`} tone="glacier" size="sm" /></div>
          <form action={logoutCustomer}><button className="btn btn-ghost btn-sm"><Icon name="logout" className="size-4" /> Sign out</button></form>
        </div>
        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <AccountNav />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
        <p className="mt-12 font-sans text-sm text-muted">Need help? <Link href="/support#contact" className="link">Contact support</Link> or call 1800 202 4504.</p>
      </main>
    </>
  );
}

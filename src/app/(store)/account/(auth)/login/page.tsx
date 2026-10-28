import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { LoginForm } from '@/components/forms/AuthForms';
import { getCustomer } from '@/lib/auth';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCustomer()) redirect(next?.startsWith('/') ? next : '/account');
  return (
    <>
      <Header framed />
      <main id="main" className="container-x grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md border-t-2 border-ink bg-white p-8">
          <Lockup as="h1" title="*Sign* in." tone="glacier" size="sm" />
          <p className="mt-8 mb-6 font-sans text-muted">Orders, invoices, warranties and service in one place.</p>
          <LoginForm next={next} />
        </div>
      </main>
    </>
  );
}

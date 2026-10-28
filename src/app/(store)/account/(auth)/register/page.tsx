import type { Metadata } from 'next';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { RegisterForm } from '@/components/forms/AuthForms';

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } };

export default async function Register({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <Header framed />
      <main id="main" className="container-x grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md border-t-2 border-ink bg-white p-8">
          <Lockup as="h1" title="*Create* your account." tone="glacier" size="sm" />
          <p className="mt-8 mb-6 font-sans text-muted">Track orders, download invoices, register warranties and refer friends.</p>
          <RegisterForm next={next} />
        </div>
      </main>
    </>
  );
}

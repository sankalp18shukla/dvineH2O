import type { Metadata } from 'next';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { ForgotPasswordForm } from '@/components/forms/AuthForms';

export const metadata: Metadata = { title: 'Reset your password', robots: { index: false } };

export default function Forgot() {
  return (
    <>
      <Header framed />
      <main id="main" className="container-x grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md border-t-2 border-ink bg-white p-8">
          <Lockup as="h1" title="*Forgot* your password?" tone="glacier" size="sm" />
          <p className="mt-8 mb-6 font-sans text-muted">Enter the email you signed up with and we’ll send you a link to choose a new one.</p>
          <ForgotPasswordForm />
        </div>
      </main>
    </>
  );
}

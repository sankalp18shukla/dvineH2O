import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/store/Header';
import { Lockup } from '@/components/ui/Brand';
import { ResetPasswordForm } from '@/components/forms/AuthForms';
import { getAuthUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Reset() {
  const user = await getAuthUser();
  return (
    <>
      <Header framed />
      <main id="main" className="container-x grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md border-t-2 border-ink bg-white p-8">
          <Lockup as="h1" title="*Choose* a new password." tone="glacier" size="sm" />
          {user ? (
            <>
              <p className="mt-8 mb-6 font-sans text-muted">For {user.email}. You’ll stay signed in here; other devices are signed out.</p>
              <ResetPasswordForm />
            </>
          ) : (
            <p className="mt-8 font-sans text-muted">This link has expired or was already used. <Link href="/account/forgot" className="link">Ask for a new one</Link>.</p>
          )}
        </div>
      </main>
    </>
  );
}

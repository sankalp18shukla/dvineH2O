import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStaff, getStaffSession, staffMfaRequired } from '@/lib/auth';
import { StaffLoginForm } from '@/components/forms/AuthForms';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (await getStaff()) redirect('/admin');
  const half = await getStaffSession();
  if (half && !half.sessionExpired && staffMfaRequired() && half.aal !== 'aal2') redirect('/admin/login/mfa');
  const { expired } = await searchParams;
  return (
    <main className="stage on-dark grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-ink">
        <Logo className="h-5 w-auto text-deep-current" />
        <h1 className="mt-6 font-sans text-2xl font-bold">Team sign in</h1>
        <p className="mt-1 mb-6 font-sans text-sm text-muted">{expired ? 'Your session ended for security. Please sign in again.' : 'Orders, customers, inventory and service.'}</p>
        <StaffLoginForm />
      </div>
    </main>
  );
}

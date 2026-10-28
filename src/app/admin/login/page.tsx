import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStaff } from '@/lib/auth';
import { StaffLoginForm } from '@/components/forms/AuthForms';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false } };

export default async function AdminLogin() {
  if (await getStaff()) redirect('/admin');
  return (
    <main className="stage on-dark grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-ink">
        <Logo className="h-5 w-auto text-deep-current" />
        <h1 className="mt-6 font-sans text-2xl font-bold">Team sign in</h1>
        <p className="mt-1 mb-6 font-sans text-sm text-muted">Orders, customers, inventory and service.</p>
        <StaffLoginForm />
      </div>
    </main>
  );
}

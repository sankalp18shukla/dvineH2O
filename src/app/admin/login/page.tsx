import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStaff, getStaffSession } from '@/lib/auth';
import { StaffLoginForm } from '@/components/forms/AuthForms';
import { AuthCard } from '@/components/admin/AuthCard';

export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (await getStaff()) redirect('/admin');
  // already signed in on this device: only the authenticator code is needed
  const half = await getStaffSession();
  if (half && !half.sessionExpired && half.needsCode) redirect('/admin/login/mfa');
  const { expired } = await searchParams;
  return (
    <AuthCard title="Team sign in" sub={expired ? 'Your session ended for security. Please sign in again.' : 'Orders, customers, form responses and service.'}>
      <StaffLoginForm />
    </AuthCard>
  );
}

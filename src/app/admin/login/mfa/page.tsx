import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStaffSession } from '@/lib/auth';
import { logoutStaff } from '@/app/actions/auth';
import { StaffMfaForm } from '@/components/forms/AuthForms';
import { AuthCard } from '@/components/admin/AuthCard';

export const metadata: Metadata = { title: 'Enter your code', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminMfa() {
  const s = await getStaffSession();
  if (!s || s.sessionExpired) redirect('/admin/login');
  if (!s.needsCode) redirect('/admin');
  return (
    <AuthCard title={s.mfaEnrolled ? 'Enter your code' : 'Secure your account'}
      sub={s.mfaEnrolled ? <>Open your authenticator app and enter the 6-digit code for <b className="font-semibold text-ink">DVINE H2O Admin</b>.</> : <>Signed in as {s.email}.</>}>
      <StaffMfaForm enrolled={s.mfaEnrolled} />
      <form action={logoutStaff} className="mt-5 border-t border-line pt-4 text-center">
        <p className="font-sans text-[13px] text-muted">Not {s.name.split(' ')[0]}? <button className="font-medium text-deep-current hover:underline">Sign in with another account</button></p>
      </form>
    </AuthCard>
  );
}

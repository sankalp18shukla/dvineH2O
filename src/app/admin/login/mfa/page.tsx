import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getStaffSession, staffMfaRequired } from '@/lib/auth';
import { logoutStaff } from '@/app/actions/auth';
import { StaffMfaForm } from '@/components/forms/AuthForms';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = { title: 'Two-step sign in', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminMfa() {
  const s = await getStaffSession();
  if (!s || s.sessionExpired) redirect('/admin/login');
  if (s.aal === 'aal2' || !staffMfaRequired()) redirect('/admin');
  return (
    <main className="stage on-dark grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-ink">
        <Logo className="h-5 w-auto text-deep-current" />
        <h1 className="mt-6 font-sans text-2xl font-bold">{s.mfaEnrolled ? 'Enter your code' : 'Secure your account'}</h1>
        <p className="mt-1 mb-6 font-sans text-sm text-muted">Signed in as {s.email}.</p>
        <StaffMfaForm enrolled={s.mfaEnrolled} />
        <form action={logoutStaff} className="mt-4 text-center"><button className="font-sans text-[13px] text-muted hover:text-ink">Not you? Sign out</button></form>
      </div>
    </main>
  );
}

import type { ReactNode } from 'react';
import { Logo } from '../ui/Logo';

/** Plain, light frame for the team sign-in and code screens. */
export function AuthCard({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F6F8FC] p-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <Logo className="h-[18px] w-auto text-deep-current" />
          <span className="rounded-md border border-line bg-white px-1.5 py-px font-sans text-[10.5px] font-semibold tracking-wide text-muted uppercase">Admin</span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-7 text-ink shadow-[0_1px_2px_rgb(4_22_74/.04)] sm:p-8">
          <h1 className="font-sans text-[22px] font-bold tracking-tight">{title}</h1>
          {sub && <p className="mt-1 mb-6 font-sans text-[14px] text-muted">{sub}</p>}
          {children}
        </div>
      </div>
    </main>
  );
}

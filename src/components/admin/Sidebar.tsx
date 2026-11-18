'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Icon } from './AdminIcon';
import { Logo } from '../ui/Logo';
import { NotificationBell } from './NotificationBell';
import type { AdminNote } from '@/lib/admin-notifications';

export type NavItem = { href: string; label: string; icon: string; badge?: number; group?: string };

/** The admin frame: a light sidebar (a drawer on phones) and a top bar with the notification bell. */
export function AdminShell({ items, staff, logout, notes, seenAt, children }: {
  items: NavItem[]; staff: { name: string; role: string }; logout: () => void; notes: AdminNote[]; seenAt: number; children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [open]);

  const nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-px overflow-y-auto px-3 pb-4">
      {items.map((i, n) => {
        const active = i.href === '/admin' ? path === '/admin' : path.startsWith(i.href);
        const heading = i.group && i.group !== items[n - 1]?.group;
        return (
          <Fragment key={i.href}>
            {heading && <p className="px-3 pt-5 pb-1.5 font-sans text-[11px] font-medium tracking-[0.08em] text-[#8592AD] uppercase">{i.group}</p>}
            <Link href={i.href} aria-current={active ? 'page' : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-[7px] font-sans text-[13.5px] transition-colors ${active ? 'bg-[#EAF2FE] font-semibold text-deep-current' : 'text-[#2E3A57] hover:bg-[#F1F4F9] hover:text-ink'}`}>
              <Icon name={i.icon} className={`size-[17px] shrink-0 ${active ? 'text-deep-current' : 'text-[#7180A0] group-hover:text-ink'}`} />
              <span className="flex-1 truncate">{i.label}</span>
              {!!i.badge && <span className={`min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold leading-5 ${active ? 'bg-deep-current text-white' : 'bg-[#E9EDF4] text-ink'}`}>{i.badge}</span>}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
  const foot = (
    <div className="flex items-center gap-3 border-t border-line px-4 py-3.5 font-sans">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EAF2FE] text-[13px] font-semibold text-deep-current" aria-hidden="true">
        {staff.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
      </span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-ink">{staff.name}</span><span className="block text-[12px] capitalize text-muted">{staff.role}</span></span>
      <form action={logout}>
        <button className="grid size-9 place-items-center rounded-lg text-[#52607E] hover:bg-[#F1F4F9] hover:text-ink" aria-label="Sign out" title="Sign out"><Icon name="logout" className="size-[17px]" /></button>
      </form>
    </div>
  );
  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5 px-6 pt-6 pb-4">
      <Logo className="h-[17px] w-auto text-deep-current" />
      <span className="rounded-md border border-line px-1.5 py-px font-sans text-[10.5px] font-semibold tracking-wide text-muted uppercase">Admin</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#F6F8FC] lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-white lg:flex">{brand}{nav}{foot}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pr-3">{brand}<button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="mt-2 grid size-10 place-items-center rounded-lg hover:bg-[#F1F4F9]"><Icon name="close" className="size-5" /></button></div>
            {nav}{foot}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-white px-3 sm:px-5 lg:px-8">
          <button type="button" className="grid size-10 place-items-center rounded-lg text-ink hover:bg-[#F1F4F9] lg:hidden" aria-label="Open admin menu" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" className="size-5" /></button>
          <Link href="/admin" className="lg:hidden" aria-label="Admin home"><Logo className="h-[15px] w-auto text-deep-current" /></Link>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell initial={notes} seenAt={seenAt} />
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 font-sans text-[13px] font-medium text-[#2E3A57] hover:bg-[#F1F4F9] hover:text-ink sm:flex">
              View site <Icon name="external" className="size-3.5" />
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

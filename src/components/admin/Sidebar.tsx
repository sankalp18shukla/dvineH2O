'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';

export type NavItem = { href: string; label: string; icon: string; badge?: number };

export function Sidebar({ items, staff, logout }: { items: NavItem[]; staff: { name: string; role: string }; logout: () => void }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
      {items.map(i => {
        const active = i.href === '/admin' ? path === '/admin' : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 font-sans text-[14px] ${active ? 'bg-white/12 font-semibold text-white' : 'text-white/70 hover:bg-white/6 hover:text-white'}`}>
            <Icon name={i.icon} className="size-[18px]" /><span className="flex-1">{i.label}</span>
            {!!i.badge && <span className="rounded-full bg-flash px-1.5 text-[11px] font-bold leading-5 text-white">{i.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
  const foot = (
    <div className="border-t border-white/10 p-4 font-sans text-sm">
      <p className="font-semibold text-white">{staff.name}</p><p className="text-[12px] capitalize text-white/60">{staff.role}</p>
      <div className="mt-3 flex gap-2"><Link href="/" className="btn btn-outline btn-sm min-h-9 border-white/25 px-3 text-white" target="_blank">View site</Link><form action={logout}><button className="btn btn-sm min-h-9 px-3 text-white/80 hover:bg-white/10">Sign out</button></form></div>
    </div>
  );
  return (
    <>
      <div className="stage on-dark sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
        <Logo className="h-4 w-auto" />
        <button className="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label="Open admin menu" aria-expanded={open} onClick={() => setOpen(o => !o)}><Icon name={open ? 'close' : 'menu'} /></button>
      </div>
      {open && <div className="stage on-dark fixed inset-x-0 top-[64px] bottom-0 z-30 flex flex-col lg:hidden">{nav}{foot}</div>}
      <aside className="stage on-dark sticky top-0 hidden h-screen w-64 shrink-0 flex-col lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-5"><Logo className="h-[18px] w-auto" /><span className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider">Admin</span></Link>
        {nav}{foot}
      </aside>
    </>
  );
}

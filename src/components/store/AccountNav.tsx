'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../ui/Icon';

const ITEMS = [
  { href: '/account', label: 'Overview', icon: 'dashboard' },
  { href: '/account/orders', label: 'Orders', icon: 'box' },
  { href: '/account/warranties', label: 'Warranties', icon: 'shield' },
  { href: '/account/service', label: 'Service requests', icon: 'wrench' },
  { href: '/account/bookings', label: 'Tests and enquiries', icon: 'drop' },
  { href: '/account/referrals', label: 'Refer a friend', icon: 'gift' },
  { href: '/account/profile', label: 'Profile and addresses', icon: 'user' },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:w-60 lg:shrink-0 lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map(i => {
          const active = i.href === '/account' ? path === '/account' : path.startsWith(i.href);
          return <li key={i.href}><Link href={i.href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 font-sans text-[15px] whitespace-nowrap ${active ? 'bg-white font-semibold shadow-sm' : 'text-muted hover:bg-white/60 hover:text-ink'}`}><Icon name={i.icon} className="size-[18px]" />{i.label}</Link></li>;
        })}
      </ul>
    </nav>
  );
}

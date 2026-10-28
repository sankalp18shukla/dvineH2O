import Link from 'next/link';
import { NAV } from '@/lib/content';
import { cartCount } from '@/lib/cart';
import { getCustomer } from '@/lib/auth';
import { Logo } from '../ui/Logo';
import { Icon } from '../ui/Icon';
import { MobileMenu } from './MobileMenu';
import { HeaderShell } from './HeaderShell';

/**
 * `framed`: a light bar sitting above the home hero card — logo and actions line up with the
 * card's inner edge, the primary links sit centred between them.
 */
export async function Header({ overlay = false, framed = false }: { overlay?: boolean; framed?: boolean }) {
  // No database yet (frontend-only preview): render as a signed-out visitor with an empty cart.
  const [count, customer] = await Promise.all([cartCount().catch(() => 0), getCustomer().catch(() => null)]);
  const actions = (
    <div className="ml-auto flex items-center gap-1 justify-self-end">
      <Link href="/search" className="grid size-11 place-items-center rounded-full hover:bg-current/10" aria-label="Search"><Icon name="search" /></Link>
      <Link href={customer ? '/account' : '/account/login'} className="hidden size-11 place-items-center rounded-full hover:bg-current/10 sm:grid" aria-label={customer ? `Account (${customer.name})` : 'Sign in'}><Icon name="user" /></Link>
      <Link href="/cart" className="relative grid size-11 place-items-center rounded-full hover:bg-current/10" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
        <Icon name="cart" />
        {count > 0 && <span className="absolute top-1 right-1 grid min-w-[18px] place-items-center rounded-full bg-flash px-1 font-sans text-[11px] font-bold leading-[18px] text-white">{count}</span>}
      </Link>
      <Link href="/book-demo" className="btn btn-primary btn-sm ml-2 hidden md:inline-flex">Book a Demo</Link>
      <MobileMenu signedIn={!!customer} />
    </div>
  );
  const links = NAV.main.map(l => <Link key={l.href} href={l.href} className="relative py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition hover:after:scale-x-100">{l.label}</Link>);
  const logo = <Link href="/" className="shrink-0 justify-self-start" aria-label="DVINE H2O home"><Logo className="h-[17px] w-auto sm:h-5" /></Link>;

  if (framed) return (
    <HeaderShell overlay={false} framed>
      <div className="frame-x flex h-[68px] items-center lg:grid lg:h-[76px] lg:grid-cols-[1fr_auto_1fr]">
        {logo}
        <nav aria-label="Primary" className="hidden gap-9 font-sans text-[15px] font-medium lg:flex">{links}</nav>
        {actions}
      </div>
    </HeaderShell>
  );

  return (
    <HeaderShell overlay={overlay}>
      <div className="hidden border-b border-current/10 lg:block">
        <nav aria-label="Utility" className="container-x flex h-8 items-center justify-end gap-3 font-sans text-[12.5px] opacity-75">
          {NAV.utility.map((l, i) => <span key={l.href} className="flex items-center gap-3">{i > 0 && <span aria-hidden="true" className="opacity-40">|</span>}<Link href={l.href} className="hover:underline">{l.label}</Link></span>)}
        </nav>
      </div>
      <div className="container-x">
        <div className="flex h-16 items-center gap-8 lg:h-[76px]">
          {logo}
          <nav aria-label="Primary" className="hidden gap-7 font-sans text-[15px] font-medium lg:flex">{links}</nav>
          {actions}
        </div>
      </div>
    </HeaderShell>
  );
}

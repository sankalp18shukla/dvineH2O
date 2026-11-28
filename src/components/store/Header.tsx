import Link from 'next/link';
import { NAV } from '@/lib/content';
import { cartCount } from '@/lib/cart';
import { getCustomer } from '@/lib/auth';
import { Logo } from '../ui/Logo';
import { Icon } from '../ui/Icon';
import { MobileMenu } from './MobileMenu';
import { HeaderShell } from './HeaderShell';
import { Ribbon } from './Ribbon';
import { getLiveContent } from '@/lib/site-content.server';
import { isLive, ribbonPages, type Ribbon as RibbonData, type RibbonPage } from '@/lib/site-content';

/**
 * `framed`: a light bar sitting above the home hero card — logo and actions line up with the
 * card's inner edge, the primary links sit centred between them.
 */
/** `page`: which page this is, so the announcement ribbon shows only where Admin › Homepage & promotions ticks it. */
export async function Header({ overlay = false, framed = false, home = false, shop = false, page, ribbon }: { overlay?: boolean; framed?: boolean; home?: boolean; shop?: boolean; page?: RibbonPage; ribbon?: RibbonData }) {
  // No database yet (frontend-only preview): render as a signed-out visitor with an empty cart.
  const [count, customer, content] = await Promise.all([cartCount().catch(() => 0), getCustomer().catch(() => null), ribbon ? null : getLiveContent()]);
  // announcement ribbon (Admin › Homepage & promotions): the home page passes its own, so ?preview=1 shows the draft
  const rb = ribbon ?? content!.ribbon;
  const where = page ?? (home ? 'home' : shop ? 'hyper' : 'other');
  const band = rb.enabled && isLive(rb) && where !== 'checkout' && ribbonPages(rb).includes(where) ? <Ribbon ribbon={rb} /> : null;
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
  const links = NAV.main.map(l => <Link key={l.href} href={l.href} className={`${l.wide ? 'hidden min-[1440px]:block ' : ''}relative py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition hover:after:scale-x-100`}>{l.label}</Link>);
  const logo = <Link href="/" className="shrink-0 justify-self-start" aria-label="DVINE H2O home"><Logo className="h-[17px] w-auto sm:h-5" /></Link>;

  if (framed) return (
    <>
      {band}
      <HeaderShell overlay={false} framed glass={home}>
        {/* Text nav from 1280: five links up to 1439 (Blog and Become a Partner wait in the menu, whose button stays
            until 1440), all seven from 1440. Between logo and actions it sits centred in the free space with even gaps
            that grow with the screen; from 1600 there is room to centre it on the bar itself, as designed. */}
        <div className="frame-x flex h-[68px] items-center lg:h-[76px] min-[1600px]:grid min-[1600px]:grid-cols-[1fr_auto_1fr]">
          {logo}
          <nav aria-label="Primary" className="mx-6 hidden flex-1 justify-center gap-[clamp(20px,1.9vw,34px)] font-sans text-[13px] font-medium tracking-[0.005em] whitespace-nowrap xl:flex min-[1440px]:gap-[clamp(20px,1.6vw,32px)] min-[1600px]:mx-0 min-[1600px]:flex-none min-[1600px]:text-[13.5px]">{links}</nav>
          {actions}
        </div>
      </HeaderShell>
    </>
  );

  return (
    <>
    {band}
    <HeaderShell overlay={overlay}>
      <div className="hidden border-b border-current/10 xl:block">
        <nav aria-label="Utility" className="container-x flex h-8 items-center justify-end gap-3 font-sans text-[12.5px] opacity-75">
          {NAV.utility.map((l, i) => <span key={l.href} className="flex items-center gap-3">{i > 0 && <span aria-hidden="true" className="opacity-40">|</span>}<Link href={l.href} className="hover:underline">{l.label}</Link></span>)}
        </nav>
      </div>
      <div className="container-x">
        <div className="flex h-16 items-center gap-8 lg:h-[76px]">
          {logo}
          <nav aria-label="Primary" className="hidden gap-5 font-sans text-[13px] font-medium xl:flex xl:gap-6">{links}</nav>
          {actions}
        </div>
      </div>
    </HeaderShell>
    </>
  );
}

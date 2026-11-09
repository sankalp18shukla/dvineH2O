'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { SITE } from '@/lib/content';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { CtaChip, ctaClass, ctaStyle } from '../ui/Cta';
import s from './MobileMenu.module.css';

/** The range, each on its product colour from the home collection (Crystal glacier, Hyper flash, Titan volt). */
const PRODUCTS = [
  { href: '/home-water-systems', name: 'Crystal', sub: 'For the home', img: '/images/crystal_product.png', tone: 'var(--color-glacier)' },
  { href: '/hydrogen-bottles', name: 'Hyper', sub: 'On the go', img: '/images/hyper_product.png', tone: 'var(--color-flash)' },
  { href: '/for-business', name: 'Titan 111', sub: 'For offices', img: '/images/titan_product.png', tone: 'var(--color-voltage)' },
];
const LINKS = [
  { href: '/water-testing', label: 'Water Testing' },
  { href: '/become-a-partner', label: 'Become a Partner' },
  { href: '/support', label: 'Support' },
];
/** Routes warmed (fully prefetched) as the menu opens, so the tap that follows lands at once. */
const WARM = [...PRODUCTS.map(p => p.href), ...LINKS.map(l => l.href), '/book-demo'];

/**
 * Phone and tablet menu. A Deep Current curtain drops from the top on a bowed edge, as the loading curtain
 * lifts away on the home page, and the menu settles in under it in a short stagger: the range first (each
 * product on its colour disc), then the pages, then the ways to reach DVINE. Rendered into <body> so a
 * frosted header can never trap it, and kept mounted after the first open so it closes with the same motion.
 */
export function MobileMenu({ signedIn }: { signedIn: boolean }) {
  const [armed, setArmed] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const burger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  const shut = useCallback(() => setOpen(false), []);
  useEffect(() => setOpen(false), [path]);

  // first open: mount closed, then open on the next frame so the curtain animates in
  const show = () => {
    if (!armed) { setArmed(true); requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true))); }
    else setOpen(true);
  };

  useEffect(() => {
    if (!armed) return;
    const body = document.body;
    if (open) {
      body.style.overflow = 'hidden'; // also holds Lenis (SmoothScroll watches the body's style)
      WARM.forEach(h => { if (h !== path) router.prefetch(h); });
      const t = setTimeout(() => close.current?.focus({ preventScroll: true }), 120);
      const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
      window.addEventListener('keydown', k);
      return () => { clearTimeout(t); window.removeEventListener('keydown', k); };
    }
    body.style.overflow = '';
    if (document.activeElement && (document.activeElement as HTMLElement).closest(`.${s.root}`)) burger.current?.focus({ preventScroll: true });
  }, [open, armed, path, router]);
  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  const here = (href: string) => path === href;
  let i = 0; // stagger index, in reading order
  const st = () => ({ ['--i' as string]: i++ });

  const menu = armed && createPortal(
    <div className={`${s.root} on-dark lg:hidden`} data-open={open} role="dialog" aria-modal="true" aria-label="Menu" inert={!open}>
      <div className={s.sheet}>
        <span className={`wave-lines ${s.pattern}`} aria-hidden="true" />
        <div className={`${s.bar} frame-x`}>
          <Link href="/" onClick={shut} aria-label="DVINE H2O home" className={s.fade} style={st()}><Logo className="h-[17px] w-auto sm:h-5" /></Link>
          <button ref={close} type="button" className={s.close} aria-label="Close menu" onClick={shut}><Icon name="close" className="size-[22px]" strokeWidth={1.8} /></button>
        </div>

        <div className={`${s.scroll} frame-x`} data-lenis-prevent>
          <p className={`${s.eyebrow} ${s.item}`} style={st()}>Shop the range</p>
          <ul className={s.range}>
            {PRODUCTS.map(p => (
              <li key={p.href} className={s.item} style={st()}>
                <Link href={p.href} onClick={shut} className={s.tile} aria-current={here(p.href) ? 'page' : undefined} style={{ ['--tone' as string]: p.tone }}>
                  <span className={s.stage} aria-hidden="true">
                    <span className={s.disc} />
                    <Image src={p.img} alt="" width={160} height={200} sizes="120px" className={s.product} />
                  </span>
                  <span className={s.name}>{p.name}</span>
                  <span className={s.sub}>{p.sub}</span>
                </Link>
              </li>
            ))}
          </ul>

          <nav aria-label="Mobile" className={s.nav}>
            {LINKS.map((l, n) => (
              <Link key={l.href} href={l.href} onClick={shut} className={`${s.link} ${s.item}`} style={st()} aria-current={here(l.href) ? 'page' : undefined}>
                <span className={s.num}>0{n + 1}</span>
                <span className={s.label}>{l.label}</span>
                <span className={s.go} aria-hidden="true"><Icon name="arrow" className="size-4" strokeWidth={2} /></span>
              </Link>
            ))}
            <div className={`${s.minor} ${s.item}`} style={st()}>
              <Link href={signedIn ? '/account' : '/account/login'} onClick={shut}><Icon name="user" className="size-[18px]" />{signedIn ? 'My account' : 'Sign in'}</Link>
              <Link href="/track" onClick={shut}><Icon name="truck" className="size-[18px]" />Track my order</Link>
            </div>
          </nav>
        </div>

        <div className={`${s.foot} frame-x ${s.item}`} style={st()}>
          <Link href="/book-demo" onClick={shut} className={ctaClass('pill', 'w-full')} style={ctaStyle('glacier')}><CtaChip icon="calendar" /><span>Book a Free Demo</span></Link>
          <div className={s.reach}>
            <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className={s.ghost}><Icon name="phone" className="size-[18px]" />Call us</a>
            <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className={s.ghost}><Icon name="whatsapp" className="size-[18px]" />WhatsApp</a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      <button ref={burger} type="button" className="grid size-11 place-items-center rounded-full hover:bg-current/10 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={show}
        // mount the menu as soon as a finger lands, so the curtain is ready by the time the tap completes
        onPointerDown={() => setArmed(true)}>
        <Icon name="menu" />
      </button>
      {menu}
    </>
  );
}

'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/app/actions/cart';
import { openCartDrawer } from './CartDrawer';
import { CHAT_OPEN, CHAT_STATE } from './events';
import { CtaChip, ctaClass, ctaStyle, type CtaTone } from '../ui/Cta';
import { Icon } from '../ui/Icon';
import { THEMES, type ThemeKey } from '@/lib/site-content';

type Props = {
  /** id of the element that holds the page's main action; the dock shows once it has scrolled out of view */
  watch: string;
  title: string;
  sub?: string;
  /** a link action, or an add-to-cart action when productId is given */
  action: { label: string; href?: string; productId?: number };
  /** the page's product colour, carried by the button's chip (Crystal glacier, Hyper flash, Titan volt) */
  tone?: CtaTone;
  /** a running offer (Product pages tab): its label rides in the dock beside the price, in the offer's colours */
  badge?: { text: string; theme: ThemeKey };
};

/** Gap between the dock and the bottom edge (above the home indicator). */
const GAP = 10;

/**
 * Phone dock ("Main action stays visible"): once the page's own call to action scrolls away, a frosted card
 * floats up from the bottom edge with the page's main action and a chat button. The chat launcher folds into
 * it while it shows, so nothing else hovers over the page. It steps aside while the chat is open and once
 * the footer comes up, so the end of the page reads clean. Phones only (md:hidden).
 */
export function ActionBar({ watch, title, sub, action, tone = 'glacier', badge }: Props) {
  const [past, setPast] = useState(false);
  const [atFooter, setAtFooter] = useState(false);
  const [chat, setChat] = useState(false);
  const [atTarget, setAtTarget] = useState(false);
  const [typing, setTyping] = useState(false);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const bar = useRef<HTMLDivElement>(null);
  // steps aside: over the footer, while chatting, while its own destination (the form it links to) is on screen,
  // and while a field has focus (the phone keyboard is up; a fixed bar would ride on it over the form)
  const show = past && !atFooter && !chat && !atTarget && !typing;

  useEffect(() => {
    const el = document.getElementById(watch);
    const target = action.href?.startsWith('#') ? document.getElementById(action.href.slice(1)) : null;
    // The footer itself can't be watched: when it fits the screen it is fixed under the page (FooterReveal), so it
    // always "intersects". A marker on the page card's bottom edge says when the footer starts to show instead.
    const card = document.querySelector('.page-card');
    const end = document.createElement('div');
    end.setAttribute('aria-hidden', 'true');
    end.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:1px;pointer-events:none;visibility:hidden';
    card?.appendChild(end);
    // Each watcher's root runs on to infinity on one side, so "above the screen" and "on or below it" are the only
    // two states and any change flips one: a jump straight past the element (an anchor link, a restored scroll
    // position on reload) still registers, where a plain viewport observer would see two misses and stay quiet.
    const BIG = '100000px';
    const passed = new IntersectionObserver(([e]) => setPast(!e.isIntersecting), { rootMargin: `0px 0px ${BIG} 0px` });
    const ended = new IntersectionObserver(([e]) => setAtFooter(e.isIntersecting), { rootMargin: `${BIG} 0px 60px 0px` });
    if (el) passed.observe(el);
    if (card) ended.observe(end);
    // the destination counts as reached once it fills a good part of the screen, not at its first pixel
    const near = new IntersectionObserver(([e]) => setAtTarget(e.isIntersecting), { rootMargin: '-35% 0px -35% 0px' });
    if (target) near.observe(target);
    const field = (t: EventTarget | null) => t instanceof HTMLElement && t.matches('input:not([type=checkbox],[type=radio],[type=button],[type=submit]), textarea, select, [contenteditable="true"]') && !t.closest('.dock');
    const onIn = (e: FocusEvent) => { if (field(e.target)) setTyping(true); };
    const onOut = (e: FocusEvent) => { if (field(e.target) && !field(e.relatedTarget)) setTyping(false); };
    const onChat = (e: Event) => setChat((e as CustomEvent<boolean>).detail);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    window.addEventListener(CHAT_STATE, onChat);
    return () => {
      passed.disconnect(); ended.disconnect(); near.disconnect(); end.remove();
      document.removeEventListener('focusin', onIn); document.removeEventListener('focusout', onOut);
      window.removeEventListener(CHAT_STATE, onChat);
    };
  }, [watch, action.href]);

  // --action-bar: room the dock takes at the bottom, so the chat panel and sticky stages clear it;
  // .has-dock folds the chat launcher into the dock
  useEffect(() => {
    const root = document.documentElement;
    const on = show && matchMedia('(max-width: 767px)').matches && !!bar.current;
    root.style.setProperty('--action-bar', on ? `${bar.current!.offsetHeight + GAP}px` : '0px');
    root.classList.toggle('has-dock', on);
    return () => { root.style.setProperty('--action-bar', '0px'); root.classList.remove('has-dock'); };
  }, [show]);

  const add = () => start(async () => {
    setErr('');
    const r = await addToCart(action.productId!, 1);
    if ('error' in r && r.error) { setErr(r.error); return; }
    openCartDrawer(); router.refresh();
  });

  const tab = show ? 0 : -1;
  const cls = ctaClass('ink', 'cta-sm shrink-0');
  const btn = action.productId
    ? <button type="button" onClick={add} disabled={pending} className={cls} style={ctaStyle(tone)} tabIndex={tab}><CtaChip icon="cart" /><span>{pending ? 'Adding…' : action.label}</span></button>
    : <Link href={action.href!} className={cls} style={ctaStyle(tone)} tabIndex={tab}><CtaChip /><span>{action.label}</span></Link>;

  return (
    <div ref={bar} aria-hidden={!show} inert={!show} data-show={show}
      style={{ bottom: `calc(${GAP}px + env(safe-area-inset-bottom, 0px))` }}
      className="dock no-print fixed inset-x-2.5 z-30 flex items-center gap-2 rounded-[26px] p-[7px] pl-4 font-sans md:hidden">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-tight font-semibold tracking-[-.01em] text-ink">{title}</p>
        {err ? <p className="truncate text-[12px] text-[#C2001B]">{err}</p> : (sub || badge) && (
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] leading-tight text-muted">
            {badge && <span className="dock-badge max-w-[60%] shrink-0 truncate" style={{ background: THEMES[badge.theme]?.bg, color: THEMES[badge.theme]?.fg }}>{badge.text}</span>}
            {sub && <span className="truncate">{sub}</span>}
          </p>
        )}
      </div>
      <button type="button" onClick={() => window.dispatchEvent(new Event(CHAT_OPEN))} tabIndex={tab}
        className="dock-chat grid size-[46px] shrink-0 place-items-center rounded-full text-deep-current" aria-label="Chat with us">
        <Icon name="chat" className="size-[21px]" strokeWidth={1.8} />
      </button>
      {btn}
    </div>
  );
}

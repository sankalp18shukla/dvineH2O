'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/app/actions/cart';
import { openCartDrawer } from './CartDrawer';

type Props = {
  /** id of the element that holds the page's main action; the bar shows once it has scrolled out of view */
  watch: string;
  title: string;
  sub?: string;
  /** a link action, or an add-to-cart action when productId is given */
  action: { label: string; href?: string; productId?: number };
};

/** Mobile sticky bar that keeps the page's main action in reach ("Main action stays visible"). */
export function ActionBar({ watch, title, sub, action }: Props) {
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(watch);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);

  // lets the chat button sit above the bar on small screens
  useEffect(() => {
    const root = document.documentElement;
    const mobile = matchMedia('(max-width: 767px)').matches;
    root.style.setProperty('--action-bar', show && mobile && bar.current ? `${bar.current.offsetHeight}px` : '0px');
    return () => { root.style.setProperty('--action-bar', '0px'); };
  }, [show]);

  const add = () => start(async () => {
    setErr('');
    const r = await addToCart(action.productId!, 1);
    if ('error' in r && r.error) { setErr(r.error); return; }
    openCartDrawer(); router.refresh();
  });

  const btn = action.productId
    ? <button type="button" onClick={add} disabled={pending} className="btn btn-primary btn-sm shrink-0" tabIndex={show ? 0 : -1}>{action.label}</button>
    : <Link href={action.href!} className="btn btn-primary btn-sm shrink-0" tabIndex={show ? 0 : -1}>{action.label}</Link>;

  return (
    <div ref={bar} aria-hidden={!show}
      className={`no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] font-sans backdrop-blur-xl transition-transform duration-300 md:hidden ${show ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{title}</p>
          {err ? <p className="truncate text-[12.5px] text-[#C2001B]">{err}</p> : sub && <p className="truncate text-[12.5px] text-muted">{sub}</p>}
        </div>
        {btn}
      </div>
    </div>
  );
}
